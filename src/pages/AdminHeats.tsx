import React, { useState, useEffect } from 'react';
import { supabase, Heat } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, Loader2, 
  Calendar, Clock, User, CheckCircle2, PlayCircle, XCircle
} from 'lucide-react';

export const AdminHeats: React.FC = () => {
  const [heats, setHeats] = useState<Heat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Heat>>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) navigate('/login');
  }

  async function fetchData() {
    const { data } = await supabase.from('heats').select('*').order('heat_date', { ascending: true }).order('start_time', { ascending: true });
    setHeats(data || []);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...current };
      delete (dataToSave as any).created_at;

      let result;
      if (current.id) {
        result = await supabase.from('heats').update(dataToSave).eq('id', current.id);
      } else {
        result = await supabase.from('heats').insert(dataToSave);
      }

      if (result.error) {
        alert(`Erro ao salvar: ${result.error.message}`);
        console.error('Supabase error:', result.error);
      } else {
        setIsEditing(false);
        setCurrent({});
        fetchData();
      }
    } catch (error) {
      console.error('Error saving heat:', error);
      alert('Ocorreu um erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('heats').update({ status }).eq('id', id);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza?')) return;
    const { error } = await supabase.from('heats').delete().eq('id', id);
    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
    } else {
      fetchData();
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-ocean" size={48} /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft />
          </button>
          <h2 className="text-3xl font-bold">Gerenciar Agenda WSL 🌊</h2>
        </div>
        {!isEditing && (
          <button 
            onClick={() => { setIsEditing(true); setCurrent({ status: 'scheduled', heat_date: '2026-06-19' }); }}
            className="bg-ocean text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-ocean-light transition-all"
          >
            <Plus size={20} /> Nova Bateria
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Data *</label>
              <input required type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.heat_date || ''} onChange={e => setCurrent({...current, heat_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Horário de Início *</label>
              <input required type="time" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.start_time || ''} onChange={e => setCurrent({...current, start_time: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fase / Nome da Bateria *</label>
            <input required placeholder="ex: Round 1 - Masculino" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.phase_name || ''} onChange={e => setCurrent({...current, phase_name: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Surfistas Envolvidos *</label>
            <input required placeholder="ex: Gabriel Medina vs Filipe Toledo" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.surfers || ''} onChange={e => setCurrent({...current, surfers: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Status *</label>
            <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.status || 'scheduled'} onChange={e => setCurrent({...current, status: e.target.value as any})}>
              <option value="scheduled">Programado</option>
              <option value="live">Ao vivo agora 🟢</option>
              <option value="finished">Finalizado ✅</option>
              <option value="cancelled">Cancelado / Adiado ❌</option>
            </select>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-2xl font-bold">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-6 py-3 bg-ocean text-white rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Salvar
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-sand border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Bateria</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Data/Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {heats.map(heat => (
                <tr key={heat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-bold">{heat.phase_name}</p>
                    <p className="text-xs text-gray-500">{heat.surfers}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {heat.heat_date} às {heat.start_time.slice(0, 5)}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className="text-xs font-bold p-1 rounded bg-gray-100"
                      value={heat.status}
                      onChange={(e) => updateStatus(heat.id, e.target.value)}
                    >
                      <option value="scheduled">Programado</option>
                      <option value="live">Ao vivo</option>
                      <option value="finished">Finalizado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setCurrent(heat); setIsEditing(true); }} className="p-2 text-ocean"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(heat.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
