import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Componentes de páginas
import Dashboard from './pages/Dashboard';
import SolarEnergy from './pages/SolarEnergy';
import SmartIrrigation from './pages/SmartIrrigation';
import AgroclimaticAssistance from './pages/AgroclimaticAssistance';
import ProductionRecommendation from './pages/ProductionRecommendation';
import PestPrevention from './pages/PestPrevention';
import FrostForecasting from './pages/FrostForecasting';

// Componentes comunes
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';
import OfflineManager from './components/OfflineManager';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
  <OfflineManager />
  <OfflineBanner />
  <Navbar />
      
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/energia-solar" element={<SolarEnergy />} />
        <Route path="/riego-inteligente" element={<SmartIrrigation />} />
        <Route path="/asistencia-agroclimatica" element={<AgroclimaticAssistance />} />
        <Route path="/recomendacion-produccion" element={<ProductionRecommendation />} />
        <Route path="/prevencion-plagas" element={<PestPrevention />} />
         <Route path="/frost" element={<FrostForecasting />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Box>
  );
}

export default App;