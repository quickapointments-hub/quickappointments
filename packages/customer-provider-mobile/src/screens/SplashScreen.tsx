import React, { useEffect } from 'react';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-[#111114] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="relative mb-6">
        <div className="w-44 h-44 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center p-6 shadow-2xl backdrop-blur-md">
          <img
            src="/logo.png"
            alt="Quick Appointments"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(101,179,46,0.3)] animate-pulse"
          />
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <h1 className="text-2xl font-bold font-display text-white tracking-tight">
          QUICK APPOINTMENTS
        </h1>
        <p className="text-xs text-brand-400 font-semibold tracking-wider uppercase">
          Precision Booking Engine
        </p>
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
          Loading Schedules
        </span>
      </div>
    </div>
  );
};

