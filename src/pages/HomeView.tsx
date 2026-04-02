import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, Place, PlaceCategory } from '../lib/supabase';
import { MapView } from '../components/MapView';
import { getCategoryEmoji, getCategoryColor, cn, isOpenNow, getHaversineDistance } from '../lib/utils';
import { Search, X, Info, MessageCircle, Instagram, MapPin, Clock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const HomeView: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [couponModalPlace, setCouponModalPlace] = useState<Place | null>(null);
  const [votedPlaces, setVotedPlaces] = useState<string[]>([]);
  const location = useLocation();

  const categories: { id: PlaceCategory | 'all'; label: string; emoji: string }[] = [
    { id: 'all', label: 'Todos', emoji: '✨' },
    { id: 'bar', label: 'Bares', emoji: '🍺' },
    { id: 'restaurante', label: 'Restaurantes', emoji: '🍔' },
    { id: 'cafe', label: 'Cafés', emoji: '☕' },
    { id: 'hospedagem', label: 'Hospedagem', emoji: '🏨' },
    { id: 'festa', label: 'Festas', emoji: '🎶' },
    { id: 'academia', label: 'Academia', emoji: '🏋️' },
    { id: 'loja', label: 'Lojas', emoji: '🛍️' },
    { id: 'outro', label: 'Outros', emoji: '🎯' },
  ];

  useEffect(() => {
    fetchPlaces();
    const savedVotes = localStorage.getItem('voted_places');
    if (savedVotes) setVotedPlaces(JSON.parse(savedVotes));
  }, []);

  useEffect(() => {
    if (location.state?.selectedPlaceId && places.length > 0) {
      const p = places.find(p => p.id === location.state.selectedPlaceId);
      if (p) {
        setSelectedPlace(p);
        setDetailPlace(p);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, places]);

  useEffect(() => {
    let result = [...places];
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.short_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showOnlyOpen) {
      result = result.filter(p => isOpenNow(p.open_time, p.close_time));
    }

    if (showOnlyRecommended) {
      result = result.filter(p => p.is_recommended);
    }

    if (userLocation) {
      result = result.map(p => ({
        ...p,
        distance: getHaversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
      }));

      if (nearMeActive) {
        result = result
          .filter(p => (p as any).distance <= 10)
          .sort((a, b) => (a as any).distance - (b as any).distance);
      }
    }

    setFilteredPlaces(result);
  }, [selectedCategory, searchTerm, places, showOnlyOpen, showOnlyRecommended, nearMeActive, userLocation]);

  async function fetchPlaces() {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setPlaces(data || []);
      setFilteredPlaces(data || []);
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(placeId: string, type: 'up' | 'down') {
    if (votedPlaces.includes(placeId)) return;

    const place = places.find(p => p.id === placeId);
    if (!place) return;

    const updates = type === 'up' 
      ? { thumbs_up: (place.thumbs_up || 0) + 1 }
      : { thumbs_down: (place.thumbs_down || 0) + 1 };

    const { error } = await supabase.from('places').update(updates).eq('id', placeId);
    
    if (!error) {
      const newVoted = [...votedPlaces, placeId];
      setVotedPlaces(newVoted);
      localStorage.setItem('voted_places', JSON.stringify(newVoted));
      fetchPlaces();
    }
  }

  const handleNearMe = () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setUserLocation(null);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setNearMeActive(true);
        },
        (error) => {
          alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
          console.error(error);
        }
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden bg-sand/30 relative">
      <div className="md:hidden absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40">
        <button 
          onClick={() => setMobileView('map')}
          className={cn(
            "px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
            mobileView === 'map' ? "bg-ocean text-white shadow-lg shadow-ocean/30 scale-105" : "text-gray-400 hover:text-gray-600"
          )}
        >
          Mapa
        </button>
        <button 
          onClick={() => setMobileView('list')}
          className={cn(
            "px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
            mobileView === 'list' ? "bg-ocean text-white shadow-lg shadow-ocean/30 scale-105" : "text-gray-400 hover:text-gray-600"
          )}
        >
          Lista
        </button>
      </div>

      <div className={cn(
        "w-full md:w-[440px] bg-white border-r border-gray-100 flex flex-col z-20 h-full shadow-[20px_0_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-500",
        "md:translate-x-0 md:relative absolute inset-0",
        mobileView === 'list' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 md:p-8 pt-20 md:pt-8 space-y-6 md:space-y-8">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-black text-dark leading-none">Descubra Saquarema</h1>
            <p className="text-gray-400 font-medium text-xs md:text-sm">Os melhores picos para curtir o WSL 2026</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-ocean transition-all duration-300" size={22} />
            <input
              type="text"
              placeholder="O que você procura hoje?"
              className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent rounded-3xl focus:outline-none focus:border-ocean/20 focus:bg-white transition-all duration-300 shadow-sm font-semibold text-dark text-base placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-nowrap overflow-x-auto pb-2 gap-2 no-scrollbar -mx-4 px-4 md:-mx-8 md:px-8">
            <button
              onClick={handleNearMe}
              className={cn(
                "flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 border-2",
                nearMeActive 
                  ? "bg-surf text-white border-surf shadow-lg shadow-surf/20 scale-105" 
                  : "bg-white text-gray-500 border-gray-100 hover:border-surf/30 hover:bg-surf/5"
              )}
            >
              <span className="text-sm md:text-base">📍</span> Perto
            </button>
            <button
              onClick={() => setShowOnlyOpen(!showOnlyOpen)}
              className={cn(
                "flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 border-2",
                showOnlyOpen 
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105" 
                  : "bg-white text-gray-500 border-gray-100 hover:border-emerald-500/30 hover:bg-emerald-50/5"
              )}
            >
              <span className="text-sm md:text-base">🟢</span> Aberto
            </button>
            <button
              onClick={() => setShowOnlyRecommended(!showOnlyRecommended)}
              className={cn(
                "flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 border-2",
                showOnlyRecommended 
                  ? "bg-amber-400 text-white border-amber-400 shadow-lg shadow-amber-400/20 scale-105" 
                  : "bg-white text-gray-500 border-gray-100 hover:border-amber-400/30 hover:bg-amber-50/5"
              )}
            >
              <span className="text-sm md:text-base">⭐</span> VIP
            </button>
            <div className="w-px bg-gray-100 mx-0.5 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 border-2",
                  selectedCategory === cat.id 
                    ? "bg-ocean text-white border-ocean shadow-lg shadow-ocean/20 scale-105" 
                    : "bg-white text-gray-500 border-gray-100 hover:border-ocean/30 hover:bg-ocean/5"
                )}
              >
                <span className="text-sm md:text-base">{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-8 pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-ocean border-t-transparent rounded-full animate-spin" />
              <p className="text-ocean font-black uppercase tracking-widest text-[10px]">Buscando os melhores picos...</p>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-dark">Nenhum local encontrado</h3>
              <p className="text-gray-400 font-medium text-sm">Tente ajustar seus filtros ou busca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPlaces.map((place) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={place.id}
                  onClick={() => {
                    setSelectedPlace(place);
                    setMobileView('map');
                  }}
                  className={cn(
                    "group bg-white rounded-[32px] p-4 border-2 transition-all duration-500 cursor-pointer relative overflow-hidden",
                    selectedPlace?.id === place.id ? "border-ocean shadow-2xl shadow-ocean/10 scale-[1.02]" : "border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-200/50"
                  )}
                >
                  <div className="flex gap-5">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden shadow-lg">
                      {place.photo_url ? (
                        <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-4xl">
                          {getCategoryEmoji(place.category)}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest shadow-lg" style={{ backgroundColor: getCategoryColor(place.category) }}>
                          {place.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-black text-dark text-base md:text-xl leading-tight group-hover:text-ocean transition-colors">{place.name}</h3>
                          {place.is_recommended && (
                            <div className="bg-amber-400 p-1 rounded-lg shadow-lg shadow-amber-400/20">
                              <Star size={12} fill="white" className="text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 text-[10px] md:text-xs font-medium line-clamp-2 leading-relaxed">{place.short_description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                            <Clock size={12} className="text-ocean" />
                            <span>{place.open_time} - {place.close_time}</span>
                          </div>
                          {(place as any).distance !== undefined && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-surf">
                              <MapPin size={12} />
                              <span>{(place as any).distance.toFixed(1)}km</span>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailPlace(place);
                          }}
                          className="bg-gray-50 text-dark hover:bg-ocean hover:text-white p-2 rounded-xl transition-all duration-300"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        "flex-1 h-full transition-all duration-500 relative",
        mobileView === 'map' ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
        <MapView 
          places={filteredPlaces} 
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlace}
          onViewDetails={setDetailPlace}
        />
      </div>

      <AnimatePresence>
        {detailPlace && (
          <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailPlace(null)}
              className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white rounded-t-[40px] md:rounded-[40px] overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setDetailPlace(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-dark hover:bg-white transition-all shadow-lg"
              >
                <X size={20} />
              </button>

              <div className="h-48 md:h-72 relative">
                {detailPlace.photo_url ? (
                  <img src={detailPlace.photo_url} alt={detailPlace.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-7xl">
                    {getCategoryEmoji(detailPlace.category)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
                  <div className="space-y-2">
                    <span className="px-3 py-1 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl" style={{ backgroundColor: getCategoryColor(detailPlace.category) }}>
                      {detailPlace.category}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-dark tracking-tighter leading-none">{detailPlace.name}</h2>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] no-scrollbar">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <Clock size={18} className="text-ocean" />
                    <span className="text-sm font-bold text-dark">{detailPlace.open_time} - {detailPlace.close_time}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <MapPin size={18} className="text-surf" />
                    <span className="text-sm font-bold text-dark">{detailPlace.address}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sobre o local</h4>
                  <p className="text-gray-600 font-medium leading-relaxed text-lg">
                    {detailPlace.full_description || detailPlace.short_description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avaliação da Galera</h4>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleVote(detailPlace!.id, 'up')}
                        disabled={votedPlaces.includes(detailPlace.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 transition-all",
                          votedPlaces.includes(detailPlace.id) ? "opacity-50 grayscale" : "hover:scale-110 active:scale-90"
                        )}
                      >
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl">🔥</div>
                        <span className="font-black text-dark">{detailPlace.thumbs_up || 0}</span>
                      </button>
                      <button 
                        onClick={() => handleVote(detailPlace!.id, 'down')}
                        disabled={votedPlaces.includes(detailPlace.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 transition-all",
                          votedPlaces.includes(detailPlace.id) ? "opacity-50 grayscale" : "hover:scale-110 active:scale-90"
                        )}
                      >
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl">🧊</div>
                        <span className="font-black text-dark">{detailPlace.thumbs_down || 0}</span>
                      </button>
                    </div>
                  </div>

                  {detailPlace.coupon_text && (
                    <div 
                      onClick={() => setCouponModalPlace(detailPlace)}
                      className="bg-surf/10 p-6 rounded-[32px] border-2 border-dashed border-surf/30 flex flex-col justify-center items-center text-center space-y-2 cursor-pointer hover:bg-surf/20 transition-all group"
                    >
                      <div className="w-12 h-12 bg-surf text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Star size={24} fill="white" />
                      </div>
                      <span className="text-[10px] font-black text-surf uppercase tracking-widest">Cupom Ativo</span>
                      <p className="text-surf font-black text-xs">VER BENEFÍCIO</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pb-4">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${detailPlace.lat},${detailPlace.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-dark text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-xl active:scale-95"
                  >
                    <MapPin size={18} /> Traçar Rota
                  </a>
                  {detailPlace.instagram && (
                    <a 
                      href={`https://instagram.com/${detailPlace.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-20 bg-gradient-to-tr from-amber-400 via-red-500 to-purple-600 text-white rounded-[24px] flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95"
                    >
                      <Instagram size={24} />
                    </a>
                  )}
                  {detailPlace.whatsapp && (
                    <a 
                      href={`https://wa.me/${detailPlace.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-20 bg-green-500 text-white rounded-[24px] flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95"
                    >
                      <MessageCircle size={24} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {couponModalPlace && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-dark/95 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-[40px] w-full max-w-md overflow-hidden relative shadow-2xl border-4 border-surf/30"
            >
              <div className="bg-surf p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
                </div>
                <Star className="mx-auto mb-4 animate-bounce" size={48} fill="currentColor" />
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">CUPOM EXCLUSIVO</h2>
                <p className="text-white/80 font-bold uppercase text-xs tracking-widest">WSL Saquarema 2026</p>
              </div>
              <div className="p-8 text-center space-y-6">
                <div className="space-y-2">
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Local</p>
                  <h3 className="text-2xl font-black text-dark">{couponModalPlace.name}</h3>
                </div>
                <div className="bg-sand/30 p-6 rounded-3xl border-2 border-dashed border-surf/30">
                  <p className="text-surf font-black text-lg leading-tight">
                    {couponModalPlace.coupon_text}
                  </p>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-500 text-xs font-medium">
                    Apresente esta tela no local para validar seu benefício exclusivo de parceiro WSL.
                  </p>
                  <button 
                    onClick={() => setCouponModalPlace(null)}
                    className="w-full py-4 bg-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
                  >
                    Entendido!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeView;
