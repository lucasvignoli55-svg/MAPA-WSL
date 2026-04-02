import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, Place, PlaceCategory } from '../lib/supabase';
import { MapView } from '../components/MapView';
import { getCategoryEmoji, getCategoryColor, cn, isOpenNow, getHaversineDistance } from '../lib/utils';
import { Search, X, Info, MessageCircle, Instagram, MapPin, Clock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HomePage: React.FC = () => {
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
          .filter(p => (p as any).distance <= 10) // Increased to 10km for better visibility
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
      {/* Mobile View Toggle */}
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

      {/* Sidebar / List */}
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

          {/* Filters */}
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
                <span className="text-sm md:text-base">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32 md:pb-8 space-y-4 custom-scrollbar">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold text-sm">Nenhum local encontrado</p>
              <button onClick={() => {setSearchTerm(''); setSelectedCategory('all');}} className="text-ocean font-black text-[10px] uppercase mt-2 hover:underline">Limpar filtros</button>
            </div>
          ) : (
            filteredPlaces.map((place) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={place.id}
                onClick={() => {
                  setSelectedPlace(place);
                  if (window.innerWidth < 768) setMobileView('map');
                }}
                className={cn(
                  "group relative bg-white p-3 md:p-5 rounded-[24px] md:rounded-[32px] border-2 transition-all duration-300 cursor-pointer hover:shadow-[0_15px_40px_-12px_rgba(0,0,0,0.08)] active:scale-[0.98]",
                  selectedPlace?.id === place.id ? "border-ocean ring-4 md:ring-8 ring-ocean/5" : "border-gray-50 hover:border-ocean/20",
                  place.is_recommended && "border-amber-100 bg-amber-50/10"
                )}
              >
                {place.is_recommended && (
                  <div className="absolute -top-2 -right-1 bg-amber-400 text-white text-[8px] md:text-[9px] font-black px-2 py-1 rounded-lg shadow-lg z-10 flex items-center gap-1 border-2 border-white">
                    <Star size={8} fill="currentColor" /> RECOMENDADO
                  </div>
                )}
                <div className="flex gap-2.5 md:gap-5 mb-2 md:mb-5">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-[16px] md:rounded-[24px] overflow-hidden shadow-inner bg-gray-100 flex-shrink-0 relative">
                    {place.photo_url ? (
                      <img 
                        src={place.photo_url} 
                        alt={place.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl md:text-3xl">
                        {getCategoryEmoji(place.category)}
                      </div>
                    )}
                    {place.live_status && (
                      <div className="absolute bottom-1 right-1">
                        <div className={cn(
                          "w-2.5 h-2.5 md:w-4 md:h-4 rounded-full border-2 md:border-3 border-white shadow-md",
                          place.live_status === 'lotado' ? "bg-red-500 animate-pulse" :
                          place.live_status === 'cheio' ? "bg-orange-500" :
                          place.live_status === 'medio' ? "bg-yellow-500" : "bg-emerald-500"
                        )} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <h3 className="font-black text-dark truncate leading-tight group-hover:text-ocean transition-colors text-[13px] md:text-base">{place.name}</h3>
                      <span className="text-[7px] md:text-[9px] font-black px-1.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-white shrink-0 uppercase tracking-tight" style={{ backgroundColor: getCategoryColor(place.category) }}>
                        {place.category}
                      </span>
                    </div>
                    <p className="text-[9px] md:text-xs text-gray-400 line-clamp-1 leading-relaxed mb-1.5 md:mb-3 font-medium">{place.short_description}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-gray-400">
                        <MapPin size={9} className="text-ocean" />
                        <span className="truncate max-w-[60px] md:max-w-[100px]">{place.address.split(',')[0]}</span>
                      </div>
                      {(place as any).distance !== undefined && (
                        <span className="text-[7px] md:text-[10px] font-black text-surf bg-surf/10 px-1 py-0.5 rounded-md">
                          {((place as any).distance) > 100 ? '>100km' : `${((place as any).distance).toFixed(1)}km`}
                        </span>
                      )}
                      {isOpenNow(place.open_time, place.close_time) ? (
                        <span className="text-[7px] md:text-[9px] font-black text-emerald-500 flex items-center gap-1 bg-emerald-50 px-1 py-0.5 rounded-md">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" /> ABERTO
                        </span>
                      ) : (
                        <span className="text-[7px] md:text-[9px] font-black text-red-400 flex items-center gap-1 bg-red-50 px-1 py-0.5 rounded-md">
                          <div className="w-1 h-1 rounded-full bg-red-400" /> FECHADO
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleVote(place.id, 'up'); }}
                      disabled={votedPlaces.includes(place.id)}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[8px] md:text-[10px] font-black transition-all",
                        votedPlaces.includes(place.id) ? "bg-gray-50 text-gray-300" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      )}
                    >
                      👍 {place.thumbs_up || 0}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleVote(place.id, 'down'); }}
                      disabled={votedPlaces.includes(place.id)}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[8px] md:text-[10px] font-black transition-all",
                        votedPlaces.includes(place.id) ? "bg-gray-50 text-gray-300" : "bg-red-50 text-red-600 hover:bg-red-100"
                      )}
                    >
                      👎 {place.thumbs_down || 0}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {place.instagram && (
                      <a 
                        href={`https://instagram.com/${place.instagram.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 bg-gray-50 text-gray-400 hover:text-purple-500 rounded-lg transition-all"
                      >
                        <Instagram size={12} />
                      </a>
                    )}
                    {place.whatsapp && (
                      <a 
                        href={`https://wa.me/${place.whatsapp.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 bg-gray-50 text-gray-400 hover:text-emerald-500 rounded-lg transition-all"
                      >
                        <MessageCircle size={12} />
                      </a>
                    )}
                    {place.coupon_text && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCouponModalPlace(place); }}
                        className="px-1.5 py-0.5 bg-surf text-white text-[7px] md:text-[9px] font-black rounded-lg shadow-md hover:bg-surf/90 transition-all"
                      >
                        🎁 CUPOM
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Map */}
      <div className={cn(
        "flex-1 h-full relative z-0 transition-all duration-500",
        mobileView === 'map' ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none md:opacity-100 md:scale-100 md:pointer-events-auto"
      )}>
        <MapView 
          places={filteredPlaces} 
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlace}
          onViewDetails={setDetailPlace}
        />
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailPlace && (
          <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden relative shadow-2xl flex flex-col"
            >
              <div className="relative h-56 md:h-80 shrink-0">
                {/* Photo Gallery with Swiper */}
                <div className="w-full h-full swiper detail-swiper">
                  <div className="swiper-wrapper">
                    <div className="swiper-slide">
                      {detailPlace.photo_url ? (
                        <img 
                          src={detailPlace.photo_url} 
                          alt={detailPlace.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-ocean flex items-center justify-center text-6xl">
                          {getCategoryEmoji(detailPlace.category)}
                        </div>
                      )}
                    </div>
                    {detailPlace.extra_photos?.map((url, i) => (
                      <div key={i} className="swiper-slide">
                        <img 
                          src={url} 
                          alt={`${detailPlace.name} ${i}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="swiper-pagination"></div>
                  <div className="swiper-button-next !text-white !w-8 !h-8 after:!text-sm bg-black/20 backdrop-blur-sm rounded-full"></div>
                  <div className="swiper-button-prev !text-white !w-8 !h-8 after:!text-sm bg-black/20 backdrop-blur-sm rounded-full"></div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent pointer-events-none z-10" />
                <button 
                  onClick={() => setDetailPlace(null)}
                  className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-all active:scale-90 z-20"
                >
                  <X size={24} />
                </button>
                <div className="absolute bottom-8 left-8 right-8 z-20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-surf text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> Parceiro WSL 2026
                    </span>
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: getCategoryColor(detailPlace.category) }}>
                      {getCategoryEmoji(detailPlace.category)} {detailPlace.category}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-4xl font-black text-white leading-none">{detailPlace.name}</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
                {detailPlace.exclusive_promo && (
                  <div className="bg-surf/10 border-2 border-surf/20 p-4 md:p-5 rounded-3xl flex items-start gap-4">
                    <div className="bg-surf text-white p-2 md:p-3 rounded-2xl shadow-lg shadow-surf/30">
                      <Star size={18} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="font-black text-surf text-xs md:text-sm uppercase tracking-tight">Promoção Exclusiva</h4>
                      <p className="text-gray-700 font-medium text-sm">{detailPlace.exclusive_promo}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Sobre o local</h4>
                      <p className="text-gray-600 leading-relaxed text-sm">{detailPlace.full_description || detailPlace.short_description}</p>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl">
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avaliação da Galera</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-green-600 font-black">
                            <span className="text-lg">👍</span> {detailPlace.thumbs_up || 0}
                          </div>
                          <div className="flex items-center gap-1 text-red-600 font-black">
                            <span className="text-lg">👎</span> {detailPlace.thumbs_down || 0}
                          </div>
                        </div>
                      </div>
                      {detailPlace.live_status && (
                        <div className="text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Agora</p>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest",
                            detailPlace.live_status === 'lotado' ? "bg-red-500 animate-pulse" :
                            detailPlace.live_status === 'cheio' ? "bg-orange-500" :
                            detailPlace.live_status === 'medio' ? "bg-yellow-500" : "bg-green-500"
                          )}>
                            {detailPlace.live_status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                          <MapPin className="text-ocean" size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Endereço</p>
                          <p className="text-xs md:text-sm font-bold text-gray-700">{detailPlace.address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                          <Clock className="text-ocean" size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Funcionamento</p>
                          <p className="text-xs md:text-sm font-bold text-gray-700">
                            {detailPlace.open_time && detailPlace.close_time 
                              ? `${detailPlace.open_time} às ${detailPlace.close_time}`
                              : detailPlace.opening_hours || 'Não informado'}
                          </p>
                        </div>
                      </div>
                      {userLocation && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin className="text-surf" size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Distância de você</p>
                            <p className="text-xs md:text-sm font-bold text-gray-700">
                              {getHaversineDistance(userLocation.lat, userLocation.lng, detailPlace.lat, detailPlace.lng).toFixed(1)} km
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${detailPlace.lat},${detailPlace.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 bg-ocean text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-ocean-light transition-all shadow-lg shadow-ocean/20 active:scale-95"
                      >
                        <MapPin size={18} /> Como chegar
                      </a>
                      <div className="grid grid-cols-2 gap-3">
                        {detailPlace.whatsapp && (
                          <a 
                            href={`https://wa.me/${detailPlace.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-green-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                          >
                            <MessageCircle size={18} /> WhatsApp
                          </a>
                        )}
                        {detailPlace.instagram && (
                          <a 
                            href={`https://instagram.com/${detailPlace.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                          >
                            <Instagram size={18} /> Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coupon Modal */}
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

export default HomePage;
