import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  HealthAndSafety as HealthIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { HealthResponse } from '../lib/domain';
import { HealthStatus } from '../lib/domain';

const HealthComponent: React.FC = () => {
  const { client } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHealth = async () => {
    if (!client) return;

    setLoading(true);
    setError('');

    try {
      const healthData = await client.getHealth();
      setHealth(healthData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [client]);

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case HealthStatus.Pass:
        return 'success';
      case HealthStatus.Warn:
        return 'warning';
      case HealthStatus.Fail:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case HealthStatus.Pass:
        return <CheckCircleIcon />;
      case HealthStatus.Warn:
        return <WarningIcon />;
      case HealthStatus.Fail:
        return <ErrorIcon />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: HealthStatus) => {
    switch (status) {
      case HealthStatus.Pass:
        return 'Healthy';
      case HealthStatus.Warn:
        return 'Warning';
      case HealthStatus.Fail:
        return 'Failed';
      default:
        return status;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(2)} ms`;
    }
    if (unit === 'bytes') {
      return `${(value / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${value} ${unit}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Health
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchHealth}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : health ? (
        <Box>
          {/* Overall Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HealthIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5" gutterBottom>
                    System Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(health.status) || undefined}
                    label={getStatusLabel(health.status)}
                    color={getStatusColor(health.status) as any}
                    size="medium"
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="h6">
                    {health.version}
                  </Typography>
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Release ID
                  </Typography>
                  <Typography variant="h6">
                    {health.releaseId}
                  </Typography>
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Checks
                  </Typography>
                  <Typography variant="h6">
                    {Object.keys(health.checks).length}
                  </Typography>
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="h6">
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Health Checks */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Health Checks
              </Typography>
              {Object.keys(health.checks).length === 0 ? (
                <Typography color="text.secondary">
                  No health checks available
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Check Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(health.checks).map(([checkName, check]) => (
                        <TableRow key={checkName}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {checkName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(check.status) || undefined}
                              label={getStatusLabel(check.status)}
                              color={getStatusColor(check.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {check.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatValue(check.observedValue, check.observedUnit)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Detailed Health Information */}
          {Object.keys(health.checks).length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Health Information
                </Typography>
                {Object.entries(health.checks).map(([checkName, check]) => (
                  <Accordion key={checkName} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                          {checkName}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(check.status) || undefined}
                          label={getStatusLabel(check.status)}
                          color={getStatusColor(check.status) as any}
                          size="small"
                          sx={{ mr: 2 }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Description
                          </Typography>
                          <Typography variant="body2">
                            {check.description}
                          </Typography>
                        </Box>
                        <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Observed Value
                          </Typography>
                          <Typography variant="body2">
                            {formatValue(check.observedValue, check.observedUnit)}
                          </Typography>
                        </Box>
                        <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="body2">
                            {getStatusLabel(check.status)}
                          </Typography>
                        </Box>
                        <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Unit
                          </Typography>
                          <Typography variant="body2">
                            {check.observedUnit}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          )}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <HealthIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No health data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click refresh to fetch the latest health status
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HealthComponent;
