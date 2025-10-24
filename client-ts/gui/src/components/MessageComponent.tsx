import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Chip,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { Message } from '../lib/domain';
import { ProcessState } from '../lib/domain';

const MessageComponent: React.FC = () => {
  const { client } = useAuth();
  const [message, setMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']);
  const [ttl, setTtl] = useState<number | null>(null);
  const [simNumber, setSimNumber] = useState<number | null>(null);
  const [withDeliveryReport, setWithDeliveryReport] = useState(true);
  const [skipPhoneValidation, setSkipPhoneValidation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [messageStates, setMessageStates] = useState<{ [key: string]: any }>({});
  const [checkingStates, setCheckingStates] = useState<{ [key: string]: boolean }>({});

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, '']);
  };

  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
    }
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const newPhoneNumbers = [...phoneNumbers];
    newPhoneNumbers[index] = value;
    setPhoneNumbers(newPhoneNumbers);
  };

  const getStateColor = (state: ProcessState) => {
    switch (state) {
      case ProcessState.Delivered:
        return 'success';
      case ProcessState.Sent:
        return 'primary';
      case ProcessState.Processed:
        return 'info';
      case ProcessState.Pending:
        return 'warning';
      case ProcessState.Failed:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStateIcon = (state: ProcessState) => {
    switch (state) {
      case ProcessState.Delivered:
        return <CheckCircleIcon />;
      case ProcessState.Failed:
        return <ErrorIcon />;
      case ProcessState.Pending:
        return <ScheduleIcon />;
      default:
        return null;
    }
  };

  const handleSend = async () => {
    if (!client) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const validPhoneNumbers = phoneNumbers.filter(phone => phone.trim() !== '');
      
      if (validPhoneNumbers.length === 0) {
        setError('Please enter at least one phone number');
        return;
      }

      if (!message.trim()) {
        setError('Please enter a message');
        return;
      }

      const messageData: Message = {
        message: message.trim(),
        phoneNumbers: validPhoneNumbers,
        ttl: ttl || null,
        simNumber: simNumber || null,
        withDeliveryReport,
      };

      const result = await client.send(messageData, { skipPhoneValidation });
      
      setMessageStates({ [result.id]: result });
      setSuccess(`Message sent successfully! Message ID: ${result.id}`);
      setMessage('');
      setPhoneNumbers(['']);
      setTtl(null);
      setSimNumber(null);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const checkMessageState = async (messageId: string) => {
    if (!client) return;

    setCheckingStates(prev => ({ ...prev, [messageId]: true }));

    try {
      const state = await client.getState(messageId);
      setMessageStates(prev => ({ ...prev, [messageId]: state }));
    } catch (err: any) {
      setError(`Failed to check message state: ${err.message}`);
    } finally {
      setCheckingStates(prev => ({ ...prev, [messageId]: false }));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Send SMS Message
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: { xs: 1, md: 2 } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Details
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                margin="normal"
                placeholder="Enter your SMS message here..."
              />

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Phone Numbers
              </Typography>
              {phoneNumbers.map((phone, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Phone ${index + 1}`}
                    value={phone}
                    onChange={(e) => updatePhoneNumber(index, e.target.value)}
                    margin="normal"
                    placeholder="+1234567890"
                  />
                  {phoneNumbers.length > 1 && (
                    <IconButton
                      onClick={() => removePhoneNumber(index)}
                      color="error"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addPhoneNumber}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Add Phone Number
              </Button>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="TTL (seconds)"
                    type="number"
                    value={ttl || ''}
                    onChange={(e) => setTtl(e.target.value ? parseInt(e.target.value) : null)}
                    margin="normal"
                    placeholder="Leave empty for no expiration"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="SIM Number"
                    type="number"
                    value={simNumber || ''}
                    onChange={(e) => setSimNumber(e.target.value ? parseInt(e.target.value) : null)}
                    margin="normal"
                    placeholder="Leave empty for default SIM"
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={withDeliveryReport}
                      onChange={(e) => setWithDeliveryReport(e.target.checked)}
                    />
                  }
                  label="Include delivery report"
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={skipPhoneValidation}
                      onChange={(e) => setSkipPhoneValidation(e.target.checked)}
                    />
                  }
                  label="Skip phone validation"
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSend}
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Message'}
              </Button>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: 1, md: 1 } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Status
              </Typography>
              {Object.keys(messageStates).length === 0 ? (
                <Typography color="text.secondary">
                  No messages sent yet
                </Typography>
              ) : (
                <List>
                  {Object.entries(messageStates).map(([messageId, state]) => (
                    <ListItem key={messageId} divider>
                      <ListItemText
                        primary={`Message ${messageId.slice(0, 8)}...`}
                        secondary={
                          <Box>
                            <Chip
                              icon={getStateIcon(state.state) || undefined}
                              label={state.state}
                              color={getStateColor(state.state) as any}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            {state.recipients && state.recipients.length > 0 && (
                              <Typography variant="caption" display="block">
                                Recipients: {state.recipients.length}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => checkMessageState(messageId)}
                          disabled={checkingStates[messageId]}
                        >
                          {checkingStates[messageId] ? (
                            <CircularProgress size={20} />
                          ) : (
                            <CheckCircleIcon />
                          )}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageComponent;
