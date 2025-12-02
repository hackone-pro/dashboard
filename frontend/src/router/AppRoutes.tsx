import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import RiskLevel from '../pages/RiskLevel';
import PrivateRoute from './PrivateRoute';
import ThreatMap from '../pages/ThreatMap';
import Incidentes from '../pages/Incidentes';
import VulnerabilitiesDetection from '../pages/VulnerabilitiesDetection';
import ArchivesIntegrity from '../pages/ArchivesIntegrity';
import Config from '../pages/Config';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import ServiceModel from '../pages/ServicesModel';
import ServicesCatalog from '../pages/ServicesCatalog';
import MonitoriaSoc from '../pages/MonitoriaSOC';
import MonitoriaCSC from '../pages/MonitoriaCSC';

export default function AppRoutes() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/risk-level" element={<PrivateRoute><RiskLevel /></PrivateRoute>} />
          <Route path="/incidentes" element={<PrivateRoute><Incidentes /></PrivateRoute>} />
          <Route path="/threat-map" element={<PrivateRoute><ThreatMap /></PrivateRoute>} />
          <Route path="/vulnerabilities-detections" element={<PrivateRoute><VulnerabilitiesDetection /></PrivateRoute>} />
          <Route path="/archives-integrity" element={<PrivateRoute><ArchivesIntegrity /></PrivateRoute>} />
          <Route path="/monitoria-ngsoc" element={<PrivateRoute><MonitoriaSoc /></PrivateRoute>} />
          <Route path="/monitoria-csc" element={<PrivateRoute><MonitoriaCSC /></PrivateRoute>} />
          <Route path="/services-catalog" element={<PrivateRoute><ServicesCatalog /></PrivateRoute>} />
          <Route path="/service/:nome" element={<PrivateRoute><ServiceModel /></PrivateRoute>}/>
          <Route path="/config" element={<PrivateRoute><Config /></PrivateRoute>} />
          <Route path="/forgot-password" element=<ForgotPassword /> />
          <Route path="/reset-password" element=<ResetPassword /> />
        </Routes>
      </BrowserRouter>
    </>
  );
}
