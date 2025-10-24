import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  PlayArrow as TestIcon,
  ExpandMore as ExpandMoreIcon,
  Webhook as WebhookIcon,
  Send as SendIcon,
  PlayCircleOutline as ListenIcon,
  Stop as StopIcon,
  DragIndicator as DragIcon,
  Edit as EditModeIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface FieldMapping {
  from: string;
  to: string;
}

interface Webhook {
  id: string;
  name: string;
  description: string;
  webhook_url: string;
  field_mappings: FieldMapping[];
  is_active: boolean;
  is_development?: boolean;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: number;
  method: string;
  headers: Record<string, string>;
  body: any;
  query_params: any;
  processed_at: string;
  status: string;
  error_message?: string;
}

const InboundWebhooks: React.FC = () => {
  const { client } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [isListening, setIsListening] = useState(false);
  const [incomingData, setIncomingData] = useState<any>(null);
  const [mappingMode, setMappingMode] = useState<'manual' | 'drag'>('manual');
  const [tempWebhookId, setTempWebhookId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhook_id: '',
    webhook_url: '',
    field_mappings: [] as FieldMapping[],
    is_active: true,
    is_development: false
  });

  useEffect(() => {
    fetchWebhooks();
  }, [client]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const fetchWebhooks = async () => {
    if (!client) return;
    try {
      setLoading(true);
      const response = await client.getInboundWebhooks();
      setWebhooks(response || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      showSnackbar('Error fetching webhooks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async (webhookId: string) => {
    if (!client) return;
    try {
      const response = await client.getWebhookLogs(webhookId);
      setWebhookLogs(response || []);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      showSnackbar('Error fetching webhook logs', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpen = (webhook?: Webhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        name: webhook.name,
        description: webhook.description,
        webhook_id: webhook.id,
        webhook_url: webhook.webhook_url,
        field_mappings: webhook.field_mappings,
        is_active: webhook.is_active,
        is_development: webhook.is_development || false
      });
    } else {
      setEditingWebhook(null);
      setFormData({
        name: '',
        description: '',
        webhook_id: '',
        webhook_url: '',
        field_mappings: [],
        is_active: true,
        is_development: false
      });
    }
    setOpen(true);
    setIsListening(false);
    setIncomingData(null);
  };

  const handleClose = async () => {
    // Stop polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    // Clean up temporary webhook if it was created for listening
    if (tempWebhookId && !editingWebhook) {
      try {
        if (client) {
          await client.deleteInboundWebhook(tempWebhookId);
        }
      } catch (error) {
        console.error('Error cleaning up temporary webhook:', error);
      }
    }
    
    setOpen(false);
    setEditingWebhook(null);
    setIsListening(false);
    setIncomingData(null);
    setTempWebhookId(null);
    setFormData({
      name: '',
      description: '',
      webhook_id: '',
      webhook_url: '',
      field_mappings: [],
      is_active: true,
      is_development: false
    });
  };

  const startListening = async () => {
    if (!client) return;
    
    if (!formData.webhook_id) {
      showSnackbar('Please enter a webhook ID first', 'error');
      return;
    }
    
    try {
      // Auto-save the webhook when starting to listen
      const webhookData = {
        name: formData.name || `Test Webhook ${Date.now()}`,
        description: formData.description || 'Temporary webhook for testing',
        webhook_id: formData.webhook_id,
        field_mappings: formData.field_mappings,
        is_active: true,
        is_development: true
      };
      
      const savedWebhook = await client.createInboundWebhook(webhookData);
      setTempWebhookId(savedWebhook.id);
      
      setIsListening(true);
      setIncomingData(null);
      
      // Start polling for incoming data every 2 seconds
      const interval = setInterval(checkForIncomingData, 2000);
      setPollingInterval(interval);
      
      showSnackbar('Webhook saved and listening for incoming data!', 'success');
    } catch (error) {
      console.error('Error saving webhook for listening:', error);
      showSnackbar('Error saving webhook. Please try again.', 'error');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const simulateIncomingData = () => {
    const sampleData = {
      message: 'Hello from external system!',
      phone: '+1234567890',
      user_id: '12345',
      timestamp: new Date().toISOString(),
      priority: 'high',
      custom_field: 'some value'
    };
    setIncomingData(sampleData);
    showSnackbar('Sample data received! You can now map the fields', 'success');
  };

  const handleSave = async () => {
    if (!client) return;
    try {
      console.log('Saving webhook:', { editingWebhook: !!editingWebhook, tempWebhookId, formData });
      
      if (editingWebhook) {
        await client.updateInboundWebhook(editingWebhook.id, formData);
        showSnackbar('Webhook updated successfully', 'success');
      } else if (tempWebhookId) {
        // Update the temporary webhook that was created for listening
        const finalWebhookData = { 
          ...formData, 
          is_development: false,
          webhook_url: `${window.location.origin}/webhook/${formData.webhook_id}`
        };
        console.log('Updating temp webhook with data:', finalWebhookData);
        await client.updateInboundWebhook(tempWebhookId, finalWebhookData);
        showSnackbar('Webhook created successfully', 'success');
        setTempWebhookId(null); // Clear temp ID since it's now a real webhook
      } else {
        const webhookData = {
          ...formData,
          webhook_url: `${window.location.origin}/webhook/${formData.webhook_id}`
        };
        console.log('Creating new webhook with data:', webhookData);
        await client.createInboundWebhook(webhookData);
        showSnackbar('Webhook created successfully', 'success');
      }
      handleClose();
      fetchWebhooks();
    } catch (error) {
      console.error('Error saving webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar('Error saving webhook: ' + errorMessage, 'error');
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!client) return;
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      try {
        await client.deleteInboundWebhook(webhookId);
        showSnackbar('Webhook deleted successfully', 'success');
        fetchWebhooks();
      } catch (error) {
        console.error('Error deleting webhook:', error);
        showSnackbar('Error deleting webhook', 'error');
      }
    }
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    setTestingWebhook(webhook.id);
    try {
      // Test with sample data
      const testData = {
        message: 'Test message from webhook',
        phone: '+1234567890'
      };

      const response = await fetch(`/webhook/${webhook.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      if (result.success) {
        showSnackbar('Test webhook sent successfully!', 'success');
      } else {
        showSnackbar(`Test failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      showSnackbar('Error testing webhook', 'error');
    } finally {
      setTestingWebhook(null);
    }
  };

  const addFieldMapping = () => {
    setFormData({
      ...formData,
      field_mappings: [...formData.field_mappings, { from: '', to: '' }]
    });
  };

  const updateFieldMapping = (index: number, field: keyof FieldMapping, value: string) => {
    const newMappings = [...formData.field_mappings];
    newMappings[index][field] = value;
    setFormData({ ...formData, field_mappings: newMappings });
  };

  const removeFieldMapping = (index: number) => {
    const newMappings = formData.field_mappings.filter((_, i) => i !== index);
    setFormData({ ...formData, field_mappings: newMappings });
  };

  const handleDragStart = (e: React.DragEvent, fieldName: string) => {
    e.dataTransfer.setData('text/plain', fieldName);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    const sourceField = e.dataTransfer.getData('text/plain');
    
    // Check if mapping already exists
    const existingMapping = formData.field_mappings.find(m => m.from === sourceField);
    if (existingMapping) {
      // Update existing mapping
      const newMappings = formData.field_mappings.map(m => 
        m.from === sourceField ? { ...m, to: targetField } : m
      );
      setFormData({ ...formData, field_mappings: newMappings });
    } else {
      // Add new mapping
      const newMappings = [...formData.field_mappings, { from: sourceField, to: targetField }];
      setFormData({ ...formData, field_mappings: newMappings });
    }
  };

  const removeDragMapping = (fromField: string) => {
    const newMappings = formData.field_mappings.filter(m => m.from !== fromField);
    setFormData({ ...formData, field_mappings: newMappings });
  };

  const copyWebhookUrl = (webhookId: string) => {
    const url = `${window.location.origin}/webhook/${webhookId}`;
    navigator.clipboard.writeText(url);
    showSnackbar('Webhook URL copied to clipboard', 'success');
  };

  const getWebhookUrl = () => {
    const webhookId = tempWebhookId || formData.webhook_id || 'auto-generated';
    return `${window.location.origin}/webhook/${webhookId}`;
  };

  const checkForIncomingData = async () => {
    if (!client || !tempWebhookId) {
      console.log('No client or tempWebhookId:', { client: !!client, tempWebhookId });
      return;
    }
    
    try {
      console.log('Checking for incoming data for webhook:', tempWebhookId);
      const logs = await client.getWebhookLogs(tempWebhookId, 5); // Get last 5 logs
      console.log('Retrieved logs:', logs);
      
      if (logs && logs.length > 0) {
        // Find the most recent log that has data
        const latestLog = logs.find(log => log.body || log.query_params) || logs[0];
        console.log('Latest log with data:', latestLog);
        
        if (latestLog.body || latestLog.query_params) {
          const data = latestLog.body ? JSON.parse(latestLog.body) : latestLog.query_params;
          console.log('Setting incoming data:', data);
          setIncomingData(data);
          showSnackbar('Incoming data received! You can now map the fields.', 'success');
        } else {
          console.log('No data found in logs');
          showSnackbar('No incoming data found. Try sending a test request.', 'info');
        }
      } else {
        console.log('No logs found');
        showSnackbar('No logs found. Try sending a test request.', 'info');
      }
    } catch (error) {
      console.error('Error checking for incoming data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar('Error checking for data: ' + errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading webhooks...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inbound Webhooks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Create Webhook
        </Button>
      </Box>

      <Typography variant="body1" color="textSecondary" mb={3}>
        Create inbound webhooks to receive SMS requests from external platforms like Make.com, n8n, or Zapier.
        Each webhook can be configured with custom field mappings to transform incoming data.
      </Typography>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <WebhookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No webhooks created yet
              </Typography>
              <Typography color="textSecondary" mb={3}>
                Create your first inbound webhook to start receiving SMS requests from external platforms.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                Create Your First Webhook
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {webhook.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {webhook.description}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Chip
                        label={webhook.is_active ? 'Active' : 'Inactive'}
                        color={webhook.is_active ? 'success' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={`${webhook.field_mappings.length} field mappings`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <IconButton
                      onClick={() => copyWebhookUrl(webhook.id)}
                      title="Copy webhook URL"
                    >
                      <CopyIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleTestWebhook(webhook)}
                      disabled={testingWebhook === webhook.id}
                      title="Test webhook"
                    >
                      <TestIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        fetchWebhookLogs(webhook.id);
                        setTestingWebhook(webhook.id);
                      }}
                      title="View logs"
                    >
                      <SendIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpen(webhook)}
                      title="Edit webhook"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(webhook.id)}
                      title="Delete webhook"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Webhook URL:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: 'grey.100',
                      padding: 1,
                      borderRadius: 1,
                      wordBreak: 'break-all'
                    }}
                  >
                    {`${window.location.origin}/webhook/${webhook.id}`}
                  </Typography>
                </Box>

                {webhook.field_mappings.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Field Mappings:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {webhook.field_mappings.map((mapping, index) => (
                        <Chip
                          key={index}
                          label={`${mapping.from} → ${mapping.to}`}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Webhook Logs Dialog */}
      <Dialog
        open={testingWebhook !== null && webhookLogs.length > 0}
        onClose={() => setTestingWebhook(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Webhook Logs</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {webhookLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.processed_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.method}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={log.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="caption">View Data</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>Body:</Typography>
                            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                              {JSON.stringify(log.body, null, 2)}
                            </pre>
                            {log.query_params && (
                              <>
                                <Typography variant="subtitle2" gutterBottom>Query Params:</Typography>
                                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                  {JSON.stringify(log.query_params, null, 2)}
                                </pre>
                              </>
                            )}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestingWebhook(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Webhook Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWebhook ? 'Edit Webhook' : 'Create New Webhook'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Webhook Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Webhook ID"
              value={formData.webhook_id}
              onChange={(e) => setFormData({ ...formData, webhook_id: e.target.value })}
              fullWidth
              helperText="Custom webhook ID (leave empty for auto-generation)"
              placeholder="my-custom-webhook"
            />
            <Box>
              <TextField
                label="Webhook URL"
                value={getWebhookUrl()}
                fullWidth
                helperText="This will be auto-generated when you save"
                disabled
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => copyWebhookUrl(tempWebhookId || formData.webhook_id || 'auto-generated')}
                      edge="end"
                      title="Copy webhook URL"
                    >
                      <CopyIcon />
                    </IconButton>
                  )
                }}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />

            {/* Test/Listen Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Test & Listen
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Test your webhook to see incoming data structure and create field mappings.
              </Typography>
              
              <Box display="flex" gap={2} mb={2}>
                {!isListening ? (
                  <Button
                    variant="outlined"
                    startIcon={<ListenIcon />}
                    onClick={startListening}
                    disabled={!formData.webhook_id}
                  >
                    Start Listening
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={stopListening}
                  >
                    Stop Listening
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={simulateIncomingData}
                  disabled={!isListening}
                >
                  Simulate Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={checkForIncomingData}
                  disabled={!isListening}
                >
                  Refresh Data
                </Button>
              </Box>

              {isListening && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip 
                          label="DEVELOPMENT MODE" 
                          color="warning" 
                          size="small" 
                          icon={<CodeIcon />}
                        />
                        <Typography variant="body2" color="textSecondary">
                          Data will be displayed for mapping only - no SMS will be sent
                        </Typography>
                      </Box>
                      <Typography variant="body2" gutterBottom>
                        Listening for incoming data... Send a test request to:
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <code style={{ 
                          backgroundColor: '#f5f5f5', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}>
                          {getWebhookUrl()}
                        </code>
                        <IconButton
                          size="small"
                          onClick={() => copyWebhookUrl(tempWebhookId || formData.webhook_id || 'auto-generated')}
                          title="Copy webhook URL"
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Alert>
              )}

              {incomingData && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Data received! You can now map the fields below.
                </Alert>
              )}
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Field Mappings</Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant={mappingMode === 'manual' ? 'contained' : 'outlined'}
                    startIcon={<EditModeIcon />}
                    onClick={() => setMappingMode('manual')}
                    size="small"
                  >
                    Manual
                  </Button>
                  <Button
                    variant={mappingMode === 'drag' ? 'contained' : 'outlined'}
                    startIcon={<DragIcon />}
                    onClick={() => setMappingMode('drag')}
                    size="small"
                  >
                    Drag & Drop
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addFieldMapping}
                    size="small"
                    disabled={mappingMode === 'drag'}
                  >
                    Add Mapping
                  </Button>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Map incoming field names to SMS Gateway field names. For example, map "phone" to "phoneNumbers".
              </Typography>

              {mappingMode === 'manual' ? (
                // Manual mapping mode
                <>
                  {/* Show incoming data and expected fields side by side */}
                  <Box display="flex" gap={3} mb={3}>
                    <Box flex={1}>
                      <Typography variant="subtitle2" gutterBottom>
                        Incoming Data
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, minHeight: 150 }}>
                        {incomingData ? (
                          <Box>
                            {Object.entries(incomingData).map(([key, value]) => (
                              <Box key={key} sx={{ mb: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight="bold">{key}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {typeof value === 'string' ? value : JSON.stringify(value)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography color="textSecondary">
                            No incoming data yet. Send a test request or use "Refresh Data".
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                    
                    <Box flex={1}>
                      <Typography variant="subtitle2" gutterBottom>
                        SMS Gateway Fields
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, minHeight: 150 }}>
                        {['message', 'phoneNumbers', 'ttl', 'simNumber', 'includeDeliveryReport', 'skipPhoneValidation'].map((field) => (
                          <Box key={field} sx={{ mb: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight="bold">{field}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {field === 'message' ? 'The SMS text content' :
                               field === 'phoneNumbers' ? 'Array of phone numbers' :
                               field === 'ttl' ? 'Time to live in seconds' :
                               field === 'simNumber' ? 'SIM slot number' :
                               field === 'includeDeliveryReport' ? 'Include delivery report' :
                               'Skip phone validation'}
                            </Typography>
                          </Box>
                        ))}
                      </Paper>
                    </Box>
                  </Box>
                  
                  {/* Manual mapping inputs */}
                  {formData.field_mappings.map((mapping, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                      <TextField
                        label="From (incoming field)"
                        value={mapping.from}
                        onChange={(e) => updateFieldMapping(index, 'from', e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <Typography>→</Typography>
                      <TextField
                        label="To (SMS Gateway field)"
                        value={mapping.to}
                        onChange={(e) => updateFieldMapping(index, 'to', e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        onClick={() => removeFieldMapping(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}

                  {formData.field_mappings.length === 0 && (
                    <Box textAlign="center" py={2}>
                      <Typography color="textSecondary">
                        No field mappings defined. Incoming data will be used as-is.
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                // Drag and drop mode
                <Box display="flex" gap={3}>
                  {/* Incoming Data Side */}
                  <Box flex={1}>
                    <Typography variant="subtitle1" gutterBottom>
                      Incoming Data
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                      {incomingData ? (
                        <Box>
                          {Object.entries(incomingData).map(([key, value]) => (
                            <Box
                              key={key}
                              draggable
                              onDragStart={(e) => handleDragStart(e, key)}
                              sx={{
                                p: 1,
                                mb: 1,
                                border: '1px dashed #ccc',
                                borderRadius: 1,
                                cursor: 'grab',
                                '&:hover': { backgroundColor: 'grey.100' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <DragIcon fontSize="small" />
                              <Box>
                                <Typography variant="body2" fontWeight="bold">{key}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {typeof value === 'string' ? value : JSON.stringify(value)}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box textAlign="center" py={4}>
                          <Typography color="textSecondary">
                            {isListening ? 'Waiting for incoming data...' : 'Start listening to see incoming data'}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>

                  {/* SMS Gateway Fields Side */}
                  <Box flex={1}>
                    <Typography variant="subtitle1" gutterBottom>
                      SMS Gateway Fields
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                      {['message', 'phoneNumbers', 'ttl', 'simNumber', 'includeDeliveryReport', 'skipPhoneValidation'].map((field) => {
                        const mapping = formData.field_mappings.find(m => m.to === field);
                        return (
                          <Box
                            key={field}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, field)}
                            sx={{
                              p: 1,
                              mb: 1,
                              border: mapping ? '2px solid #4caf50' : '1px dashed #ccc',
                              borderRadius: 1,
                              backgroundColor: mapping ? 'success.light' : 'transparent',
                              minHeight: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="bold">{field}</Typography>
                              {mapping && (
                                <Typography variant="caption" color="success.main">
                                  ← {mapping.from}
                                </Typography>
                              )}
                            </Box>
                            {mapping && (
                              <IconButton
                                size="small"
                                onClick={() => removeDragMapping(mapping.from)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        );
                      })}
                    </Paper>
                  </Box>
                </Box>
              )}

              {/* Show current mappings */}
              {formData.field_mappings.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Mappings:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {formData.field_mappings.map((mapping, index) => (
                      <Chip
                        key={index}
                        label={`${mapping.from} → ${mapping.to}`}
                        onDelete={() => removeDragMapping(mapping.from)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingWebhook ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InboundWebhooks;
