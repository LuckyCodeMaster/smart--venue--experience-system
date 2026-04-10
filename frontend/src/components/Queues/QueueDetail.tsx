import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Queue } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';

interface QueueDetailProps {
  queue: Queue;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onClose?: () => void;
}

const QueueDetail: React.FC<QueueDetailProps> = ({ queue, onJoin, onLeave, onClose }) => {
  const { subscribeToQueue, unsubscribeFromQueue } = useWebSocket();

  useEffect(() => {
    subscribeToQueue(queue.id);
    return () => unsubscribeFromQueue(queue.id);
  }, [queue.id, subscribeToQueue, unsubscribeFromQueue]);

  const fillPercent = (queue.currentLength / Math.max(queue.maxLength, 1)) * 100;
  const canJoin = queue.status === 'active' && !queue.isUserInQueue && fillPercent < 100;

  const statusInfo = [
    {
      label: 'People waiting',
      value: queue.currentLength,
      icon: <PeopleIcon color="action" />,
    },
    {
      label: 'Estimated wait',
      value: `~${queue.estimatedWaitTime} min`,
      icon: <AccessTimeIcon color="action" />,
    },
    {
      label: 'Average wait',
      value: `${queue.averageWaitTime} min`,
      icon: <AccessTimeIcon color="action" />,
    },
  ];

  return (
    <Card
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
    >
      <CardHeader
        title={queue.name}
        subheader={queue.venueName}
        action={
          <Box display="flex" gap={1} alignItems="center">
            <Chip
              label={queue.status}
              color={
                queue.status === 'active'
                  ? 'success'
                  : queue.status === 'paused'
                  ? 'warning'
                  : 'default'
              }
              size="small"
            />
            {onClose && (
              <Button size="small" onClick={onClose}>
                Close
              </Button>
            )}
          </Box>
        }
      />
      <CardContent>
        {queue.description && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {queue.description}
          </Typography>
        )}

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2">Queue capacity</Typography>
            <Typography variant="body2" fontWeight={600}>
              {queue.currentLength} / {queue.maxLength}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(fillPercent, 100)}
            color={fillPercent > 80 ? 'error' : fillPercent > 60 ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <List dense sx={{ mb: 2 }}>
          {statusInfo.map(({ label, value, icon }) => (
            <ListItem key={label} disablePadding sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
              <ListItemText
                primary={label}
                secondary={value}
                primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mb: 2 }} />

        {queue.isUserInQueue ? (
          <Box textAlign="center">
            <Box position="relative" display="inline-flex" mb={1}>
              <CircularProgress
                variant="determinate"
                value={100 - ((queue.position ?? 1) / Math.max(queue.currentLength, 1)) * 100}
                size={80}
                thickness={4}
              />
              <Box
                position="absolute"
                top="50%"
                left="50%"
                sx={{ transform: 'translate(-50%, -50%)' }}
              >
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  #{queue.position}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Your position in queue
            </Typography>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => onLeave(queue.id)}
            >
              Leave Queue
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            fullWidth
            disabled={!canJoin}
            onClick={() => onJoin(queue.id)}
            size="large"
          >
            {fillPercent >= 100
              ? 'Queue Full'
              : queue.status !== 'active'
              ? `Queue ${queue.status}`
              : 'Join Queue'}
          </Button>
        )}

        <Box mt={2} display="flex" alignItems="center" gap={0.5}>
          <FiberManualRecordIcon sx={{ fontSize: 10, color: 'success.main' }} />
          <Typography variant="caption" color="text.secondary">
            Real-time updates enabled
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QueueDetail;
