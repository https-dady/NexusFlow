import { useSelector } from 'react-redux';
import { can, canAny, PERMISSIONS } from '../lib/permissions.js';

export function useAuth() {
  const { user, status, error, bootstrapped } = useSelector((state) => state.auth);
  return {
    user,
    status,
    error,
    bootstrapped,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || !bootstrapped,
    can: (permission) => can(user, permission),
    canAny: (permissions) => canAny(user, permissions),
    permissions: user?.permissions ?? [],
    PERMISSIONS,
  };
}
