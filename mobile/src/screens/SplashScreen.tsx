import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { initializeAuth } from '../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Initialize auth state from storage
    dispatch(initializeAuth());
  }, [dispatch, logoOpacity, logoScale, pulseAnim, taglineOpacity]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />

      {/* Background gradient circles */}
      <View style={[styles.circle, styles.circleOuter]} />
      <View style={[styles.circle, styles.circleInner]} />

      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Animated.View
          style={[styles.logoIcon, { transform: [{ scale: pulseAnim }] }]}
        >
          <Text style={styles.logoEmoji}>🏟️</Text>
        </Animated.View>
        <Text style={styles.logoTitle}>SVES</Text>
        <Text style={styles.logoSubtitle}>Smart Venue Experience</Text>
      </Animated.View>

      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <Text style={styles.tagline}>Navigate • Queue • Discover</Text>
      </Animated.View>

      {!isInitialized && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: width,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circleOuter: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    right: -width * 0.3,
  },
  circleInner: {
    width: width,
    height: width,
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 50,
  },
  logoTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 6,
  },
  logoSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    letterSpacing: 2,
  },
  taglineContainer: {
    marginTop: 12,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});

export default SplashScreen;
