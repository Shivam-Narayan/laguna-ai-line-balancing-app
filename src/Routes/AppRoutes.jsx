import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from '../pages/Login';
import EmailRecovery from '../pages/EmailRecovery';
import ForgotPassword from '../pages/ForgotPassword';
import TermsAndConditions from '../pages/TermsAndConditions';
import AdminDashboard from '../pages/AdminDashboard';
import UserDashboard from '../pages/UserDashboard';
import ChangePassword from '../pages/ChangePassword';
import Forecast from '../pages/Forecast';
import Planning from '../pages/Planning';
import Operators from '../pages/Operators';
import PlanningSheet from '../pages/PlanningSheet';
import ApplicationTesting from '../pages/ApplicationTesting';

const AppRoutes = () => {

  const ProtectedRoute = ({ children, allowedUserTypes }) => {
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    const location = useLocation();
  
    if (!authToken) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  
    if (allowedUserTypes && !allowedUserTypes.includes(Number(userType))) {
      const defaultRoute = userType === '1' ? '/admin-dashboard' : '/user-dashboard';
      return <Navigate to={defaultRoute} replace />;
    }
  
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Redirect from root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* 404 page for unknown routes */}
        <Route path="*" element={<div>404: Page Not Found</div>} />

        <Route path="/email-recovery" element={<EmailRecovery />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Terms and Conditions page - requires authentication but no specific user type */}
        <Route path="/terms-and-conditions" element={
          <ProtectedRoute>
            <TermsAndConditions />
          </ProtectedRoute>
        } />

        {/* Protected Routes */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedUserTypes={[1]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/user-dashboard" element={
          <ProtectedRoute allowedUserTypes={[0]}>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/change-password" element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        } />
        <Route path="/forecast" element={
          <ProtectedRoute>
            <Forecast />
          </ProtectedRoute>
        } />
        <Route path="/planning" element={
          <ProtectedRoute>
            <Planning />
          </ProtectedRoute>
        } />
        <Route path="/planning_sheet" element={
          <ProtectedRoute>
            <PlanningSheet />
          </ProtectedRoute>
        } />
        <Route path="/operators" element={
          <ProtectedRoute>
            <Operators />
          </ProtectedRoute>
        } />
        <Route path="/application_testing" element={
          <ProtectedRoute>
            <ApplicationTesting />
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;