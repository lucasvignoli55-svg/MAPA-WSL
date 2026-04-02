import React, { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isAfter, isBefore } from 'date-fns';

export const Countdown: React.FC = () => {
  const wslStartDate = new Date('2026-06-19T08:00:00');
  const wslEndDate = new Date('2026-06-27T18:00:00');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDuringEvent = isAfter(now, wslStartDate) && isBefore(now, wslEndDate);
  const hasEnded = isAfter(now, wslEndDate);

  if (hasEnded) {
    return (
      <div className="bg-dark text-white py-3 px-4 text-center border-b border-white/5">
        <p className="text-sm font-black uppercase tracking-[0.2em]">A WSL 2026 em Saquarema foi incrível! Até 2027 🤙</p>
      </div>
    );
  }

  if (isDuringEvent) {
    return (
      <div className="bg-emerald-600 text-white py-3 px-4 text-center border-b border-white/5 shadow-lg shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
        <p className="text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 relative z-10">
          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
          🌊 WSL em andamento em Saquarema!
        </p>
      </div>
    );
  }

  const days = differenceInDays(wslStartDate, now);
  const hours = differenceInHours(wslStartDate, now) % 24;
  const minutes = differenceInMinutes(wslStartDate, now) % 60;
  const seconds = differenceInSeconds(wslStartDate, now) % 60;

  return (
    <div className="bg-surf text-white py-2 md:py-4 px-4 md:px-6 text-center border-b border-white/5 shadow-lg shadow-surf/20">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2 md:gap-12">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-0.5 md:mb-1">Contagem Regressiva</p>
          <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">WSL Saquarema 2026</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          {[
            { value: days, label: 'Dias' },
            { value: hours, label: 'Hrs' },
            { value: minutes, label: 'Min' },
            { value: seconds, label: 'Seg' }
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              <div className="flex flex-col items-center">
                <span className="text-xl md:text-3xl font-black tabular-nums leading-none mb-0.5 md:mb-1">{item.value.toString().padStart(2, '0')}</span>
                <span className="text-[7px] md:text-[9px] uppercase font-black tracking-widest opacity-60">{item.label}</span>
              </div>
              {i < 3 && <span className="text-lg md:text-2xl font-black opacity-30 mb-3 md:mb-4">:</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="hidden md:block h-8 w-px bg-white/20 mx-4" />
        
        <p className="text-[8px] md:text-xs font-black uppercase tracking-widest bg-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl backdrop-blur-sm">
          Faltam {days} dias para o show! 🏄‍♂️
        </p>
      </div>
    </div>
  );
};

export const LiveBanner: React.FC = () => {
  const now = new Date();
  const wslStartDate = new Date('2026-06-19T00:00:00');
  const wslEndDate = new Date('2026-06-27T23:59:59');
  
  const isDuringEvent = isAfter(now, wslStartDate) && isBefore(now, wslEndDate);

  if (!isDuringEvent) return null;

  return (
    <div className="bg-red-600 text-white py-2 md:py-3 px-4 md:px-6 text-center font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] sticky top-16 md:top-24 z-40 shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 md:gap-4 border-b border-white/10">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
        <span className="w-2 h-2 bg-white rounded-full absolute opacity-75"></span>
      </div>
      🔴 WSL AO VIVO AGORA em Saquarema
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
        <span className="w-2 h-2 bg-white rounded-full absolute opacity-75"></span>
      </div>
    </div>
  );
};
