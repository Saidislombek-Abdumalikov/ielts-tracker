import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, BarChart2, ChevronRight, LayoutGrid, GraduationCap, CloudSun, Settings, Download, Upload, Trash2, X, AlertTriangle, Smartphone, HardDrive, Timer, CalendarClock, Flag } from 'lucide-react';
import { AppState, ScoreInput, Tab } from './types';
import { getBandScore, calculateWriting, calculateOverall, INITIAL_BOOKS_START, INITIAL_BOOKS_END, generateInitialRecords } from './constants';
import { loadState, saveState } from './services/storageService';
import TestCard from './components/TestCard';
import Analytics from './components/Analytics';
import BookCover from './components/BookCover';

const App: React.FC = () => {
  const loadedState = loadState();
  const [state, setState] = useState<AppState>(loadedState);
  // Initialize UI state from persisted storage or defaults
  const [activeTab, setActiveTab] = useState<Tab>(loadedState.uiState?.activeTab ?? Tab.BOOKS);
  const [selectedBook, setSelectedBook] = useState<number | null>(loadedState.uiState?.selectedBook ?? null);
  
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Countdown State
  const [timeString, setTimeString] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Persist State Changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Sync UI state to main state for persistence
  useEffect(() => {
    setState(prev => ({
      ...prev,
      uiState: {
        activeTab,
        selectedBook
      }
    }));
  }, [activeTab, selectedBook]);

  const handleSaveScore = (id: string, scores: ScoreInput) => {
    setState(prev => {
      const newRecords = prev.records.map(record => {
        if (record.id === id) {
          const lBand = getBandScore(scores.listeningRaw);
          const rBand = getBandScore(scores.readingRaw);
          const wBand = calculateWriting(scores.writingTask1, scores.writingTask2);
          const overall = calculateOverall(lBand, rBand, wBand);
          
          return {
            ...record,
            isCompleted: true,
            completedDate: record.completedDate || new Date().toISOString(), // Keep original date if updating
            scores: scores,
            calculatedBand: {
              listening: lBand,
              reading: rBand,
              writing: wBand,
              overall: overall
            }
          };
        }
        return record;
      });
      return { ...prev, records: newRecords };
    });
  };

  const handleResolve = (id: string) => {
    setState(prev => {
      const newRecords = prev.records.map(record => {
        if (record.id === id) {
            // Toggle resolve status
            const newStatus = !record.isResolved;
            return {
                ...record,
                isResolved: newStatus,
                resolvedDate: newStatus ? new Date().toISOString() : null
            };
        }
        return record;
      });
      return { ...prev, records: newRecords };
    });
  };

  // Data Management Functions
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ielts_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          if (event.target?.result) {
            const parsed = JSON.parse(event.target.result as string);
            // Basic validation
            if (parsed.records && Array.isArray(parsed.records)) {
              setState(parsed);
              // Also restore UI state if present
              if (parsed.uiState) {
                  setActiveTab(parsed.uiState.activeTab);
                  setSelectedBook(parsed.uiState.selectedBook);
              }
              setShowSettings(false);
              alert("Data restored successfully!");
            } else {
              alert("Invalid backup file.");
            }
          }
        } catch (error) {
          console.error(error);
          alert("Failed to parse file.");
        }
      };
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will delete all your progress permanently.")) {
      const newState = {
        startDate: new Date().toISOString(),
        records: generateInitialRecords(),
        uiState: { activeTab: Tab.BOOKS, selectedBook: null }
      };
      setState(newState);
      setActiveTab(Tab.BOOKS);
      setSelectedBook(null);
      setShowSettings(false);
    }
  };

  // Scheduled dates logic
  // RULE: 1 Test every 2 days. Skip Sundays.
  const scheduledRecords = useMemo(() => {
    const startDate = new Date(state.startDate);
    let currentDate = new Date(startDate);
    currentDate.setHours(0,0,0,0);

    return state.records.map((record) => {
      // If the calculation lands on a Sunday, move to Monday
      if (currentDate.getDay() === 0) { 
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const projected = new Date(currentDate);
      
      // Increment by 2 days for the next test cycle
      currentDate.setDate(currentDate.getDate() + 2);
      
      return { ...record, projectedDate: projected };
    });
  }, [state.records, state.startDate]);

  const finishDate = useMemo(() => {
    if (scheduledRecords.length > 0) {
      return scheduledRecords[scheduledRecords.length - 1].projectedDate;
    }
    return null;
  }, [scheduledRecords]);

  // Group records by book for the dashboard
  const bookProgress = useMemo(() => {
     const progress = [];
     for(let b = INITIAL_BOOKS_START; b <= INITIAL_BOOKS_END; b++) {
         const bookTests = scheduledRecords.filter(r => r.bookNumber === b);
         const completed = bookTests.filter(r => r.isCompleted).length;
         progress.push({ book: b, completed, total: 4, tests: bookTests });
     }
     return progress;
  }, [scheduledRecords]);

  // Countdown Logic
  useEffect(() => {
    const calculateTime = () => {
      const nextTest = scheduledRecords.find(r => !r.isCompleted);
      if (!nextTest) {
        setStatusMessage("All tests completed!");
        setTimeString("");
        return;
      }

      const now = new Date();
      const target = new Date(nextTest.projectedDate);
      target.setHours(0,0,0,0); // Midnight of test day

      const nowMidnight = new Date(now);
      nowMidnight.setHours(0,0,0,0);

      // Compare dates only first
      if (nowMidnight.getTime() === target.getTime()) {
         setStatusMessage("TODAY");
         setTimeString("Test Day");
         return;
      }

      if (nowMidnight.getTime() > target.getTime()) {
         setStatusMessage("OVERDUE");
         const diff = now.getTime() - target.getTime();
         const days = Math.floor(diff / (1000 * 60 * 60 * 24));
         setTimeString(`${days} days late`);
         return;
      }

      // Future date
      const diff = target.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setStatusMessage("NEXT TEST");
      setTimeString(`${days}d ${hours}h ${minutes}m`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [scheduledRecords]);


  // View logic
  const renderContent = () => {
    if (activeTab === Tab.ANALYTICS) {
        return (
            <div className="p-6 animate-in slide-in-from-right-4 duration-300">
               <Analytics 
                  records={state.records} 
               />
            </div>
        );
    }

    // BOOKS TAB
    if (selectedBook) {
        // Single Book View
        const tests = scheduledRecords.filter(r => r.bookNumber === selectedBook);
        return (
            <div className="p-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setSelectedBook(null)}
                    className="group flex items-center text-slate-500 hover:text-sky-600 font-bold text-sm transition-colors"
                  >
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 group-hover:border-sky-200 shadow-sm transition-all group-hover:bg-sky-50">
                        <ChevronRight className="w-4 h-4 rotate-180 text-slate-600 group-hover:text-sky-600" />
                      </div>
                      Back to Library
                  </button>
                  <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-full border border-sky-100 shadow-sm">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Book {selectedBook}</span>
                     <div className="h-4 w-[1px] bg-slate-200"></div>
                     <span className="text-sm font-bold text-sky-600">
                        {tests.filter(t => t.isCompleted).length} <span className="text-slate-400 text-xs font-medium">/ 4 Tests</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-end space-x-4 mb-8">
                   <h2 className="text-4xl font-serif font-black text-slate-800">Cambridge {selectedBook}</h2>
                   <span className="bg-sky-50 text-sky-600 text-xs font-bold px-2 py-1 rounded mb-2 border border-sky-100">Academic</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {tests.map(test => (
                      <TestCard 
                          key={test.id}
                          record={test}
                          projectedDate={test.projectedDate}
                          onSave={handleSaveScore}
                          onResolve={handleResolve}
                      />
                  ))}
                </div>
            </div>
        );
    }

    // Books Grid View
    return (
        <div className="p-8 pb-24 animate-in fade-in duration-500">
            {/* Completion Estimate Banner */}
            {finishDate && (
               <div className="mb-8 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-sky-200 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                  <div className="relative z-10 flex items-center space-x-4">
                     <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                        <Flag className="w-8 h-8 text-white" />
                     </div>
                     <div>
                        <p className="text-sky-100 text-xs font-bold uppercase tracking-wider mb-1">Target Completion Date</p>
                        <h2 className="text-3xl font-serif font-bold">{finishDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                     </div>
                  </div>
                  <div className="relative z-10 mt-6 md:mt-0 md:text-right">
                      <p className="text-sky-100 text-xs font-bold uppercase tracking-wider mb-1">Total Duration</p>
                      <p className="text-xl font-bold">{Math.max(0, Math.ceil((finishDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} Days Remaining</p>
                  </div>
                  
                  {/* Decor */}
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
               </div>
            )}

            <div className="mb-8 border-b border-sky-100 pb-4">
              <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center">
                <GraduationCap className="w-8 h-8 mr-3 text-sky-500" />
                Cambridge Library
              </h2>
              <p className="text-slate-500 text-sm mt-1 ml-11">Official examination papers from University of Cambridge ESOL Examinations</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                {bookProgress.map((item) => (
                    <div key={item.book} className="flex flex-col items-center">
                        <div className="w-full max-w-[180px] shadow-xl rounded-lg transition-transform duration-300 hover:-translate-y-2">
                           <BookCover 
                              number={item.book} 
                              completedCount={item.completed} 
                              onClick={() => setSelectedBook(item.book)}
                           />
                        </div>
                        {/* Reflection Effect - Sky blue tint */}
                        <div className="w-[90%] h-4 bg-sky-900/10 blur-xl rounded-[100%] mt-2 opacity-40"></div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-sky-50/30 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto min-h-screen bg-white shadow-2xl shadow-sky-100/50 overflow-hidden relative flex flex-col border-x border-slate-50">
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-sky-100 px-8 py-5 sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-200 flex-shrink-0">
                 <CloudSun className="w-7 h-7 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">IELTS Tracker</h1>
                <p className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mt-0.5">Preparation Dashboard</p>
              </div>
            </div>

            {/* Countdown Timer - Centered or right aligned */}
            <div className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl border ${
                statusMessage === 'TODAY' ? 'bg-green-50 border-green-200' : 
                statusMessage === 'OVERDUE' ? 'bg-red-50 border-red-200' : 
                'bg-sky-50 border-sky-100'
            }`}>
                 <div className="flex items-center space-x-1.5">
                    {statusMessage === 'OVERDUE' ? <AlertTriangle className="w-3 h-3 text-red-500" /> : <Timer className="w-3 h-3 text-sky-500" />}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        statusMessage === 'TODAY' ? 'text-green-600' : 
                        statusMessage === 'OVERDUE' ? 'text-red-600' : 
                        'text-sky-600'
                    }`}>{statusMessage}</span>
                 </div>
                 <span className={`font-mono font-bold text-lg leading-none mt-0.5 ${
                    statusMessage === 'TODAY' ? 'text-green-700' : 
                    statusMessage === 'OVERDUE' ? 'text-red-700' : 
                    'text-slate-700'
                 }`}>
                    {timeString}
                 </span>
            </div>

            <div className="flex items-center space-x-4">
               <button 
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700"
                title="Data Settings"
               >
                  <Settings className="w-5 h-5" />
               </button>

               <div className="bg-sky-50 p-2 rounded-full border border-sky-100 hidden sm:block">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                     Me
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-sky-50/10">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-slate-100 safe-area-bottom sticky bottom-0 z-40 shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.02)]">
          <div className="flex justify-center space-x-12 h-16">
            <button 
              onClick={() => setActiveTab(Tab.BOOKS)}
              className={`flex items-center space-x-2 px-6 border-t-[3px] transition-all ${activeTab === Tab.BOOKS ? 'border-sky-500 text-sky-700 bg-sky-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <BookOpen className={`w-5 h-5 ${activeTab === Tab.BOOKS ? 'fill-current opacity-100' : 'opacity-50'}`} />
              <span className="text-sm font-bold font-serif">Library</span>
            </button>
            
            <button 
              onClick={() => setActiveTab(Tab.ANALYTICS)}
              className={`flex items-center space-x-2 px-6 border-t-[3px] transition-all ${activeTab === Tab.ANALYTICS ? 'border-sky-500 text-sky-700 bg-sky-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <BarChart2 className={`w-5 h-5 ${activeTab === Tab.ANALYTICS ? 'fill-current opacity-100' : 'opacity-50'}`} />
              <span className="text-sm font-bold font-serif">Analytics</span>
            </button>
          </div>
        </nav>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center">
                     <Settings className="w-5 h-5 mr-2 text-slate-500" />
                     Data Management
                   </h3>
                   <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="p-6 space-y-4">
                   <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-start">
                      <HardDrive className="w-5 h-5 text-sky-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-sky-900">Local Storage Active</p>
                        <p className="text-xs text-sky-700 mt-1">
                          Your data is safely stored on this device. You can reload freely.
                        </p>
                      </div>
                   </div>

                   <button 
                      onClick={handleExport}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all group"
                   >
                      <div className="flex items-center">
                         <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 mr-3 group-hover:bg-sky-200 group-hover:scale-110 transition-all">
                            <Download className="w-5 h-5" />
                         </div>
                         <div className="text-left">
                            <p className="font-bold text-slate-700 group-hover:text-sky-700">Backup Data</p>
                            <p className="text-xs text-slate-400">Download progress to file</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-400" />
                   </button>

                   <button 
                      onClick={handleImportClick}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group"
                   >
                      <div className="flex items-center">
                         <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 mr-3 group-hover:bg-violet-200 group-hover:scale-110 transition-all">
                            <Upload className="w-5 h-5" />
                         </div>
                         <div className="text-left">
                            <p className="font-bold text-slate-700 group-hover:text-violet-700">Restore Data</p>
                            <p className="text-xs text-slate-400">Upload backup file</p>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400" />
                   </button>
                   <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                   />

                   <div className="pt-4 border-t border-slate-100">
                     <button 
                        onClick={handleReset}
                        className="w-full flex items-center justify-center p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-bold"
                     >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset All Data
                     </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;