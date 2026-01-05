import React from 'react';
import { TestRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TARGET_SCORES, calculateOverall } from '../constants';
import { Brain, TrendingUp, BarChart3, CalendarDays, Hourglass, Target } from 'lucide-react';

interface AnalyticsProps {
  records: TestRecord[];
}

const Analytics: React.FC<AnalyticsProps> = ({ records }) => {
  const completed = records.filter(r => r.isCompleted);
  const resolved = records.filter(r => r.isResolved);

  if (completed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
        <Brain className="w-16 h-16 mb-4 text-sky-200" />
        <p className="text-lg font-medium text-slate-600">No test data available.</p>
        <p className="text-sm">Complete a test in the Library to unlock analytics.</p>
      </div>
    );
  }

  const data = completed.map(r => ({
    name: `B${r.bookNumber}T${r.testNumber}`,
    L: r.calculatedBand.listening,
    R: r.calculatedBand.reading,
    W: r.calculatedBand.writing,
    WT1: r.scores.writingTask1,
    WT2: r.scores.writingTask2,
    Overall: r.calculatedBand.overall,
    date: r.completedDate ? new Date(r.completedDate).getTime() : 0
  })).sort((a, b) => a.date - b.date);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-sky-100 shadow-xl rounded-xl text-sm">
          <p className="font-bold mb-3 text-slate-800 border-b border-sky-50 pb-2">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} style={{ color: entry.color }} className="flex justify-between space-x-6 mb-1.5">
              <span className="font-medium">{entry.name}</span>
              <span className="font-mono font-bold text-base">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const avgOverall = (completed.reduce((acc, curr) => acc + curr.calculatedBand.overall, 0) / completed.length).toFixed(1);
  const avgListening = (completed.reduce((acc, curr) => acc + curr.calculatedBand.listening, 0) / completed.length).toFixed(1);
  const avgReading = (completed.reduce((acc, curr) => acc + curr.calculatedBand.reading, 0) / completed.length).toFixed(1);

  // --- HEATMAP LOGIC ---
  const today = new Date();
  const heatmapData = [];
  for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const count = records.filter(r => r.completedDate && r.completedDate.startsWith(dateString)).length;
      heatmapData.push({ date: d, count: count, label: dateString });
  }

  return (
    <div className="space-y-6 pb-24">
      
      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tests Done</p>
          <div className="flex items-end space-x-2 mt-2">
            <p className="text-3xl font-extrabold text-slate-800">{completed.length}</p>
            <span className="text-sm text-slate-400 font-medium mb-1.5">/ {records.length}</span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-start">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Resolved</p>
              <Target className="w-4 h-4 text-amber-500" />
           </div>
           <div className="mt-2">
            <div className="flex items-baseline space-x-1">
                <p className="text-3xl font-extrabold text-amber-600">{resolved.length}</p>
                <span className="text-xs text-slate-400">/ {completed.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-start">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Avg Overall</p>
              <TrendingUp className="w-4 h-4 text-sky-500" />
           </div>
           <div className="mt-2">
            <p className="text-3xl font-extrabold text-sky-600">{avgOverall}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hidden lg:block">
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Avg L / R</p>
           <div className="mt-2 flex space-x-4">
             <div><span className="text-xs text-sky-500 font-bold">L</span> <span className="text-xl font-bold text-slate-700">{avgListening}</span></div>
             <div><span className="text-xs text-emerald-500 font-bold">R</span> <span className="text-xl font-bold text-slate-700">{avgReading}</span></div>
           </div>
        </div>
      </div>

      {/* HEATMAP */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div className="flex items-center space-x-2 mb-4">
            <CalendarDays className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-slate-800">Study Consistency</h3>
         </div>
         <p className="text-xs text-slate-500 mb-4">Your activity over the last 60 days. Keep the streak alive!</p>
         
         <div className="flex flex-wrap gap-1.5">
            {heatmapData.map((day, idx) => (
                <div 
                    key={idx}
                    title={`${day.label}: ${day.count} tests`}
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-sm transition-all duration-300 hover:scale-125 ${
                        day.count === 0 ? 'bg-slate-100' :
                        day.count === 1 ? 'bg-sky-200' :
                        day.count === 2 ? 'bg-sky-400' :
                        'bg-sky-600'
                    }`}
                ></div>
            ))}
         </div>
         <div className="flex items-center justify-end mt-2 space-x-2">
             <span className="text-[10px] text-slate-400">Less</span>
             <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
             <div className="w-3 h-3 bg-sky-200 rounded-sm"></div>
             <div className="w-3 h-3 bg-sky-400 rounded-sm"></div>
             <div className="w-3 h-3 bg-sky-600 rounded-sm"></div>
             <span className="text-[10px] text-slate-400">More</span>
         </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Skill Progression Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center space-x-2">
                <div className="p-2 bg-slate-50 rounded-lg"><BarChart3 className="w-5 h-5 text-slate-600"/></div>
                <h3 className="font-bold text-slate-800">Skill Progression</h3>
             </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[4, 9]} tickCount={6} width={30} tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#cbd5e1', strokeDasharray: '4 4'}} />
                
                <ReferenceLine y={TARGET_SCORES.listening} stroke="#38bdf8" strokeDasharray="3 3" opacity={0.3} />
                <ReferenceLine y={TARGET_SCORES.reading} stroke="#10b981" strokeDasharray="3 3" opacity={0.3} />
                
                <Line type="monotone" dataKey="L" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{r: 6, strokeWidth: 0}} name="Listening" />
                <Line type="monotone" dataKey="R" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{r: 6, strokeWidth: 0}} name="Reading" />
                <Line type="monotone" dataKey="W" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{r: 6, strokeWidth: 0}} name="Writing Avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-6 space-x-6">
               <div className="flex items-center text-sm font-medium text-slate-600"><div className="w-3 h-3 rounded-full bg-sky-400 mr-2"></div>Listening</div>
               <div className="flex items-center text-sm font-medium text-slate-600"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>Reading</div>
               <div className="flex items-center text-sm font-medium text-slate-600"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>Writing</div>
          </div>
        </div>

        {/* Writing Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <div className="flex items-center space-x-2">
                <div className="p-2 bg-slate-50 rounded-lg"><TrendingUp className="w-5 h-5 text-slate-600"/></div>
                <h3 className="font-bold text-slate-800">Writing Tasks</h3>
             </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[4, 9]} tickCount={6} width={30} tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                
                <Line type="monotone" dataKey="WT1" stroke="#f472b6" strokeWidth={3} dot={{r: 3}} name="Task 1" />
                <Line type="monotone" dataKey="WT2" stroke="#8b5cf6" strokeWidth={3} dot={{r: 3}} name="Task 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
           <div className="flex justify-center mt-6 space-x-6">
               <div className="flex items-center text-sm font-medium text-slate-600"><div className="w-3 h-3 rounded-full bg-pink-400 mr-2"></div>Task 1</div>
               <div className="flex items-center text-sm font-medium text-slate-600"><div className="w-3 h-3 rounded-full bg-violet-500 mr-2"></div>Task 2</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;