import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LockIcon from '@mui/icons-material/Lock';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import { useAuth } from '../hooks/useAuth';
import { settingsApi } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) =>
  value === index ? <Box pt={3}>{children}</Box> : null;

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    queueUpdates: true,
    capacityAlerts: true,
    sensorAlerts: false,
  });

  const [display, setDisplay] = useState({
    compactView: false,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await settingsApi.updateProfile(profile);
      showSnackbar('Profile updated successfully');
    } catch {
      showSnackbar('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      await settingsApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.newPassword,
      });
      setPasswords({ current: '', newPassword: '', confirm: '' });
      showSnackbar('Password changed successfully');
    } catch {
      showSnackbar('Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await settingsApi.updateUserSettings({ notifications });
      showSnackbar('Notification preferences saved');
    } catch {
      showSnackbar('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your account, notifications, and display preferences
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* User Card */}
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Box
                mt={1}
                px={1.5}
                py={0.5}
                bgcolor="primary.lighter"
                borderRadius={2}
                display="inline-block"
              >
                <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                  {user?.role}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Tabs */}
        <Grid item xs={12} md={9}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab icon={<AccountCircleIcon />} label="Profile" iconPosition="start" />
                <Tab icon={<LockIcon />} label="Security" iconPosition="start" />
                <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
                <Tab icon={<DisplaySettingsIcon />} label="Display" iconPosition="start" />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Profile Tab */}
              <TabPanel value={tab} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={16} /> : undefined}
                    >
                      Save Changes
                    </Button>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={tab} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={600} mb={1}>
                      Change Password
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      error={passwords.confirm !== '' && passwords.confirm !== passwords.newPassword}
                      helperText={
                        passwords.confirm !== '' && passwords.confirm !== passwords.newPassword
                          ? 'Passwords do not match'
                          : ''
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleChangePassword}
                      disabled={saving || !passwords.current || !passwords.newPassword}
                    >
                      Change Password
                    </Button>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Notifications Tab */}
              <TabPanel value={tab} index={2}>
                <Typography variant="subtitle2" fontWeight={600} mb={2}>
                  Notification Channels
                </Typography>
                <Box mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.email}
                        onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.push}
                        onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                      />
                    }
                    label="Push Notifications"
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={600} mb={2}>
                  Alert Types
                </Typography>
                <Box display="flex" flexDirection="column">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.queueUpdates}
                        onChange={(e) =>
                          setNotifications({ ...notifications, queueUpdates: e.target.checked })
                        }
                      />
                    }
                    label="Queue Position Updates"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.capacityAlerts}
                        onChange={(e) =>
                          setNotifications({ ...notifications, capacityAlerts: e.target.checked })
                        }
                      />
                    }
                    label="Capacity Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.sensorAlerts}
                        onChange={(e) =>
                          setNotifications({ ...notifications, sensorAlerts: e.target.checked })
                        }
                      />
                    }
                    label="Sensor Fault Alerts"
                  />
                </Box>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    onClick={handleSaveNotifications}
                    disabled={saving}
                  >
                    Save Preferences
                  </Button>
                </Box>
              </TabPanel>

              {/* Display Tab */}
              <TabPanel value={tab} index={3}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={display.compactView}
                        onChange={(e) => setDisplay({ ...display, compactView: e.target.checked })}
                      />
                    }
                    label="Compact View"
                  />
                  <TextField
                    label="Language"
                    select
                    size="small"
                    value={display.language}
                    onChange={(e) => setDisplay({ ...display, language: e.target.value })}
                    sx={{ maxWidth: 300 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </TextField>
                  <TextField
                    label="Timezone"
                    size="small"
                    value={display.timezone}
                    onChange={(e) => setDisplay({ ...display, timezone: e.target.value })}
                    sx={{ maxWidth: 300 }}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      onClick={() => showSnackbar('Display settings saved')}
                    >
                      Save Display Settings
                    </Button>
                  </Box>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
