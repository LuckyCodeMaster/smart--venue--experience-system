import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import { Venue } from '../../types';
import HeatmapVisualization from './HeatmapVisualization';

interface VenueDetailProps {
  venue: Venue;
  onClose?: () => void;
}

const VenueDetail: React.FC<VenueDetailProps> = ({ venue, onClose }) => {
  const occupancyColor =
    venue.occupancyPercentage > 90
      ? 'error'
      : venue.occupancyPercentage > 70
      ? 'warning'
      : 'success';

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}>
        <CardHeader
          title={venue.name}
          subheader={
            <Box display="flex" alignItems="center" gap={0.5}>
              <LocationOnIcon sx={{ fontSize: 14 }} />
              <Typography variant="body2">{venue.address}, {venue.city}, {venue.country}</Typography>
            </Box>
          }
          action={
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                label={venue.status}
                color={venue.status === 'open' ? 'success' : venue.status === 'maintenance' ? 'warning' : 'error'}
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
              {onClose && (
                <Button size="small" onClick={onClose}>
                  Close
                </Button>
              )}
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">Current Occupancy</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700}>
                    {venue.currentOccupancy} / {venue.capacity}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(venue.occupancyPercentage, 100)}
                  color={occupancyColor}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                  {venue.occupancyPercentage}% capacity used
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              {venue.description && (
                <Typography variant="body2" color="text.secondary">
                  {venue.description}
                </Typography>
              )}
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          {venue.amenities.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Amenities
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {venue.amenities.map((a) => (
                  <Chip key={a} label={a} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {venue.zones.length > 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <HeatmapVisualization zones={venue.zones} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardHeader
                title="Zone Details"
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <List dense>
                  {venue.zones.map((zone, index) => (
                    <React.Fragment key={zone.id}>
                      {index > 0 && <Divider />}
                      <ListItem disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={zone.name}
                          secondary={`${zone.currentOccupancy}/${zone.capacity} (${zone.occupancyPercentage}%)`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(zone.occupancyPercentage, 100)}
                          color={
                            zone.occupancyPercentage > 80
                              ? 'error'
                              : zone.occupancyPercentage > 60
                              ? 'warning'
                              : 'success'
                          }
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default VenueDetail;
