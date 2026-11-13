import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { mobileApi } from '../../api';

const DEFAULT_DAYS = [
  { dayOfWeek: 1, day: 'Monday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
  { dayOfWeek: 2, day: 'Tuesday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
  { dayOfWeek: 3, day: 'Wednesday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
  { dayOfWeek: 4, day: 'Thursday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
  { dayOfWeek: 5, day: 'Friday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
  { dayOfWeek: 6, day: 'Saturday', open: '09:00', close: '19:00', breakStart: '13:00', breakEnd: '14:00', isClosed: false },
  { dayOfWeek: 0, day: 'Sunday', open: '09:00', close: '18:00', breakStart: '13:00', breakEnd: '14:00', isClosed: true },
];

export const ProviderAvailabilityScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [schedule, setSchedule] = useState(DEFAULT_DAYS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const res = await mobileApi.getProviderAvailability();
        const rows = res?.data || res?.schedule || [];
        if (active && Array.isArray(rows) && rows.length > 0) {
          setSchedule(
            DEFAULT_DAYS.map((def) => {
              const found = rows.find(
                (r: any) =>
                  Number(r.dayOfWeek ?? r.day_of_week) === def.dayOfWeek ||
                  String(r.day || '').toLowerCase() === def.day.toLowerCase()
              );
              if (!found) return def;
              return {
                dayOfWeek: def.dayOfWeek,
                day: def.day,
                open: found.openTime || found.open_time || found.startTime || found.start_time || found.open || def.open,
                close: found.closeTime || found.close_time || found.endTime || found.end_time || found.close || def.close,
                breakStart: found.breakStart || found.break_start || def.breakStart,
                breakEnd: found.breakEnd || found.break_end || def.breakEnd,
                isClosed: Boolean(found.isClosed ?? found.is_closed),
              };
            })
          );
        }
      } catch (err: any) {
        if (active) {
          setStatusMsg({ type: 'err', text: err.message || 'Unable to load availability schedule' });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadSchedule();
    return () => {
      active = false;
    };
  }, []);

  const toggleDay = (idx: number) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, isClosed: !item.isClosed } : item))
    );
  };

  const updateTime = (idx: number, field: 'open' | 'close', value: string) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      await mobileApi.saveProviderAvailability(
        schedule.map((item) => ({
          dayOfWeek: item.dayOfWeek,
          openTime: item.open,
          closeTime: item.close,
          breakStart: item.breakStart,
          breakEnd: item.breakEnd,
          isClosed: item.isClosed,
        }))
      );
      setStatusMsg({ type: 'ok', text: 'Working hours saved to database.' });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Failed to save working hours' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 px-5 pt-4 space-y-4 bg-[#FDFCF4] text-[#111111] min-h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-full bg-white border border-[#E8E4D9] text-[#111111] hover:bg-[#FAF8F0] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-black font-display text-[#111111] tracking-tight">
              Schedule & Availability
            </h2>
            <p className="text-xs text-[#4B5563] font-medium">Working hours, lunch breaks & holiday rules</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-3.5 py-2 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center gap-2 font-semibold ${
            statusMsg.type === 'ok'
              ? 'bg-[#EFF8E7] border-[#65B32E] text-[#111111]'
              : 'bg-red-50 border-red-200 text-[#DC2626]'
          }`}
        >
          {statusMsg.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-[#65B32E] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#E8E4D9] p-4 shadow-sm space-y-3">
        <div className="text-[11px] text-[#4B5563] pb-2 border-b border-[#F2EFE8] font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#65B32E]" />
          <span>Customer slots automatically adapt to these hours in real time.</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[#6B7280]">Loading schedule...</div>
        ) : (
          <div className="space-y-2">
            {schedule.map((item, idx) => (
              <div
                key={item.day}
                className={`p-3 rounded-2xl border transition-all space-y-2 text-xs ${
                  item.isClosed
                    ? 'bg-[#FAF8F0] border-[#E8E4D9] opacity-70'
                    : 'bg-white border-[#E8E4D9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#111111]">{item.day}</p>
                    {item.isClosed && (
                      <p className="text-[11px] text-[#DC2626] font-semibold">Closed / Off Duty</p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleDay(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      item.isClosed
                        ? 'bg-[#F3F4F6] text-[#4B5563] border border-[#DCD8C8]'
                        : 'bg-[#EFF8E7] text-[#111111] border border-[#65B32E]'
                    }`}
                  >
                    {item.isClosed ? 'Open' : 'Active'}
                  </button>
                </div>

                {!item.isClosed && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block mb-0.5">Open</span>
                      <input
                        type="time"
                        value={item.open}
                        onChange={(e) => updateTime(idx, 'open', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-[#DCD8C8] bg-[#FDFCF4] font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] block mb-0.5">Close</span>
                      <input
                        type="time"
                        value={item.close}
                        onChange={(e) => updateTime(idx, 'close', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-[#DCD8C8] bg-[#FDFCF4] font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
