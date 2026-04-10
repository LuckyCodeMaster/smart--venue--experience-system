import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { venuesApi, analyticsApi } from '../../services/api';
import { Venue, OccupancyDataPoint } from '../../types';

interface VenueState {
  venues: Venue[];
  selectedVenue: Venue | null;
  occupancyHistory: OccupancyDataPoint[];
  loading: boolean;
  error: string | null;
}

const initialState: VenueState = {
  venues: [],
  selectedVenue: null,
  occupancyHistory: [],
  loading: false,
  error: null,
};

export const fetchVenues = createAsyncThunk(
  'venues/fetchAll',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await venuesApi.getAll(params);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch venues');
    }
  }
);

export const fetchVenueById = createAsyncThunk(
  'venues/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await venuesApi.getById(id);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch venue');
    }
  }
);

export const fetchOccupancyHistory = createAsyncThunk(
  'venues/fetchOccupancyHistory',
  async ({ venueId, period }: { venueId?: string; period?: string }, { rejectWithValue }) => {
    try {
      const response = await analyticsApi.getOccupancyTrend(venueId, period);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch occupancy data');
    }
  }
);

const venueSlice = createSlice({
  name: 'venues',
  initialState,
  reducers: {
    setSelectedVenue(state, action: PayloadAction<Venue | null>) {
      state.selectedVenue = action.payload;
    },
    updateVenueOccupancy(
      state,
      action: PayloadAction<{ id: string; currentOccupancy: number; occupancyPercentage: number }>
    ) {
      const venue = state.venues.find((v) => v.id === action.payload.id);
      if (venue) {
        venue.currentOccupancy = action.payload.currentOccupancy;
        venue.occupancyPercentage = action.payload.occupancyPercentage;
      }
      if (state.selectedVenue?.id === action.payload.id) {
        state.selectedVenue.currentOccupancy = action.payload.currentOccupancy;
        state.selectedVenue.occupancyPercentage = action.payload.occupancyPercentage;
      }
    },
    clearVenueError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload.data ?? action.payload;
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchVenueById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVenueById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVenue = action.payload;
        const index = state.venues.findIndex((v) => v.id === action.payload.id);
        if (index !== -1) {
          state.venues[index] = action.payload;
        } else {
          state.venues.push(action.payload);
        }
      })
      .addCase(fetchVenueById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchOccupancyHistory.fulfilled, (state, action) => {
        state.occupancyHistory = action.payload.data ?? action.payload;
      });
  },
});

export const { setSelectedVenue, updateVenueOccupancy, clearVenueError } = venueSlice.actions;
export default venueSlice.reducer;
