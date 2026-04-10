import React, { useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchVenues, fetchVenueById, setSelectedVenue, fetchOccupancyHistory } from '../store/slices/venueSlice';
import VenueList from '../components/Venues/VenueList';
import VenueDetail from '../components/Venues/VenueDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Venue } from '../types';

const VenuesPage: React.FC = () => {
  const { venueId } = useParams<{ venueId?: string }>();
  const dispatch = useAppDispatch();
  const { venues, selectedVenue, loading } = useAppSelector((state) => state.venues);

  useEffect(() => {
    dispatch(fetchVenues(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (venueId) {
      dispatch(fetchVenueById(venueId));
      dispatch(fetchOccupancyHistory({ venueId }));
    }
  }, [dispatch, venueId]);

  const handleSelect = (venue: Venue) => {
    dispatch(setSelectedVenue(venue));
    dispatch(fetchOccupancyHistory({ venueId: venue.id }));
  };

  const handleClose = () => {
    dispatch(setSelectedVenue(null));
  };

  if (loading && venues.length === 0) {
    return <LoadingSpinner message="Loading venues..." />;
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Venue Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor occupancy, zones, and crowd density across all venues
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={selectedVenue ? 5 : 12}>
          <VenueList
            venues={venues}
            onSelect={handleSelect}
            selectedVenueId={selectedVenue?.id}
          />
        </Grid>
        {selectedVenue && (
          <Grid item xs={12} md={7}>
            <VenueDetail venue={selectedVenue} onClose={handleClose} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default VenuesPage;
