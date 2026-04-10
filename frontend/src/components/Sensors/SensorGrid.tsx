import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import AirIcon from '@mui/icons-material/Air';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SensorsIcon from '@mui/icons-material/Sensors';
import { Sensor } from '../../types';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface SensorGridProps {
  sensors: Sensor[];
  onSelect: (sensor: Sensor) => void;
  selectedSensorId?: string;
}

const statusConfig = {
  online: { icon: <WifiIcon />, color: 'success' as const, label: 'Online' },
  offline: { icon: <WifiOffIcon />, color: 'default' as const, label: 'Offline' },
  warning: { icon: <WarningAmberIcon />, color: 'warning' as const, label: 'Warning' },
  error: { icon: <ErrorOutlineIcon />, color: 'error' as const, label: 'Error' },
};

const typeIcon: Record<string, React.ReactNode> = {
  occupancy: <SensorsIcon />,
  temperature: <ThermostatIcon />,
  humidity: <OpacityIcon />,
  air_quality: <AirIcon />,
  noise: <SensorsIcon />,
  camera: <CameraAltIcon />,
  door_counter: <SensorsIcon />,
};

const SensorGrid: React.FC<SensorGridProps> = ({ sensors, onSelect, selectedSensorId }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const sensorTypes = Array.from(new Set(sensors.map((s) => s.type)));

  const filtered = sensors.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search sensors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            {sensorTypes.map((t) => (
              <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                {t.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {filtered.map((sensor) => {
          const status = statusConfig[sensor.status];
          const lastSeen = (() => {
            try {
              return formatDistanceToNow(parseISO(sensor.lastSeen), { addSuffix: true });
            } catch {
              return 'Unknown';
            }
          })();

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={sensor.id}>
              <Card
                elevation={0}
                onClick={() => onSelect(sensor)}
                sx={{
                  border: '2px solid',
                  borderColor: selectedSensorId === sensor.id ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box color="text.secondary">{typeIcon[sensor.type] ?? <SensorsIcon />}</Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
                          {sensor.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sensor.location}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </Box>

                  <Chip
                    label={sensor.type.replace('_', ' ')}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize', mb: 1 }}
                  />

                  {sensor.lastReading && (
                    <Box
                      p={1}
                      bgcolor="action.hover"
                      borderRadius={1.5}
                      mb={1}
                    >
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {sensor.lastReading.value}
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          ml={0.5}
                        >
                          {sensor.lastReading.unit}
                        </Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Latest reading
                      </Typography>
                    </Box>
                  )}

                  {sensor.batteryLevel !== undefined && (
                    <Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          Battery
                        </Typography>
                        <Typography variant="caption">{sensor.batteryLevel}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={sensor.batteryLevel}
                        color={
                          sensor.batteryLevel < 20
                            ? 'error'
                            : sensor.batteryLevel < 50
                            ? 'warning'
                            : 'success'
                        }
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  )}

                  <Tooltip title={sensor.lastSeen}>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Last seen: {lastSeen}
                    </Typography>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filtered.length === 0 && (
        <Box py={6} textAlign="center">
          <Typography color="text.secondary">No sensors match your filters</Typography>
        </Box>
      )}
    </Box>
  );
};

export default SensorGrid;
