import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import ElevatorIcon from '@mui/icons-material/Elevator';
import StairsIcon from '@mui/icons-material/Stairs';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import WcIcon from '@mui/icons-material/Wc';
import { useAppSelector } from '../store';

const mockRoutes = [
  {
    id: '1',
    from: 'Main Entrance',
    to: 'Restrooms',
    steps: [
      { order: 1, instruction: 'Enter through the main entrance', direction: 'straight' as const },
      { order: 2, instruction: 'Turn right at the information desk', direction: 'right' as const },
      { order: 3, instruction: 'Walk 50 meters down the corridor', direction: 'straight' as const },
      { order: 4, instruction: 'Restrooms are on the left', direction: 'left' as const },
    ],
    estimatedTime: 3,
    distance: 120,
  },
  {
    id: '2',
    from: 'Main Entrance',
    to: 'Conference Hall A',
    steps: [
      { order: 1, instruction: 'Enter through the main entrance', direction: 'straight' as const },
      { order: 2, instruction: 'Take the elevator to Floor 2', direction: 'up' as const },
      { order: 3, instruction: 'Turn left after exiting the elevator', direction: 'left' as const },
      { order: 4, instruction: 'Conference Hall A is at the end of the corridor', direction: 'straight' as const },
    ],
    estimatedTime: 5,
    distance: 200,
  },
];

const destinations = [
  'Restrooms',
  'Conference Hall A',
  'Conference Hall B',
  'Cafeteria',
  'Information Desk',
  'Parking',
  'Emergency Exit',
];

const directionIcon: Record<string, React.ReactNode> = {
  straight: <DirectionsWalkIcon />,
  right: <DirectionsWalkIcon sx={{ transform: 'rotate(90deg)' }} />,
  left: <DirectionsWalkIcon sx={{ transform: 'rotate(-90deg)' }} />,
  up: <ElevatorIcon />,
  down: <StairsIcon />,
};

const NavigationPage: React.FC = () => {
  const [from, setFrom] = useState('Main Entrance');
  const [to, setTo] = useState('');
  const [activeRoute, setActiveRoute] = useState<typeof mockRoutes[0] | null>(null);
  const venues = useAppSelector((state) => state.venues.venues);

  const handleNavigate = () => {
    const route = mockRoutes.find((r) => r.to === to) ?? mockRoutes[0];
    setActiveRoute(route);
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Indoor Navigation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Get step-by-step directions to any location within the venue
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Full map integration (e.g., Google Maps Indoor, HERE Maps) requires configuration of venue
        floor plan assets. The demo below uses mock navigation data.
      </Alert>

      <Grid container spacing={2}>
        {/* Route Planner */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardHeader
              title="Plan Your Route"
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              avatar={<MapIcon color="primary" />}
            />
            <CardContent>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>From</InputLabel>
                <Select value={from} label="From" onChange={(e) => setFrom(e.target.value)}>
                  <MenuItem value="Main Entrance">Main Entrance</MenuItem>
                  <MenuItem value="East Entrance">East Entrance</MenuItem>
                  <MenuItem value="Parking Level B1">Parking Level B1</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>To</InputLabel>
                <Select value={to} label="To" onChange={(e) => setTo(e.target.value)}>
                  {destinations.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                disabled={!to}
                onClick={handleNavigate}
                startIcon={<DirectionsWalkIcon />}
              >
                Get Directions
              </Button>
            </CardContent>
          </Card>

          {/* Venue selector */}
          {venues.length > 0 && (
            <Card
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mt: 2 }}
            >
              <CardHeader
                title="Quick Locations"
                titleTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {[
                    { label: 'Restrooms', icon: <WcIcon sx={{ fontSize: 14 }} /> },
                    { label: 'Exit', icon: <ExitToAppIcon sx={{ fontSize: 14 }} /> },
                    { label: 'Meeting Room', icon: <MeetingRoomIcon sx={{ fontSize: 14 }} /> },
                    { label: 'Elevator', icon: <ElevatorIcon sx={{ fontSize: 14 }} /> },
                  ].map(({ label, icon }) => (
                    <Chip
                      key={label}
                      icon={icon}
                      label={label}
                      size="small"
                      variant="outlined"
                      onClick={() => setTo(label)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Map / Route Display */}
        <Grid item xs={12} md={8}>
          {activeRoute ? (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardHeader
                title={`${activeRoute.from} → ${activeRoute.to}`}
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                subheader={`~${activeRoute.estimatedTime} min · ${activeRoute.distance}m`}
              />
              <CardContent>
                <List>
                  {activeRoute.steps.map((step, index) => (
                    <React.Fragment key={step.order}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 44 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {directionIcon[step.direction]}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={step.instruction}
                          secondary={`Step ${step.order}`}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          ) : (
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box textAlign="center">
                <MapIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Indoor Map
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Select a destination to see directions
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default NavigationPage;
