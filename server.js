const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = require('node-fetch');
const https = require('https');
const database = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const SMS_GATEWAY_BASE_URL = process.env.SMS_GATEWAY_BASE_URL || 'https://api.sms-gate.app/3rdparty/v1';

// Create HTTPS agent that ignores SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Initialize database
database.init().catch(console.error);

// Webhook processing function
async function processWebhook(webhookId, data, method, headers, queryParams) {
  try {
    console.log(`Processing webhook ${webhookId}:`, { method, data, queryParams });
    
    // Get webhook configuration
    const webhook = await database.getWebhookById(webhookId);
    console.log('Retrieved webhook:', JSON.stringify(webhook, null, 2));
    if (!webhook || !webhook.is_active) {
      throw new Error('Webhook not found or inactive');
    }

    // Log the incoming request
    await database.logWebhookRequest(webhookId, method, headers, data, queryParams);

    // If webhook is in development mode, just return the data for mapping
    console.log('Checking development mode:', webhook.is_development);
    if (webhook.is_development) {
      console.log('Webhook is in development mode - returning data for mapping only');
      return {
        success: true,
        development: true,
        message: 'Data received for mapping (development mode)',
        incomingData: data || queryParams,
        method: method
      };
    }

    // Apply field mappings
    const mappedData = applyFieldMappings(data, webhook.field_mappings, queryParams);
    
    // Create SMS message from mapped data
    const smsMessage = {
      message: mappedData.message || mappedData.text || 'No message provided',
      phoneNumbers: Array.isArray(mappedData.phoneNumbers) ? mappedData.phoneNumbers : [mappedData.phoneNumbers || mappedData.phone],
      ttl: mappedData.ttl || 3600,
      simNumber: mappedData.simNumber || mappedData.sim || 1,
      includeDeliveryReport: mappedData.includeDeliveryReport !== false,
      skipPhoneValidation: mappedData.skipPhoneValidation || false
    };

    // Validate required fields
    if (!smsMessage.message) {
      throw new Error('Message is required');
    }
    if (!smsMessage.phoneNumbers || smsMessage.phoneNumbers.length === 0) {
      throw new Error('Phone number is required');
    }

    // Send SMS using the webhook owner's credentials
    const authHeader = `Basic ${Buffer.from(`${webhook.username}:${webhook.password}`).toString('base64')}`;
    
    const response = await fetch(`${SMS_GATEWAY_BASE_URL}/message`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'android-sms-gateway/3.0 (client; js)'
      },
      body: JSON.stringify(smsMessage),
      agent: httpsAgent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SMS sending failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log(`Webhook ${webhookId} processed successfully:`, result);
    
    return { success: true, result };
  } catch (error) {
    console.error(`Error processing webhook ${webhookId}:`, error);
    return { success: false, error: error.message };
  }
}

