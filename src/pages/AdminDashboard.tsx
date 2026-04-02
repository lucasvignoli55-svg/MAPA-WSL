import React, { useState, useEffect } from 'react';
import { supabase, checkBucketExists } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, MapPin, Home, Music, Calendar, Settings, 
  LogOut, Plus, Edit2, Trash2, Check, X, Loader2, Phone, AlertTriangle, ExternalLink
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storageOk, setStorageOk] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    places: 0,
    accommodations: 0,
    events: 0,
    heats: 0
  });
  const [adminWhatsApp, setAdminWhatsApp] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSqlFix, setShowSqlFix] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchStats();
    fetchSettings();
    checkStorage();
  }, []);

  const sqlFix = `-- 1. Criar o bucket (se não existir)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- 2. Criar políticas de acesso (RLS)
-- Permitir leitura pública
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- Permitir uploads para usuários autenticados
create policy "Authenticated Uploads"
on storage.objects for insert
with check (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- Permitir atualizações para usuários autenticados
create policy "Authenticated Updates"
on storage.objects for update
using (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- Permitir exclusões para usuários autenticados
create policy "Authenticated Deletes"
on storage.objects for delete
using (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);`;

  async function checkStorage() {
    const exists = await checkBucketExists('images');
    setStorageOk(exists);
  }

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    } else {
      setUser(user);
    }
  }

  async function fetchStats() {
    try {
      const [places, acc, events, heats] = await Promise.all([
        supabase.from('places').select('id', { count: 'exact' }),
        supabase.from('accommodations').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('heats').select('id', { count: 'exact' })
      ]);

      setStats({
        places: places.count || 0,
        accommodations: acc.count || 0,
        events: events.count || 0,
        heats: heats.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) setAdminWhatsApp(data.admin_whatsapp || '');
  }

  async function saveSettings() {
    setIsSavingSettings(true);
    try {
      const { data: existing } = await supabase.from('settings').select('id').single();
      let result;
      if (existing) {
        result = await supabase.from('settings').update({ admin_whatsapp: adminWhatsApp, updated_at: new Date() }).eq('id', existing.id);
      } else {
        result = await supabase.from('settings').insert({ admin_whatsapp: adminWhatsApp });
      }

      if (result.error) {
        alert(`Erro ao salvar: ${result.error.message}`);
        console.error('Supabase error:', result.error);
      } else {
        alert('Configurações salvas!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ocorreu um erro inesperado ao salvar.');
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-ocean" size={48} /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-dark">Dashboard Admin 🚀</h2>
          <p className="text-gray-500">Bem-vindo, {user?.email}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
        >
          <LogOut size={20} /> Sair
        </button>
      </div>

      {/* Storage Warning */}
      {storageOk === false && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl mb-8 flex flex-col gap-6 animate-pulse">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-2xl text-white">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-black text-red-900 uppercase tracking-tighter">Atenção: Armazenamento não configurado!</h4>
                <p className="text-red-700 text-sm">O bucket "images" não foi encontrado ou as políticas de acesso (RLS) estão bloqueando o upload.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a 
                href="https://supabase.com/dashboard/project/_/sql" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-red-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black transition-all"
              >
                Abrir SQL Editor <ExternalLink size={16} />
              </a>
              <button 
                onClick={() => setShowSqlFix(!showSqlFix)}
                className="bg-white text-red-900 border-2 border-red-100 px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-red-50 transition-all"
              >
                {showSqlFix ? 'Ocultar Instruções' : 'Ver Instruções SQL'}
              </button>
              <button 
                onClick={checkStorage}
                className="bg-red-100 text-red-900 px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-red-200 transition-all"
              >
                Verificar Novamente
              </button>
            </div>
          </div>

          {showSqlFix && (
            <div className="bg-white p-6 rounded-2xl border border-red-100 space-y-4">
              <p className="text-sm text-gray-600 font-bold">Copie e cole o código abaixo no SQL Editor do seu Supabase para criar o bucket e as permissões necessárias:</p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
                {sqlFix}
              </pre>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(sqlFix);
                  alert('Código SQL copiado para a área de transferência!');
                }}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
              >
                Copiar Código SQL
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Locais no Mapa', value: stats.places, icon: MapPin, color: 'bg-orange-500' },
          { label: 'Hospedagens', value: stats.accommodations, icon: Home, color: 'bg-blue-500' },
          { label: 'Festas', value: stats.events, icon: Music, color: 'bg-purple-500' },
          { label: 'Baterias WSL', value: stats.heats, icon: Calendar, color: 'bg-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-3xl font-bold text-dark">{stat.value}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <LayoutDashboard className="text-ocean" /> Gestão de Conteúdo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/admin/locais" className="flex items-center justify-between p-4 bg-sand rounded-2xl hover:bg-ocean hover:text-white transition-all group">
                <div className="flex items-center gap-3">
                  <MapPin size={24} />
                  <span className="font-bold">Gerenciar Mapa</span>
                </div>
                <Plus size={20} />
              </Link>
              <Link to="/admin/hospedagens" className="flex items-center justify-between p-4 bg-sand rounded-2xl hover:bg-ocean hover:text-white transition-all group">
                <div className="flex items-center gap-3">
                  <Home size={24} />
                  <span className="font-bold">Gerenciar Hospedagem</span>
                </div>
                <Plus size={20} />
              </Link>
              <Link to="/admin/festas" className="flex items-center justify-between p-4 bg-sand rounded-2xl hover:bg-ocean hover:text-white transition-all group">
                <div className="flex items-center gap-3">
                  <Music size={24} />
                  <span className="font-bold">Gerenciar Festas</span>
                </div>
                <Plus size={20} />
              </Link>
              <Link to="/admin/baterias" className="flex items-center justify-between p-4 bg-sand rounded-2xl hover:bg-ocean hover:text-white transition-all group">
                <div className="flex items-center gap-3">
                  <Calendar size={24} />
                  <span className="font-bold">Gerenciar Agenda WSL</span>
                </div>
                <Plus size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings className="text-surf" /> Configurações Gerais
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">WhatsApp do Admin (Geral)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="5521999999999"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surf/50 transition-all"
                    value={adminWhatsApp}
                    onChange={(e) => setAdminWhatsApp(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Este número será usado para reservas de hospedagem.</p>
              </div>
              <button
                onClick={saveSettings}
                disabled={isSavingSettings}
                className="w-full bg-surf text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
