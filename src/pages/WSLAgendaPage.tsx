import React, { useState, useEffect } from 'react';
import { supabase, Heat } from '../lib/supabase';
import { Calendar, Clock, User, CheckCircle2, PlayCircle, XCircle, Timer, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const WSLAgendaPage: React.FC = () => {
  const [heats, setHeats] = useState<Heat[]>([]);
  const [filtered, setFiltered] = useState<Heat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const wslDates = [
    '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22', 
    '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27'
  ];

  useEffect(() => {
    fetchHeats();
  }, []);

  useEffect(() => {
    setFiltered(heats.filter(h => h.heat_date === selectedDate));
  }, [selectedDate, heats]);

  async function fetchHeats() {
    try {
      const { data, error } = await supabase
        .from('heats')
        .select('*')
        .order('heat_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      setHeats(data || []);
      
      // Default to first day if current date is not in range
      const today = new Date().toISOString().split('T')[0];
      if (!wslDates.includes(today)) {
        setSelectedDate('2026-06-19');
      } else {
        setSelectedDate(today);
      }
    } catch (error) {
      console.error('Error fetching heats:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 pulsing-green">
            <PlayCircle size={14} /> AO VIVO AGORA
          </span>
        );
      case 'finished':
        return (
          <span className="bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCircle2 size={14} /> FINALIZADO
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <XCircle size={14} /> CANCELADO / ADIADO
          </span>
        );
      default:
        return (
          <span className="bg-ocean text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Timer size={14} /> PROGRAMADO
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24 md:pb-8">
      <div className="mb-4 md:mb-8">
        <h2 className="text-xl md:text-3xl font-bold text-ocean mb-1 md:mb-2">Agenda WSL Saquarema 🌊</h2>
        <p className="text-[10px] md:text-base text-gray-600">Acompanhe as baterias e horários do Vivo Rio Pro 2026.</p>
      </div>

      {/* Date Selector */}
      <div className="flex overflow-x-auto gap-2 pb-4 md:pb-6 no-scrollbar">
        {wslDates.map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-4 rounded-2xl md:rounded-3xl font-bold transition-all text-center min-w-[80px] md:min-w-[120px] border-2 ${
              selectedDate === date 
                ? 'bg-ocean text-white border-ocean shadow-xl scale-105' 
                : 'bg-white text-gray-500 border-transparent hover:border-ocean/20'
            }`}
          >
            <span className="block text-[8px] md:text-[10px] uppercase opacity-70 mb-0.5 md:mb-1">
              {format(new Date(date + 'T12:00:00'), 'EEEE', { locale: ptBR })}
            </span>
            <span className="text-sm md:text-xl">{format(new Date(date + 'T12:00:00'), 'dd/MM')}</span>
          </button>
        ))}
      </div>

      {/* Heats List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl p-6 h-32"></div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-xl text-gray-400">Nenhuma bateria prevista para este dia. Acompanhe as atualizações! 🤙</p>
          </div>
        ) : (
          filtered.map((heat) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={heat.id}
              className={`bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border-l-4 md:border-l-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 transition-all hover:shadow-md ${
                heat.status === 'live' ? 'border-green-500' : 
                heat.status === 'finished' ? 'border-gray-300' : 
                heat.status === 'cancelled' ? 'border-red-500' : 'border-ocean'
              }`}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className="text-center min-w-[60px] md:min-w-[80px]">
                  <div className="flex items-center justify-center gap-1 text-ocean font-bold text-base md:text-xl">
                    <Clock size={16} md:size={20} />
                    {heat.start_time.slice(0, 5)}
                  </div>
                  <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase">Início</span>
                </div>
                
                <div className="h-10 md:h-12 w-px bg-gray-100 hidden md:block"></div>

                <div>
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 leading-tight">{heat.phase_name}</h3>
                  <p className="text-[10px] md:text-gray-600 flex items-center gap-1.5 md:gap-2">
                    <User size={12} md:size={16} className="text-surf" />
                    {heat.surfers}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end">
                {getStatusBadge(heat.status)}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-12 bg-ocean/5 p-8 rounded-3xl border border-ocean/10">
        <h3 className="text-xl font-bold text-ocean mb-4 flex items-center gap-2">
          <Info size={24} /> Informações Importantes
        </h3>
        <ul className="space-y-3 text-gray-700 text-sm">
          <li className="flex gap-2">
            <span className="text-surf">✦</span>
            Os horários estão sujeitos a alterações conforme as condições do mar (swell e vento).
          </li>
          <li className="flex gap-2">
            <span className="text-surf">✦</span>
            A chamada oficial acontece todos os dias às 07h00 na Praia de Itaúna.
          </li>
          <li className="flex gap-2">
            <span className="text-surf">✦</span>
            Acompanhe o status "AO VIVO" para saber exatamente quando os surfistas entrarem na água.
          </li>
        </ul>
      </div>
    </div>
  );
};
export default WSLAgendaPage;
