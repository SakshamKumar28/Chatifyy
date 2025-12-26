import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
