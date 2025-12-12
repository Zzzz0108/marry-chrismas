import React from 'react';
import { GiftMessage } from '../types';
import { X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftModalProps {
  gift: GiftMessage | null;
  onClose: () => void;
}

const GiftModal: React.FC<GiftModalProps> = ({ gift, onClose }) => {
  return (
    <AnimatePresence>
      {gift && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl p-8 shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden"
            style={{
                boxShadow: `0 0 30px ${gift.color}40`
            }}
          >
            {/* Decorative Glow */}
            <div 
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ backgroundColor: gift.color }}
            />
             <div 
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ backgroundColor: gift.color }}
            />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div 
                className="p-4 rounded-full bg-slate-800 ring-2 ring-offset-4 ring-offset-slate-900 shadow-xl"
                style={{ '--tw-ring-color': gift.color, color: gift.color } as React.CSSProperties}
              >
                <Gift size={48} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl text-slate-400 font-christmas">For: <span className="text-white text-2xl ml-1">{gift.to}</span></h3>
                <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 font-christmas leading-tight">
                  Merry Christmas
                </h2>
              </div>

              <p className="text-lg text-slate-300 leading-relaxed italic border-t border-slate-800 pt-4 w-full">
                "{gift.message}"
              </p>

              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full font-semibold text-slate-900 transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: gift.color }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GiftModal;