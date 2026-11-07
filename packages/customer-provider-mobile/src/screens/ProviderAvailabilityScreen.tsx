import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

export const ProviderAvailabilityScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [schedule, setSchedule] = useState([
    { day: 'Monday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
    { day: 'Tuesday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
    { day: 'Wednesday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
    { day: 'Thursday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
    { day: 'Friday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
    { day: 'Saturday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
    { day: 'Sunday', open: '09:00', close: '18:00', breakStart: '13:00', breakEnd: '14:00', isClosed: true },
  ]);

  const toggleDay = (idx: number) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, isClosed: !item.isClosed } : item))
    );
  };

  return (
    <div className="pb-24 px-5 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
            Schedule & Availability
          </h2>
          <p className="text-xs text-slate-500">Working hours, lunch breaks & holiday rules</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm space-y-3">
        <div className="text-[11px] text-slate-500 pb-2 border-b border-slate-100">
          Customer slots automatically adapt to these hours in real time. Mid-day break times are excluded from booking.
        </div>

        <div className="space-y-2">
          {schedule.map((item, idx) => (
            <div
              key={item.day}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                item.isClosed
                  ? 'bg-slate-50 border-slate-200/60 opacity-60'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <p className="font-bold text-slate-900">{item.day}</p>
                {!item.isClosed ? (
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {item.open} - {item.close} (Lunch: {item.breakStart}-{item.breakEnd})
                  </p>
                ) : (
                  <p className="text-[11px] text-rose-500 font-medium">Closed / Off Duty</p>
                )}
              </div>

              <button
                onClick={() => toggleDay(idx)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  item.isClosed
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}
              >
                {item.isClosed ? 'Mark Open' : 'Open'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

