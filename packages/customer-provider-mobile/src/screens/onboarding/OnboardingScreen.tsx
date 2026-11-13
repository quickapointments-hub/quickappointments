import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { LeavesDecoration } from '../../components/LeavesDecoration';

interface OnboardingScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'Book Appointments Easily',
      subtitle: 'Find trusted professionals and book your favourite services in just a few taps.',
      buttonText: 'Next',
      illustration: (
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Mint Circular Backdrop */}
          <div className="absolute inset-0 m-auto w-48 h-48 rounded-full bg-[#E8F6E4]" />
          
          {/* Subtle Radiating Rays on Top Right */}
          <div className="absolute top-4 right-10 flex gap-1 items-end pointer-events-none">
            <div className="w-1.5 h-3.5 bg-[#2E9E1E] rounded-full transform rotate-[-30deg]" />
            <div className="w-1.5 h-4.5 bg-[#2E9E1E] rounded-full transform -translate-y-1" />
            <div className="w-1.5 h-3.5 bg-[#2E9E1E] rounded-full transform rotate-[30deg]" />
          </div>

          {/* Calendar Vector Card */}
          <div className="relative z-10 w-36 h-36 bg-white rounded-3xl border-4 border-[#1B5E20] shadow-md p-3.5 flex flex-col justify-between">
            {/* Calendar Rings */}
            <div className="absolute -top-3 left-6 w-3 h-6 bg-[#1B5E20] rounded-full border-2 border-white" />
            <div className="absolute -top-3 right-6 w-3 h-6 bg-[#1B5E20] rounded-full border-2 border-white" />
            
            {/* Top Calendar Bar */}
            <div className="h-4 border-b-2 border-[#1B5E20]/20 mb-1" />

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-3 gap-2 px-1">
              <div className="h-4 rounded-md bg-[#A5D6A7]" />
              <div className="h-4 rounded-md bg-[#A5D6A7]" />
              <div className="h-4 rounded-md bg-[#A5D6A7]" />
              <div className="h-4 rounded-md bg-[#A5D6A7]" />
              <div className="h-4 rounded-md bg-[#A5D6A7]" />
              <div className="h-4 rounded-md bg-[#A5D6A7]" />
            </div>
          </div>

          {/* Floating Verified Checkmark Badge */}
          <div className="absolute -bottom-1 right-6 z-20 w-14 h-14 rounded-full bg-[#2E9E1E] border-4 border-white flex items-center justify-center shadow-lg text-white">
            <Check className="w-7 h-7 stroke-[3.5]" />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Choose Verified Service Providers',
      subtitle: 'Discover trusted and skilled professionals for your needs.',
      buttonText: 'Next',
      illustration: (
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Mint Circular Backdrop */}
          <div className="absolute inset-0 m-auto w-48 h-48 rounded-full bg-[#E8F6E4]" />

          {/* Subtle Radiating Rays on Top Right */}
          <div className="absolute top-4 right-10 flex gap-1 items-end pointer-events-none">
            <div className="w-1.5 h-3.5 bg-[#2E9E1E] rounded-full transform rotate-[-30deg]" />
            <div className="w-1.5 h-4.5 bg-[#2E9E1E] rounded-full transform -translate-y-1" />
            <div className="w-1.5 h-3.5 bg-[#2E9E1E] rounded-full transform rotate-[30deg]" />
          </div>

          {/* Service Specialist Silhouette Avatar */}
          <div className="relative z-10 w-36 h-36 flex flex-col items-center justify-end overflow-hidden">
            {/* Head & Hair */}
            <div className="relative w-16 h-16 rounded-full bg-[#1B5E20] border-4 border-[#1B5E20] overflow-hidden mb-1">
              <div className="absolute top-3 inset-x-0 mx-auto w-10 h-10 rounded-full bg-[#F5F2E6]" />
            </div>
            {/* Collar & Apron */}
            <div className="w-28 h-16 rounded-t-3xl bg-[#E8F6E4] border-4 border-[#1B5E20] border-b-0 flex flex-col items-center pt-1">
              <div className="flex gap-2">
                <div className="w-3 h-5 border-r-2 border-b-2 border-[#1B5E20] transform rotate-45" />
                <div className="w-3 h-5 border-l-2 border-b-2 border-[#1B5E20] transform -rotate-45" />
              </div>
              <div className="w-2 h-2 rounded-full bg-[#1B5E20] mt-1" />
            </div>
          </div>

          {/* Floating Verified Checkmark Badge */}
          <div className="absolute -bottom-1 right-6 z-20 w-14 h-14 rounded-full bg-[#2E9E1E] border-4 border-white flex items-center justify-center shadow-lg text-white">
            <Check className="w-7 h-7 stroke-[3.5]" />
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Manage Your Appointments Easily',
      subtitle: 'Book, reschedule or cancel your appointments anytime, anywhere.',
      buttonText: 'Get Started',
      illustration: (
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Mint Circular Backdrop */}
          <div className="absolute inset-0 m-auto w-48 h-48 rounded-full bg-[#E8F6E4]" />

          {/* Subtle Radiating Rays on Top Right */}
          <div className="absolute top-4 right-10 flex gap-1 items-end pointer-events-none">
            <div className="w-1.5 h-3.5 bg-[#2E9E1E] rounded-full transform rotate-[-30deg]" />
            <div className="w-1.5 h-4.5 bg-[#2E9E1E] rounded-full transform -translate-y-1" />
            <div className="w-1.5 h-3.5 bg-[#2E9E1E] rounded-full transform rotate-[30deg]" />
          </div>

          {/* Smartphone Frame Vector */}
          <div className="relative z-10 w-28 h-44 bg-white rounded-3xl border-4 border-[#1B5E20] shadow-md p-2.5 flex flex-col items-center">
            {/* Speaker bar */}
            <div className="w-8 h-1.5 bg-[#1B5E20] rounded-full mb-3" />
            {/* Mini Calendar Icon on Screen */}
            <div className="w-10 h-10 rounded-xl bg-[#E8F6E4] border-2 border-[#2E9E1E] flex items-center justify-center mb-2.5">
              <Check className="w-5 h-5 text-[#2E9E1E] stroke-[3]" />
            </div>
            {/* Content bars */}
            <div className="w-full h-2.5 rounded-full bg-[#E8F6E4] mb-1.5" />
            <div className="w-3/4 h-2.5 rounded-full bg-[#E8F6E4]" />
          </div>

          {/* Floating Verified Checkmark Badge */}
          <div className="absolute -bottom-1 right-6 z-20 w-14 h-14 rounded-full bg-[#2E9E1E] border-4 border-white flex items-center justify-center shadow-lg text-white">
            <Check className="w-7 h-7 stroke-[3.5]" />
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const active = slides[currentSlide];

  return (
    <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FDFCF4] text-[#111111] overflow-hidden select-none">
      {/* Top Header: Logo & Skip */}
      <div className="pt-2 flex items-center justify-between relative z-10">
        <div className="w-12" />
        <div className="flex-1 text-center">
          <img
            src="/logo.png"
            alt="Quick Appointments"
            className="h-14 sm:h-16 w-auto object-contain mx-auto"
          />
        </div>
        <button
          onClick={onComplete}
          className="text-[#2E9E1E] font-bold text-sm sm:text-base px-2 py-1 hover:opacity-80 transition-opacity cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Center Illustration & Content */}
      <div className="my-auto py-4 flex flex-col items-center text-center relative z-10 max-w-sm mx-auto w-full">
        {/* Vector Illustration matching exact reference images */}
        <div className="mb-6 flex items-center justify-center">
          {active.illustration}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight max-w-[280px]">
          {active.title}
        </h1>

        {/* Emerald Horizontal Divider */}
        <div className="w-12 h-1 bg-[#2E9E1E] rounded-full my-3.5" />

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-[290px] font-medium">
          {active.subtitle}
        </p>

        {/* 3-Dot Indicator */}
        <div className="flex items-center gap-2 mt-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all cursor-pointer ${
                currentSlide === idx
                  ? 'w-2.5 h-2.5 bg-[#2E9E1E]'
                  : 'w-2.5 h-2.5 bg-[#D1D5DB]'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Action Pill Button */}
      <div className="relative z-10 pt-2 pb-4 max-w-sm mx-auto w-full">
        <button
          onClick={handleNext}
          type="button"
          className="w-full py-4 px-6 rounded-full bg-[#2E9E1E] hover:bg-[#238017] text-white font-bold text-sm sm:text-base shadow-md shadow-[#2E9E1E]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <span>{active.buttonText}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Decorative Curves */}
      <LeavesDecoration />
    </div>
  );
};
