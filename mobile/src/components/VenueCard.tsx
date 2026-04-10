import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, ImageSourcePropType } from 'react-native';
import { Venue } from '../types';

interface VenueCardProps {
  venue: Venue;
  onPress?: () => void;
  compact?: boolean;
}

const statusConfig = {
  open: { color: '#22c55e', label: 'Open', bg: '#dcfce7' },
  closed: { color: '#ef4444', label: 'Closed', bg: '#fee2e2' },
  limited: { color: '#f59e0b', label: 'Limited', bg: '#fef3c7' },
};

const VenueCard: React.FC<VenueCardProps> = ({ venue, onPress, compact = false }) => {
  const status = statusConfig[venue.status];
  const occupancyPercent = Math.round((venue.currentOccupancy / venue.capacity) * 100);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${venue.name}, ${status.label}`}
      >
        <Text style={styles.compactEmoji}>🏟️</Text>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{venue.name}</Text>
          <Text style={styles.compactAddress} numberOfLines={1}>{venue.address}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}`}
    >
      {/* Hero area */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🏟️</Text>
        <View style={[styles.statusBadge, styles.heroBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.name}>{venue.name}</Text>
        <Text style={styles.address} numberOfLines={1}>📍 {venue.address}</Text>
        <Text style={styles.description} numberOfLines={2}>{venue.description}</Text>

        {/* Occupancy */}
        <View style={styles.occupancyRow}>
          <View style={styles.occupancyTrack}>
            <View
              style={[
                styles.occupancyFill,
                {
                  width: `${Math.min(occupancyPercent, 100)}%`,
                  backgroundColor:
                    occupancyPercent < 60 ? '#22c55e' : occupancyPercent < 85 ? '#f59e0b' : '#ef4444',
                },
              ]}
            />
          </View>
          <Text style={styles.occupancyText}>
            {venue.currentOccupancy.toLocaleString()} / {venue.capacity.toLocaleString()} ({occupancyPercent}%)
          </Text>
        </View>

        {/* Amenity icons */}
        <View style={styles.amenityRow}>
          {venue.amenities.slice(0, 6).map((a) => (
            <View key={a.id} style={styles.amenityChip}>
              <Text style={styles.amenityChipText}>
                {a.type === 'restroom' ? '🚻' :
                  a.type === 'food' ? '🍔' :
                  a.type === 'drink' ? '🥤' :
                  a.type === 'atm' ? '🏧' :
                  a.type === 'firstaid' ? '🏥' : '📍'}
              </Text>
            </View>
          ))}
          {venue.amenities.length > 6 && (
            <Text style={styles.moreAmenities}>+{venue.amenities.length - 6}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  hero: {
    height: 120,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroEmoji: { fontSize: 60 },
  heroBadge: { position: 'absolute', top: 12, right: 12 },
  body: { padding: 16, gap: 8 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  address: { fontSize: 13, color: '#6b7280' },
  description: { fontSize: 14, color: '#374151', lineHeight: 20 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  occupancyRow: { gap: 4 },
  occupancyTrack: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  occupancyFill: { height: 6, borderRadius: 3 },
  occupancyText: { fontSize: 11, color: '#9ca3af' },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  amenityChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityChipText: { fontSize: 16 },
  moreAmenities: { fontSize: 12, color: '#9ca3af', alignSelf: 'center' },
  // Compact styles
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  compactEmoji: { fontSize: 28 },
  compactInfo: { flex: 1 },
  compactName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  compactAddress: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});

export default VenueCard;
