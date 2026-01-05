import React from 'react';
import { CheckCircle } from 'lucide-react';

interface BookCoverProps {
  number: number;
  completedCount: number; // 0 to 4
  onClick?: () => void;
}

const getBookColor = (num: number) => {
  // Cycle through academic-looking gradients based on book number
  const colors = [
    'from-slate-800 to-slate-900',      // 5 (Classic Black)
    'from-blue-800 to-blue-950',        // 6 (Deep Blue)
    'from-purple-800 to-purple-950',    // 7 (Purple)
    'from-indigo-800 to-indigo-950',    // 8 (Indigo)
    'from-teal-800 to-teal-950',        // 9 (Teal)
    'from-cyan-800 to-cyan-950',        // 10 (Cyan Dark)
    'from-rose-800 to-rose-950',        // 11 (Red/Rose)
    'from-emerald-800 to-emerald-950',  // 12 (Green)
    'from-violet-800 to-violet-950',    // 13 (Violet)
    'from-amber-700 to-orange-900',     // 14 (Orange/Brown)
    'from-fuchsia-800 to-pink-950',     // 15 (Pink)
    'from-sky-700 to-blue-900',         // 16 (Light Blue)
    'from-lime-800 to-green-950',       // 17 (Lime Dark)
    'from-indigo-900 to-slate-900',     // 18
    'from-red-900 to-rose-950',         // 19
    'from-slate-700 to-gray-900',       // 20
  ];
  return colors[(num - 5) % colors.length];
};

const BookCover: React.FC<BookCoverProps> = ({ number, completedCount, onClick }) => {
  const isFullyComplete = completedCount === 4;
  const progressPercent = (completedCount / 4) * 100;
  
  return (
    <div 
      onClick={onClick}
      className={`relative aspect-[3/4] rounded-r-lg rounded-l-sm shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group overflow-hidden bg-white`}
    >
      {/* Binding/Spine Effect */}
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/20 to-transparent z-20 pointer-events-none"></div>
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/20 z-20 pointer-events-none"></div>

      {/* Main Cover Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getBookColor(number)}`}>
         {/* Subtle Texture Overlay */}
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Content Layout */}
      <div className="relative z-10 h-full flex flex-col p-4 text-white">
        
        {/* Header */}
        <div className="border-b border-white/20 pb-2 mb-2">
           <p className="text-[8px] uppercase tracking-widest font-serif opacity-80">Cambridge University Press</p>
        </div>

        {/* Title Section */}
        <div className="mt-2 space-y-0">
          <h3 className="text-3xl font-serif font-black tracking-tighter leading-none">IELTS</h3>
          <p className="text-xs uppercase tracking-[0.2em] font-light mt-1 opacity-90">Academic</p>
          <p className="text-[10px] uppercase tracking-wider font-light opacity-70 mt-0.5">With Answers</p>
        </div>

        {/* Book Number (Centerpiece) */}
        <div className="flex-1 flex items-center justify-center relative">
           <span className="text-8xl font-serif font-bold opacity-20 absolute scale-150 transform -rotate-12 select-none">{number}</span>
           <span className="text-7xl font-serif font-bold relative z-10 drop-shadow-2xl">{number}</span>
        </div>

        {/* Footer / Progress Overlay */}
        <div className="mt-auto pt-4">
           {completedCount > 0 ? (
             <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/10 shadow-lg">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Progress</span>
                   {isFullyComplete ? (
                     <CheckCircle className="w-4 h-4 text-green-400" />
                   ) : (
                     <span className="text-xs font-bold">{Math.round(progressPercent)}%</span>
                   )}
                </div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                   <div 
                     className={`h-full ${isFullyComplete ? 'bg-green-400' : 'bg-sky-400'}`} 
                     style={{width: `${progressPercent}%`}}
                   ></div>
                </div>
             </div>
           ) : (
             <div className="opacity-60 text-center">
                <p className="text-[10px] uppercase tracking-widest border border-white/30 rounded px-2 py-1 inline-block">Authentic Papers</p>
             </div>
           )}
        </div>
      </div>
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none"></div>
    </div>
  );
};

export default BookCover;