// src/router/AppRoutes.tsx

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import Swal from "sweetalert2";

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import RiskLevel from '../pages/RiskLevel';
import PrivateRoute from './PrivateRoute';
import ThreatMap from '../pages/ThreatMap';
import Incidentes from '../pages/Incidentes';
import VulnerabilitiesDetection from '../pages/VulnerabilitiesDetection';
import ArchivesIntegrity from '../pages/ArchivesIntegrity';
import ReportDash from '../pages/ReportDash';
import ReportView from '../pages/ReportView';
import Config from '../pages/Config';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import ServiceModel from '../pages/ServicesModel';
import ServicesCatalog from '../pages/ServicesCatalog';
import MonitoriaSoc from '../pages/MonitoriaSOC';
import MonitoriaCSC from '../pages/MonitoriaCSC';
import Integrations from '../pages/Integrations';
import VerifyCode from '../pages/MFACode';
import MultiTenantManager from '../pages/MultiTenantManager';
import AdminRoute from './AdminRoute';
import PublicRoute from './PublicRoute';
import SOCAnalytics from '../pages/SOCAnalytics';
import ChatWidget from '../componentes/chat/ChatWidget';
import { useAuth } from '../context/AuthContext';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

const enableIntegrations =
  import.meta.env.VITE_ENABLE_INTEGRATIONS === 'true';

// ─── Guard de inatividade (roda apenas quando autenticado) ────────────────────

function InactivityGuard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    if (!token) return;

    Swal.fire({
      title: "Sessão expirada",
      text: "Você foi desconectado por inatividade.",
      icon: "warning",
      confirmButtonText: "Ir para o login",
      confirmButtonColor: "#7c3aed",
      background: "#0f0b1e",
      color: "#ffffff",
      allowOutsideClick: false,
    }).then(() => {
      logout();
      navigate("/login", { replace: true });
    });
  }, [token, logout, navigate]);

  useInactivityLogout(handleLogout);

  return null;
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <BrowserRouter>

      <InactivityGuard />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/verify-code" element={<PublicRoute><VerifyCode /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/risk-level" element={<PrivateRoute><RiskLevel /></PrivateRoute>} />
        <Route path="/incidentes" element={<PrivateRoute><Incidentes /></PrivateRoute>} />
        <Route path="/threat-map" element={<PrivateRoute><ThreatMap /></PrivateRoute>} />
        <Route path="/vulnerabilities-detections" element={<PrivateRoute><VulnerabilitiesDetection /></PrivateRoute>} />
        <Route path="/archives-integrity" element={<PrivateRoute><ArchivesIntegrity /></PrivateRoute>} />
        <Route path="/monitoria-ngsoc" element={<PrivateRoute><MonitoriaSoc /></PrivateRoute>} />
        <Route path="/monitoria-csc" element={<PrivateRoute><MonitoriaCSC /></PrivateRoute>} />
        <Route path="/soc-analytics" element={<PrivateRoute><SOCAnalytics /></PrivateRoute>} />
        {enableIntegrations && (
          <Route path="/integrations" element={<PrivateRoute><Integrations /></PrivateRoute>} />
        )}
        <Route path="/services-catalog" element={<PrivateRoute><ServicesCatalog /></PrivateRoute>} />
        <Route path="/service/:nome" element={<PrivateRoute><ServiceModel /></PrivateRoute>} />
        <Route path="/relatorios/report-view" element={<PrivateRoute><ReportView /></PrivateRoute>} />
        <Route path="/relatorios" element={<PrivateRoute><ReportDash /></PrivateRoute>} />
        <Route path="/config" element={<PrivateRoute><Config /></PrivateRoute>} />
        <Route path="/multitenant-manager" element={<PrivateRoute><AdminRoute><MultiTenantManager /></AdminRoute></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ChatWidget />

    </BrowserRouter>
  );
}