import React, { useEffect } from 'react';
import { Grid, Typography, Box, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import QueueIcon from '@mui/icons-material/Queue';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WifiIcon from '@mui/icons-material/Wifi';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchQueues } from '../store/slices/queueSlice';
import { fetchVenues, fetchOccupancyHistory } from '../store/slices/venueSlice';
import { fetchSensors } from '../store/slices/sensorSlice';
import MetricCard from '../components/Dashboard/MetricCard';
import OccupancyChart from '../components/Dashboard/OccupancyChart';
import QueueSummary from '../components/Dashboard/QueueSummary';
import SensorStatus from '../components/Dashboard/SensorStatus';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { queues, loading: queuesLoading } = useAppSelector((state) => state.queues);
  const { venues, occupancyHistory, loading: venuesLoading } = useAppSelector((state) => state.venues);
  const { sensors, loading: sensorsLoading } = useAppSelector((state) => state.sensors);

  useEffect(() => {
    dispatch(fetchQueues(undefined));
    dispatch(fetchVenues(undefined));
    dispatch(fetchSensors(undefined));
    dispatch(fetchOccupancyHistory({}));
  }, [dispatch]);

  const totalOccupancy = venues.reduce((sum, v) => sum + v.currentOccupancy, 0);
  const totalCapacity = venues.reduce((sum, v) => sum + v.capacity, 0);
  const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;
  const activeQueues = queues.filter((q) => q.status === 'active').length;
  const totalQueueLength = queues.reduce((sum, q) => sum + q.currentLength, 0);
  const avgWaitTime =
    queues.length > 0
      ? Math.round(queues.reduce((sum, q) => sum + q.estimatedWaitTime, 0) / queues.length)
      : 0;
  const onlineSensors = sensors.filter((s) => s.status === 'online').length;
  const errorSensors = sensors.filter((s) => s.status === 'error' || s.status === 'warning').length;

  const isLoading = queuesLoading && venuesLoading && sensorsLoading;

  if (isLoading && queues.length === 0) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time overview of all venues, queues, and sensors
        </Typography>
      </Box>

      {errorSensors > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {errorSensors} sensor{errorSensors > 1 ? 's' : ''} require attention.
        </Alert>
      )}

      {/* KPI Metrics */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Occupancy"
            value={`${totalOccupancy.toLocaleString()}`}
            subtitle={`${occupancyPct}% of ${totalCapacity.toLocaleString()} capacity`}
            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
            trend={occupancyPct > 80 ? 8 : -3}
            trendLabel="vs yesterday"
            color={occupancyPct > 90 ? 'error' : occupancyPct > 70 ? 'warning' : 'primary'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Active Queues"
            value={activeQueues}
            subtitle={`${totalQueueLength} people waiting`}
            icon={<QueueIcon sx={{ fontSize: 28 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Avg. Wait Time"
            value={`${avgWaitTime} min`}
            subtitle="Across all active queues"
            icon={<AccessTimeIcon sx={{ fontSize: 28 }} />}
            trend={-5}
            trendLabel="improvement"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Sensors Online"
            value={`${onlineSensors} / ${sensors.length}`}
            subtitle={errorSensors > 0 ? `${errorSensors} need attention` : 'All systems normal'}
            icon={<WifiIcon sx={{ fontSize: 28 }} />}
            color={errorSensors > 0 ? 'warning' : 'success'}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} lg={8}>
          <OccupancyChart
            data={occupancyHistory}
            capacity={totalCapacity}
            title="Venue Occupancy Trend"
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <QueueSummary queues={queues.filter((q) => q.status === 'active')} />
        </Grid>
      </Grid>

      {/* Sensor Status */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SensorStatus sensors={sensors} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
