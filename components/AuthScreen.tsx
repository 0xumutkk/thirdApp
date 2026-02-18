
import React from 'react';
import { Coffee } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  return (
    <div className="h-full w-full flex flex-col justify-between p-8 bg-[#FAF9F6] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#1B4332]/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#BC4749]/5 rounded-full blur-3xl" />

      <div className="mt-20 flex flex-col items-center text-center relative z-10">
        <div className="w-64 h-64 flex items-center justify-center mb-6 animate-bounce-slow">
          <img
            src="/assets/logo.svg"
            alt="Loca Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-gray-500 font-medium px-6 leading-relaxed">
          Şehrindeki en iyi çalışma alanlarını keşfet ve ödüller kazan.
        </p>
      </div>

      <div className="space-y-4 mb-12 relative z-10">
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 py-4 rounded-[1.8rem] shadow-sm active:scale-[0.98] transition-all hover:shadow-md"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="font-outfit font-semibold text-[#1B4332]">Google ile Devam Et</span>
        </button>

        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-black py-4 rounded-[1.8rem] shadow-sm active:scale-[0.98] transition-all hover:shadow-lg"
        >
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.96.95-2.12 1.72-3.47 1.72-1.32 0-2.07-.82-3.58-.82-1.52 0-2.34.82-3.58.82-1.35 0-2.51-.77-3.47-1.72-2.12-2.1-3.32-6.14-3.32-9.04 0-4.02 2.5-6.14 4.88-6.14 1.28 0 2.22.42 3.12.42.82 0 1.83-.42 3.12-.42 1.63 0 3.32.74 4.31 2.12-3.58 2.06-2.92 7.04.66 8.35-.66 1.7-1.48 3.32-2.07 4.71zM12.03 7.25c-.04-2.52 2.1-4.63 4.54-4.71.04 2.52-2.1 4.63-4.54 4.71z" />
          </svg>
          <span className="font-outfit font-semibold text-white">Apple ile Devam Et</span>
        </button>

        <p className="text-[10px] text-center text-gray-400 mt-6 px-10">
          Devam ederek <span className="underline">Kullanım Koşulları</span> ve <span className="underline">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
        </p>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
