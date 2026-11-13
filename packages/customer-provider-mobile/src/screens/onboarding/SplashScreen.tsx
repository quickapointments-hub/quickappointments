import React, { useEffect, useState } from 'react';
import { LeavesDecoration } from '../../components/LeavesDecoration';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [fadingOut, setFadingOut] = useState(false);
  const onFinishRef = React.useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // Prevent duplicate splash displays in the same browser session
    try {
      if (sessionStorage.getItem('qa_splash_shown') === 'true') {
        onFinishRef.current();
        return;
      }
    } catch {
      // In non-browser environments or when storage is restricted
    }

    // Professional clean splash duration: 1.1s display, then 250ms smooth fade-out
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 1100);

    const finishTimer = setTimeout(() => {
      try {
        sessionStorage.setItem('qa_splash_shown', 'true');
      } catch {}
      onFinishRef.current();
    }, 1350);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#FDFCF4] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden transition-opacity duration-300 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#FDFCF4' }}
    >
      {/* Centered High-Resolution Official Quick Appointments Logo with standard mobile dimensions */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10">
        <div className="w-56 h-20 flex items-center justify-center p-2">
          <img
            src="/logo.png"
            alt="Quick Appointments"
            className="max-h-16 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(17,17,17,0.06)]"
          />
        </div>

        {/* Circular Brand Green Spinner directly beneath logo */}
        <div className="mt-8">
          <div className="w-7 h-7 border-[2.5px] border-[#65B32E] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>

      {/* Organic Leaves & Soft Curve Background */}
      <LeavesDecoration />
    </div>
  );
};
