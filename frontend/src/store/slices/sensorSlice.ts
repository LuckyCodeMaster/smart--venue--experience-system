import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { sensorsApi } from '../../services/api';
import { Sensor, SensorReading } from '../../types';

interface SensorState {
  sensors: Sensor[];
  selectedSensor: Sensor | null;
  readings: Record<string, SensorReading[]>;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: SensorState = {
  sensors: [],
  selectedSensor: null,
  readings: {},
  loading: false,
  error: null,
  lastUpdated: null,
};

export const fetchSensors = createAsyncThunk(
  'sensors/fetchAll',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await sensorsApi.getAll(params);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch sensors');
    }
  }
);

export const fetchSensorById = createAsyncThunk(
  'sensors/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await sensorsApi.getById(id);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch sensor');
    }
  }
);

export const fetchSensorReadings = createAsyncThunk(
  'sensors/fetchReadings',
  async ({ id, from, to }: { id: string; from: string; to: string }, { rejectWithValue }) => {
    try {
      const response = await sensorsApi.getHistory(id, from, to);
      return { id, readings: response.data.readings ?? response.data };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch sensor readings');
    }
  }
);

const sensorSlice = createSlice({
  name: 'sensors',
  initialState,
  reducers: {
    setSelectedSensor(state, action: PayloadAction<Sensor | null>) {
      state.selectedSensor = action.payload;
    },
    updateSensorReading(
      state,
      action: PayloadAction<{ sensorId: string; reading: SensorReading; status?: Sensor['status'] }>
    ) {
      const sensor = state.sensors.find((s) => s.id === action.payload.sensorId);
      if (sensor) {
        sensor.lastReading = action.payload.reading;
        sensor.lastSeen = action.payload.reading.timestamp;
        if (action.payload.status) sensor.status = action.payload.status;
      }
      if (state.selectedSensor?.id === action.payload.sensorId) {
        state.selectedSensor.lastReading = action.payload.reading;
        state.selectedSensor.lastSeen = action.payload.reading.timestamp;
      }
      const existingReadings = state.readings[action.payload.sensorId] ?? [];
      state.readings[action.payload.sensorId] = [
        ...existingReadings.slice(-99),
        action.payload.reading,
      ];
      state.lastUpdated = new Date().toISOString();
    },
    clearSensorError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSensors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSensors.fulfilled, (state, action) => {
        state.loading = false;
        state.sensors = action.payload.data ?? action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSensors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchSensorById.fulfilled, (state, action) => {
        state.selectedSensor = action.payload;
        const index = state.sensors.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.sensors[index] = action.payload;
        } else {
          state.sensors.push(action.payload);
        }
      });

    builder.addCase(fetchSensorReadings.fulfilled, (state, action) => {
      state.readings[action.payload.id] = action.payload.readings;
    });
  },
});

export const { setSelectedSensor, updateSensorReading, clearSensorError } = sensorSlice.actions;
export default sensorSlice.reducer;
