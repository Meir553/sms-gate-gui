import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { DeviceSettings } from '../lib/domain';
import { LimitPeriod, SimSelectionMode } from '../lib/domain';

const SettingsComponent: React.FC = () => {
  const { client } = useAuth();
  const [settings, setSettings] = useState<DeviceSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    if (!client) return;

    setLoading(true);
    setError('');

    try {
      const currentSettings = await client.getSettings();
      setSettings(currentSettings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [client]);

  const handleSave = async () => {
    if (!client) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await client.updateSettings(settings);
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const getValue = (path: string) => {
    const keys = path.split('.');
    let current: any = settings;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? <CircularProgress size={20} /> : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Messages Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Message Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Limit Period</InputLabel>
                    <Select
                      value={getValue('messages.limitPeriod') || LimitPeriod.Disabled}
                      onChange={(e) => updateSettings('messages.limitPeriod', e.target.value)}
                      label="Limit Period"
                    >
                      <MenuItem value={LimitPeriod.Disabled}>Disabled</MenuItem>
                      <MenuItem value={LimitPeriod.PerMinute}>Per Minute</MenuItem>
                      <MenuItem value={LimitPeriod.PerHour}>Per Hour</MenuItem>
                      <MenuItem value={LimitPeriod.PerDay}>Per Day</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Limit Value"
                    type="number"
                    value={getValue('messages.limitValue') || ''}
                    onChange={(e) => updateSettings('messages.limitValue', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Maximum messages per period"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Log Lifetime (days)"
                    type="number"
                    value={getValue('messages.logLifetimeDays') || ''}
                    onChange={(e) => updateSettings('messages.logLifetimeDays', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Days to retain message logs"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>SIM Selection Mode</InputLabel>
                    <Select
                      value={getValue('messages.simSelectionMode') || SimSelectionMode.OSDefault}
                      onChange={(e) => updateSettings('messages.simSelectionMode', e.target.value)}
                      label="SIM Selection Mode"
                    >
                      <MenuItem value={SimSelectionMode.OSDefault}>OS Default</MenuItem>
                      <MenuItem value={SimSelectionMode.RoundRobin}>Round Robin</MenuItem>
                      <MenuItem value={SimSelectionMode.Random}>Random</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Min Send Interval (seconds)"
                    type="number"
                    value={getValue('messages.sendIntervalMin') || ''}
                    onChange={(e) => updateSettings('messages.sendIntervalMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Minimum interval between sends"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Max Send Interval (seconds)"
                    type="number"
                    value={getValue('messages.sendIntervalMax') || ''}
                    onChange={(e) => updateSettings('messages.sendIntervalMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Maximum interval between sends"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Webhook Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Webhook Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: '100%', p: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={getValue('webhooks.internetRequired') || false}
                        onChange={(e) => updateSettings('webhooks.internetRequired', e.target.checked)}
                      />
                    }
                    label="Internet Required for Webhooks"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Retry Count"
                    type="number"
                    value={getValue('webhooks.retryCount') || ''}
                    onChange={(e) => updateSettings('webhooks.retryCount', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Number of retry attempts"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Signing Key"
                    type="password"
                    value={getValue('webhooks.signingKey') || ''}
                    onChange={(e) => updateSettings('webhooks.signingKey', e.target.value)}
                    placeholder="Secret key for webhook signing"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Gateway Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Gateway Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Cloud URL"
                    value={getValue('gateway.cloudUrl') || ''}
                    onChange={(e) => updateSettings('gateway.cloudUrl', e.target.value)}
                    placeholder="https://api.sms-gate.app"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Private Token"
                    type="password"
                    value={getValue('gateway.privateToken') || ''}
                    onChange={(e) => updateSettings('gateway.privateToken', e.target.value)}
                    placeholder="Private server token"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Encryption Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Encryption Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: '100%', p: 1 }}>
                  <TextField
                    fullWidth
                    label="Encryption Passphrase"
                    type="password"
                    value={getValue('encryption.passphrase') || ''}
                    onChange={(e) => updateSettings('encryption.passphrase', e.target.value)}
                    placeholder="Passphrase for message encryption"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Logs Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Logs Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Log Lifetime (days)"
                    type="number"
                    value={getValue('logs.lifetimeDays') || ''}
                    onChange={(e) => updateSettings('logs.lifetimeDays', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Days to retain logs"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Ping Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Ping Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    fullWidth
                    label="Ping Interval (seconds)"
                    type="number"
                    value={getValue('ping.intervalSeconds') || ''}
                    onChange={(e) => updateSettings('ping.intervalSeconds', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Interval between ping requests"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );
};

export default SettingsComponent;
