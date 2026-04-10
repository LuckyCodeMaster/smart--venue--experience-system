import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import {
  startNavigation,
  stopNavigation,
  setCurrentStepIndex,
} from '../store/slices/navigationSlice';

const BEARING_ARROWS: Record<string, string> = {
  N: '↑', NE: '↗', E: '→', SE: '↘',
  S: '↓', SW: '↙', W: '←', NW: '↖',
};

function bearingToCompass(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8];
}

const NavigationScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const {
    currentRoute,
    currentStepIndex,
    isNavigating,
    estimatedArrivalSeconds,
  } = useAppSelector((state) => state.navigation);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentRoute && !isNavigating) {
      dispatch(startNavigation());
    }
  }, [currentRoute, dispatch, isNavigating]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleStop = () => {
    Alert.alert('Stop Navigation?', 'Are you sure you want to stop navigation?', [
      { text: 'Continue', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: () => {
          dispatch(stopNavigation());
          navigation.goBack();
        },
      },
    ]);
  };

  if (!currentRoute) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Active Route</Text>
          <Text style={styles.emptySubtitle}>Select a destination on the map to start navigation.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go to Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentStep = currentRoute.steps[currentStepIndex];
  const nextStep = currentRoute.steps[currentStepIndex + 1];
  const progress = (currentStepIndex + 1) / currentRoute.steps.length;
  const compassDir = bearingToCompass(currentStep?.bearing ?? 0);
  const arrow = BEARING_ARROWS[compassDir] ?? '↑';

  const etaMinutes = estimatedArrivalSeconds ? Math.ceil(estimatedArrivalSeconds / 60) : null;

  return (
    <View style={styles.container}>
      {/* Current step banner */}
      <View style={styles.currentStepBanner}>
        <Animated.View style={[styles.arrowContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.arrow}>{arrow}</Text>
        </Animated.View>
        <View style={styles.stepInfo}>
          <Text style={styles.stepInstruction}>{currentStep?.instruction}</Text>
          <Text style={styles.stepDistance}>
            {currentStep ? `${currentStep.distanceMeters}m` : '—'}
            {currentStep?.floor !== undefined ? ` • Floor ${currentStep.floor}` : ''}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStepIndex + 1} of {currentRoute.steps.length}
        </Text>
      </View>

      {/* ETA and distance */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{etaMinutes ?? '—'}</Text>
          <Text style={styles.statLabel}>min remaining</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {Math.round(
              currentRoute.steps
                .slice(currentStepIndex)
                .reduce((s, step) => s + step.distanceMeters, 0)
            )}
          </Text>
          <Text style={styles.statLabel}>meters left</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{currentRoute.isAccessible ? '♿' : '🚶'}</Text>
          <Text style={styles.statLabel}>{currentRoute.isAccessible ? 'Accessible' : 'Standard'}</Text>
        </View>
      </View>

      {/* All steps list */}
      <ScrollView style={styles.stepsList} contentContainerStyle={styles.stepsListContent}>
        <Text style={styles.stepsHeader}>All Steps</Text>
        {currentRoute.steps.map((step, idx) => (
          <TouchableOpacity
            key={step.stepNumber}
            style={[
              styles.stepRow,
              idx === currentStepIndex && styles.stepRowActive,
              idx < currentStepIndex && styles.stepRowDone,
            ]}
            onPress={() => dispatch(setCurrentStepIndex(idx))}
          >
            <View
              style={[
                styles.stepDot,
                idx === currentStepIndex && styles.stepDotActive,
                idx < currentStepIndex && styles.stepDotDone,
              ]}
            >
              <Text style={styles.stepDotText}>
                {idx < currentStepIndex ? '✓' : idx + 1}
              </Text>
            </View>
            <View style={styles.stepRowContent}>
              <Text
                style={[
                  styles.stepRowInstruction,
                  idx === currentStepIndex && styles.stepRowInstructionActive,
                ]}
              >
                {step.instruction}
              </Text>
              <Text style={styles.stepRowMeta}>
                {step.distanceMeters}m{step.landmark ? ` • near ${step.landmark}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Next step preview */}
      {nextStep && (
        <View style={styles.nextStepPreview}>
          <Text style={styles.nextStepLabel}>THEN</Text>
          <Text style={styles.nextStepText}>{nextStep.instruction}</Text>
        </View>
      )}

      {/* Stop button */}
      <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
        <Text style={styles.stopBtnText}>■ Stop Navigation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  backBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  currentStepBanner: {
    backgroundColor: '#1a237e',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  arrowContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 32, color: '#fff' },
  stepInfo: { flex: 1 },
  stepInstruction: { fontSize: 18, fontWeight: '700', color: '#fff', lineHeight: 24 },
  stepDistance: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  progressContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, gap: 4 },
  progressTrack: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#3b82f6', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#9ca3af', textAlign: 'right' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1a237e' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb', alignSelf: 'stretch', marginVertical: 4 },
  stepsList: { flex: 1 },
  stepsListContent: { padding: 16, paddingBottom: 8 },
  stepsHeader: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
    opacity: 0.6,
  },
  stepRowActive: { opacity: 1 },
  stepRowDone: { opacity: 0.4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#1a237e' },
  stepDotDone: { backgroundColor: '#22c55e' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  stepRowContent: { flex: 1 },
  stepRowInstruction: { fontSize: 14, color: '#374151', lineHeight: 20 },
  stepRowInstructionActive: { fontWeight: '700', color: '#111827' },
  stepRowMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  nextStepPreview: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e7ff',
  },
  nextStepLabel: { fontSize: 10, fontWeight: '700', color: '#6366f1', marginBottom: 2 },
  nextStepText: { fontSize: 14, color: '#374151' },
  stopBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
  },
  stopBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default NavigationScreen;
