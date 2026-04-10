import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Venue } from '../../types';

interface VenueListProps {
  venues: Venue[];
  onSelect: (venue: Venue) => void;
  selectedVenueId?: string;
}

const statusColor: Record<Venue['status'], 'success' | 'warning' | 'error'> = {
  open: 'success',
  closed: 'error',
  maintenance: 'warning',
};

const VenueList: React.FC<VenueListProps> = ({ venues, onSelect, selectedVenueId }) => {
  const [search, setSearch] = useState('');

  const filtered = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      v.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Search venues by name or location..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      <Grid container spacing={2}>
        {filtered.map((venue) => {
          const occupancyColor =
            venue.occupancyPercentage > 90
              ? 'error'
              : venue.occupancyPercentage > 70
              ? 'warning'
              : 'primary';
          return (
            <Grid item xs={12} sm={6} lg={4} key={venue.id}>
              <Card
                elevation={0}
                sx={{
                  border: '2px solid',
                  borderColor: selectedVenueId === venue.id ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardActionArea onClick={() => onSelect(venue)} sx={{ p: 0 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon color="primary" />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {venue.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {venue.city}, {venue.country}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Chip
                        label={venue.status}
                        size="small"
                        color={statusColor[venue.status]}
                        sx={{ textTransform: 'capitalize', height: 22, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Box mt={1.5}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Occupancy
                        </Typography>
                        <Typography variant="caption" fontWeight={700}>
                          {venue.currentOccupancy} / {venue.capacity} ({venue.occupancyPercentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(venue.occupancyPercentage, 100)}
                        color={occupancyColor}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    {venue.amenities.length > 0 && (
                      <Box display="flex" gap={0.5} flexWrap="wrap" mt={1.5}>
                        {venue.amenities.slice(0, 3).map((a) => (
                          <Chip key={a} label={a} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        ))}
                        {venue.amenities.length > 3 && (
                          <Chip
                            label={`+${venue.amenities.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      {filtered.length === 0 && (
        <Box py={6} textAlign="center">
          <Typography color="text.secondary">No venues match your search</Typography>
        </Box>
      )}
    </Box>
  );
};

export default VenueList;
