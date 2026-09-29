import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { InteractionsPage } from './pages/InteractionsPage';
import { MetricsPage } from './pages/MetricsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/interactions" replace />} />
          <Route path="/interactions" element={<InteractionsPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
