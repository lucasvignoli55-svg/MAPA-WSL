import React, { useState, useEffect } from 'react';
import { supabase, Event } from '../lib/supabase';
import { Calendar, Clock, MapPin, Ticket, Info, ExternalLink, MessageCircle, Music } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

export const PartiesPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('all');

  const wslDates = [
    '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22', 
    '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27'
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedDate === 'all') {
      setFiltered(events);
    } else if (selectedDate === 'others') {
      setFiltered(events.filter(e => !wslDates.includes(e.event_date)));
    } else {
      setFiltered(events.filter(e => e.event_date === selectedDate));
    }
  }, [selectedDate, events]);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
      setFiltered(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-12 pb-32 md:pb-12 bg-sand/30 min-h-screen">
      <div className="mb-4 md:mb-12 text-center md:text-left">
        <h2 className="text-2xl md:text-5xl font-black text-dark mb-1 md:mb-4 tracking-tighter">FESTAS & <span className="text-ocean">ROLÊS</span> 🎶</h2>
        <p className="text-[10px] md:text-base text-gray-500 font-medium max-w-2xl">Os melhores afters, luaus e eventos exclusivos de Saquarema durante a temporada da WSL 2026.</p>
      </div>

      {/* Date Filter */}
      <div className="flex overflow-x-auto gap-2 md:gap-4 pb-4 md:pb-8 no-scrollbar mb-6 md:mb-12">
        <button
          onClick={() => setSelectedDate('all')}
          className={cn(
            "flex-shrink-0 px-4 md:px-8 py-2.5 md:py-4 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[9px] md:text-xs transition-all",
            selectedDate === 'all' 
              ? "bg-dark text-white shadow-2xl shadow-dark/20 scale-105" 
              : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
          )}
        >
          Todas
        </button>
        {wslDates.map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={cn(
              "flex-shrink-0 px-4 md:px-8 py-2.5 md:py-4 rounded-2xl md:rounded-3xl font-black transition-all text-center min-w-[80px] md:min-w-[120px] border",
              selectedDate === date 
                ? "bg-ocean text-white shadow-2xl shadow-ocean/20 scale-105 border-transparent" 
                : "bg-white text-gray-400 hover:bg-gray-50 border-gray-100"
            )}
          >
            <span className="block text-[8px] md:text-[10px] uppercase tracking-widest opacity-60 mb-0.5 md:mb-1">
              {format(new Date(date + 'T12:00:00'), 'EEE', { locale: ptBR })}
            </span>
            <span className="text-sm md:text-xl tracking-tighter">{format(new Date(date + 'T12:00:00'), 'dd/MM')}</span>
          </button>
        ))}
        <button
          onClick={() => setSelectedDate('others')}
          className={cn(
            "flex-shrink-0 px-4 md:px-8 py-2.5 md:py-4 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[9px] md:text-xs transition-all",
            selectedDate === 'others' 
              ? "bg-dark text-white shadow-2xl shadow-dark/20 scale-105" 
              : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
          )}
        >
          Outros
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-10">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 md:h-96 bg-gray-100 rounded-2xl md:rounded-[40px] animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 md:py-32 bg-white rounded-3xl md:rounded-[40px] border-4 border-dashed border-gray-100">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Music size={24} md:size={40} className="text-gray-200" />
            </div>
            <p className="text-lg md:text-2xl font-black text-gray-300 uppercase tracking-tighter">Nenhuma festa cadastrada</p>
          </div>
        ) : (
          filtered.map((event) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={event.id}
              className={cn(
                "bg-white rounded-2xl md:rounded-[40px] overflow-hidden shadow-xl shadow-dark/5 border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group",
                isToday(event.event_date) ? "border-surf pulsing-orange" : "border-transparent"
              )}
            >
              <div className="relative h-32 md:h-80 overflow-hidden">
                {event.photo_url ? (
                  <img 
                    src={event.photo_url} 
                    alt={event.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-dark flex items-center justify-center text-4xl md:text-8xl">🎶</div>
                )}
                
                <div className="absolute top-2 md:top-6 left-2 md:left-6 flex flex-col gap-1 md:gap-2">
                  {event.urgency_badge !== 'none' && (
                    <span className="bg-red-600 text-white px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[10px] font-black uppercase tracking-widest shadow-2xl animate-pulse">
                      {event.urgency_badge === 'today' ? '🔥 Hoje' : 
                       event.urgency_badge === 'tomorrow' ? '⚡ Amanhã' : 
                       '🎟️ Últimos'}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2 md:bottom-6 right-2 md:right-6 bg-white/90 backdrop-blur-md px-2 md:px-6 py-1 md:py-3 rounded-lg md:rounded-2xl font-black text-ocean shadow-2xl flex items-center gap-1 md:gap-3 border border-white/50">
                  <Ticket size={12} md:size={20} className="text-surf" />
                  <span className="text-[10px] md:text-xl tracking-tighter">
                    {event.ticket_price ? `R$ ${event.ticket_price}` : 'FREE'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 md:p-8">
                <div className="mb-1.5 md:mb-6">
                  <h3 className="text-[11px] md:text-3xl font-black text-dark mb-0.5 md:mb-3 leading-tight group-hover:text-ocean transition-colors line-clamp-1 md:line-clamp-none">{event.name}</h3>
                  <div className="flex flex-col md:flex-row md:gap-6 text-[6px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Calendar size={8} md:size={14} className="text-surf" />
                      <span>{format(new Date(event.event_date + 'T12:00:00'), "dd/MM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Clock size={8} md:size={14} className="text-surf" />
                      <span>{event.event_time ? event.event_time.slice(0, 5) : 'A definir'}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-start gap-3 mb-8 text-gray-500 bg-gray-50 p-4 rounded-2xl">
                  <MapPin size={18} className="text-ocean shrink-0" />
                  <span className="text-xs font-bold leading-relaxed">{event.location_text}</span>
                </div>

                <p className="text-[8px] md:text-sm text-gray-500 line-clamp-1 md:line-clamp-3 mb-2 md:mb-8 leading-relaxed font-medium">
                  {event.description}
                </p>

                <a 
                  href={event.ticket_link.startsWith('http') ? event.ticket_link : `https://wa.me/${event.ticket_link.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1 md:gap-3 bg-dark text-white py-1.5 md:py-4 rounded-lg md:rounded-2xl font-black text-[7px] md:text-xs uppercase tracking-widest hover:bg-ocean transition-all shadow-xl shadow-dark/10 active:scale-95"
                >
                  <Ticket size={10} md:size={18} /> Ingressos
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
export default PartiesPage;
