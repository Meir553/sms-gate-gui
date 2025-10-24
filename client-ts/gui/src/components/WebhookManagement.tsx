import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Webhook as WebhookIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { WebHook, RegisterWebHookRequest } from '../lib/domain';
import { WebHookEventType } from '../lib/domain';

const WebhookManagement: React.FC = () => {
  const { client } = useAuth();
  const [webhooks, setWebhooks] = useState<WebHook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<WebHook | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebHook | null>(null);
  const [formData, setFormData] = useState({
    event: WebHookEventType.SmsReceived,
    url: '',
    deviceId: '',
  });

  const eventTypes = [
    { value: WebHookEventType.SmsReceived, label: 'SMS Received' },
    { value: WebHookEventType.SmsSent, label: 'SMS Sent' },
    { value: WebHookEventType.SmsDelivered, label: 'SMS Delivered' },
    { value: WebHookEventType.SmsFailed, label: 'SMS Failed' },
    { value: WebHookEventType.SystemPing, label: 'System Ping' },
  ];

  const fetchWebhooks = async () => {
    if (!client) return;

    setLoading(true);
    setError('');

    try {
      const webhookList = await client.getWebhooks();
      setWebhooks(webhookList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [client]);

  const handleAddWebhook = () => {
    setEditingWebhook(null);
    setFormData({
      event: WebHookEventType.SmsReceived,
      url: '',
      deviceId: '',
    });
    setAddDialogOpen(true);
  };

  const handleEditWebhook = (webhook: WebHook) => {
    setEditingWebhook(webhook);
    setFormData({
      event: webhook.event,
      url: webhook.url,
      deviceId: webhook.deviceId || '',
    });
    setAddDialogOpen(true);
  };

  const handleSaveWebhook = async () => {
    if (!client) return;

    if (!formData.url.trim()) {
      setError('Please enter a webhook URL');
      return;
    }

    try {
      const webhookData: RegisterWebHookRequest = {
        id: editingWebhook?.id || null,
        event: formData.event,
        url: formData.url.trim(),
        deviceId: formData.deviceId.trim() || null,
      };

      if (editingWebhook) {
        await client.registerWebhook(webhookData);
        setSuccess('Webhook updated successfully');
      } else {
        await client.registerWebhook(webhookData);
        setSuccess('Webhook created successfully');
      }

      setAddDialogOpen(false);
      fetchWebhooks();
    } catch (err: any) {
      setError(err.message || 'Failed to save webhook');
    }
  };

  const handleDeleteWebhook = (webhook: WebHook) => {
    setWebhookToDelete(webhook);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteWebhook = async () => {
    if (!client || !webhookToDelete) return;

    setDeleting(true);
    try {
      await client.deleteWebhook(webhookToDelete.id!);
      setWebhooks(webhooks.filter(w => w.id !== webhookToDelete.id));
      setDeleteDialogOpen(false);
      setWebhookToDelete(null);
      setSuccess('Webhook deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete webhook');
    } finally {
      setDeleting(false);
    }
  };

  const getEventTypeLabel = (eventType: WebHookEventType) => {
    const event = eventTypes.find(e => e.value === eventType);
    return event ? event.label : eventType;
  };

  const getEventTypeColor = (eventType: WebHookEventType) => {
    switch (eventType) {
      case WebHookEventType.SmsReceived:
        return 'primary';
      case WebHookEventType.SmsSent:
        return 'info';
      case WebHookEventType.SmsDelivered:
        return 'success';
      case WebHookEventType.SmsFailed:
        return 'error';
      case WebHookEventType.SystemPing:
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Webhook Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchWebhooks}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddWebhook}
          >
            Add Webhook
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

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : webhooks.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <WebhookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No webhooks configured
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create webhooks to receive notifications about SMS events
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Type</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Device ID</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <Chip
                          label={getEventTypeLabel(webhook.event)}
                          color={getEventTypeColor(webhook.event) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {webhook.url}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {webhook.deviceId || 'All devices'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditWebhook(webhook)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteWebhook(webhook)}
                          disabled={deleting}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Webhook Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ width: '100%' }}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={formData.event}
                  onChange={(e) => setFormData({ ...formData, event: e.target.value as WebHookEventType })}
                  label="Event Type"
                >
                  {eventTypes.map((event) => (
                    <MenuItem key={event.value} value={event.value}>
                      {event.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://your-server.com/webhook"
                required
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Device ID (optional)"
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                placeholder="Leave empty for all devices"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveWebhook}
            variant="contained"
            disabled={!formData.url.trim()}
          >
            {editingWebhook ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Webhook
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this webhook? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Event: {webhookToDelete && getEventTypeLabel(webhookToDelete.event)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            URL: {webhookToDelete?.url}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteWebhook}
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebhookManagement;
