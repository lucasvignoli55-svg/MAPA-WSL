import React, { useState, useEffect } from 'react';
import { supabase, Place, PlaceCategory, uploadImage } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, Loader2, 
  Image as ImageIcon, MapPin, Clock, Phone, Instagram, Star, Check,
  MousePointer2, Upload
} from 'lucide-react';

// Fix Leaflet marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapPicker = ({ lat, lng, onChange }: { lat: number, lng: number, onChange: (lat: number, lng: number) => void }) => {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng]);

  return lat && lng ? <Marker position={[lat, lng]} icon={DefaultIcon} /> : null;
};

export const AdminPlaces: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlace, setCurrentPlace] = useState<Partial<Place>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchPlaces();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) navigate('/login');
  }

  async function fetchPlaces() {
    const { data } = await supabase.from('places').select('*').order('name');
    setPlaces(data || []);
    setLoading(false);
  }

  async function handleMainPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMain(true);
    const url = await uploadImage(file);
    if (url) {
      setCurrentPlace({ ...currentPlace, photo_url: url });
    } else {
      alert('Erro ao fazer upload da imagem principal. Verifique se o bucket "images" existe e se você tem permissão (RLS) para fazer upload no seu Supabase Storage.');
    }
    setUploadingMain(false);
  }

  async function handleExtraPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingExtra(true);
    const url = await uploadImage(file);
    if (url) {
      const currentPhotos = currentPlace.extra_photos || [];
      setCurrentPlace({ ...currentPlace, extra_photos: [...currentPhotos, url] });
    } else {
      alert('Erro ao fazer upload da imagem adicional. Verifique se o bucket "images" existe e se você tem permissão (RLS) para fazer upload no seu Supabase Storage.');
    }
    setUploadingExtra(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean up data before saving
      const placeData = { ...currentPlace };
      delete (placeData as any).created_at;

      let result;
      if (currentPlace.id) {
        result = await supabase.from('places').update(placeData).eq('id', currentPlace.id);
      } else {
        result = await supabase.from('places').insert(placeData);
      }

      if (result.error) {
        alert(`Erro ao salvar: ${result.error.message}`);
        console.error('Supabase error:', result.error);
      } else {
        setIsEditing(false);
        setCurrentPlace({});
        fetchPlaces();
      }
    } catch (error) {
      console.error('Error saving place:', error);
      alert('Ocorreu um erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;
    const { error } = await supabase.from('places').delete().eq('id', id);
    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
    } else {
      fetchPlaces();
    }
  }

  async function handleLiveStatusUpdate(id: string, status: string | null) {
    const { error } = await supabase.from('places').update({ live_status: status }).eq('id', id);
    if (error) {
      alert(`Erro ao atualizar status: ${error.message}`);
    } else {
      fetchPlaces();
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
          <h2 className="text-3xl font-bold">Gerenciar Mapa 🗺️</h2>
        </div>
        {!isEditing && (
          <button 
            onClick={() => { setIsEditing(true); setCurrentPlace({ category: 'bar', is_active: true, is_recommended: false, lat: -22.9285, lng: -42.5100, extra_photos: [] }); }}
            className="bg-ocean text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-ocean-light transition-all"
          >
            <Plus size={20} /> Novo Local
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome do Local *</label>
                <input 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                  value={currentPlace.name || ''}
                  onChange={e => setCurrentPlace({...currentPlace, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Categoria *</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                  value={currentPlace.category || 'bar'}
                  onChange={e => setCurrentPlace({...currentPlace, category: e.target.value as PlaceCategory})}
                >
                  <option value="bar">Bar / Adega</option>
                  <option value="restaurante">Restaurante / Lanchonete</option>
                  <option value="cafe">Café</option>
                  <option value="hospedagem">Hospedagem</option>
                  <option value="festa">Festa / Luau</option>
                  <option value="academia">Academia</option>
                  <option value="loja">Loja / Comércio</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              
              {/* Main Photo */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Foto Principal</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50 text-sm"
                    placeholder="URL da foto (https://...)"
                    value={currentPlace.photo_url || ''}
                    onChange={e => setCurrentPlace({...currentPlace, photo_url: e.target.value})}
                  />
                  <label className="bg-dark text-white px-4 rounded-xl hover:bg-ocean transition-all cursor-pointer flex items-center justify-center">
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainPhotoUpload} />
                    {uploadingMain ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  </label>
                </div>
                {currentPlace.photo_url && (
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm mt-2">
                    <img src={currentPlace.photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      type="button"
                      onClick={() => setCurrentPlace({...currentPlace, photo_url: ''})}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg shadow-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Extra Photos */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fotos Adicionais</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setCurrentPlace({...currentPlace, extra_photos: [...(currentPlace.extra_photos || []), '']})}
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Adicionar via URL
                  </button>
                  <label className="flex-1 p-3 bg-ocean/10 border border-ocean/20 text-ocean rounded-xl text-xs font-bold hover:bg-ocean/20 transition-all cursor-pointer flex items-center justify-center gap-2">
                    <input type="file" accept="image/*" className="hidden" onChange={handleExtraPhotoUpload} />
                    {uploadingExtra ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    {uploadingExtra ? 'Enviando...' : 'Upload da Galeria'}
                  </label>
                </div>
                
                <div className="space-y-2 mt-4">
                  {(currentPlace.extra_photos || []).map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                        {url && <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                      </div>
                      <input 
                        className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        placeholder="https://..."
                        value={url}
                        onChange={e => {
                          const newPhotos = [...(currentPlace.extra_photos || [])];
                          newPhotos[index] = e.target.value;
                          setCurrentPlace({...currentPlace, extra_photos: newPhotos});
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newPhotos = (currentPlace.extra_photos || []).filter((_, i) => i !== index);
                          setCurrentPlace({...currentPlace, extra_photos: newPhotos});
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição Curta (Máx 120 carac.) *</label>
                <input 
                  required
                  maxLength={120}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                  value={currentPlace.short_description || ''}
                  onChange={e => setCurrentPlace({...currentPlace, short_description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição Completa</label>
                <textarea 
                  rows={4}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                  value={currentPlace.full_description || ''}
                  onChange={e => setCurrentPlace({...currentPlace, full_description: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Endereço Completo *</label>
                <input 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                  value={currentPlace.address || ''}
                  onChange={e => setCurrentPlace({...currentPlace, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Abre às:</label>
                  <input 
                    type="time"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                    value={currentPlace.open_time || ''}
                    onChange={e => setCurrentPlace({...currentPlace, open_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fecha às:</label>
                  <input 
                    type="time"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                    value={currentPlace.close_time || ''}
                    onChange={e => setCurrentPlace({...currentPlace, close_time: e.target.value})}
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 -mt-2">Horários após meia-noite: use 00:00, 01:00, etc.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Latitude *</label>
                  <input 
                    required
                    type="number" step="any"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                    value={currentPlace.lat || ''}
                    onChange={e => setCurrentPlace({...currentPlace, lat: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Longitude *</label>
                  <input 
                    required
                    type="number" step="any"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                    value={currentPlace.lng || ''}
                    onChange={e => setCurrentPlace({...currentPlace, lng: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                  <MousePointer2 size={14} /> Selecionar no Mapa
                </label>
                <div className="h-48 rounded-2xl overflow-hidden border border-gray-200 z-0">
                  <MapContainer 
                    center={[currentPlace.lat || -22.9285, currentPlace.lng || -42.5100]} 
                    zoom={15} 
                    className="h-full w-full"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapPicker 
                      lat={currentPlace.lat || -22.9285} 
                      lng={currentPlace.lng || -42.5100} 
                      onChange={(lat, lng) => setCurrentPlace({...currentPlace, lat, lng})} 
                    />
                  </MapContainer>
                </div>
                <p className="text-[10px] text-gray-400">Clique no mapa para ajustar as coordenadas automaticamente.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">WhatsApp (Somente números)</label>
                <input 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                  placeholder="5521999999999"
                  value={currentPlace.whatsapp || ''}
                  onChange={e => setCurrentPlace({...currentPlace, whatsapp: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Instagram (ex: @nomedobar)</label>
                <input 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                  placeholder="@nomedobar"
                  value={currentPlace.instagram || ''}
                  onChange={e => setCurrentPlace({...currentPlace, instagram: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cupom Exclusivo WSL</label>
                <input 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ocean/50"
                  placeholder="Ex: Mostre essa tela e ganhe 1 drink grátis!"
                  value={currentPlace.coupon_text || ''}
                  onChange={e => setCurrentPlace({...currentPlace, coupon_text: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="is_active"
                    checked={currentPlace.is_active}
                    onChange={e => setCurrentPlace({...currentPlace, is_active: e.target.checked})}
                    className="w-5 h-5 accent-ocean"
                  />
                  <label htmlFor="is_active" className="font-bold text-gray-700">Local Ativo no Mapa</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="is_recommended"
                    checked={currentPlace.is_recommended}
                    onChange={e => setCurrentPlace({...currentPlace, is_recommended: e.target.checked})}
                    className="w-5 h-5 accent-surf"
                  />
                  <label htmlFor="is_recommended" className="font-bold text-gray-700">⭐ Local recomendado pelo grupo</label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => { setIsEditing(false); setCurrentPlace({}); }}
              className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <X size={20} /> Cancelar
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-ocean text-white rounded-2xl font-bold hover:bg-ocean-light transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Salvar Local
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-sand border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Local</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Categoria</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status ao Vivo</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {places.map(place => (
                  <tr key={place.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {place.photo_url ? <img src={place.photo_url} className="w-full h-full object-cover" /> : '📍'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 flex items-center gap-1">
                            {place.name}
                            {place.is_recommended && <Star size={12} className="text-surf fill-surf" />}
                          </span>
                          {place.coupon_text && <span className="text-[10px] text-surf font-bold">🎁 Cupom Ativo</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600 uppercase">
                        {place.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        className="text-xs font-bold p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean/50"
                        value={place.live_status || ''}
                        onChange={e => handleLiveStatusUpdate(place.id, e.target.value || null)}
                      >
                        <option value="">(Sem status)</option>
                        <option value="medio">🟡 Médio</option>
                        <option value="cheio">🟠 Cheio</option>
                        <option value="lotado">🔴 Lotado</option>
                        <option value="fila">⚠️ Fila na porta</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {place.is_active ? (
                        <span className="flex items-center gap-1 text-green-500 font-bold text-xs">
                          <Check size={14} /> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 font-bold text-xs">
                          <X size={14} /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setCurrentPlace(place); setIsEditing(true); }}
                          className="p-2 text-ocean hover:bg-ocean/10 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(place.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
