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
  DialogContentText,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Devices as DevicesIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { Device } from '../lib/domain';

const DeviceManagement: React.FC = () => {
  const { client } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDevices = async () => {
    if (!client) return;

    setLoading(true);
    setError('');

    try {
      const deviceList = await client.getDevices();
      setDevices(deviceList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [client]);

  const handleDeleteDevice = (device: Device) => {
    setDeviceToDelete(device);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDevice = async () => {
    if (!client || !deviceToDelete) return;

    setDeleting(true);
    try {
      await client.deleteDevice(deviceToDelete.id);
      setDevices(devices.filter(d => d.id !== deviceToDelete.id));
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete device');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceStatus = (device: Device) => {
    const now = new Date();
    const lastSeen = new Date(device.lastSeen);
    const timeDiff = now.getTime() - lastSeen.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < 5) {
      return { status: 'Online', color: 'success' as const };
    } else if (minutesDiff < 60) {
      return { status: 'Recently Online', color: 'warning' as const };
    } else {
      return { status: 'Offline', color: 'error' as const };
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Device Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchDevices}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : devices.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <DevicesIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No devices found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Devices will appear here once they are registered with the SMS Gateway
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Device Name</TableCell>
                    <TableCell>Device ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Seen</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {devices.map((device) => {
                    const deviceStatus = getDeviceStatus(device);
                    return (
                      <TableRow key={device.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {device.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {device.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={deviceStatus.status}
                            color={deviceStatus.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(device.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(device.lastSeen)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(device.updatedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteDevice(device)}
                            disabled={deleting}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Device
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the device "{deviceToDelete?.name}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteDevice}
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

export default DeviceManagement;
