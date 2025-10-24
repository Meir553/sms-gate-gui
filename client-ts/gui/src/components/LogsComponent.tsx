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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assessment as LogsIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { LogEntry } from '../lib/domain';
import { LogEntryPriority } from '../lib/domain';

const LogsComponent: React.FC = () => {
  const { client } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    priority: '',
    module: '',
    fromDate: '',
    toDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const priorityOptions = [
    { value: LogEntryPriority.Debug, label: 'Debug', color: 'default' as const },
    { value: LogEntryPriority.Info, label: 'Info', color: 'info' as const },
    { value: LogEntryPriority.Warn, label: 'Warning', color: 'warning' as const },
    { value: LogEntryPriority.Error, label: 'Error', color: 'error' as const },
  ];

  const fetchLogs = async () => {
    if (!client) return;

    setLoading(true);
    setError('');

    try {
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : undefined;
      const toDate = filters.toDate ? new Date(filters.toDate) : undefined;
      
      const logEntries = await client.getLogs(fromDate, toDate);
      setLogs(logEntries);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [client]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      priority: '',
      module: '',
      fromDate: '',
      toDate: '',
    });
    fetchLogs();
  };

  const getPriorityColor = (priority: LogEntryPriority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.color : 'default';
  };

  const getPriorityLabel = (priority: LogEntryPriority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.label : priority;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleLogClick = (log: LogEntry) => {
    setSelectedLog(log);
    setLogDialogOpen(true);
  };

  const filteredLogs = logs.filter(log => {
    if (filters.priority && log.priority !== filters.priority) return false;
    if (filters.module && !log.module.toLowerCase().includes(filters.module.toLowerCase())) return false;
    return true;
  });

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Logs
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchLogs}
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filters</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    label="Priority"
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    {priorityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                <TextField
                  fullWidth
                  label="Module"
                  value={filters.module}
                  onChange={(e) => handleFilterChange('module', e.target.value)}
                  placeholder="Filter by module name"
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                <TextField
                  fullWidth
                  label="From Date"
                  type="datetime-local"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="datetime-local"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ width: '100%', p: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                  <Button variant="outlined" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredLogs.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <LogsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No logs found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {logs.length === 0 ? 'No logs available' : 'No logs match the current filters'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Priority</TableCell>
                      <TableCell>Module</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow 
                        key={log.id} 
                        hover 
                        onClick={() => handleLogClick(log)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Chip
                            label={getPriorityLabel(log.priority)}
                            color={getPriorityColor(log.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.module}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 300, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {log.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(log.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Log Entry Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip
                    label={getPriorityLabel(selectedLog.priority)}
                    color={getPriorityColor(selectedLog.priority)}
                    size="small"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Module
                  </Typography>
                  <Typography variant="body1">
                    {selectedLog.module}
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedLog.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Message
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedLog.message}
                  </Typography>
                </Box>
                {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
                  <Box sx={{ width: '100%', p: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Context
                    </Typography>
                    <Box component="pre" sx={{ 
                      backgroundColor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 200
                    }}>
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogsComponent;
