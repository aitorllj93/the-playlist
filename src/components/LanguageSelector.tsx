import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative flex items-center gap-1 sm:gap-2 bg-white/70 backdrop-blur-xl rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 border border-[#fce5e8]/40">
      {/* Fondo deslizante animado */}
      <div
        className="absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full bg-gradient-to-br from-[#f9b69d] to-[#ff9999] shadow-sm transition-all duration-300 ease-in-out"
        style={{
          left: language === 'en' ? '0.375rem' : 'calc(50% - 0.375rem)',
          width: 'calc(50% - 0.125rem)',
        }}
      />

      <button
        type="button"
        className={`relative z-10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
          language === 'en'
            ? 'text-white'
            : 'text-[#d4725c] hover:text-[#b85f4a]'
        }`}
        onClick={() => setLanguage('en')}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        className={`relative z-10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
          language === 'es'
            ? 'text-white'
            : 'text-[#d4725c] hover:text-[#b85f4a]'
        }`}
        onClick={() => setLanguage('es')}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
    </div>
  );
}

