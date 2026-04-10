import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { Sensor } from '../../types';

interface SensorStatusProps {
  sensors: Sensor[];
}

const statusConfig = {
  online: { icon: <WifiIcon />, color: 'success' as const, label: 'Online' },
  offline: { icon: <WifiOffIcon />, color: 'default' as const, label: 'Offline' },
  warning: { icon: <WarningIcon />, color: 'warning' as const, label: 'Warning' },
  error: { icon: <ErrorIcon />, color: 'error' as const, label: 'Error' },
};

const SensorStatus: React.FC<SensorStatusProps> = ({ sensors }) => {
  const counts = sensors.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<Sensor['status'], number>
  );

  return (
    <Card
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
    >
      <CardHeader
        title="Sensor Status Overview"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader={`${sensors.length} sensors monitored`}
      />
      <CardContent sx={{ pt: 0 }}>
        <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
          {(Object.keys(statusConfig) as Sensor['status'][]).map((status) => (
            <Box key={status} textAlign="center">
              <Typography variant="h5" fontWeight={700} color={`${statusConfig[status].color}.main`}>
                {counts[status] ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {statusConfig[status].label}
              </Typography>
            </Box>
          ))}
        </Box>
        <Grid container spacing={1}>
          {sensors.slice(0, 12).map((sensor) => {
            const cfg = statusConfig[sensor.status];
            return (
              <Grid item xs={6} sm={4} md={3} key={sensor.id}>
                <Tooltip title={`${sensor.name} — ${sensor.location}`} arrow>
                  <Box
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: 'default',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Chip
                      icon={cfg.icon}
                      size="small"
                      color={cfg.color}
                      sx={{ height: 20, '& .MuiChip-icon': { fontSize: 12 }, px: 0 }}
                    />
                    <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                      {sensor.name}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
        {sensors.length > 12 && (
          <Typography variant="caption" color="text.secondary" mt={1} display="block">
            +{sensors.length - 12} more sensors
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default SensorStatus;