// Apply field mappings to transform incoming data
function applyFieldMappings(data, fieldMappings, queryParams) {
  const result = {};
  
  // Start with query params for GET requests
  if (queryParams) {
    Object.assign(result, queryParams);
  }
  
  // Add POST body data
  if (data) {
    Object.assign(result, data);
  }
  
  // Apply field mappings
  if (fieldMappings && Array.isArray(fieldMappings)) {
    fieldMappings.forEach(mapping => {
      if (mapping.from && mapping.to && result[mapping.from] !== undefined) {
        result[mapping.to] = result[mapping.from];
        if (mapping.from !== mapping.to) {
          delete result[mapping.from];
        }
      }
    });
  }
  
  return result;
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static files from the built React app
app.use(express.static(path.join(__dirname, 'client-ts/gui/dist')));

// Handle root API path
app.get('/api', (req, res) => {
  res.json({ message: 'SMS Gateway API Proxy', version: '1.0.0' });
});

// Provide environment configuration to frontend
app.get('/api/config', (req, res) => {
  res.json({
    hasEnvCredentials: !!(process.env.SMS_GATEWAY_USERNAME && process.env.SMS_GATEWAY_PASSWORD),
    baseUrl: SMS_GATEWAY_BASE_URL,
    cloudMode: process.env.CLOUD_MODE === 'true',
    showInboundWebhook: process.env.SHOW_INBOUND_WEBHOOK !== 'false'
  });
});

// Provide environment credentials for auto-login
app.get('/api/env-credentials', (req, res) => {
  if (process.env.SMS_GATEWAY_USERNAME && process.env.SMS_GATEWAY_PASSWORD) {
    res.json({
      login: process.env.SMS_GATEWAY_USERNAME,
      password: process.env.SMS_GATEWAY_PASSWORD
    });
  } else {
    res.status(404).json({ error: 'No environment credentials found' });
  }
});

// Inbound Webhook Endpoints
app.get('/webhook/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;
    const queryParams = req.query;
    
    console.log(`Incoming GET webhook ${webhookId}:`, queryParams);
    
    const result = await processWebhook(webhookId, null, 'GET', req.headers, queryParams);
    
    if (result.success) {
      if (result.development) {
        res.json({ 
          success: true, 
          message: 'Data received for mapping (development mode)',
          development: true,
          incomingData: result.incomingData,
          method: result.method
        });
      } else {
        res.json({ success: true, message: 'SMS sent successfully', data: result.result });
      }
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Webhook GET error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/webhook/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;
    const data = req.body;
    
    console.log(`Incoming POST webhook ${webhookId}:`, data);
    
    const result = await processWebhook(webhookId, data, 'POST', req.headers, null);
    
    if (result.success) {
      if (result.development) {
        res.json({ 
          success: true, 
          message: 'Data received for mapping (development mode)',
          development: true,
          incomingData: result.incomingData,
          method: result.method
        });
      } else {
        res.json({ success: true, message: 'SMS sent successfully', data: result.result });
      }
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Webhook POST error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Inbound Webhook Management API (for the new inbound webhook feature)
app.get('/api/inbound-webhooks', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
    const [username] = credentials.split(':');
    
    const webhooks = await database.getWebhooksByUser(username);
    res.json(webhooks);
  } catch (error) {
    console.error('Error fetching inbound webhooks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/inbound-webhooks', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    const webhookData = {
      ...req.body,
      name: req.body.name || `Webhook ${Date.now()}`,
      username,
      password,
      webhook_url: `${req.protocol}://${req.get('host')}/webhook/${req.body.webhook_id || 'auto-generated'}`
    };
    
    const webhook = await database.createWebhook(webhookData);
    res.json(webhook);
  } catch (error) {
    console.error('Error creating inbound webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/inbound-webhooks/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
    const [username] = credentials.split(':');
    
    const webhook = await database.getWebhookById(req.params.id);
    if (!webhook || webhook.username !== username) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const webhookData = {
      ...req.body,
      name: req.body.name || `Webhook ${Date.now()}`
    };
    const updatedWebhook = await database.updateWebhook(req.params.id, webhookData);
    res.json(updatedWebhook);
  } catch (error) {
    console.error('Error updating inbound webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/inbound-webhooks/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
    const [username] = credentials.split(':');
    
    const webhook = await database.getWebhookById(req.params.id);
    if (!webhook || webhook.username !== username) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const result = await database.deleteWebhook(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting inbound webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inbound-webhooks/:id/logs', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
    const [username] = credentials.split(':');
    
    const webhook = await database.getWebhookById(req.params.id);
    if (!webhook || webhook.username !== username) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const logs = await database.getWebhookLogs(req.params.id, req.query.limit || 50);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching inbound webhook logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy all API requests to SMS Gateway - use specific route patterns
app.all('/api/*', async (req, res) => {
  try {
    console.log('=== API REQUEST DEBUG ===');
    console.log('Method:', req.method);
    console.log('Original URL:', req.originalUrl);
    console.log('Path:', req.path);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Get credentials from request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.log('ERROR: No valid authorization header');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Extract the API path - remove /api prefix from the original URL
    const apiPath = req.originalUrl.replace('/api', '');
    const fullUrl = `${SMS_GATEWAY_BASE_URL}${apiPath}`;
    
    console.log('=== PATH EXTRACTION ===');
    console.log('Original URL:', req.originalUrl);
    console.log('API Path:', apiPath);
    console.log('Full URL:', fullUrl);
    
    // Forward the request with SSL verification disabled
    console.log('=== FORWARDING REQUEST ===');
    console.log('Forwarding to:', fullUrl);
    
    // Test with health endpoint first if this is a devices request
    if (apiPath === '/devices') {
      console.log('Testing health endpoint first...');
      const healthUrl = `${SMS_GATEWAY_BASE_URL}/health`;
      try {
        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'User-Agent': 'android-sms-gateway/3.0 (client; js)',
          },
          agent: httpsAgent
        });
        console.log('Health endpoint status:', healthResponse.status);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('Health data:', healthData);
        } else {
          const healthError = await healthResponse.text();
          console.log('Health error:', healthError);
        }
      } catch (healthError) {
        console.log('Health test failed:', healthError.message);
      }
    }
    
    console.log('=== FORWARDING TO EXTERNAL API ===');
    console.log('Full URL:', fullUrl);
    console.log('Request body:', req.method !== 'GET' ? JSON.stringify(req.body, null, 2) : 'N/A');
    console.log('Auth header:', authHeader);
    
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'android-sms-gateway/3.0 (client; js)',
        'Accept': 'application/json',
        'Content-Type': req.method !== 'GET' ? 'application/json' : undefined
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      agent: httpsAgent
    });
    
    console.log('=== RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      return res.status(response.status).json({ 
        error: `API Error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    // Handle 204 No Content responses (like DELETE operations)
    if (response.status === 204) {
      console.log('Response: 204 No Content (successful DELETE)');
      return res.status(204).send();
    }

    // Try to parse as JSON for other responses
    try {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      res.status(response.status).json(data);
    } catch (jsonError) {
      // If JSON parsing fails, return the raw text
      console.log('Response is not JSON, returning as text');
      const textData = await response.text();
      res.status(response.status).send(textData);
    }

  } catch (error) {
    console.error('=== PROXY ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Proxy Error', details: error.message });
  }
});

// Catch all handler - serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client-ts/gui/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 SMS Gateway GUI Server running on port', PORT);
  console.log('GUI: http://localhost:' + PORT);
  console.log('API: http://localhost:' + PORT + '/api');
});