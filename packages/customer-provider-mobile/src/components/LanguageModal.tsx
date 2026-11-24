import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { SupportedLanguage } from '../i18n/types';
import { X, Check, Globe } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { currentLanguage, setLanguage, languages, t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl border border-[#E8E4D9] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center border border-[#65B32E]/30">
              <Globe className="w-4 h-4 text-[#65B32E]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">{t('choose_language')}</h3>
              <p className="text-[11px] text-[#4B5563]">10 Indian Languages Supported</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FFFFFF] text-[#6B7280] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Grid / List */}
        <div className="p-4 overflow-y-auto space-y-2">
          {languages.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as SupportedLanguage);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all text-left ${
                  isSelected
                    ? 'border-[#65B32E] bg-[#EFF8E7] text-[#111111] shadow-xs'
                    : 'border-[#E8E4D9] bg-white hover:bg-[#FFFFFF] text-[#111111]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{lang.nativeName}</span>
                    {lang.code === 'en' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] font-semibold">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#4B5563]">{lang.name}</span>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-[#65B32E] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-[#DCD8C8]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E8E4D9] bg-[#FFFFFF] text-center">
          <p className="text-[10px] text-[#6B7280] font-medium">
            Language selection persists across visits and native device sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

