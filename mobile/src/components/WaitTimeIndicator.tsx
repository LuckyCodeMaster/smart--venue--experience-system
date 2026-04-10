import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface WaitTimeIndicatorProps {
  minutes: number;
  compact?: boolean;
}

function getColorForWait(minutes: number): string {
  if (minutes <= 10) return '#22c55e';
  if (minutes <= 25) return '#f59e0b';
  return '#ef4444';
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const WaitTimeIndicator: React.FC<WaitTimeIndicatorProps> = ({ minutes, compact = false }) => {
  const color = getColorForWait(minutes);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Brief pulse on value change
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [minutes, scaleAnim]);

  if (compact) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={[styles.compactValue, { color }]}>{formatTime(minutes)}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={[styles.value, { color }]}>{formatTime(minutes)}</Text>
        <Text style={styles.label}>wait</Text>
      </View>
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
        <Text style={styles.legendText}>&lt;10m fast</Text>
        <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
        <Text style={styles.legendText}>10–25m moderate</Text>
        <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
        <Text style={styles.legendText}>&gt;25m long</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, color: '#9ca3af', marginTop: -2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'center' },
  legendText: { fontSize: 10, color: '#6b7280' },
  compactValue: { fontSize: 20, fontWeight: '800' },
});

export default WaitTimeIndicator;
