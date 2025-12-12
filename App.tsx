import React, { useState, useEffect } from 'react';
import TreeCanvas from './components/TreeCanvas';
import GiftModal from './components/GiftModal';
import { GiftMessage } from './types';
import { Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

const App: React.FC = () => {
  const [activeGift, setActiveGift] = useState<GiftMessage | null>(null);
  const [isExploded, setIsExploded] = useState(true); // Start exploded

  // Auto-form the tree after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
        setIsExploded(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGiftClick = (gift: GiftMessage) => {
    setActiveGift(gift);
  };

  const handleCloseModal = () => {
    setActiveGift(null);
  };

  const toggleExplosion = () => {
    setIsExploded(!isExploded);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white font-luxury selection:bg-yellow-500/30">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <TreeCanvas onGiftClick={handleGiftClick} isExploded={isExploded} />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-8 z-20 flex flex-col items-center pointer-events-none">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
        >
            <div className="flex items-center gap-3 text-yellow-500 mb-2">
                <Sparkles size={16} />
                <span className="uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold font-sans">The Grand Edition</span>
                <Sparkles size={16} />
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDD0] via-[#FFD700] to-[#B8860B] drop-shadow-[0_4px_20px_rgba(255,215,0,0.5)] leading-tight py-2">
            MERRY<br/>CHRISTMAS
            </h1>
            
            <p className="mt-6 text-yellow-100/60 text-sm md:text-base font-sans font-light tracking-wide max-w-md backdrop-blur-sm px-4 py-2 rounded-full border border-white/5 bg-black/20">
                Tap the Golden Gifts to Reveal Your Fortune
            </p>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-auto">
         <button 
            onClick={toggleExplosion}
            className="group relative px-8 py-3 bg-black/40 backdrop-blur-xl border border-[#FFD700]/30 text-[#FFD700] rounded-full overflow-hidden transition-all hover:bg-[#FFD700]/10 hover:border-[#FFD700] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)]"
         >
            <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-bold">
                {isExploded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                <span>{isExploded ? "Assemble" : "Deconstruct"}</span>
            </div>
         </button>
      </div>

      {/* Interactive Modal */}
      <GiftModal gift={activeGift} onClose={handleCloseModal} />

      {/* Corners */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#FFD700]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#FFD700]/20 to-transparent blur-3xl pointer-events-none" />
      
      {/* Border Frame */}
      <div className="absolute inset-0 border-[1px] border-white/5 pointer-events-none m-4 rounded-3xl" />
    </div>
  );
};

export default App;