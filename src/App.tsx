import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header, BottomNav } from './components/Navigation';
import { Countdown, LiveBanner } from './components/HomeSpecial';
import HomePage from './pages/HomePage';
import { TodayPage } from './pages/TodayPage';
import { AccommodationPage } from './pages/AccommodationPage';
import { PartiesPage } from './pages/PartiesPage';
import { WSLAgendaPage } from './pages/WSLAgendaPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPlaces } from './pages/AdminPlaces';
import { AdminAccommodations } from './pages/AdminAccommodations';
import { AdminEvents } from './pages/AdminEvents';
import { AdminHeats } from './pages/AdminHeats';
import { NotFoundPage } from './pages/NotFoundPage';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AlertCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-bold text-dark">Configuração Necessária</h1>
          <p className="text-gray-600">
            Para que o <strong>Mapa do Rolê WSL</strong> funcione, você precisa configurar as credenciais do Supabase.
          </p>
          <div className="bg-gray-50 p-4 rounded-2xl text-left text-sm space-y-2 font-mono">
            <p>VITE_SUPABASE_URL</p>
            <p>VITE_SUPABASE_ANON_KEY</p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Adicione essas variáveis no painel de <strong>Secrets</strong> (Configurações) do AI Studio.
            </p>
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-ocean font-bold hover:underline"
            >
              Criar conta no Supabase <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <Countdown />
        <LiveBanner />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/hoje" element={<TodayPage />} />
            <Route path="/hospedagem" element={<AccommodationPage />} />
            <Route path="/festas" element={<PartiesPage />} />
            <Route path="/agenda" element={<WSLAgendaPage />} />
            <Route path="/buscar" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/locais" element={<AdminPlaces />} />
            <Route path="/admin/hospedagens" element={<AdminAccommodations />} />
            <Route path="/admin/festas" element={<AdminEvents />} />
            <Route path="/admin/baterias" element={<AdminHeats />} />
            
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}
