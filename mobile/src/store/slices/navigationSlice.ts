import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NavigationRoute, Coordinate, Amenity, ApiError } from '../../types';
import api from '../../services/api';

interface NavigationState {
  currentRoute: NavigationRoute | null;
  currentStepIndex: number;
  userLocation: Coordinate | null;
  destinationId: string | null;
  nearbyAmenities: Amenity[];
  isNavigating: boolean;
  isLoading: boolean;
  error: string | null;
  congestionZones: string[];
  estimatedArrivalSeconds: number | null;
}

const initialState: NavigationState = {
  currentRoute: null,
  currentStepIndex: 0,
  userLocation: null,
  destinationId: null,
  nearbyAmenities: [],
  isNavigating: false,
  isLoading: false,
  error: null,
  congestionZones: [],
  estimatedArrivalSeconds: null,
};

export const fetchRoute = createAsyncThunk(
  'navigation/fetchRoute',
  async (
    params: {
      venueId: string;
      startPoint: Coordinate;
      endPoint: Coordinate;
      isAccessible?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<{ data: NavigationRoute }>('/navigation/route', params);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Failed to calculate route.');
    }
  }
);

export const fetchNearbyAmenities = createAsyncThunk(
  'navigation/fetchNearbyAmenities',
  async (
    params: { venueId: string; latitude: number; longitude: number; radiusMeters?: number },
    { rejectWithValue }
  ) => {
    try {
      const { venueId, latitude, longitude, radiusMeters = 100 } = params;
      const response = await api.get<{ data: Amenity[] }>(
        `/navigation/amenities?venueId=${venueId}&lat=${latitude}&lng=${longitude}&radius=${radiusMeters}`
      );
      return response.data.data;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Failed to fetch amenities.');
    }
  }
);

export const reportCongestion = createAsyncThunk(
  'navigation/reportCongestion',
  async (params: { zoneId: string; level: 'low' | 'medium' | 'high' }, { rejectWithValue }) => {
    try {
      await api.post('/navigation/congestion', params);
      return params.zoneId;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Failed to report congestion.');
    }
  }
);

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    updateUserLocation(state, action: PayloadAction<Coordinate>) {
      state.userLocation = action.payload;
      // Auto-advance navigation steps based on proximity
      if (state.currentRoute && state.isNavigating) {
        const steps = state.currentRoute.steps;
        if (state.currentStepIndex < steps.length - 1) {
          const nextStep = steps[state.currentStepIndex + 1];
          const dist = getDistanceMeters(action.payload, nextStep.coordinate);
          if (dist < 10) {
            state.currentStepIndex += 1;
          }
        }
        // Recalculate ETA
        const remainingSteps = steps.slice(state.currentStepIndex);
        const remainingDistance = remainingSteps.reduce((sum, s) => sum + s.distanceMeters, 0);
        state.estimatedArrivalSeconds = Math.round(remainingDistance / 1.2); // ~1.2 m/s walk speed
      }
    },
    setCurrentStepIndex(state, action: PayloadAction<number>) {
      state.currentStepIndex = action.payload;
    },
    startNavigation(state) {
      state.isNavigating = true;
      state.currentStepIndex = 0;
    },
    stopNavigation(state) {
      state.isNavigating = false;
      state.currentRoute = null;
      state.currentStepIndex = 0;
      state.destinationId = null;
      state.estimatedArrivalSeconds = null;
    },
    setDestination(state, action: PayloadAction<string>) {
      state.destinationId = action.payload;
    },
    updateCongestionZones(state, action: PayloadAction<string[]>) {
      state.congestionZones = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoute.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRoute.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRoute = action.payload;
        state.currentStepIndex = 0;
      })
      .addCase(fetchRoute.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchNearbyAmenities.fulfilled, (state, action) => {
        state.nearbyAmenities = action.payload;
      });
  },
});

function getDistanceMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export const {
  updateUserLocation,
  setCurrentStepIndex,
  startNavigation,
  stopNavigation,
  setDestination,
  updateCongestionZones,
  clearError,
} = navigationSlice.actions;
export default navigationSlice.reducer;
