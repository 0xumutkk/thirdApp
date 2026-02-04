
import React from 'react';
import { Home, Map, Heart, User } from 'lucide-react';
import { AppScreen } from '../types';

interface BottomNavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { id: 'HOME', label: 'Keşfet', icon: Home },
    { id: 'MAP', label: 'Harita', icon: Map },
    { id: 'FAVES', label: 'Favoriler', icon: Heart },
    { id: 'PROFILE', label: 'Profil', icon: User },
  ];

  const activeIndex = navItems.findIndex(item => item.id === currentScreen);

  const handleClick = (id: string) => {
    onNavigate(id as AppScreen);
  };

  return (
    <nav className="absolute bottom-0 left-0 right-0 px-8 pb-10 pt-4 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6]/80 to-transparent pointer-events-none">
      <div className="relative bg-white/70 backdrop-blur-[24px] border border-white/50 rounded-[2.8rem] p-2 flex justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto overflow-hidden">
        {activeIndex !== -1 && (
          <div 
            className="absolute top-2 bottom-2 w-[calc(25%-1rem)] bg-[#1B4332] rounded-[2rem] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
            style={{ 
              left: '0.5rem',
              transform: `translateX(calc(${activeIndex} * 100% + ${activeIndex} * 1.33rem))` 
            }}
          />
        )}
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                handleClick(item.id);
              }}
              className={`relative z-10 flex-1 flex flex-col items-center justify-center p-3 rounded-[2rem] transition-all duration-500 ${
                isActive ? 'text-white' : 'text-gray-400'
              } active:scale-90`}
            >
              <Icon className={`w-5 h-5 transition-all duration-500 ${isActive ? 'scale-110 stroke-[2px]' : 'stroke-[1.5px]'}`} />
              <span className={`text-[8px] font-black mt-1 uppercase tracking-widest transition-all duration-500 ${isActive ? 'opacity-100 max-h-4 translate-y-0' : 'opacity-0 max-h-0 -translate-y-1 overflow-hidden'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
