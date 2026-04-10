import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Queue } from '../../types';
import { useNavigate } from 'react-router-dom';

interface QueueSummaryProps {
  queues: Queue[];
}

const statusColor: Record<Queue['status'], 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  paused: 'warning',
  closed: 'default',
  full: 'error',
};

const QueueSummary: React.FC<QueueSummaryProps> = ({ queues }) => {
  const navigate = useNavigate();

  return (
    <Card
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
    >
      <CardHeader
        title="Active Queues"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Button size="small" onClick={() => navigate('/queues')}>
            View All
          </Button>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {queues.length === 0 ? (
          <Box py={3} textAlign="center">
            <Typography color="text.secondary">No active queues</Typography>
          </Box>
        ) : (
          queues.slice(0, 5).map((queue, index) => {
            const fillPercent = (queue.currentLength / Math.max(queue.maxLength, 1)) * 100;
            return (
              <React.Fragment key={queue.id}>
                {index > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {queue.name}
                      </Typography>
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
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(fillPercent, 100)}
                    color={fillPercent > 80 ? 'error' : fillPercent > 60 ? 'warning' : 'primary'}
                    sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                  />
                  <Box display="flex" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {queue.currentLength} / {queue.maxLength}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        ~{queue.estimatedWaitTime} min
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </React.Fragment>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default QueueSummary;
