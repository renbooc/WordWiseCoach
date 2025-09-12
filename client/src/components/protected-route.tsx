import { ReactNode } from 'react';
import { useAuth } from '../hooks/use-auth.tsx';
import { Redirect } from 'wouter';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // You can render a loading spinner here
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};
