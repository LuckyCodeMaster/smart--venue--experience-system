import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Queue, QueuePosition, ApiError } from '../../types';
import api from '../../services/api';

interface QueueState {
  availableQueues: Queue[];
  activeQueues: Queue[];
  userPositions: QueuePosition[];
  selectedQueue: Queue | null;
  isLoading: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: QueueState = {
  availableQueues: [],
  activeQueues: [],
  userPositions: [],
  selectedQueue: null,
  isLoading: false,
  isJoining: false,
  isLeaving: false,
  error: null,
  lastUpdated: null,
};

export const fetchQueues = createAsyncThunk(
  'queue/fetchQueues',
  async (venueId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: Queue[] }>(`/queues?venueId=${venueId}`);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Failed to fetch queues.');
    }
  }
);

export const fetchUserQueues = createAsyncThunk(
  'queue/fetchUserQueues',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: { queues: Queue[]; positions: QueuePosition[] } }>(
        '/queues/user/active'
      );
      return response.data.data;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Failed to fetch user queues.');
    }
  }
);

export const fetchQueueById = createAsyncThunk(
  'queue/fetchQueueById',
  async (queueId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: Queue }>(`/queues/${queueId}`);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Failed to fetch queue.');
    }
  }
);

export const joinQueue = createAsyncThunk(
  'queue/joinQueue',
  async (queueId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: QueuePosition }>(`/queues/${queueId}/join`);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Failed to join queue.');
    }
  }
);

export const leaveQueue = createAsyncThunk(
  'queue/leaveQueue',
  async (queueId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/queues/${queueId}/leave`);
      return queueId;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Failed to leave queue.');
    }
  }
);

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    selectQueue(state, action: PayloadAction<Queue | null>) {
      state.selectedQueue = action.payload;
    },
    updateQueueRealTime(state, action: PayloadAction<Queue>) {
      const idx = state.availableQueues.findIndex((q) => q.id === action.payload.id);
      if (idx !== -1) {
        state.availableQueues[idx] = action.payload;
      }
      const activeIdx = state.activeQueues.findIndex((q) => q.id === action.payload.id);
      if (activeIdx !== -1) {
        state.activeQueues[activeIdx] = action.payload;
      }
      if (state.selectedQueue?.id === action.payload.id) {
        state.selectedQueue = action.payload;
      }
      state.lastUpdated = new Date().toISOString();
    },
    updatePositionRealTime(state, action: PayloadAction<QueuePosition>) {
      const idx = state.userPositions.findIndex((p) => p.queueId === action.payload.queueId);
      if (idx !== -1) {
        state.userPositions[idx] = action.payload;
      } else {
        state.userPositions.push(action.payload);
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQueues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQueues.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableQueues = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchQueues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchUserQueues.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserQueues.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeQueues = action.payload.queues;
        state.userPositions = action.payload.positions;
      })
      .addCase(fetchUserQueues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchQueueById.fulfilled, (state, action) => {
        state.selectedQueue = action.payload;
      });

    builder
      .addCase(joinQueue.pending, (state) => {
        state.isJoining = true;
        state.error = null;
      })
      .addCase(joinQueue.fulfilled, (state, action) => {
        state.isJoining = false;
        state.userPositions.push(action.payload);
      })
      .addCase(joinQueue.rejected, (state, action) => {
        state.isJoining = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(leaveQueue.pending, (state) => {
        state.isLeaving = true;
        state.error = null;
      })
      .addCase(leaveQueue.fulfilled, (state, action) => {
        state.isLeaving = false;
        state.userPositions = state.userPositions.filter((p) => p.queueId !== action.payload);
        state.activeQueues = state.activeQueues.filter((q) => q.id !== action.payload);
      })
      .addCase(leaveQueue.rejected, (state, action) => {
        state.isLeaving = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectQueue, updateQueueRealTime, updatePositionRealTime, clearError } =
  queueSlice.actions;
export default queueSlice.reducer;
