import React, { useState, useEffect } from 'react';
import { supabase, Event, Place, uploadImage } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, Loader2, 
  Calendar, Clock, MapPin, Ticket, Info, Upload
} from 'lucide-react';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Event>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    const [eventsRes, placesRes] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      supabase.from('places').select('id, name').order('name')
    ]);
    setEvents(eventsRes.data || []);
    setPlaces(placesRes.data || []);
    setLoading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setCurrent({ ...current, photo_url: url });
    } else {
      alert('Erro ao fazer upload da imagem. Verifique se o bucket "images" existe e se você tem permissão (RLS) para fazer upload no seu Supabase Storage.');
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...current };
      delete (dataToSave as any).created_at;

      let result;
      if (current.id) {
        result = await supabase.from('events').update(dataToSave).eq('id', current.id);
      } else {
        result = await supabase.from('events').insert(dataToSave);
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
      console.error('Error saving event:', error);
      alert('Ocorreu um erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
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
          <h2 className="text-3xl font-bold">Gerenciar Festas 🎶</h2>
        </div>
        {!isEditing && (
          <button 
            onClick={() => { setIsEditing(true); setCurrent({ is_active: true, urgency_badge: 'none', event_date: '2026-06-19' }); }}
            className="bg-ocean text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-ocean-light transition-all"
          >
            <Plus size={20} /> Nova Festa
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Festa *</label>
                <input required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.name || ''} onChange={e => setCurrent({...current, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Data *</label>
                  <input required type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.event_date || ''} onChange={e => setCurrent({...current, event_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Horário</label>
                  <input type="time" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.event_time || ''} onChange={e => setCurrent({...current, event_time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Local (Texto) *</label>
                <input required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.location_text || ''} onChange={e => setCurrent({...current, location_text: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Vincular ao Mapa (Opcional)</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.place_id || ''} onChange={e => setCurrent({...current, place_id: e.target.value || null})}>
                  <option value="">Não vincular</option>
                  {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Flyer/Foto</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" 
                    placeholder="URL da foto (https://...)"
                    value={current.photo_url || ''} 
                    onChange={e => setCurrent({...current, photo_url: e.target.value})} 
                  />
                  <label className="bg-dark text-white px-4 rounded-xl hover:bg-ocean transition-all cursor-pointer flex items-center justify-center">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  </label>
                </div>
                {current.photo_url && (
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm mt-2">
                    <img src={current.photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      type="button"
                      onClick={() => setCurrent({...current, photo_url: ''})}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg shadow-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço do Ingresso (R$ ou vazio p/ Grátis)</label>
                <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.ticket_price || ''} onChange={e => setCurrent({...current, ticket_price: e.target.value ? parseFloat(e.target.value) : null})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Link ou WhatsApp p/ Ingresso *</label>
                <input required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.ticket_link || ''} onChange={e => setCurrent({...current, ticket_link: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Badge de Urgência</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.urgency_badge || 'none'} onChange={e => setCurrent({...current, urgency_badge: e.target.value as any})}>
                  <option value="none">Nenhum</option>
                  <option value="today">Hoje 🔥</option>
                  <option value="tomorrow">Amanhã ⚡</option>
                  <option value="last_tickets">Últimos ingressos 🎟️</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={current.is_active} onChange={e => setCurrent({...current, is_active: e.target.checked})} />
                <label htmlFor="is_active" className="font-bold text-sm">Festa Ativa</label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição Completa</label>
            <textarea rows={4} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.description || ''} onChange={e => setCurrent({...current, description: e.target.value})} />
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
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Festa</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold">{event.name}</td>
                  <td className="px-6 py-4 text-sm">{event.event_date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setCurrent(event); setIsEditing(true); }} className="p-2 text-ocean"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(event.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
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
