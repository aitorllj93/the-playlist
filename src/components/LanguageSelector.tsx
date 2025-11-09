import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-white/70 backdrop-blur-xl rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 border border-[#fce5e8]/40">
      <button
        type="button"
        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
          language === 'en'
            ? 'bg-linear-to-br from-[#f9b69d] to-[#ff9999] text-white shadow-sm'
            : 'text-[#d4725c] hover:bg-white/60'
        }`}
        onClick={() => setLanguage('en')}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
          language === 'es'
            ? 'bg-linear-to-br from-[#f9b69d] to-[#ff9999] text-white shadow-sm'
            : 'text-[#d4725c] hover:bg-white/60'
        }`}
        onClick={() => setLanguage('es')}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
    </div>
  );
}

