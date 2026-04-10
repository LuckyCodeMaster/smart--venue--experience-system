import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from './store';
import { refreshToken } from './store/slices/authSlice';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import QueuesPage from './pages/QueuesPage';
import NavigationPage from './pages/NavigationPage';
import VenuesPage from './pages/VenuesPage';
import SensorsPage from './pages/SensorsPage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('refreshToken');
    if (token) {
      dispatch(refreshToken());
    }
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="queues" element={<QueuesPage />} />
          <Route path="queues/:queueId" element={<QueuesPage />} />
          <Route path="navigation" element={<NavigationPage />} />
          <Route path="venues" element={<VenuesPage />} />
          <Route path="venues/:venueId" element={<VenuesPage />} />
          <Route path="sensors" element={<SensorsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
