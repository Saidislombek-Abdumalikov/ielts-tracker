import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, AlertCircle, BookOpenCheck } from 'lucide-react';
import { TestRecord, ScoreInput } from '../types';
import { getBandScore, calculateWriting } from '../constants';

interface TestCardProps {
  record: TestRecord;
  projectedDate: Date;
  onSave: (id: string, scores: ScoreInput) => void;
  onResolve: (id: string) => void;
}

const TestCard: React.FC<TestCardProps> = ({ record, projectedDate, onSave, onResolve }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputs, setInputs] = useState<ScoreInput>(record.scores);

  useEffect(() => {
    setInputs(record.scores);
  }, [record.scores]);

  const handleRawChange = (field: 'listeningRaw' | 'readingRaw', val: string) => {
    const num = parseInt(val);
    if (!isNaN(num) && num >= 0 && num <= 40) {
      setInputs(prev => ({ ...prev, [field]: num }));
    } else if (val === '') {
      setInputs(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleBandChange = (field: 'writingTask1' | 'writingTask2', val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 9) {
      setInputs(prev => ({ ...prev, [field]: num }));
    } else if (val === '') {
      setInputs(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = () => {
    onSave(record.id, inputs);
    if (!record.isCompleted) {
        // If first time completing, we keep it open so they see the result or maybe close it
        setIsOpen(false);
    }
  };

  const currentListeningBand = getBandScore(inputs.listeningRaw);
  const currentReadingBand = getBandScore(inputs.readingRaw);
  const currentWritingBand = calculateWriting(inputs.writingTask1, inputs.writingTask2);

  const isFormValid = inputs.listeningRaw !== null && inputs.readingRaw !== null && inputs.writingTask1 !== null && inputs.writingTask2 !== null;

  const dateStr = projectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  // Calculate Resolve Due Date (Completed Date + 1 Day)
  const getResolveDueDate = () => {
    if (!record.completedDate) return null;
    const d = new Date(record.completedDate);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const resolveDateStr = getResolveDueDate();

  return (
    <div className={`mb-3 rounded-2xl border transition-all duration-300 overflow-hidden ${record.isCompleted ? 'bg-white border-green-200 shadow-sm' : 'bg-white/80 border-slate-100 hover:border-sky-300 hover:shadow-md hover:shadow-sky-100'}`}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Pending Resolve Indicator Dot */}
        {record.isCompleted && !record.isResolved && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
        )}

        <div className="flex items-center space-x-4">
          {record.isCompleted ? (
            <div className="bg-green-100 p-1.5 rounded-full shadow-sm">
               <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="bg-slate-50 p-1.5 rounded-full border border-slate-100">
               <Circle className="w-5 h-5 text-slate-300" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Test {record.testNumber}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{dateStr}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {record.isCompleted && (
             <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall</span>
                <div className="flex items-center space-x-2">
                    <span className={`text-base font-bold ${record.calculatedBand.overall >= 8.0 ? 'text-sky-600' : 'text-slate-700'}`}>
                    {record.calculatedBand.overall}
                    </span>
                    {record.isResolved && <BookOpenCheck className="w-3 h-3 text-amber-500" />}
                </div>
             </div>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </div>
      </div>

      {isOpen && (
        <div className="bg-slate-50/30 border-t border-slate-50">
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Listening */}
                <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Listening (Raw)</label>
                    <span className="text-xs font-bold text-sky-600">{currentListeningBand}</span>
                </div>
                <input 
                    type="number" 
                    value={inputs.listeningRaw ?? ''}
                    onChange={(e) => handleRawChange('listeningRaw', e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none text-center font-mono text-lg bg-white shadow-sm"
                    placeholder="/40"
                />
                </div>

                {/* Reading */}
                <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reading (Raw)</label>
                    <span className="text-xs font-bold text-sky-600">{currentReadingBand}</span>
                </div>
                <input 
                    type="number" 
                    value={inputs.readingRaw ?? ''}
                    onChange={(e) => handleRawChange('readingRaw', e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none text-center font-mono text-lg bg-white shadow-sm"
                    placeholder="/40"
                />
                </div>

                {/* Writing Task 1 */}
                <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Writing Task 1</label>
                <input 
                    type="number" 
                    step="0.5"
                    value={inputs.writingTask1 ?? ''}
                    onChange={(e) => handleBandChange('writingTask1', e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none text-center font-mono text-lg bg-white shadow-sm"
                    placeholder="Band"
                />
                </div>

                {/* Writing Task 2 */}
                <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Writing Task 2</label>
                    <span className="text-xs font-bold text-sky-600">Avg: {currentWritingBand}</span>
                </div>
                <input 
                    type="number" 
                    step="0.5"
                    value={inputs.writingTask2 ?? ''}
                    onChange={(e) => handleBandChange('writingTask2', e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none text-center font-mono text-lg bg-white shadow-sm"
                    placeholder="Band"
                />
                </div>
            </div>

            <button 
                disabled={!isFormValid}
                onClick={handleSave}
                className={`mt-6 w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-sky-200 transition-all active:scale-[0.98] ${
                isFormValid ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700' : 'bg-slate-300 cursor-not-allowed shadow-none'
                }`}
            >
                {record.isCompleted ? 'Update Scores' : 'Complete Test'}
            </button>
          </div>

          {/* Resolve Section - Only shows if completed */}
          {record.isCompleted && (
              <div className="border-t border-slate-100 bg-amber-50/50 p-4">
                 <div className="flex items-start justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center">
                            <BookOpenCheck className="w-4 h-4 mr-2 text-amber-500" />
                            Analysis & Review
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            {record.isResolved 
                                ? "Great job reviewing your mistakes." 
                                : `Review mistakes on ${resolveDateStr}`
                            }
                        </p>
                    </div>
                    <button 
                        onClick={() => onResolve(record.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                            record.isResolved 
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50 shadow-sm'
                        }`}
                    >
                        {record.isResolved ? "Resolved ✓" : "Mark Resolved"}
                    </button>
                 </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCard;