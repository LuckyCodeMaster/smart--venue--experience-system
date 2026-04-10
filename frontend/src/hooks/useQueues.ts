import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import {
  fetchQueues,
  fetchQueueById,
  joinQueue,
  leaveQueue,
  setSelectedQueue,
} from '../store/slices/queueSlice';
import { useWebSocket } from './useWebSocket';
import toast from 'react-hot-toast';

export const useQueues = (venueId?: string) => {
  const dispatch = useAppDispatch();
  const { queues, selectedQueue, userTickets, loading, error, lastUpdated } = useAppSelector(
    (state) => state.queues
  );
  const { subscribeToQueue, unsubscribeFromQueue } = useWebSocket();

  useEffect(() => {
    dispatch(fetchQueues(venueId ? { venueId } : undefined));
  }, [dispatch, venueId]);

  const selectQueue = useCallback(
    async (queueId: string) => {
      const existing = queues.find((q) => q.id === queueId);
      if (existing) {
        dispatch(setSelectedQueue(existing));
      }
      await dispatch(fetchQueueById(queueId));
      subscribeToQueue(queueId);
    },
    [dispatch, queues, subscribeToQueue]
  );

  const deselectQueue = useCallback(() => {
    if (selectedQueue) {
      unsubscribeFromQueue(selectedQueue.id);
    }
    dispatch(setSelectedQueue(null));
  }, [dispatch, selectedQueue, unsubscribeFromQueue]);

  const handleJoinQueue = useCallback(
    async (queueId: string) => {
      const result = await dispatch(joinQueue(queueId));
      if (joinQueue.fulfilled.match(result)) {
        toast.success('Successfully joined the queue!');
        subscribeToQueue(queueId);
      } else {
        toast.error(result.payload as string ?? 'Failed to join queue');
      }
      return result;
    },
    [dispatch, subscribeToQueue]
  );

  const handleLeaveQueue = useCallback(
    async (queueId: string) => {
      const result = await dispatch(leaveQueue(queueId));
      if (leaveQueue.fulfilled.match(result)) {
        toast.success('Left the queue');
        unsubscribeFromQueue(queueId);
      } else {
        toast.error(result.payload as string ?? 'Failed to leave queue');
      }
      return result;
    },
    [dispatch, unsubscribeFromQueue]
  );

  const refreshQueues = useCallback(() => {
    dispatch(fetchQueues(venueId ? { venueId } : undefined));
  }, [dispatch, venueId]);

  return {
    queues,
    selectedQueue,
    userTickets,
    loading,
    error,
    lastUpdated,
    selectQueue,
    deselectQueue,
    joinQueue: handleJoinQueue,
    leaveQueue: handleLeaveQueue,
    refreshQueues,
  };
};
