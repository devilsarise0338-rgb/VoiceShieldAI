import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AudioAnalysisPage } from './pages/AudioAnalysisPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { LimitationsPage } from './pages/LimitationsPage';
import { AgentsPage } from './pages/AgentsPage';
import { LiveDetectionPage } from './pages/LiveDetectionPage';
import { SpeakerProfilesPage } from './pages/SpeakerProfilesPage';
import { AlertsPage } from './pages/AlertsPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { HelpDocumentationPage } from './pages/HelpDocumentationPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/analyze" replace />} />
          <Route path="/analyze" element={<AudioAnalysisPage />} />
          <Route path="/audio-analysis" element={<Navigate to="/analyze" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/live-detection" element={<LiveDetectionPage />} />
          <Route path="/speaker-profiles" element={<SpeakerProfilesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/investigations" element={<InvestigationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/help" element={<HelpDocumentationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/limitations" element={<LimitationsPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="*" element={<Navigate to="/analyze" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
