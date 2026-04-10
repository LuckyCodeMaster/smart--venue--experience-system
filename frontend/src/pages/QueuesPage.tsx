import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQueues } from '../hooks/useQueues';
import QueueList from '../components/Queues/QueueList';
import QueueDetail from '../components/Queues/QueueDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';

const QueuesPage: React.FC = () => {
  const { queueId } = useParams<{ queueId?: string }>();
  const {
    queues,
    selectedQueue,
    loading,
    selectQueue,
    deselectQueue,
    joinQueue,
    leaveQueue,
    refreshQueues,
  } = useQueues();

  React.useEffect(() => {
    if (queueId && (!selectedQueue || selectedQueue.id !== queueId)) {
      selectQueue(queueId);
    }
  }, [queueId, selectQueue, selectedQueue]);

  if (loading && queues.length === 0) {
    return <LoadingSpinner message="Loading queues..." />;
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Queue Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and manage all active queues in real time
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={selectedQueue ? 7 : 12}>
          <QueueList
            queues={queues}
            loading={loading}
            onJoin={joinQueue}
            onLeave={leaveQueue}
            onSelect={selectQueue}
            onRefresh={refreshQueues}
            selectedQueueId={selectedQueue?.id}
          />
        </Grid>

        {selectedQueue && (
          <Grid item xs={12} md={5}>
            <Box position="sticky" top={80}>
              <QueueDetail
                queue={selectedQueue}
                onJoin={joinQueue}
                onLeave={leaveQueue}
                onClose={deselectQueue}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default QueuesPage;
