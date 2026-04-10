import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { queuesApi } from '../../services/api';
import { Queue, QueueTicket } from '../../types';

interface QueueState {
  queues: Queue[];
  selectedQueue: Queue | null;
  userTickets: QueueTicket[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: QueueState = {
  queues: [],
  selectedQueue: null,
  userTickets: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

export const fetchQueues = createAsyncThunk(
  'queues/fetchAll',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await queuesApi.getAll(params);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch queues');
    }
  }
);

export const fetchQueueById = createAsyncThunk(
  'queues/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await queuesApi.getById(id);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch queue');
    }
  }
);

export const joinQueue = createAsyncThunk(
  'queues/join',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await queuesApi.join(id);
      return { queueId: id, ticket: response.data };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to join queue');
    }
  }
);

export const leaveQueue = createAsyncThunk(
  'queues/leave',
  async (id: string, { rejectWithValue }) => {
    try {
      await queuesApi.leave(id);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to leave queue');
    }
  }
);

const queueSlice = createSlice({
  name: 'queues',
  initialState,
  reducers: {
    setSelectedQueue(state, action: PayloadAction<Queue | null>) {
      state.selectedQueue = action.payload;
    },
    updateQueueRealtime(state, action: PayloadAction<Partial<Queue> & { id: string }>) {
      const index = state.queues.findIndex((q) => q.id === action.payload.id);
      if (index !== -1) {
        state.queues[index] = { ...state.queues[index], ...action.payload };
      }
      if (state.selectedQueue?.id === action.payload.id) {
        state.selectedQueue = { ...state.selectedQueue, ...action.payload };
      }
      state.lastUpdated = new Date().toISOString();
    },
    clearQueueError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQueues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQueues.fulfilled, (state, action) => {
        state.loading = false;
        state.queues = action.payload.data ?? action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchQueues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchQueueById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchQueueById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedQueue = action.payload;
        const index = state.queues.findIndex((q) => q.id === action.payload.id);
        if (index !== -1) {
          state.queues[index] = action.payload;
        } else {
          state.queues.push(action.payload);
        }
      })
      .addCase(fetchQueueById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder.addCase(joinQueue.fulfilled, (state, action) => {
      const { queueId, ticket } = action.payload;
      const queue = state.queues.find((q) => q.id === queueId);
      if (queue) {
        queue.isUserInQueue = true;
        queue.userTicketId = ticket.id;
        queue.currentLength += 1;
      }
      state.userTickets.push(ticket);
    });

    builder.addCase(leaveQueue.fulfilled, (state, action) => {
      const queueId = action.payload;
      const queue = state.queues.find((q) => q.id === queueId);
      if (queue) {
        queue.isUserInQueue = false;
        queue.userTicketId = undefined;
        queue.currentLength = Math.max(0, queue.currentLength - 1);
      }
      state.userTickets = state.userTickets.filter((t) => t.queueId !== queueId);
    });
  },
});

export const { setSelectedQueue, updateQueueRealtime, clearQueueError } = queueSlice.actions;
export default queueSlice.reducer;
