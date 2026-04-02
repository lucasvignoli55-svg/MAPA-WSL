import React, { useState, useEffect } from 'react';
import { supabase, Accommodation, uploadImage } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, Loader2, 
  Home, Users, DollarSign, MapPin, MessageCircle, Star, Image as ImageIcon, Upload
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AdminAccommodations: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Accommodation>>({});
  const [saving, setSaving] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
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
    const { data } = await supabase.from('accommodations').select('*').order('created_at', { ascending: false });
    setAccommodations(data || []);
    setLoading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadImage(file);
    if (url) {
      const currentPhotos = current.photos || [];
      setCurrent({ ...current, photos: [...currentPhotos, url] });
    } else {
      alert('Erro ao fazer upload da imagem. Verifique se o bucket "images" existe e se você tem permissão (RLS) para fazer upload no seu Supabase Storage.');
    }
    setUploading(false);
  }

  const addPhotoUrl = () => {
    if (!newPhotoUrl) return;
    const currentPhotos = current.photos || [];
    setCurrent({ ...current, photos: [...currentPhotos, newPhotoUrl] });
    setNewPhotoUrl('');
  };

  const removePhoto = (index: number) => {
    const currentPhotos = [...(current.photos || [])];
    currentPhotos.splice(index, 1);
    setCurrent({ ...current, photos: currentPhotos });
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...current };
      delete (dataToSave as any).created_at;

      let result;
      if (current.id) {
        result = await supabase.from('accommodations').update(dataToSave).eq('id', current.id);
      } else {
        result = await supabase.from('accommodations').insert(dataToSave);
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
      console.error('Error saving accommodation:', error);
      alert('Ocorreu um erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza?')) return;
    const { error } = await supabase.from('accommodations').delete().eq('id', id);
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
          <h2 className="text-3xl font-bold">Gerenciar Hospedagem 🏨</h2>
        </div>
        {!isEditing && (
          <button 
            onClick={() => { setIsEditing(true); setCurrent({ type: 'casa', is_active: true, available_wsl: true, badge: 'none', photos: [] }); }}
            className="bg-ocean text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-ocean-light transition-all"
          >
            <Plus size={20} /> Nova Hospedagem
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Hospedagem *</label>
                <input required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.name || ''} onChange={e => setCurrent({...current, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tipo *</label>
                <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.type || 'casa'} onChange={e => setCurrent({...current, type: e.target.value as any})}>
                  <option value="casa">Casa</option>
                  <option value="pousada">Pousada</option>
                  <option value="kitnet">Kitnet</option>
                  <option value="quarto">Quarto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Capacidade (Pessoas) *</label>
                <input required type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.capacity || ''} onChange={e => setCurrent({...current, capacity: parseInt(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço Mínimo (R$) *</label>
                  <input required type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.min_price || ''} onChange={e => setCurrent({...current, min_price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço Máximo (R$)</label>
                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.max_price || ''} onChange={e => setCurrent({...current, max_price: parseFloat(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Distância da Praia *</label>
                <input required placeholder="ex: 200m, 1km" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.distance_beach || ''} onChange={e => setCurrent({...current, distance_beach: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">WhatsApp de Contato *</label>
                <input required placeholder="5521999999999" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.whatsapp || ''} onChange={e => setCurrent({...current, whatsapp: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Badge Especial</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.badge || 'none'} onChange={e => setCurrent({...current, badge: e.target.value as any})}>
                  <option value="none">Nenhum</option>
                  <option value="most_wanted">Mais procurada 🔥</option>
                  <option value="last_available">Última disponível ⚠️</option>
                  <option value="best_value">Ótimo custo-benefício ✅</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="available_wsl" checked={current.available_wsl} onChange={e => setCurrent({...current, available_wsl: e.target.checked})} />
                  <label htmlFor="available_wsl" className="font-bold text-sm">Disponível no período WSL</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={current.is_active} onChange={e => setCurrent({...current, is_active: e.target.checked})} />
                  <label htmlFor="is_active" className="font-bold text-sm">Hospedagem Ativa</label>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição Completa</label>
            <textarea rows={4} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={current.description || ''} onChange={e => setCurrent({...current, description: e.target.value})} />
          </div>

          {/* Photos Management */}
          <div className="space-y-4 pt-6 border-t border-gray-100">
            <h3 className="font-black text-dark uppercase tracking-tighter flex items-center gap-2">
              <ImageIcon size={20} className="text-ocean" /> Fotos da Hospedagem
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase">Adicionar via URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="https://exemplo.com/foto.jpg"
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={addPhotoUrl}
                    className="bg-dark text-white px-4 rounded-xl hover:bg-ocean transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase">Adicionar via Upload</label>
                <label className={cn(
                  "flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-ocean hover:bg-ocean/5 transition-all",
                  uploading && "opacity-50 pointer-events-none"
                )}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  {uploading ? <Loader2 className="animate-spin text-ocean" /> : <Upload size={20} className="text-gray-400" />}
                  <span className="text-sm font-bold text-gray-500">
                    {uploading ? 'Enviando...' : 'Escolher da Galeria'}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {current.photos?.map((url, index) => (
                <div key={index} className="relative group aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
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
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Hospedagem</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Preço</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accommodations.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold">{acc.name}</td>
                  <td className="px-6 py-4 uppercase text-xs">{acc.type}</td>
                  <td className="px-6 py-4 text-sm">R$ {acc.min_price}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setCurrent(acc); setIsEditing(true); }} className="p-2 text-ocean"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(acc.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
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
export default AdminAccommodations;
