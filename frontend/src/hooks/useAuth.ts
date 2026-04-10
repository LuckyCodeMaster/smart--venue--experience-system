import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { login, logout, register, clearError } from '../store/slices/authSlice';
import { LoginCredentials, RegisterPayload } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );

  const handleLogin = useCallback(
    (credentials: LoginCredentials) => dispatch(login(credentials)),
    [dispatch]
  );

  const handleLogout = useCallback(() => dispatch(logout()), [dispatch]);

  const handleRegister = useCallback(
    (payload: RegisterPayload) => dispatch(register(payload)),
    [dispatch]
  );

  const handleClearError = useCallback(() => dispatch(clearError()), [dispatch]);

  return {
    user,
    accessToken,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    clearError: handleClearError,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
  };
};
