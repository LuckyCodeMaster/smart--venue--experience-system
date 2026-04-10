import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import AccessibleIcon from '@mui/icons-material/Accessible';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { Queue } from '../../types';

interface QueueCardProps {
  queue: Queue;
  selected?: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onSelect: (id: string) => void;
}

const typeIcon: Record<Queue['type'], React.ReactNode> = {
  general: null,
  vip: <StarIcon sx={{ fontSize: 14 }} />,
  express: <FlashOnIcon sx={{ fontSize: 14 }} />,
  accessibility: <AccessibleIcon sx={{ fontSize: 14 }} />,
};

const statusColor: Record<Queue['status'], 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  paused: 'warning',
  closed: 'default',
  full: 'error',
};

const QueueCard: React.FC<QueueCardProps> = ({
  queue,
  selected,
  onJoin,
  onLeave,
  onSelect,
}) => {
  const fillPercent = (queue.currentLength / Math.max(queue.maxLength, 1)) * 100;
  const isFull = queue.status === 'full' || queue.currentLength >= queue.maxLength;
  const canJoin = queue.status === 'active' && !queue.isUserInQueue && !isFull;

  return (
    <Card
      elevation={0}
      onClick={() => onSelect(queue.id)}
      sx={{
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { boxShadow: 4, borderColor: 'primary.light' },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Box display="flex" alignItems="center" gap={0.5} mb={0.25}>
              {typeIcon[queue.type]}
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                {queue.name}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {queue.venueName}
            </Typography>
          </Box>
          <Chip
            label={queue.status}
            size="small"
            color={statusColor[queue.status]}
            sx={{ textTransform: 'capitalize', height: 22, fontSize: '0.7rem' }}
          />
        </Box>

        {queue.description && (
          <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ fontSize: '0.8rem' }}>
            {queue.description}
          </Typography>
        )}

        <Box>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Queue capacity
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {queue.currentLength} / {queue.maxLength}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(fillPercent, 100)}
            color={fillPercent > 80 ? 'error' : fillPercent > 60 ? 'warning' : 'primary'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <Box display="flex" gap={3} mt={1.5}>
          <Tooltip title="People in queue">
            <Box display="flex" alignItems="center" gap={0.5}>
              <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600}>
                {queue.currentLength}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Estimated wait time">
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600}>
                ~{queue.estimatedWaitTime} min
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {queue.isUserInQueue && queue.position && (
          <Box
            mt={1.5}
            p={1}
            bgcolor="primary.lighter"
            borderRadius={2}
            border="1px solid"
            borderColor="primary.light"
          >
            <Typography variant="caption" color="primary.main" fontWeight={600}>
              Your position: #{queue.position}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Divider sx={{ mt: 1.5 }} />
      <CardActions sx={{ px: 2, py: 1 }}>
        {queue.isUserInQueue ? (
          <Button
            size="small"
            color="error"
            onClick={(e) => { e.stopPropagation(); onLeave(queue.id); }}
            fullWidth
          >
            Leave Queue
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            disabled={!canJoin}
            onClick={(e) => { e.stopPropagation(); onJoin(queue.id); }}
            fullWidth
          >
            {isFull ? 'Queue Full' : queue.status !== 'active' ? 'Unavailable' : 'Join Queue'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default QueueCard;
