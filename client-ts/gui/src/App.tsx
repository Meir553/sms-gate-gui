import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthComponent from './components/AuthComponent';
import MainLayout from './components/MainLayout';
import { AuthContext } from './contexts/AuthContext';
import { Client } from './lib/client';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudMode, setCloudMode] = useState(false);
  const [showInboundWebhook, setShowInboundWebhook] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('App useEffect running...');
        
        // First, check if there are environment credentials available
        const configResponse = await fetch('/api/config');
        const config = await configResponse.json();
        
        console.log('Environment config:', config);
        
        // Store cloud mode configuration
        setCloudMode(config.cloudMode || false);
        setShowInboundWebhook(config.showInboundWebhook !== false);
        
        let login = '';
        let password = '';
        
        if (config.hasEnvCredentials) {
          // Use environment credentials
          console.log('Using environment credentials for auto-login');
          const envResponse = await fetch('/api/env-credentials');
          const envCreds = await envResponse.json();
          login = envCreds.login;
          password = envCreds.password;
        } else {
          // Check if credentials are stored in localStorage
          const storedLogin = localStorage.getItem('sms_gateway_login');
          const storedPassword = localStorage.getItem('sms_gateway_password');
          
          console.log('Stored credentials:', { storedLogin: !!storedLogin, storedPassword: !!storedPassword });
          
          if (storedLogin && storedPassword) {
            login = storedLogin;
            password = storedPassword;
          }
        }
        
        if (login && password) {
          // Create a simple HTTP client for the library with authentication
          const authHeader = `Basic ${btoa(`${login}:${password}`)}`;
          const httpClient = {
        async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
          const response = await fetch(url, { 
            method: 'GET', 
            headers: { ...headers, 'Authorization': authHeader }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          return response.json();
        },
        async post<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
          const response = await fetch(url, { 
            method: 'POST', 
            headers: { ...headers, 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          return response.json();
        },
        async put<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
          const response = await fetch(url, { 
            method: 'PUT', 
            headers: { ...headers, 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          return response.json();
        },
        async patch<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
          const response = await fetch(url, { 
            method: 'PATCH', 
            headers: { ...headers, 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          return response.json();
        },
        async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
          const response = await fetch(url, { 
            method: 'DELETE', 
            headers: { ...headers, 'Authorization': authHeader }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          
          // Handle 204 No Content responses (successful DELETE)
          if (response.status === 204) {
            return undefined as T;
          }
          
          return response.json();
        },
      };
      
        try {
        const smsClient = new Client(login, password, httpClient);
        setClient(smsClient);
        setIsAuthenticated(true);
        console.log('Client created successfully');
        } catch (error) {
          console.error('Error creating client:', error);
          // Don't set as authenticated if there's an error
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setLoading(false);
    }
  };
  
  initializeApp();
  }, []);

  // Add error boundary
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <div>Loading...</div>
        </Box>
      </ThemeProvider>
    );
  }

  const handleLogin = (login: string, password: string) => {
    // Store credentials in localStorage
    localStorage.setItem('sms_gateway_login', login);
    localStorage.setItem('sms_gateway_password', password);
    
    // Create HTTP client with authentication
    const authHeader = `Basic ${btoa(`${login}:${password}`)}`;
    const httpClient = {
      async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
        const response = await fetch(url, { 
          method: 'GET', 
          headers: { ...headers, 'Authorization': authHeader }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
      },
      async post<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
        const response = await fetch(url, { 
          method: 'POST', 
          headers: { ...headers, 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
      },
      async put<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
        const response = await fetch(url, { 
          method: 'PUT', 
          headers: { ...headers, 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
      },
      async patch<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
        const response = await fetch(url, { 
          method: 'PATCH', 
          headers: { ...headers, 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
      },
      async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
        const response = await fetch(url, { 
          method: 'DELETE', 
          headers: { ...headers, 'Authorization': authHeader }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
      },
    };
    
    try {
      const smsClient = new Client(login, password, httpClient);
      setClient(smsClient);
      setIsAuthenticated(true);
      
      // Store credentials
      localStorage.setItem('sms_gateway_login', login);
      localStorage.setItem('sms_gateway_password', password);
      console.log('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClient(null);
    localStorage.removeItem('sms_gateway_login');
    localStorage.removeItem('sms_gateway_password');
  };

  console.log('App rendering, isAuthenticated:', isAuthenticated, 'loading:', loading);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={{ client, isAuthenticated, logout: handleLogout }}>
        <Router>
          <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Container maxWidth="xl">
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    isAuthenticated ? 
                    <Navigate to="/" replace /> : 
                    <AuthComponent onLogin={handleLogin} />
                  } 
                />
                <Route 
                  path="/*" 
                  element={
                    isAuthenticated ? 
                    <MainLayout cloudMode={cloudMode} showInboundWebhook={showInboundWebhook} /> : 
                    <Navigate to="/login" replace />
                  } 
                />
              </Routes>
            </Container>
          </Box>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;