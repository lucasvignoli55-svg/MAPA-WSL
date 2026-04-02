import React, { useState, useEffect } from 'react';
import { supabase, Accommodation } from '../lib/supabase';
import { Search, MapPin, Users, DollarSign, MessageCircle, ChevronLeft, ChevronRight, Filter, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { formatWhatsAppLink } from '../lib/utils';

export const AccommodationPage: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [filtered, setFiltered] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [capacity, setCapacity] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [type, setType] = useState<string>('all');

  useEffect(() => {
    fetchAccommodations();
  }, []);

  useEffect(() => {
    let result = accommodations;
    if (capacity !== 'all') {
      const cap = parseInt(capacity);
      result = result.filter(a => a.capacity >= cap);
    }
    result = result.filter(a => a.min_price <= maxPrice);
    if (type !== 'all') {
      result = result.filter(a => a.type === type);
    }
    setFiltered(result);
  }, [capacity, maxPrice, type, accommodations]);

  async function fetchAccommodations() {
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAccommodations(data || []);
      setFiltered(data || []);
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-12 pb-32 md:pb-12 bg-sand/30 min-h-screen">
      <div className="mb-4 md:mb-12 text-center md:text-left">
        <h2 className="text-2xl md:text-5xl font-black text-dark mb-1 md:mb-4 tracking-tighter">ONDE FICAR EM <span className="text-ocean">SAQUAREMA</span>? 🏨</h2>
        <p className="text-[10px] md:text-base text-gray-500 font-medium max-w-2xl">Encontre as melhores casas, pousadas e quartos selecionados para você curtir a WSL 2026 com conforto e estilo.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-8 rounded-[24px] md:rounded-[40px] shadow-2xl shadow-dark/5 border border-gray-100 mb-6 md:mb-12">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-surf/10 rounded-xl flex items-center justify-center">
            <Filter size={16} md:size={20} className="text-surf" />
          </div>
          <h3 className="font-black text-dark uppercase tracking-widest text-[10px] md:text-sm">Filtros de Busca</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
          <div>
            <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 md:mb-3">Tipo de Imóvel</label>
            <select 
              className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl p-3 md:p-4 focus:outline-none focus:border-ocean focus:bg-white transition-all font-bold text-dark text-xs md:text-base"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="casa">Casa</option>
              <option value="pousada">Pousada</option>
              <option value="kitnet">Kitnet</option>
              <option value="quarto">Quarto</option>
            </select>
          </div>
          <div>
            <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 md:mb-3">Pessoas</label>
            <select 
              className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl p-3 md:p-4 focus:outline-none focus:border-ocean focus:bg-white transition-all font-bold text-dark text-xs md:text-base"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            >
              <option value="all">Qualquer quantidade</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n}+ pessoas</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-1.5 md:mb-3">
              <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Preço máximo por diária
              </label>
              <span className="text-lg md:text-2xl font-black text-ocean">R$ {maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="1500" 
              step="50"
              className="w-full h-1.5 md:h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-ocean"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            />
            <div className="flex justify-between text-[8px] md:text-[10px] font-black text-gray-300 mt-1 md:mt-2 uppercase tracking-tighter">
              <span>R$ 50</span>
              <span>R$ 1.500+</span>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[500px] bg-gray-100 rounded-[40px] animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-32 bg-white rounded-[40px] border-4 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home size={40} className="text-gray-200" />
            </div>
            <p className="text-2xl font-black text-gray-300 uppercase tracking-tighter">Nenhuma hospedagem encontrada</p>
            <button 
              onClick={() => { setType('all'); setCapacity('all'); setMaxPrice(1500); }}
              className="mt-4 text-ocean font-black text-xs uppercase tracking-widest hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          filtered.map((acc) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              key={acc.id}
              className="bg-white rounded-[24px] md:rounded-[40px] overflow-hidden shadow-xl shadow-dark/5 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col"
            >
              <div className="relative h-48 md:h-72 overflow-hidden shrink-0">
                {acc.photos && acc.photos.length > 0 ? (
                  <img 
                    src={acc.photos[0]} 
                    alt={acc.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-ocean/10 flex items-center justify-center text-4xl md:text-6xl">🏨</div>
                )}
                
                <div className="absolute top-3 md:top-6 left-3 md:left-6 flex flex-col gap-1 md:gap-2">
                  {acc.available_wsl && (
                    <span className="bg-green-500 text-white px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md">
                      ✅ Disponível WSL
                    </span>
                  )}
                  {acc.badge !== 'none' && (
                    <span className="bg-surf text-white px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md">
                      {acc.badge === 'most_wanted' ? '🔥 Mais procurada' : 
                       acc.badge === 'last_available' ? '⚠️ Última disponível' : 
                       '✅ Ótimo custo-benefício'}
                    </span>
                  )}
                </div>
                
                <div className="absolute bottom-3 md:bottom-6 right-3 md:right-6 bg-white/90 backdrop-blur-md px-3 md:px-5 py-1 md:py-2 rounded-xl md:rounded-2xl shadow-2xl border border-white/50">
                  <span className="text-lg md:text-2xl font-black text-ocean">R$ {acc.min_price}</span>
                  <span className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase ml-1 tracking-tighter">/ dia</span>
                </div>
              </div>

              <div className="p-4 md:p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 md:mb-4 gap-2 md:gap-4">
                  <h3 className="text-lg md:text-2xl font-black text-dark leading-tight group-hover:text-ocean transition-colors line-clamp-1 md:line-clamp-none">{acc.name}</h3>
                  <span className="text-[8px] md:text-[10px] font-black text-ocean bg-ocean/10 px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest shrink-0">
                    {acc.type}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 md:gap-6 mb-3 md:mb-6">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <MapPin size={12} md:size={14} className="text-surf" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-gray-500">{acc.distance_beach} da praia</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Users size={12} md:size={14} className="text-surf" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-gray-500">Até {acc.capacity} pessoas</span>
                  </div>
                </div>

                <p className="text-[11px] md:text-sm text-gray-500 line-clamp-2 md:line-clamp-3 mb-4 md:mb-8 leading-relaxed font-medium">
                  {acc.description}
                </p>

                <div className="mt-auto">
                  <a 
                    href={formatWhatsAppLink(acc.whatsapp, `Olá! Vi a hospedagem ${acc.name} no Mapa do Rolê WSL e quero saber mais.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 md:gap-3 bg-dark text-white py-2.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-ocean transition-all shadow-xl shadow-dark/10 active:scale-95"
                  >
                    <MessageCircle size={16} md:size={18} /> Quero reservar
                  </a>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
export default AccommodationPage;
