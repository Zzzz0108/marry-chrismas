import React, { useState } from 'react';
import TreeCanvas from './components/TreeCanvas';
import GiftModal from './components/GiftModal';
import { GiftMessage } from './types';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [activeGift, setActiveGift] = useState<GiftMessage | null>(null);

  const handleGiftClick = (gift: GiftMessage) => {
    setActiveGift(gift);
  };

  const handleCloseModal = () => {
    setActiveGift(null);
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden text-white">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-black z-0" />
      
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-10">
        <TreeCanvas onGiftClick={handleGiftClick} />
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex flex-col items-center pointer-events-none">
        <div className="flex items-center gap-2 text-yellow-400 animate-pulse">
           <Sparkles size={20} />
           <span className="uppercase tracking-widest text-xs font-bold">Special Delivery</span>
           <Sparkles size={20} />
        </div>
        <h1 className="mt-2 text-5xl md:text-7xl font-bold text-center font-christmas text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-green-600 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
          Merry Christmas
        </h1>
        <p className="mt-4 text-slate-300 text-sm md:text-base font-light bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 pointer-events-auto">
          Tap the gifts to see who they are for! 🎁
        </p>
      </div>

      {/* Interactive Modal */}
      <GiftModal gift={activeGift} onClose={handleCloseModal} />

      {/* Footer / Credits */}
      <div className="absolute bottom-4 left-0 w-full text-center z-20 pointer-events-none opacity-50 text-xs text-slate-500">
        <p>Warm Wishes for 2024</p>
      </div>
    </div>
  );
};

export default App;