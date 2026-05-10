import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import Login from './views/Login';
import ScanPage from './views/ScanPage';
import Dashboard from './views/Dashboard';
import Workers from './views/Workers';
import Cards from './views/Cards';
import AttendanceToday from './views/AttendanceToday';
import BiweeklyReport from './views/BiweeklyReport';
import Admins from './views/Admins';
import Register from './views/Register';

function PrivateRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="workers" element={<Workers />} />
            <Route path="cards" element={<Cards />} />
            <Route path="attendance" element={<AttendanceToday />} />
            <Route path="biweekly" element={<BiweeklyReport />} />
            <Route path="admins" element={<Admins />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
