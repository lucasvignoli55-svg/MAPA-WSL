import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, Home, Music, Calendar, Search, User, Waves, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', icon: Map, label: 'Mapa' },
    { to: '/hoje', icon: Flame, label: 'Hoje' },
    { to: '/hospedagem', icon: Home, label: 'Hospedagem' },
    { to: '/festas', icon: Music, label: 'Festas' },
    { to: '/agenda', icon: Calendar, label: 'Agenda' },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 bg-dark/90 backdrop-blur-2xl border border-white/10 px-3 py-3 z-[3000] md:hidden flex justify-around items-center h-20 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full transition-all duration-500 relative",
              isActive ? "text-surf scale-110" : "text-gray-500 hover:text-white"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-2 rounded-2xl transition-all duration-500",
                isActive ? "bg-surf/10 shadow-[0_0_20px_rgba(244,162,97,0.2)]" : ""
              )}>
                <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
              </div>
              <span className={cn("text-[9px] mt-1.5 font-black uppercase tracking-[0.1em]", isActive ? "opacity-100" : "opacity-40")}>
                {item.label}
              </span>
              {/* Active Indicator Dot */}
              <div className={cn(
                "absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-surf transition-all duration-500 shadow-[0_0_10px_rgba(244,162,97,0.8)]",
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
              )} />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export const Header: React.FC = () => {
  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100/50 p-2 md:p-5 sticky top-0 z-[1000] h-16 md:h-24 flex items-center transition-all duration-300">
      <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between px-4 md:px-8">
        <NavLink to="/" className="flex items-center gap-2 md:gap-4 group">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-ocean rounded-[14px] md:rounded-[18px] flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(0,119,182,0.3)] transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:shadow-ocean/40">
            <Waves className="text-white" size={20} md:size={28} />
          </div>
          <div>
            <h1 className="text-base md:text-2xl font-black text-dark leading-none tracking-tighter flex items-center gap-1 md:gap-2">
              MAPA DO ROLÊ <span className="text-ocean bg-ocean/5 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg">WSL</span>
            </h1>
            <p className="text-[7px] md:text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 md:mt-1.5">Saquarema 2026 • Guia Oficial</p>
          </div>
        </NavLink>

        <div className="hidden lg:flex gap-12 items-center">
          <nav className="flex gap-10">
            {[
              { to: '/', label: 'Mapa' },
              { to: '/hoje', label: 'Hoje 🔥' },
              { to: '/hospedagem', label: 'Hospedagem' },
              { to: '/festas', label: 'Festas' },
              { to: '/agenda', label: 'Agenda WSL' },
            ].map(link => (
              <NavLink 
                key={link.to}
                to={link.to} 
                className={({ isActive }) => cn(
                  "text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:text-ocean relative py-3 group",
                  isActive ? "text-ocean" : "text-gray-400"
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{link.label}</span>
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-1 bg-ocean rounded-full transition-all duration-300 shadow-[0_2px_10px_rgba(0,119,182,0.4)]",
                      isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50"
                    )} />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          
          <NavLink 
            to="/admin" 
            className="bg-dark text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-ocean hover:shadow-xl hover:shadow-ocean/20 transition-all duration-500 active:scale-95 flex items-center gap-3"
          >
            <User size={16} /> Painel Admin
          </NavLink>
        </div>
        
        {/* Mobile Admin Link */}
        <NavLink to="/admin" className="lg:hidden w-12 h-12 bg-dark rounded-2xl flex items-center justify-center text-white shadow-xl shadow-dark/20 active:scale-90 transition-all">
          <User size={22} />
        </NavLink>
      </div>
    </header>
  );
};
