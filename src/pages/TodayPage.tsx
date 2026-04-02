import React, { useState, useEffect } from 'react';
import { supabase, Place } from '../lib/supabase';
import { isOpenNow, getCategoryEmoji, getCategoryColor, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Star, Clock, MapPin, MessageCircle, Instagram, ArrowRight, Flame, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TodayPage: React.FC = () => {
  const [livelyPlaces, setLivelyPlaces] = useState<Place[]>([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [couponPlaces, setCouponPlaces] = useState<Place[]>([]);
  const [openNowPlaces, setOpenNowPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodayData();
  }, []);

  async function fetchTodayData() {
    try {
      const { data: allPlaces, error } = await supabase
        .from('places')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (allPlaces) {
        // Lively Now: cheio, lotado, fila
        setLivelyPlaces(allPlaces.filter(p => ['cheio', 'lotado', 'fila'].includes(p.live_status || '')));
        
        // Recommended
        setRecommendedPlaces(allPlaces.filter(p => p.is_recommended));
        
        // With Coupon
        setCouponPlaces(allPlaces.filter(p => p.coupon_text));
        
        // Open Now
        setOpenNowPlaces(allPlaces.filter(p => isOpenNow(p.open_time, p.close_time)));
      }
    } catch (error) {
      console.error('Error fetching today data:', error);
    } finally {
      setLoading(false);
    }
  }

  const Section = ({ title, icon: Icon, places, color }: { title: string, icon: any, places: Place[], color: string }) => {
    if (places.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-xl text-white shadow-lg", color)}>
              <Icon size={20} />
            </div>
            <h3 className="text-lg font-black text-dark uppercase tracking-tighter">{title}</h3>
          </div>
          <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
            {places.length} LOCAIS
          </span>
        </div>
        <div className="flex overflow-x-auto gap-3 md:gap-4 px-4 pb-4 no-scrollbar">
          {places.map((place) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={place.id}
              onClick={() => navigate('/', { state: { selectedPlaceId: place.id } })}
              className="flex-shrink-0 w-56 md:w-72 bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-xl border border-gray-100 flex flex-col"
            >
              <div className="relative h-32 md:h-40">
                {place.photo_url ? (
                  <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl md:text-4xl">
                    {getCategoryEmoji(place.category)}
                  </div>
                )}
                <div className="absolute top-3 md:top-4 right-3 md:right-4">
                  <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black text-white uppercase tracking-widest shadow-lg" style={{ backgroundColor: getCategoryColor(place.category) }}>
                    {place.category}
                  </span>
                </div>
                {place.live_status && (
                  <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4">
                    <span className={cn(
                      "px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black text-white uppercase tracking-widest shadow-lg flex items-center gap-1",
                      place.live_status === 'lotado' ? "bg-red-500 animate-pulse" :
                      place.live_status === 'cheio' ? "bg-orange-500" : "bg-yellow-500"
                    )}>
                      <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-white" /> {place.live_status}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 md:p-5 flex-1 flex flex-col">
                <h4 className="font-black text-dark text-sm md:text-lg mb-0.5 md:mb-1 truncate">{place.name}</h4>
                <p className="text-[10px] md:text-xs text-gray-500 line-clamp-1 md:line-clamp-2 mb-2 md:mb-4 flex-1">{place.short_description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-gray-400">
                    <MapPin size={10} md:size={12} className="text-ocean" />
                    <span className="truncate w-24 md:w-32">{place.address.split(',')[0]}</span>
                  </div>
                  <button className="w-6 h-6 md:w-8 md:h-8 bg-ocean text-white rounded-full flex items-center justify-center hover:bg-ocean-light transition-all">
                    <ArrowRight size={14} md:size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-sand/30">
      <div className="w-16 h-16 border-4 border-ocean border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-ocean font-black uppercase tracking-widest text-xs">Carregando o rolê de hoje...</p>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-sand/30 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto pt-6 md:pt-8 space-y-8 md:space-y-12">
        <div className="px-4">
          <h2 className="text-xl md:text-6xl font-black text-dark tracking-tighter leading-none mb-1 md:mb-2">O QUE TÁ ROLANDO <br/><span className="text-ocean">HOJE EM SAQUAREMA</span></h2>
          <p className="text-gray-500 font-bold text-[8px] md:text-sm uppercase tracking-widest">Quinta-feira, 02 de Abril</p>
        </div>

        <Section title="Bombando Agora" icon={Flame} places={livelyPlaces} color="bg-red-500" />
        <Section title="Recomendados pelo Grupo" icon={Star} places={recommendedPlaces} color="bg-yellow-500" />
        <Section title="Com Cupom Ativo" icon={Gift} places={couponPlaces} color="bg-surf" />
        <Section title="Abertos Agora" icon={Clock} places={openNowPlaces} color="bg-green-500" />

        {livelyPlaces.length === 0 && recommendedPlaces.length === 0 && couponPlaces.length === 0 && openNowPlaces.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Clock size={40} className="text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-dark mb-2">Tudo tranquilo por enquanto...</h3>
            <p className="text-gray-500 font-medium">Volte mais tarde para ver o que está bombando!</p>
          </div>
        )}
      </div>
    </div>
  );
};
