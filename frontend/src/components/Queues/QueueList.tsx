import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Queue } from '../../types';
import QueueCard from './QueueCard';

interface QueueListProps {
  queues: Queue[];
  loading?: boolean;
  onJoin: (queueId: string) => void;
  onLeave: (queueId: string) => void;
  onSelect: (queueId: string) => void;
  onRefresh: () => void;
  selectedQueueId?: string;
}

const QueueList: React.FC<QueueListProps> = ({
  queues,
  loading,
  onJoin,
  onLeave,
  onSelect,
  onRefresh,
  selectedQueueId,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'wait' | 'length' | 'name'>('wait');

  const filtered = useMemo(() => {
    return queues
      .filter((q) => {
        const matchesSearch =
          q.name.toLowerCase().includes(search.toLowerCase()) ||
          q.venueName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
        const matchesType = typeFilter === 'all' || q.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'wait') return a.estimatedWaitTime - b.estimatedWaitTime;
        if (sortBy === 'length') return a.currentLength - b.currentLength;
        return a.name.localeCompare(b.name);
      });
  }, [queues, search, statusFilter, typeFilter, sortBy]);

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField
          size="small"
          placeholder="Search queues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
            <MenuItem value="full">Full</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="vip">VIP</MenuItem>
            <MenuItem value="express">Express</MenuItem>
            <MenuItem value="accessibility">Accessibility</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <MenuItem value="wait">Wait Time</MenuItem>
            <MenuItem value="length">Queue Length</MenuItem>
            <MenuItem value="name">Name</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {filtered.length === 0 ? (
        <Box py={6} textAlign="center">
          <Typography color="text.secondary">
            {queues.length === 0 ? 'No queues available' : 'No queues match your filters'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((queue) => (
            <Grid item xs={12} sm={6} lg={4} key={queue.id}>
              <QueueCard
                queue={queue}
                selected={queue.id === selectedQueueId}
                onJoin={onJoin}
                onLeave={onLeave}
                onSelect={onSelect}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default QueueList;
