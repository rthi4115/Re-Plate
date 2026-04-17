
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DonationProvider } from './context/DonationContext';
import { ChatBot } from './components/ChatBot';
import { RealtimeSidebar } from './components/RealtimeSidebar';
import { ToastContainer } from './components/Toast';

import Login from './pages/Login';
import VolunteerLogin from './pages/VolunteerLogin';
import SignUp from './pages/SignUp';
import DonorDashboard from './pages/DonorDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import Profile from './pages/Profile';
import ImpactDashboard from './pages/ImpactDashboard';
import VolunteerImpactDashboard from './pages/VolunteerImpactDashboard';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/volunteer-login" element={user ? <Navigate to="/" replace /> : <VolunteerLogin />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignUp />} />
      
      <Route 
        path="/donor-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['donor']}>
            <DonorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/ngo-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ngo']}>
            <DonorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/volunteer-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receiver-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['receiver']}>
            <ReceiverDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Impact pages */}
      <Route
        path="/impact"
        element={
          <ProtectedRoute allowedRoles={['donor', 'ngo']}>
            <ImpactDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer-impact"
        element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerImpactDashboard />
          </ProtectedRoute>
        }
      />

      
      {/* Root redirect based on role */}
      <Route 
        path="/" 
        element={
          !user ? <Navigate to="/login" replace /> : 
          <Navigate to={`/${user.role}-dashboard`} replace />
        } 
      />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DonationProvider>
          <BrowserRouter>
            <AppRoutes />
            <ChatBot />
            <RealtimeSidebar />
            <ToastContainer />
          </BrowserRouter>
        </DonationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
