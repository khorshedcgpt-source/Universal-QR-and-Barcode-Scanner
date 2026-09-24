import React from 'react';
import { Scan, History, QrCode, Settings, ShieldCheck } from 'lucide-react';

export type TabType = 'scanner' | 'history' | 'generator' | 'settings';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  historyCount: number;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange, historyCount }) => {
  const navItems: NavItem[] = [
    { id: 'scanner', label: 'Scanner', icon: Scan },
    { id: 'history', label: 'History', icon: History, badge: historyCount > 0 ? historyCount : undefined },
    { id: 'generator', label: 'Generator', icon: QrCode },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onTabChange('scanner')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
            <Scan className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-400 transition">
                Universal Scanner
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                <span>100% Offline</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Privacy-First QR & Barcode Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as TabType)}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                    isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
