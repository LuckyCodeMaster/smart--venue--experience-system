import React, { useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchSensors, setSelectedSensor } from '../store/slices/sensorSlice';
import SensorGrid from '../components/Sensors/SensorGrid';
import SensorChart from '../components/Sensors/SensorChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Sensor } from '../types';

const SensorsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sensors, selectedSensor, loading } = useAppSelector((state) => state.sensors);

  useEffect(() => {
    dispatch(fetchSensors(undefined));
    const interval = setInterval(() => dispatch(fetchSensors(undefined)), 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleSelect = (sensor: Sensor) => {
    dispatch(setSelectedSensor(sensor));
  };

  if (loading && sensors.length === 0) {
    return <LoadingSpinner message="Loading sensors..." />;
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Sensor Monitoring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time monitoring of all IoT sensors across venues
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={selectedSensor ? 7 : 12}>
          <SensorGrid
            sensors={sensors}
            onSelect={handleSelect}
            selectedSensorId={selectedSensor?.id}
          />
        </Grid>
        {selectedSensor && (
          <Grid item xs={12} md={5}>
            <Box position="sticky" top={80}>
              <SensorChart sensor={selectedSensor} />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SensorsPage;
