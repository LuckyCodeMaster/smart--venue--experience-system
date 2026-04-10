import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Queue, QueuePosition } from '../types';
import WaitTimeIndicator from './WaitTimeIndicator';

interface QueueCardProps {
  queue: Queue;
  onPress?: () => void;
  myPosition?: QueuePosition;
}

const statusConfig = {
  active: { color: '#22c55e', label: 'Open', bg: '#dcfce7' },
  paused: { color: '#f59e0b', label: 'Paused', bg: '#fef3c7' },
  closed: { color: '#ef4444', label: 'Closed', bg: '#fee2e2' },
};

const typeEmoji: Record<Queue['type'], string> = {
  attraction: '🎢',
  food: '🍔',
  service: '🛎️',
  entry: '🚪',
};

const QueueCard: React.FC<QueueCardProps> = ({ queue, onPress, myPosition }) => {
  const status = statusConfig[queue.status];
  const occupancyPercent = Math.round((queue.currentLength / queue.maxCapacity) * 100);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${queue.name}, estimated wait ${queue.estimatedWaitMinutes} minutes`}
    >
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.typeEmoji}>{typeEmoji[queue.type]}</Text>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{queue.name}</Text>
          {queue.description ? (
            <Text style={styles.description} numberOfLines={1}>{queue.description}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <WaitTimeIndicator minutes={queue.estimatedWaitMinutes} compact />
          <Text style={styles.statLabel}>wait</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{queue.currentLength}</Text>
          <Text style={styles.statLabel}>in queue</Text>
        </View>
        {myPosition && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, styles.myPositionValue]}>#{myPosition.position}</Text>
              <Text style={styles.statLabel}>your pos</Text>
            </View>
          </>
        )}
      </View>

      {/* Capacity bar */}
      <View style={styles.capacityRow}>
        <View style={styles.capacityTrack}>
          <View
            style={[
              styles.capacityFill,
              {
                width: `${Math.min(occupancyPercent, 100)}%`,
                backgroundColor:
                  occupancyPercent < 60 ? '#22c55e' : occupancyPercent < 85 ? '#f59e0b' : '#ef4444',
              },
            ]}
          />
        </View>
        <Text style={styles.capacityText}>{occupancyPercent}% full</Text>
      </View>

      {myPosition && (
        <View style={styles.myPositionBanner}>
          <Text style={styles.myPositionBannerText}>
            🎟️ You are in this queue · Position #{myPosition.position}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeEmoji: { fontSize: 28 },
  nameBlock: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  description: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1a237e' },
  myPositionValue: { color: '#7c3aed' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#e5e7eb' },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capacityTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFill: {
    height: 4,
    borderRadius: 2,
  },
  capacityText: { fontSize: 11, color: '#9ca3af', minWidth: 48, textAlign: 'right' },
  myPositionBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  myPositionBannerText: { fontSize: 12, color: '#15803d', fontWeight: '500' },
});

export default QueueCard;
