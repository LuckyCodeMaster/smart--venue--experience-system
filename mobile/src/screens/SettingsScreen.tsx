import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';
import { MainStackParamList } from '../types';

type SettingsNavProp = NativeStackNavigationProp<MainStackParamList>;

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon, title, subtitle, value, onToggle, onPress, destructive,
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && value === undefined}
    accessibilityRole={value !== undefined ? 'switch' : 'button'}
  >
    <Text style={styles.rowIcon}>{icon}</Text>
    <View style={styles.rowContent}>
      <Text style={[styles.rowTitle, destructive && styles.destructiveText]}>{title}</Text>
      {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
    </View>
    {value !== undefined && onToggle ? (
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#d1d5db', true: '#1a237e' }}
        thumbColor="#fff"
      />
    ) : (
      <Text style={styles.chevron}>›</Text>
    )}
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [notifications, setNotifications] = useState(user?.preferences.notifications ?? true);
  const [locationSharing, setLocationSharing] = useState(user?.preferences.locationSharing ?? true);
  const [accessibilityMode, setAccessibilityMode] = useState(
    user?.preferences.accessibilityMode ?? false
  );
  const [darkMode, setDarkMode] = useState(user?.preferences.theme === 'dark');

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Profile section */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.firstName?.[0] ?? '?').toUpperCase()}
            {(user?.lastName?.[0] ?? '').toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email ?? 'Not signed in'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role ?? 'visitor'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Edit profile"
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🔔"
            title="Push Notifications"
            subtitle="Queue updates, venue alerts"
            value={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="🎟️"
            title="Queue Ready Alerts"
            subtitle="Get notified when your turn is near"
            value={notifications}
            onToggle={setNotifications}
          />
        </View>
      </View>

      {/* Privacy & Location */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Privacy & Location</Text>
        <View style={styles.card}>
          <SettingRow
            icon="📍"
            title="Location Sharing"
            subtitle="Enables indoor navigation"
            value={locationSharing}
            onToggle={setLocationSharing}
          />
        </View>
      </View>

      {/* Accessibility */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Accessibility</Text>
        <View style={styles.card}>
          <SettingRow
            icon="♿"
            title="Accessibility Mode"
            subtitle="Prefer accessible routes and amenities"
            value={accessibilityMode}
            onToggle={setAccessibilityMode}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="🌙"
            title="Dark Mode"
            subtitle="Use dark colour scheme"
            value={darkMode}
            onToggle={setDarkMode}
          />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Support</Text>
        <View style={styles.card}>
          <SettingRow icon="❓" title="Help & FAQ" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingRow icon="📧" title="Contact Support" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingRow icon="📋" title="Privacy Policy" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingRow icon="📄" title="Terms of Service" onPress={() => {}} />
        </View>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <View style={styles.card}>
          <SettingRow
            icon="🚪"
            title="Sign Out"
            onPress={handleLogout}
            destructive
          />
        </View>
      </View>

      <Text style={styles.version}>SVES v1.0.0 · Build 1</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  profileCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  roleText: { fontSize: 11, fontWeight: '600', color: '#1a237e', textTransform: 'capitalize' },
  editBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  editBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, paddingLeft: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: '#111827' },
  rowSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  chevron: { fontSize: 20, color: '#d1d5db' },
  destructiveText: { color: '#ef4444' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 56 },
  version: { textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 8 },
});

export default SettingsScreen;
