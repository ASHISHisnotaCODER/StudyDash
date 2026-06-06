import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload, Calendar, ChevronDown, ChevronUp,
  Save, Share2, Download, Trash2,
  Cloud, Sun, Moon, Palette, Wind,
  CheckCircle2, Plus, X, Zap, BookOpen,
  Target, BarChart2, Brain, Coffee, Star,
  ArrowLeft, Home, Clock, PlusCircle, FileText,
  CheckCheck, Loader2, Sparkles, ChevronRight,
  GraduationCap, TrendingUp, Play, Pause, Square,
  Timer, RotateCcw, MapPin, Flag, Layers, Rocket,
  BookMarked, FlaskConical, ClipboardList, AlertCircle, Settings, Crown, RefreshCw, Menu, Check
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { STUDY_HOURS_DATA, MOTIVATIONAL_QUOTES, DAILY_TASKS_INITIAL } from './data/sampleData';
import { parseSyllabusPDF } from './utils/pdfParser';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Login from './Login';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', fontFamily: 'monospace' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.error && this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0');
const fmtSecs = s => `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  const styles = {
    success: { border:'var(--accent)', icon:<CheckCheck size={15} className="text-[var(--accent)]"/> },
    info:    { border:'#8b5cf6', icon:<Sparkles size={15} className="text-[#8b5cf6]"/> },
    warning: { border:'#f59e0b', icon:<Zap size={15} className="text-[#f59e0b]"/> },
    error:   { border:'#ef4444', icon:<X size={15} className="text-[#ef4444]"/> },
  };
  const s = styles[type] || styles.success;
  return (
    <div className="fixed top-24 right-4 z-[9999] nm-card px-4 py-3 flex items-center gap-3 min-w-[270px] max-w-sm"
      style={{ border:`1px solid ${s.border}`, boxShadow:`0 0 18px color-mix(in srgb, ${s.border} 20%, transparent)`, animation:'toast-in 0.3s ease' }}>
      {s.icon}
      <span className="text-xs font-medium text-[var(--text-secondary)] flex-1">{message}</span>
      <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={12}/></button>
    </div>
  );
}

// ─── Digital Clock ────────────────────────────────────────────────────────────
function DigitalClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(id); }, []);
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div className="flex flex-col">
      <div className="digital-clock text-xl font-bold text-[var(--accent)] glow-accent tracking-widest">
        {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
      </div>
      <div className="text-[9px] text-[var(--text-muted)]">{days[time.getDay()]}, {time.getDate()} {months[time.getMonth()]} {time.getFullYear()}</div>
    </div>
  );
}

// ─── Weather ──────────────────────────────────────────────────────────────────
function WeatherWidget() {
  return (
    <div className="nm-inset flex items-center gap-2 px-3 py-2">
      <div className="relative">
        <Sun size={19} className="text-[#f59e0b]" style={{filter:'drop-shadow(0 0 5px #f59e0b)'}}/>
        <Cloud size={11} className="text-[var(--text-secondary)] absolute -bottom-1 -right-1"/>
      </div>
      <div>
        <div className="text-sm font-bold text-[var(--text-primary)] leading-none">32°C</div>
        <div className="text-[9px] text-[var(--text-muted)]">Partly Cloudy · Kolkata</div>
      </div>
      <div className="flex items-center gap-1 text-[var(--text-muted)]"><Wind size={9}/><span className="text-[9px]">14 km/h</span></div>
    </div>
  );
}

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ value, size=110, strokeWidth=9, color='var(--accent)' }) {
  const r=(size-strokeWidth)/2, circ=2*Math.PI*r, offset=circ-(value/100)*circ;
  return (
    <div className="relative" style={{width:size,height:size}}>
      <svg width={size} height={size} className="-rotate-90 block">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a24" strokeWidth={strokeWidth}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{transition:'stroke-dashoffset 0.8s cubic-bezier(.25,.46,.45,.94)',filter:`drop-shadow(0 0 5px ${color})`}}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-[var(--text-primary)]">{value}%</span>
        <span className="text-[9px] text-[var(--text-muted)]">done</span>
      </div>
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function CountdownWidget({ examDate }) {
  const daysLeft=examDate?Math.max(0,Math.ceil((new Date(examDate)-new Date())/86400000)):0;
  const urgencyColor=daysLeft<=7?'#ef4444':daysLeft<=30?'#f59e0b':'var(--accent)';
  return (
    <div className="nm-card p-5 flex flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[10px] font-semibold uppercase tracking-widest">
        <Target size={11}/> Days Until Exam
      </div>
      <div className="text-6xl font-black digital-clock leading-none"
        style={{color:urgencyColor,filter:`drop-shadow(0 0 18px ${urgencyColor})`}}>
        {daysLeft}
      </div>
      <div className="text-[10px] text-[var(--text-muted)]">
        {examDate?new Date(examDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'No date set'}
      </div>
      {daysLeft<=30&&daysLeft>0&&<div className="text-[10px] font-semibold text-[#f59e0b] nm-inset px-2.5 py-1 rounded-full">⚡ Sprint mode!</div>}
    </div>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject, topicChecks, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const checkedCount=subject.topics.filter((_,i)=>topicChecks[`${subject.id}-${i}`]).length;
  const progress=Math.round((checkedCount/subject.topics.length)*100);
  return (
    <div className="nm-card overflow-hidden flex-shrink-0">
      <button onClick={()=>setExpanded(!expanded)}
        className="w-full p-3.5 flex items-center gap-3 hover:bg-[var(--nm-border)] transition-colors">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{background:subject.color,boxShadow:`0 0 7px ${subject.color}`}}/>
        <div className="flex-1 text-left">
          <div className="font-semibold text-xs text-[var(--text-secondary)]">{subject.name}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{checkedCount}/{subject.topics.length} topics</div>
        </div>
        <span className="text-xs font-bold mr-1" style={{color:subject.color}}>{progress}%</span>
        {expanded?<ChevronUp size={13} className="text-[var(--text-muted)]"/>:<ChevronDown size={13} className="text-[var(--text-muted)]"/>}
      </button>
      <div className="px-3.5 pb-2">
        <div className="progress-track h-1">
          <div className="h-full rounded-full transition-all duration-500"
            style={{width:`${progress}%`,background:subject.color,boxShadow:`0 0 5px ${subject.color}`}}/>
        </div>
      </div>
      {expanded&&(
        <div className="px-3 pb-3">
          <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5" style={{maxHeight:'180px'}}>
            {subject.topics.map((tObj,i)=>{
              const key=`${subject.id}-${i}`;
              const staggerClass = `stagger-${(i % 5) + 1}`;
              
              const topicName = typeof tObj === 'string' ? tObj : tObj.name;
              const difficulty = typeof tObj === 'string' ? 'Medium' : (tObj.difficulty || 'Medium');
              
              let diffColor = '#f59e0b';
              if (difficulty === 'Easy') diffColor = '#10b981';
              if (difficulty === 'Hard') diffColor = '#ef4444';

              return (
                <label key={key} className={`flex items-start gap-3 cursor-pointer group nm-inset px-3 py-2.5 animate-slide-down ${staggerClass}`} style={{opacity:0, animationFillMode:'forwards'}}>
                  <div className="pt-[3px]">
                    <input type="checkbox" className="neo-checkbox" checked={!!topicChecks[key]} onChange={()=>onToggle(key)}/>
                  </div>
                  <div className={`text-xs leading-relaxed transition-colors flex-1 ${topicChecks[key]?'line-through text-[var(--text-muted)]':'text-[var(--text-secondary)]'}`}>
                    <span className="font-bold text-[var(--text-muted)] mr-1.5">{i + 1}.</span>
                    {topicName.includes(':') ? (
                      <>
                        <span className="font-bold text-[13px] mr-1.5 transition-colors" style={topicChecks[key] ? {} : { color: subject.color, textShadow: `0 0 8px ${subject.color}40` }}>
                          {topicName.substring(0, topicName.indexOf(':') + 1)}
                        </span>
                        <span className="group-hover:text-[var(--text-secondary)] transition-colors">{topicName.substring(topicName.indexOf(':') + 1).trim()}</span>
                      </>
                    ) : (
                      <span className="group-hover:text-[var(--text-secondary)] transition-colors">{topicName}</span>
                    )}
                  </div>
                  <div className="pt-[2px] shrink-0">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full nm-inset" style={{ color: diffColor }}>
                      {difficulty}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function StudyHoursChart({ sessions }) {
  const [showEditor, setShowEditor] = useState(false);
  const [targets, setTargets] = useState({ Mon:4, Tue:4, Wed:4, Thu:5, Fri:4, Sat:6, Sun:6 });
  
  // Calculate the current week from Sunday to Saturday
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const date = new Date(now);
    date.setDate(now.getDate() - currentDayOfWeek + i);
    
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    // Sum all session durations (in seconds) for this specific day
    const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    const totalSeconds = (sessions || []).filter(s => isSameDay(new Date(s.start), date)).reduce((acc, s) => acc + s.duration, 0);
    
    return {
      day: dayStr,
      hours: Number((totalSeconds / 3600).toFixed(1)), // Convert to hours
      target: targets[dayStr] || 4
    };
  });

  const TT=({active,payload,label})=>!active||!payload?.length?null:(
    <div className="nm-card px-3 py-2 text-xs border border-[#00f5ff20]">
      <div className="text-[var(--text-secondary)] mb-1">{label}</div>
      {payload.map(p=><div key={p.dataKey} style={{color:p.color}} className="font-semibold">{p.name}: {p.value}h</div>)}
    </div>
  );
  return (
    <div className="nm-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={13} className="text-[var(--accent)]"/>
          <h3 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Study Hours Over Time</h3>
        </div>
        <button onClick={() => setShowEditor(!showEditor)} className="text-[10px] font-bold text-[#8b5cf6] nm-inset px-2.5 py-1 rounded-md hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
          <Settings size={10}/> {showEditor ? 'Done' : 'Edit Targets'}
        </button>
      </div>
      
      {showEditor && (
        <div className="nm-inset p-3 rounded-xl flex flex-wrap gap-2 items-center justify-center animate-slide-down">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-[var(--text-muted)] font-bold">{day}</span>
              <select value={targets[day]} onChange={e => setTargets(p => ({...p, [day]: Number(e.target.value)}))} 
                className="nm-card px-1 py-1 text-[10px] text-[var(--text-secondary)] rounded outline-none bg-transparent cursor-pointer font-bold text-center appearance-none">
                {[1,2,3,4,5,6,7,8,9,10,12,14].map(h => <option key={h} value={h} className="bg-[var(--bg)] text-left">{h}h</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={showEditor ? 140 : 170} className="transition-all duration-300">
        <AreaChart data={chartData} margin={{top:4,right:4,left:-22,bottom:0}}>
          <defs>
            <linearGradient id="hG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-lighter)"/>
          <XAxis dataKey="day" tick={{fill:'#475569',fontSize:9}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:'#475569',fontSize:9}} axisLine={false} tickLine={false}/>
          <Tooltip content={<TT/>}/>
          <Area type="monotone" dataKey="target" name="Target" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#tG)" dot={false}/>
          <Area type="monotone" dataKey="hours" name="Actual" stroke="#00f5ff" strokeWidth={2} fill="url(#hG)"
            dot={{fill:'#00f5ff',r:2.5,strokeWidth:0}} activeDot={{r:4,fill:'#00f5ff',strokeWidth:2,stroke:'var(--bg)'}}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProficiencyRadar({ selectedSubjects, topicChecks }) {
  const data=selectedSubjects.map((s, index)=>{
    const checked=s.topics.filter((_,i)=>topicChecks[`${s.id}-${i}`]).length;
    // Try to find the first word that isn't a number or roman numeral, fallback to full name
    const words = s.name.split(' ').filter(w => w.length > 2 && !/^[0-9.]+$/.test(w));
    let shortName = words.length > 0 ? words[0] : s.name.split(' ')[0];
    
    // If there is a second word, add its first letter to help distinguish (e.g. ELECTRICAL M vs ELECTRICAL H)
    if (words.length > 1) shortName += ' ' + words[1][0];
    if (shortName.length > 12) shortName = shortName.substring(0, 12) + '..';

    // Guarantee uniqueness for Recharts so it never merges identical labels into a single web edge
    shortName += '\u200B'.repeat(index);

    return {subject:shortName.toUpperCase(),value:10+Math.round((checked/s.topics.length)*90),fullMark:100};
  });
  const TT=({active,payload})=>!active||!payload?.length?null:(
    <div className="nm-card px-3 py-2 text-xs border border-[var(--accent)]">
      <div className="text-[var(--accent)] font-semibold">{payload[0].payload.subject}</div>
      <div className="text-[var(--text-secondary)]">{payload[0].value}% proficiency</div>
    </div>
  );
  return (
    <div className="nm-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Brain size={13} className="text-[#8b5cf6]"/>
        <h3 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Proficiency by Subject</h3>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <RadarChart data={data} margin={{top:5,right:25,bottom:5,left:25}}>
          <PolarGrid stroke="var(--bg-lighter)"/>
          <PolarAngleAxis dataKey="subject" tick={{fill:'var(--text-secondary)',fontSize:9}} interval={0}/>
          <PolarRadiusAxis tick={{fill:'var(--text-muted)',fontSize:7}} domain={[0,100]} axisLine={false}/>
          <Radar name="Proficiency" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="var(--accent)" fillOpacity={0.15} dot={{fill:'var(--accent)',r:2.5}}/>
          <Tooltip content={<TT/>}/>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Daily Tasks ──────────────────────────────────────────────────────────────
function DailyTasks({ tasks, setTasks }) {
  const [newTask,setNewTask]=useState('');
  const addTask=()=>{if(!newTask.trim())return;setTasks(p=>[...p,{id:Date.now(),text:newTask.trim(),done:false}]);setNewTask('');};
  const toggle=id=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const remove=id=>setTasks(p=>p.filter(t=>t.id!==id));
  const done=tasks.filter(t=>t.done).length;
  return (
    <div className="nm-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={13} className="text-[#10b981]"/>
        <h3 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Today's Goals</h3>
        <span className="ml-auto text-[10px] nm-inset px-2 py-0.5 text-[#10b981] font-bold">{done}/{tasks.length}</span>
      </div>
      <div className="progress-track h-1.5">
        <div className="h-full rounded-full transition-all duration-500"
          style={{width:`${tasks.length?(done/tasks.length)*100:0}%`,background:'linear-gradient(90deg,#10b981,#34d399)',boxShadow:'0 0 7px rgba(16,185,129,0.5)'}}/>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5" style={{maxHeight:'190px'}}>
        {tasks.map(task=>(
          <div key={task.id} className="flex items-start gap-2 nm-inset px-3 py-2 group">
            <input type="checkbox" className="neo-checkbox mt-0.5 flex-shrink-0" checked={task.done} onChange={()=>toggle(task.id)}/>
            <span className={`text-xs flex-1 leading-relaxed ${task.done?'line-through text-[var(--text-muted)]':'text-[var(--text-secondary)]'}`}>{task.text}</span>
            <button onClick={()=>remove(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[#ef4444] flex-shrink-0"><X size={11}/></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()}
          placeholder="Add a new goal..." className="flex-1 nm-inset px-3 py-2 text-xs text-[var(--text-secondary)] placeholder-slate-600 bg-transparent outline-none"/>
        <button onClick={addTask} className="nm-btn nm-btn-accent p-2 rounded-xl flex items-center justify-center"><Plus size={13}/></button>
      </div>
    </div>
  );
}

// ─── Quote Widget ─────────────────────────────────────────────────────────────
function QuoteWidget() {
  const [idx,setIdx]=useState(()=>Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length));
  const q=MOTIVATIONAL_QUOTES[idx];
  return (
    <div className="nm-card p-4 flex flex-col gap-3 border-glow-violet">
      <div className="flex items-center gap-2">
        <Star size={12} className="text-[#f59e0b]" style={{filter:'drop-shadow(0 0 5px #f59e0b)'}}/>
        <h3 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Daily Inspiration</h3>
        <button onClick={()=>setIdx(i=>(i+1)%MOTIVATIONAL_QUOTES.length)} className="ml-auto nm-btn p-1.5 rounded-lg">
          <Zap size={11} className="text-[#8b5cf6]"/>
        </button>
      </div>
      <div className="nm-inset p-4 flex flex-col gap-2 flex-1">
        <blockquote className="text-sm font-medium text-[var(--text-secondary)] italic leading-relaxed">"{q.quote}"</blockquote>
        <cite className="text-xs text-[#8b5cf6] font-semibold not-italic">— {q.author}</cite>
      </div>
    </div>
  );
}

const getMedalDetails = (hours) => {
  if (hours >= 8) return { name: 'Diamond', bgFrom: '#8b5cf6', bgTo: '#4c1d95', badgeFrom: '#a78bfa', badgeTo: '#6d28d9', icon: Sparkles, message: "Absolute legend! You've achieved the ultra-rare Diamond rank!", shadow: 'rgba(139, 92, 246, 0.5)' };
  if (hours >= 6) return { name: 'Platinum', bgFrom: '#06b6d4', bgTo: '#0891b2', badgeFrom: '#67e8f9', badgeTo: '#0e7490', icon: Zap, message: "Unstoppable! You've unlocked the elite Platinum rank!", shadow: 'rgba(6, 182, 212, 0.5)' };
  if (hours >= 4) return { name: 'Gold', bgFrom: '#fbbf24', bgTo: '#d97706', badgeFrom: '#fde68a', badgeTo: '#b45309', icon: Crown, message: "Outstanding! You've secured the prestigious Gold rank!", shadow: 'rgba(245, 158, 11, 0.5)' };
  if (hours >= 2) return { name: 'Silver', bgFrom: '#94a3b8', bgTo: '#475569', badgeFrom: '#cbd5e1', badgeTo: '#334155', icon: Target, message: "Excellent focus! You've earned the Silver rank!", shadow: 'rgba(148, 163, 184, 0.5)' };
  return { name: 'Bronze', bgFrom: '#b45309', bgTo: '#78350f', badgeFrom: '#fcd34d', badgeTo: '#92400e', icon: Star, message: "Great start! You've claimed the Bronze rank!", shadow: 'rgba(180, 83, 9, 0.5)' };
};

// ─── Weekly Badges Widget ─────────────────────────────────────────────────────
function WeeklyBadgesWidget({ sessions }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const baseDate = new Date(now);
  baseDate.setDate(now.getDate() + (weekOffset * 7));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - currentDayOfWeek + i);
    return d;
  });

  const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const getMedalForHours = (h) => {
    if (h >= 8) return { color: '#8b5cf6', name: 'Diamond', icon: Sparkles };
    if (h >= 6) return { color: '#06b6d4', name: 'Platinum', icon: Zap };
    if (h >= 4) return { color: '#fbbf24', name: 'Gold', icon: Crown };
    if (h >= 2) return { color: '#94a3b8', name: 'Silver', icon: Target };
    if (h >= 1) return { color: '#b45309', name: 'Bronze', icon: Star };
    return null;
  };

  const weekLabel = weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `${Math.abs(weekOffset)} Weeks Ago`;

  return (
    <div className="nm-card p-4 flex flex-col gap-2 col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold flex items-center gap-1.5"><Crown size={12} className="text-[#fbbf24]" fill="currentColor"/> Weekly Badges</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 nm-inset rounded-md"><ArrowLeft size={10}/></button>
          <div className="text-[9px] font-bold px-2 py-0.5 rounded-md text-[var(--accent)] min-w-[65px] text-center">{weekLabel}</div>
          <button onClick={() => setWeekOffset(w => w < 0 ? w + 1 : 0)} disabled={weekOffset === 0} className={`p-1 nm-inset rounded-md transition-colors ${weekOffset === 0 ? 'text-[var(--text-muted)] opacity-50 cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><ChevronRight size={10}/></button>
        </div>
      </div>
      <div className="flex items-center justify-between px-1 py-1 flex-1 overflow-x-auto min-w-0 pb-2" style={{scrollbarWidth: 'none'}}>
        {days.map((date, i) => {
          const totalSecs = (sessions || []).filter(s => isSameDay(new Date(s.start), date)).reduce((a, s) => a + s.duration, 0);
          const hrs = totalSecs / 3600;
          const medal = getMedalForHours(hrs);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const isToday = isSameDay(date, new Date());
          const Icon = medal?.icon;
          
          return (
            <div key={i} className="flex flex-col items-center gap-2 group relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${medal ? 'shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:scale-110 cursor-pointer' : 'nm-inset'}`}
                style={medal ? { background: `linear-gradient(135deg, ${medal.color}dd, ${medal.color})` } : {}}>
                {medal ? <Icon size={14} className="text-white drop-shadow-sm" fill="currentColor"/> : <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] opacity-30"/>}
              </div>
              <span className={`text-[9px] font-bold ${isToday ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{dayName}</span>
              
              {/* Tooltip */}
              {medal && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#09090b] text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 border border-[#27272a]">
                  {medal.name} ({hrs.toFixed(1)}h)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Celebration Modal ────────────────────────────────────────────────────────
function CelebrationModal({ hours, onClose }) {
  const medal = getMedalDetails(hours);
  const Icon = medal.icon;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#09090b99] backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white w-[320px] rounded-[2rem] p-8 flex flex-col items-center text-center shadow-2xl animate-slide-up"
           style={{boxShadow: `0 20px 60px ${medal.shadow}`}}>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-2">
          <X size={18} strokeWidth={3}/>
        </button>

        {/* Dynamic Badge */}
        <div className="relative mb-6 mt-2">
          {/* Ribbons */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-[2px] z-0">
             <div className="w-[30px] h-[55px]" style={{background: `linear-gradient(to bottom, ${medal.badgeFrom}, ${medal.badgeTo})`, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)'}}></div>
             <div className="w-[30px] h-[55px]" style={{background: `linear-gradient(to bottom, ${medal.badgeFrom}, ${medal.badgeTo})`, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)'}}></div>
          </div>
          
          <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center border-4 border-white z-10 relative"
               style={{background: `linear-gradient(to bottom right, ${medal.bgFrom}, ${medal.bgTo})`, boxShadow: `0 10px 25px ${medal.shadow}`}}>
            <div className="absolute inset-1 border-[2px] border-dashed rounded-full opacity-50" style={{borderColor: medal.badgeFrom}}></div>
            <Icon size={46} className="text-white drop-shadow-md z-20" fill="currentColor" strokeWidth={1.5}/>
          </div>
        </div>

        <h2 className="text-[22px] font-black text-[#1e293b] mb-2 font-sans tracking-tight">{medal.name} Unlocked!</h2>
        <p className="text-[12px] text-gray-500 mb-8 font-medium leading-relaxed px-2">
          You've completed <span className="font-bold text-[13px]" style={{color: medal.bgFrom}}>{hours} hour{hours > 1 ? 's' : ''}</span> of deep focus today. {medal.message}
        </p>

        <button onClick={() => {
            alert(`Shared: "I just unlocked the ${medal.name} badge with ${hours} hours of deep study on SemPilot!"`);
            onClose();
          }} 
          className="w-full bg-[#ff5a5f] hover:bg-[#e0484d] text-white py-3.5 rounded-[1rem] font-bold text-sm shadow-[0_8px_20px_rgba(255,90,95,0.3)] transition-transform hover:scale-[1.02] active:scale-95">
          Share Milestone
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STUDY TIMER (Floating) ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function StudyTimer({ sessions, setSessions }) {
  const [isRunning,setIsRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [expanded,setExpanded]=useState(false);
  const startRef=useRef(null);
  const timerRef=useRef(null);

  useEffect(()=>{
    if(isRunning){
      startRef.current=Date.now()-elapsed*1000;
      timerRef.current=setInterval(()=>setElapsed(Math.floor((Date.now()-startRef.current)/1000)),1000);
    } else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  },[isRunning]);

  const handleStop=()=>{
    if(elapsed>5){
      const now=Date.now();
      setSessions(prev=>[{id:now,start:new Date(now-elapsed*1000).toISOString(),end:new Date(now).toISOString(),duration:elapsed},...prev]);
    }
    setIsRunning(false); setElapsed(0);
  };

  const totalToday=sessions
    .filter(s=>new Date(s.start).toDateString()===new Date().toDateString())
    .reduce((a,s)=>a+s.duration,0)+(isRunning?elapsed:0);

  // Milestone for Celebration Popup
  const SECONDS_PER_MILESTONE = 3600;
  
  const prevHoursRef = useRef(Math.floor(totalToday / SECONDS_PER_MILESTONE));
  const [showCelebration, setShowCelebration] = useState(0);

  useEffect(() => {
    const currentHours = Math.floor(totalToday / SECONDS_PER_MILESTONE);
    // Trigger popup exactly when crossing the milestone boundary
    if (currentHours > prevHoursRef.current && currentHours > 0) {
      setShowCelebration(currentHours);
    }
    prevHoursRef.current = currentHours;
  }, [totalToday]);

  return (
    <>
      {showCelebration > 0 && <CelebrationModal hours={showCelebration} onClose={() => setShowCelebration(0)} />}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col items-end gap-2">
        {expanded&&(
        <div className="nm-card border-glow-accent w-72 flex flex-col gap-0 overflow-hidden animate-slide-up"
          style={{boxShadow:'8px 8px 20px var(--nm-shadow-dark),-5px -5px 14px var(--nm-shadow-light),0 0 30px color-mix(in srgb, var(--accent) 8%, transparent)'}}>
          <div className="px-4 py-3 border-b border-[var(--nm-border)] flex items-center gap-2">
            <Timer size={13} className="text-[var(--accent)]"/>
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Study Timer</span>
            <button onClick={()=>setExpanded(false)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><X size={13}/></button>
          </div>
          <div className="px-4 pt-5 pb-3 text-center">
            <div className={`digital-clock font-black leading-none transition-all duration-300 ${isRunning?'text-[var(--accent)] glow-accent':elapsed>0?'text-[#f59e0b]':'text-[var(--text-muted)]'}`}
              style={{fontSize:'3rem'}}>{fmtSecs(elapsed)}</div>
            <div className="text-[9px] text-[var(--text-muted)] mt-1.5 uppercase tracking-widest">
              {isRunning?'● Recording…':elapsed>0?'⏸ Paused':'Ready'}
            </div>
          </div>
          <div className="flex gap-2 px-4 pb-4 justify-center">
            <button onClick={()=>setIsRunning(r=>!r)}
              className={`flex-1 nm-btn py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${isRunning?'nm-btn-violet':'nm-btn-accent'}`}>
              {isRunning?<><Pause size={13}/> Pause</>:<><Play size={13}/> {elapsed>0?'Resume':'Start'}</>}
            </button>
            {elapsed>0&&<>
              <button onClick={handleStop} className="nm-btn py-2.5 px-3 rounded-xl text-[var(--text-secondary)] hover:text-[#10b981] transition-colors" title="Save session"><Square size={14}/></button>
              <button onClick={()=>{setIsRunning(false);setElapsed(0);}} className="nm-btn py-2.5 px-3 rounded-xl text-[var(--text-secondary)] hover:text-[#ef4444] transition-colors" title="Reset"><RotateCcw size={13}/></button>
            </>}
          </div>
          <div className="mx-4 mb-4 nm-inset px-3 py-2.5 flex items-center justify-between">
            <div><div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Total Today</div>
              <div className="text-lg font-black digital-clock text-[#10b981]">{fmtSecs(totalToday)}</div></div>
            <div><div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Sessions</div>
              <div className="text-lg font-black digital-clock text-[#8b5cf6]">
                {sessions.filter(s=>new Date(s.start).toDateString()===new Date().toDateString()).length}
              </div></div>
          </div>
          {sessions.length>0&&(
            <div className="border-t border-[var(--nm-border)] px-4 py-3">
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mb-2">Session History</div>
              <div className="flex flex-col gap-1.5 overflow-y-auto" style={{maxHeight:'140px'}}>
                {sessions.map(s=>(
                  <div key={s.id} className="nm-inset px-3 py-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" style={{boxShadow:'0 0 5px var(--accent)'}}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {new Date(s.start).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} – {new Date(s.end).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                    <div className="digital-clock text-xs font-bold text-[var(--accent)]">{fmtSecs(s.duration)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <button onClick={()=>setExpanded(e=>!e)}
        className={`flex items-center gap-2.5 rounded-2xl transition-all duration-300 shadow-lg ${isRunning?'nm-btn-accent nm-btn py-3 px-4 animate-pulse-accent':'nm-btn py-3 px-4'}`}>
        <Timer size={17} className={isRunning?'text-[var(--bg)]':'text-[var(--accent)]'} style={isRunning?{}:{filter:'drop-shadow(0 0 6px var(--accent))'}}/>
        {isRunning&&<span className="digital-clock text-sm font-black text-[var(--bg)]">{fmtSecs(elapsed)}</span>}
        {!isRunning&&!expanded&&<span className="text-xs text-[var(--text-secondary)] font-medium">Timer</span>}
      </button>
    </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STUDY ROADMAP ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function StudyRoadmap({ examDate, selectedSubjects }) {
  const today=new Date(), exam=new Date(examDate);
  const totalDays=Math.max(1,Math.ceil((exam-today)/86400000));
  const daysLeft=Math.max(0,Math.ceil((exam-today)/86400000));
  const subjectList=[...selectedSubjects];
  const half=Math.ceil(subjectList.length/2);

  const buildPhases=()=>{
    if(totalDays>=90) return [
      {name:'Foundation',      icon:BookMarked,   color:'#06b6d4',ratio:0.25,desc:'Build core concepts & theory',    subjects:subjectList.slice(0,2)},
      {name:'Deep Study',      icon:Layers,       color:'#8b5cf6',ratio:0.30,desc:'Master advanced topics',          subjects:subjectList.slice(2,4)},
      {name:'Problem Practice',icon:FlaskConical, color:'#f472b6',ratio:0.25,desc:'Solve PYQs & exercises',          subjects:subjectList.slice(0,half)},
      {name:'Revision',        icon:RotateCcw,    color:'#10b981',ratio:0.12,desc:'Rapid revision all subjects',     subjects:subjectList},
      {name:'Mock Tests',      icon:ClipboardList,color:'#f59e0b',ratio:0.08,desc:'Full mock & final prep',          subjects:[]},
    ];
    if(totalDays>=45) return [
      {name:'Core Concepts',   icon:BookMarked,   color:'#06b6d4',ratio:0.30,desc:'Focus on fundamentals',          subjects:subjectList.slice(0,half)},
      {name:'Advanced Topics', icon:Brain,        color:'#8b5cf6',ratio:0.30,desc:'Complex topics & derivations',   subjects:subjectList.slice(half)},
      {name:'Practice',        icon:FlaskConical, color:'#f472b6',ratio:0.25,desc:'Intensive problem solving',      subjects:subjectList.slice(0,half)},
      {name:'Revision+Mock',   icon:Rocket,       color:'#10b981',ratio:0.15,desc:'Full revision & mock tests',     subjects:subjectList},
    ];
    if(totalDays>=20) return [
      {name:'Quick Revision',  icon:RotateCcw,    color:'#f59e0b',ratio:0.40,desc:'Revisit all key topics fast',   subjects:subjectList},
      {name:'Practice Tests',  icon:FlaskConical, color:'#f472b6',ratio:0.35,desc:'PYQs & topic-wise tests',       subjects:subjectList},
      {name:'Final Sprint',    icon:Rocket,       color:'#10b981',ratio:0.25,desc:'Mock tests & weak area focus',  subjects:[]},
    ];
    return [
      {name:'Emergency Revision',icon:RotateCcw,  color:'#ef4444',ratio:0.50,desc:'High-yield topics only',       subjects:subjectList},
      {name:'Final Mock',        icon:Rocket,     color:'#f59e0b',ratio:0.50,desc:'Mock tests & formulae revision',subjects:[]},
    ];
  };
  const phases=buildPhases();
  let cursor=0;
  const phaseData=phases.map(ph=>{
    const startDay=Math.round(cursor), endDay=Math.round(cursor+ph.ratio*totalDays);
    cursor=endDay;
    const sd=new Date(today); sd.setDate(today.getDate()+startDay);
    const ed=new Date(today); ed.setDate(today.getDate()+endDay-1);
    return {...ph,startDay,endDay,startDate:sd,endDate:ed};
  });
  const daysDone=totalDays-daysLeft;
  const safeIdx=Math.max(0,phaseData.findIndex(p=>daysDone>=p.startDay&&daysDone<p.endDay));
  const fmt=d=>d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});

  return (
    <div className="nm-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-[#f472b6]" style={{filter:'drop-shadow(0 0 5px #f472b6)'}}/>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Study Roadmap</h3>
        </div>
        <div className="nm-inset px-2.5 py-1 flex items-center gap-1.5">
          <Flag size={10} className="text-[#f59e0b]"/>
          <span className="text-[10px] text-[var(--text-secondary)]">Exam in <span className="text-[#f59e0b] font-bold">{daysLeft}</span> days</span>
        </div>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden">
        {phaseData.map((ph,i)=>(
          <div key={i} className="h-full transition-all duration-700"
            style={{width:`${ph.ratio*100}%`,background:ph.color,opacity:i<=safeIdx?1:0.2}}/>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {phaseData.map((ph,i)=>{
          const Icon=ph.icon, isCurrent=i===safeIdx, isPast=i<safeIdx;
          return (
            <div key={i} className="nm-inset p-3 flex items-start gap-3 transition-all duration-300"
              style={isCurrent?{boxShadow:`inset 4px 4px 10px var(--nm-shadow-dark),inset -3px -3px 8px var(--nm-shadow-light),0 0 12px ${ph.color}20`}:{}}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 nm-card"
                style={{background:isCurrent?`${ph.color}15`:''}}>
                <Icon size={14} style={{color:isPast?'#475569':ph.color,filter:isCurrent?`drop-shadow(0 0 4px ${ph.color})`:'none'}}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${isPast?'text-[var(--text-muted)]':'text-[var(--text-secondary)]'}`}>{ph.name}</span>
                  {isCurrent&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:`${ph.color}20`,color:ph.color}}>● You are here</span>}
                  {isPast&&<span className="text-[9px] text-[var(--text-muted)]">Completed</span>}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{ph.desc}</div>
                <div className="text-[9px] text-[var(--text-muted)] mt-1">{fmt(ph.startDate)} → {fmt(ph.endDate)} · {Math.round(ph.ratio*totalDays)} days</div>
                {ph.subjects.length>0&&(
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {ph.subjects.slice(0,4).map(s=>(
                      <span key={s.id} className="text-[9px] nm-inset px-1.5 py-0.5 font-medium" style={{color:isPast?'#475569':s.color}}>
                        {s.name.split(' ')[0]}
                      </span>
                    ))}
                    {ph.subjects.length>4&&<span className="text-[9px] text-[var(--text-muted)] nm-inset px-1.5 py-0.5">+{ph.subjects.length-4}</span>}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[10px] font-bold digital-clock" style={{color:isPast?'#475569':ph.color}}>{Math.round(ph.ratio*totalDays)}d</div>
                <div className="text-[9px] text-[var(--text-muted)]">{Math.round(ph.ratio*100)}%</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="nm-inset px-4 py-3 flex items-center gap-3">
        <Rocket size={13} className="text-[#f59e0b] flex-shrink-0" style={{filter:'drop-shadow(0 0 5px #f59e0b)'}}/>
        <div className="text-[10px] text-[var(--text-secondary)]">
          <span className="text-[var(--text-primary)] font-semibold">Daily target: </span>
          {totalDays>0?`${Math.max(3,Math.round(selectedSubjects.reduce((a,s)=>a+s.topics.length,0)*0.3/totalDays*60))} min/subject · ${Math.max(4,Math.min(10,Math.round(200/totalDays)))}h total`:'Set your exam date'}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── UPLOAD SCREEN (with real PDF parsing) ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function UploadScreen({ onParsed }) {
  const [dragging,     setDragging]     = useState(false);
  const [file,         setFile]         = useState(null);
  const [examDate,     setExamDate]     = useState('');
  const [examName,     setExamName]     = useState('');
  const [phase,        setPhase]        = useState('idle'); // 'idle'|'parsing'|'error'
  const [parseSteps,   setParseSteps]   = useState([]);
  const [parseProgress,setParseProgress]= useState(0);
  const [parseError,   setParseError]   = useState('');

  const UI_STEPS = [
    'Loading PDF document…',
    'Extracting text layers…',
    'Detecting subject headers…',
    'Mapping topic hierarchies…',
    'Analysing difficulty weights…',
    'Building dependency graph…',
    'Generating study timeline…',
  ];

  const handleFile = useCallback(f => {
    if (f && f.type === 'application/pdf') { setFile(f); setParseError(''); setPhase('idle'); }
  }, []);
  const handleDrop = e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleParse = async () => {
    if (!file || !examDate || !examName.trim()) return;
    setPhase('parsing'); setParseSteps([]); setParseProgress(0); setParseError('');
    let stepIdx = 0;
    const ticker = setInterval(() => {
      setParseProgress(prev => {
        if (stepIdx < UI_STEPS.length) {
          setParseSteps(ps => [...ps, UI_STEPS[stepIdx]]);
          stepIdx++;
          return Math.round((stepIdx / (UI_STEPS.length + 2)) * 100);
        }
        return prev < 95 ? prev + 1 : prev;
      });
    }, 600);
    try {
      const subjects = await parseSyllabusPDF(file);
      clearInterval(ticker);
      if (!subjects || subjects.length === 0) {
        setParseError('No subjects could be extracted. Make sure the PDF contains selectable text (not a scanned image).');
        setPhase('error'); return;
      }
      setParseSteps(prev => [...prev, `✓ Analysis complete — ${subjects.length} subjects, ${subjects.reduce((a,s)=>a+s.topics.length,0)} topics found`]);
      setParseProgress(100);
      setTimeout(() => onParsed(file, examDate, examName.trim(), subjects), 700);
    } catch (err) {
      clearInterval(ticker);
      setParseError(`Parsing failed: ${err.message || 'Unknown error'}. Try a different PDF.`);
      setPhase('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 relative"
      style={{background:'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, var(--bg) 60%)'}}>
      <ParticleBackground />

      <div className="text-center animate-fade-in relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 nm-card flex items-center justify-center border-glow-accent">
            <GraduationCap size={20} className="text-[var(--accent)]"/>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Sem<span className="text-[var(--accent)] glow-accent">Pilot</span></h1>
        </div>
        <p className="text-[var(--text-muted)] text-sm">Your personalized exam preparation command center</p>
      </div>

      <div className="w-full max-w-lg animate-slide-up relative z-10">
        <div className="nm-card p-7 flex flex-col gap-5">

          {/* Parsing Phase */}
          {phase === 'parsing' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Loader2 size={16} className="text-[var(--accent)] animate-spin"/>
                <span className="text-sm font-semibold text-[var(--text-secondary)]">Analysing syllabus PDF…</span>
              </div>
              <div className="progress-track h-3">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{width:`${parseProgress}%`,background:'var(--accent)',boxShadow:'0 0 12px color-mix(in srgb, var(--accent) 60%, transparent)'}}/>
              </div>
              <div className="text-right text-xs text-[var(--accent)] font-bold digital-clock">{parseProgress}%</div>
              <div className="nm-inset p-3 flex flex-col gap-1.5 overflow-y-auto" style={{maxHeight:'160px'}}>
                {parseSteps.map((step,i)=>(
                  <div key={i} className="flex items-center gap-2 animate-fade-in">
                    <CheckCheck size={11} className="text-[#10b981] flex-shrink-0"/>
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono">{step}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] text-center">Parsing: <span className="text-[var(--accent)]">{file?.name}</span></div>
            </div>
          )}

          {/* Error Phase */}
          {phase === 'error' && (
            <div className="flex flex-col gap-4">
              <div className="nm-inset p-4 border border-[#ef444430] flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-[#ef4444] flex-shrink-0"/>
                  <span className="text-sm font-semibold text-[#ef4444]">Extraction Failed</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{parseError}</p>
              </div>
              <button onClick={()=>{setPhase('idle');setParseSteps([]);setParseProgress(0);}}
                className="nm-btn py-2.5 px-5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-colors flex items-center justify-center gap-2">
                <RotateCcw size={13}/> Try Again
              </button>
            </div>
          )}

          {/* Idle Phase */}
          {(phase === 'idle') && (
            <>
              {/* Dropzone */}
              <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 nm-inset
                  ${dragging?'dropzone-active':'border-[var(--accent)]'}`}
                onClick={()=>document.getElementById('file-input').click()}>
                <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={e=>handleFile(e.target.files[0])}/>
                {file ? (
                  <>
                    <div className="w-14 h-14 nm-card flex items-center justify-center border-glow-accent"><FileText size={24} className="text-[var(--accent)]"/></div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-[var(--text-secondary)]">{file.name}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{(file.size/1024).toFixed(1)} KB · PDF Ready</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#10b981] font-semibold nm-inset px-3 py-1 rounded-full">
                      <CheckCheck size={12}/> File selected
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 nm-card flex items-center justify-center border-glow-accent animate-pulse-accent"><Upload size={24} className="text-[var(--accent)]"/></div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-[var(--text-secondary)]">Drop your Syllabus PDF here</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">or click to browse · PDF only</div>
                    </div>
                    <div className="flex gap-3 text-[10px] text-[var(--text-muted)]">
                      <span>• GATE Syllabus</span><span>• University Exam</span><span>• Custom PDF</span>
                    </div>
                  </>
                )}
              </div>
              {/* Exam Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={11} className="text-[var(--accent)]"/> Exam Name
                </label>
                <input type="text" placeholder="e.g. GATE 2026, Semester 6" value={examName} onChange={e=>setExamName(e.target.value)}
                  className="nm-inset px-4 py-2.5 text-sm text-[var(--text-secondary)] bg-transparent outline-none w-full placeholder:text-[var(--text-muted)]"/>
              </div>
              {/* Date Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={11} className="text-[#8b5cf6]"/> Target Exam Date
                </label>
                <input type="date" value={examDate} onChange={e=>setExamDate(e.target.value)}
                  className="nm-inset px-4 py-2.5 text-sm text-[var(--text-secondary)] bg-transparent outline-none w-full" />
              </div>
              <button onClick={handleParse} disabled={!file||!examDate||!examName.trim()}
                className={`nm-btn nm-btn-accent py-3 px-6 text-sm font-bold rounded-2xl w-full transition-all ${(!file||!examDate||!examName.trim())?'opacity-40 cursor-not-allowed':'hover:scale-[1.02]'}`}>
                <span className="flex items-center justify-center gap-2"><Sparkles size={14}/> Analyse Syllabus</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center animate-fade-in">
        {[{icon:BarChart2,text:'Analytics',color:'var(--accent)'},{icon:Target,text:'Goal Tracking',color:'#8b5cf6'},
          {icon:Timer,text:'Study Timer',color:'#10b981'},{icon:MapPin,text:'Roadmap',color:'#f472b6'}].map(({icon:Icon,text,color})=>(
          <div key={text} className="nm-card px-3 py-2 flex items-center gap-2">
            <Icon size={12} style={{color}}/><span className="text-xs text-[var(--text-secondary)]">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Subject Modal ────────────────────────────────────────────────────────────
function SubjectModal({ subjects, onGenerate, onClose }) {
  const [selected, setSelected] = useState(() => new Set(subjects.map(s => s.id)));
  const [search,   setSearch]   = useState('');
  const filtered    = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const toggle      = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const totalTopics = subjects.reduce((a, s) => a + s.topics.length, 0);

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
      <div className="nm-card border-glow-accent w-full max-w-2xl animate-slide-up max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[var(--nm-border)] flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2"><Brain size={14} className="text-[var(--accent)]"/>Select Subjects from PDF</h2>
            <p className="text-[var(--text-muted)] text-[10px] mt-1">
              Extracted <span className="text-[var(--accent)] font-bold">{subjects.length}</span> subjects · <span className="text-[var(--accent)] font-bold">{totalTopics}</span> total topics from your PDF
            </p>
          </div>
          <button onClick={onClose} className="nm-btn p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={14}/></button>
        </div>
        {/* Search + Controls */}
        <div className="px-5 py-3 flex gap-2 items-center flex-shrink-0 border-b border-[var(--nm-border)]">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subjects..."
            className="flex-1 nm-inset px-3 py-2 text-xs text-[var(--text-secondary)] placeholder-slate-600 bg-transparent outline-none"/>
          <button onClick={()=>setSelected(new Set(subjects.map(s=>s.id)))} className="text-[10px] text-[var(--accent)] nm-inset px-2.5 py-2 rounded-lg">All</button>
          <button onClick={()=>setSelected(new Set())} className="text-[10px] text-[var(--text-muted)] nm-inset px-2.5 py-2 rounded-lg">None</button>
        </div>
        {/* Subject Grid */}
        <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-1">
          {filtered.length === 0 && <div className="col-span-2 text-center py-8 text-[var(--text-muted)] text-xs">No subjects match your search</div>}
          {filtered.map(s => (
            <button key={s.id} onClick={()=>toggle(s.id)}
              className={`nm-btn p-3 flex items-center gap-3 text-left transition-all duration-200 ${selected.has(s.id)?'border-glow-accent':''}`}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{background:selected.has(s.id)?s.color:'var(--bg-lighter)',boxShadow:selected.has(s.id)?`0 0 7px ${s.color}`:'none'}}/>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold truncate ${selected.has(s.id)?'text-[var(--text-primary)]':'text-[var(--text-secondary)]'}`}>{s.name}</div>
                <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{s.topics.length} topic{s.topics.length!==1?'s':''}</div>
              </div>
              {selected.has(s.id)&&<CheckCheck size={11} className="text-[var(--accent)] flex-shrink-0"/>}
            </button>
          ))}
        </div>
        {/* Footer */}
        <div className="p-5 pt-3 border-t border-[var(--nm-border)] flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-[var(--text-muted)]">{selected.size} of {subjects.length} selected</span>
          <button onClick={()=>{if(selected.size===0)return;onGenerate(subjects.filter(s=>selected.has(s.id)));}}
            disabled={selected.size===0}
            className={`nm-btn nm-btn-accent py-2.5 px-5 text-xs font-bold rounded-xl flex items-center gap-2 ${selected.size===0?'opacity-40 cursor-not-allowed':''}`}>
            <Sparkles size={12}/> Generate Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ theme, setTheme }) {
  return (
    <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      className="nm-raised p-1 rounded-full flex items-center transition-all duration-300 hover:scale-[1.02]"
      style={{ width: '90px', height: '28px' }}>
      <div className="w-full h-full nm-inset rounded-full flex items-center px-1 relative">
        <div className={`absolute w-[20px] h-[20px] rounded-full flex items-center justify-center transition-all duration-500 z-10 ${theme === 'dark' ? 'left-1 bg-[#f6f8f9]' : 'left-[calc(100%-24px)] bg-[#2b3544]'} shadow-[0_2px_5px_rgba(0,0,0,0.2)]`}>
          <div className="relative w-full h-full flex items-center justify-center transition-transform duration-500" style={{ transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(360deg)' }}>
            {theme === 'dark' ? <Moon size={11} className="text-[#1a1c23] fill-current" /> : <Sun size={11} className="text-white fill-current" />}
          </div>
        </div>
        <div className="w-full flex justify-between px-1.5 text-[8px] font-bold tracking-widest z-0 select-none">
          <span className={`transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100 text-[var(--text-primary)] ml-6' : 'opacity-0 absolute'}`}>DARK</span>
          <span className={`transition-opacity duration-300 ${theme === 'light' ? 'opacity-100 text-[#2b3544] mr-6' : 'opacity-0 absolute'}`}>LIGHT</span>
        </div>
      </div>
    </button>
  );
}

// ─── Settings Sidebar ─────────────────────────────────────────────────────────
function SettingsSidebar({ isOpen, onClose, accentColor, setAccentColor, onLoginClick }) {
  const { currentUser, logout } = useAuth();
  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-[280px] bg-[var(--bg)] z-[101] shadow-[-10px_0_30px_rgba(0,0,0,0.2)] transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="p-5 flex items-center justify-between border-b border-[var(--nm-border)]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Preferences</h2>
          </div>
          <button onClick={onClose} className="nm-btn p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14}/></button>
        </div>
        <div className="p-6 flex flex-col gap-8">

          <div className="flex flex-col gap-5">
            <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} className="text-[var(--accent)]"/> Theme Color
            </label>
            <div className="flex gap-4 relative w-full justify-center px-2">
              {['var(--color-cyan)','var(--color-purple)','var(--color-pink)','var(--color-emerald)','var(--color-amber)'].map(c => {
                const isSelected = accentColor === c;
                return (
                  <button key={c} onClick={() => setAccentColor(c)}
                    className="relative w-11 h-11 rounded-[14px] flex items-center justify-center group transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                      background: isSelected ? c : 'var(--bg)',
                      boxShadow: isSelected 
                        ? `0 0 20px color-mix(in srgb, ${c} 60%, transparent), inset 0 2px 5px rgba(255,255,255,0.4)` 
                        : 'inset 4px 4px 10px var(--nm-shadow-dark), inset -3px -3px 8px var(--nm-shadow-light)',
                      transform: isSelected ? 'scale(1.15) translateY(-3px)' : 'scale(1)'
                    }}>
                    
                    {/* Inner Check Icon */}
                    <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSelected ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'}`}>
                      <Check size={18} strokeWidth={3} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"/>
                    </div>

                    {/* Unselected Inner Color Dot */}
                    <div className={`absolute inset-0 m-auto w-3 h-3 rounded-full transition-all duration-300 ${isSelected ? 'scale-0 opacity-0' : 'scale-100 opacity-100 group-hover:scale-150'}`}
                      style={{ backgroundColor: c, boxShadow: `0 0 10px ${c}` }} />
                      
                    {/* Hover Glow Ring */}
                    <div className="absolute inset-[-4px] rounded-[18px] border-2 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-110 group-hover:scale-100 pointer-events-none"
                      style={{ borderColor: c, opacity: isSelected ? 0 : '' }} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto border-t border-[var(--nm-border)] pt-6 flex flex-col gap-4">
            <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Account</label>
            {currentUser ? (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-[var(--text-primary)] px-2 py-1 bg-[var(--nm-inset)] rounded-md border border-[var(--nm-border)] text-center break-all">
                  {currentUser.email}
                </div>
                <button onClick={logout} className="nm-btn p-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-500 transition-colors w-full flex justify-center">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-4">
                <div className="text-xs text-[var(--text-muted)] text-center">
                  You are currently using SemPilot as a Guest. Log in to sync your data.
                </div>
                <button onClick={onLoginClick} className="nm-btn p-2.5 rounded-xl text-xs font-bold text-[var(--accent)] hover:text-white transition-colors w-full flex justify-center">
                  Log In or Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────
function DashboardHeader({ title, onBack, onSave, onShare, onDownload, onDelete, onOpenSettings, theme, setTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="nm-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 relative">
      {/* Left Group */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} id="btn-home"
            className="nm-btn p-2.5 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex-shrink-0">
            <Home size={14}/>
          </button>
          <div className="w-px h-5 bg-[var(--nm-border)] hidden sm:block"/>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 nm-card flex items-center justify-center border-glow-accent flex-shrink-0">
              <GraduationCap size={13} className="text-[var(--accent)]"/>
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">SemPilot</div>
              <div className="text-[9px] text-[var(--text-muted)] max-w-[120px] sm:max-w-[150px] truncate">{title}</div>
            </div>
          </div>
        </div>
        
        {/* Mobile Hamburger Button */}
        <button className="sm:hidden nm-btn p-2 rounded-xl text-[var(--text-secondary)]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={16}/> : <Menu size={16}/>}
        </button>
      </div>

      {/* Right Group */}
      <div className={`${isMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3 sm:gap-2 w-full sm:w-auto`}>
        <div className="hidden sm:block"><DigitalClock/></div>
        <div className="w-px h-5 bg-[var(--nm-border)] hidden sm:block mx-1"/>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button onClick={onOpenSettings} className="nm-btn p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            <Settings size={15}/>
          </button>
        </div>

        <div className="w-px h-5 bg-[var(--nm-border)] hidden sm:block mx-1"/>
        
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0">
          {[
            {id:'btn-save',    title:'Save',        icon:Save,     action:onSave,     hover:'var(--accent)'},
            {id:'btn-share',   title:'Share',        icon:Share2,   action:onShare,    hover:'var(--accent)'},
            {id:'btn-download',title:'Download PDF', icon:Download, action:onDownload, hover:'#10b981'},
            {id:'btn-delete',  title:'Delete',       icon:Trash2,   action:onDelete,   hover:'#ef4444'},
          ].map(({id,title,icon:Icon,action,hover})=>(
            <button key={id} id={id} onClick={action} title={title} className="nm-btn p-2 rounded-xl group flex-1 sm:flex-none flex justify-center"
              onMouseEnter={e=>e.currentTarget.querySelector('svg').style.color=hover}
              onMouseLeave={e=>e.currentTarget.querySelector('svg').style.color=''}>
              <Icon size={13} className="text-[var(--text-secondary)] transition-colors"/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Full Dashboard ───────────────────────────────────────────────────────────
function Dashboard({ db, onUpdate, onBack, onDelete, onOpenSettings, theme, setTheme }) {
  const {selectedSubjects,examDate,fileName}=db;
  const [topicChecks,setTopicChecks]=useState(db.topicChecks||{});
  const [tasks,setTasks]=useState(db.tasks||DAILY_TASKS_INITIAL);
  const [sessions,setSessions]=useState(db.sessions||[]);
  const [toast,setToast]=useState(null);

  useEffect(()=>{onUpdate({topicChecks,tasks,sessions});},[topicChecks,tasks,sessions]);

  const showToast=(m,t='success')=>setToast({message:m,type:t,id:Date.now()});
  const toggleTopic=k=>setTopicChecks(prev=>({...prev,[k]:!prev[k]}));

  const totalTopics=selectedSubjects.reduce((a,s)=>a+s.topics.length,0);
  const checkedTopics=selectedSubjects.reduce((a,s)=>a+s.topics.filter((_,i)=>topicChecks[`${s.id}-${i}`]).length,0);
  const overallProgress=totalTopics?Math.round((checkedTopics/totalTopics)*100):0;
  
  const safeName = db.examName || db.fileName || 'Syllabus';
  const title=`${safeName.replace('.pdf','').toUpperCase()} · ${selectedSubjects?.length || 0} subjects`;

  const calculateCurrentMins = () => {
    let uncompletedMins = 0;
    selectedSubjects.forEach(s => s.topics.forEach((t, i) => {
      if (!topicChecks[`${s.id}-${i}`]) {
        const diff = typeof t === 'string' ? 'Medium' : (t.difficulty || 'Medium');
        uncompletedMins += diff === 'Easy' ? 30 : diff === 'Hard' ? 90 : 60;
      }
    }));
    const remainingDays = examDate ? Math.max(1, Math.ceil((new Date(examDate) - new Date()) / 86400000)) : 1;
    return Math.round(uncompletedMins / remainingDays);
  };
  const currentDailyMinutes = calculateCurrentMins();
  
  const baseMins = db.baseDailyMinutes || (() => {
    let m = 0;
    selectedSubjects.forEach(s => s.topics.forEach(t => {
      const diff = typeof t === 'string' ? 'Medium' : (t.difficulty || 'Medium');
      m += diff === 'Easy' ? 30 : diff === 'Hard' ? 90 : 60;
    }));
    const d = examDate ? Math.max(1, Math.ceil((new Date(examDate) - new Date(db.createdAt || Date.now())) / 86400000)) : 1;
    return Math.round(m / d);
  })();

  const [showRescheduleBanner, setShowRescheduleBanner] = useState(true);
  const showBanner = showRescheduleBanner && baseMins && currentDailyMinutes > baseMins + 5;

  return (
    <div className="min-h-screen p-3 flex flex-col gap-3"
      style={{background:'radial-gradient(ellipse at 70% 0%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, var(--bg) 55%)'}}>
      {toast&&<Toast key={toast.id} message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      <StudyTimer sessions={sessions} setSessions={setSessions}/>
      <DashboardHeader title={title} onBack={onBack} onOpenSettings={onOpenSettings} theme={theme} setTheme={setTheme}
        onSave={()=>showToast('Dashboard saved!','success')}
        onShare={()=>showToast('Share link copied!','info')}
        onDownload={()=>showToast('Preparing PDF download…','success')}
        onDelete={()=>{if(window.confirm('Delete this dashboard?'))onDelete();}}/>
        
      {/* Dynamic Rescheduling Banner */}
      {showBanner && (
        <div className="nm-card p-4 mx-1 flex items-center justify-between animate-fade-in" style={{border: '1px solid #f59e0b40', background: 'color-mix(in srgb, #f59e0b 8%, transparent)'}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: '#f59e0b20'}}>
              <RefreshCw size={14} className="text-[#f59e0b] animate-spin-slow"/>
            </div>
            <div>
              <div className="text-sm font-bold text-[#f59e0b]">Plan Dynamically Updated</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                You've missed some targets. To ensure you finish before the exam, your daily target has increased by <span className="font-bold text-[var(--text-primary)]">{currentDailyMinutes - baseMins} mins</span>.
              </div>
            </div>
          </div>
          <button onClick={() => setShowRescheduleBanner(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2"><X size={14}/></button>
        </div>
      )}

      {/* Row 1 — Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <WeeklyBadgesWidget sessions={sessions} />
        <CountdownWidget examDate={examDate}/>
        <div className="nm-card p-5 flex flex-col items-center justify-center gap-2 text-center">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold">Overall Completion</div>
          <CircularProgress value={overallProgress} color="var(--accent)"/>
          <div className="text-[10px] text-[var(--text-muted)]">{checkedTopics}/{totalTopics} topics</div>
        </div>
        <div className="nm-card p-4 flex flex-col gap-2">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold mb-1">Quick Stats</div>
          {[
            {label:'Subjects',value:selectedSubjects.length,color:'var(--accent)'},
            {label:'Topics Done',value:checkedTopics,color:'#10b981'},
            {label:'Tasks Today',value:`${tasks.filter(t=>t.done).length}/${tasks.length}`,color:'#8b5cf6'},
          ].map(({label,value,color})=>(
            <div key={label} className="nm-inset px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
              <span className="text-xs font-bold" style={{color}}>{value}</span>
            </div>
          ))}
        </div>
        <div className="nm-card p-4 flex flex-col gap-2">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold mb-1">By Subject</div>
          {selectedSubjects.slice(0,4).map(s=>{
            const ck=s.topics.filter((_,i)=>topicChecks[`${s.id}-${i}`]).length;
            const pct=Math.round((ck/s.topics.length)*100);
            return (
              <div key={s.id}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] text-[var(--text-muted)] truncate max-w-[80px]">{s.name.split(' ')[0]}</span>
                  <span className="text-[9px] font-bold" style={{color:s.color}}>{pct}%</span>
                </div>
                <div className="progress-track h-1">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{width:`${pct}%`,background:s.color,boxShadow:`0 0 4px ${s.color}`}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Row 2 — Roadmap */}
      <StudyRoadmap examDate={examDate} selectedSubjects={selectedSubjects}/>
      {/* Row 3 — Subject Tracker + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <BookOpen size={12} className="text-[var(--accent)]"/>
            <h2 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Subject Tracker</h2>
            <span className="text-[9px] text-[var(--text-muted)] ml-auto">Tap to expand</span>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto" style={{maxHeight:'520px'}}>
            {selectedSubjects.map(s=>(
              <SubjectCard key={s.id} subject={s} topicChecks={topicChecks} onToggle={toggleTopic}/>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-3">
          <StudyHoursChart sessions={sessions}/>
          <ProficiencyRadar selectedSubjects={selectedSubjects} topicChecks={topicChecks}/>
        </div>
      </div>
      {/* Row 4 — Tasks + Quote */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DailyTasks tasks={tasks} setTasks={setTasks}/>
        <QuoteWidget/>
      </div>
    </div>
  );
}

// ─── Particle Background ──────────────────────────────────────────────────────
function ParticleBackground() {
  const particles = React.useMemo(() => {
    return Array.from({length: 30}).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100 + 10,
      opacity: Math.random() * 0.4 + 0.1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -30,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[0]">
      <div className="absolute top-[10%] left-[20%] w-64 h-64 rounded-full mix-blend-screen animate-pulse-slow pointer-events-none" 
           style={{background:'var(--accent)', filter:'blur(120px)', opacity:0.15}}></div>
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full mix-blend-screen animate-pulse-slow pointer-events-none" 
           style={{background:'var(--accent)', filter:'blur(150px)', opacity:0.15, animationDelay:'4s'}}></div>
      
      {particles.map(p => (
        <div key={p.id} 
             className="absolute rounded-full animate-float"
             style={{
               width: p.size + 'px',
               height: p.size + 'px',
               left: p.left + '%',
               top: p.top + '%',
               background: 'var(--accent)',
               boxShadow: '0 0 10px var(--accent), 0 0 20px var(--accent)',
               animationDuration: `${p.duration}s`,
               animationDelay: `${p.delay}s`,
               '--max-opacity': p.opacity,
             }}
        />
      ))}
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ dashboards, onOpen, onDelete, onCreateNew, onOpenSettings, theme, setTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fmt=d=>new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  return (
    <div className="min-h-screen p-3 sm:p-5 flex flex-col gap-4 sm:gap-5 relative"
      style={{background:'radial-gradient(ellipse at 30% 0%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, var(--bg) 55%)'}}>
      <ParticleBackground />
      <div className="nm-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Top Bar on Mobile */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 nm-card flex items-center justify-center border-glow-accent">
              <GraduationCap size={16} className="text-[var(--accent)]"/>
            </div>
            <div>
              <div className="text-base font-black text-[var(--text-primary)]">Sem<span className="text-[var(--accent)] glow-accent">Pilot</span></div>
              <div className="text-[9px] text-[var(--text-muted)]">Exam Preparation Hub</div>
            </div>
          </div>
          
          {/* Mobile Hamburger Button */}
          <button className="sm:hidden nm-btn p-2 rounded-xl text-[var(--text-secondary)]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
        
        {/* Expandable Menu */}
        <div className={`${isMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-4 sm:gap-3 w-full sm:w-auto`}>
          <div className="hidden sm:block"><DigitalClock/></div>
          <div className="w-px h-5 bg-[var(--nm-border)] hidden sm:block mx-1"/>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button onClick={onOpenSettings} className="nm-btn p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
              <Settings size={15}/>
            </button>
          </div>
          
          <div className="w-px h-5 bg-[var(--nm-border)] hidden sm:block mx-1"/>
          <button onClick={onCreateNew} className="nm-btn nm-btn-accent py-3 sm:py-2 px-4 rounded-xl text-sm sm:text-xs font-bold flex items-center justify-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <PlusCircle size={15} className="sm:w-[13px] sm:h-[13px]"/> New Dashboard
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">My Dashboards</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">{dashboards.length} dashboard{dashboards.length!==1?'s':''} saved</p>
        </div>
      </div>
      {dashboards.length===0&&(
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16 relative z-10">
          <div className="w-20 h-20 nm-card flex items-center justify-center border-glow-accent animate-pulse-accent">
            <BookOpen size={34} className="text-[var(--accent)]" style={{filter:'drop-shadow(0 0 10px var(--accent))'}}/>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-[var(--text-secondary)]">No dashboards yet</h2>
            <p className="text-[var(--text-muted)] text-xs mt-1 max-w-xs">Upload your syllabus PDF to create your first personalized study dashboard.</p>
          </div>
          <button onClick={onCreateNew} className="nm-btn nm-btn-accent py-3 px-7 rounded-2xl text-sm font-bold flex items-center gap-2">
            <Upload size={15}/> Upload Syllabus PDF
          </button>
        </div>
      )}
      {dashboards.length>0&&(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 relative z-10">
          {dashboards.map(db=>{
            const tt=db.selectedSubjects.reduce((a,s)=>a+s.topics.length,0);
            const ct=db.selectedSubjects.reduce((a,s)=>a+s.topics.filter((_,i)=>(db.topicChecks||{})[`${s.id}-${i}`]).length,0);
            const prog=tt?Math.round((ct/tt)*100):0;
            const dl=db.examDate?Math.max(0,Math.ceil((new Date(db.examDate)-new Date())/86400000)):null;
            const uc=dl<=7?'#ef4444':dl<=30?'#f59e0b':'var(--accent)';
            const ts=(db.sessions||[]).reduce((a,s)=>a+s.duration,0);
            return (
              <div key={db.id} onClick={()=>onOpen(db.id)}
                className="nm-card flex flex-col gap-0 overflow-hidden group cursor-pointer hover:translate-y-[-2px] transition-all duration-300">
                <div className="h-1 w-full" style={{background:`linear-gradient(90deg,${db.selectedSubjects[0]?.color||'var(--accent)'},${db.selectedSubjects[1]?.color||'#8b5cf6'})`}}/>
                <div className="p-5 flex flex-col gap-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{(db.examName||db.fileName.replace('.pdf','')).toUpperCase()}</h3>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{db.selectedSubjects.length} subjects · {fmt(db.createdAt)}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();if(window.confirm('Delete?'))onDelete(db.id);}}
                      className="nm-btn p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={11} className="text-[var(--text-muted)] hover:text-[#ef4444] transition-colors"/>
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-[var(--text-muted)]">Completion</span>
                      <span className="text-[10px] font-bold text-[var(--accent)]">{prog}%</span>
                    </div>
                    <div className="progress-track h-2">
                      <div className="h-full rounded-full" style={{width:`${prog}%`,background:'var(--accent)',boxShadow:'0 0 6px color-mix(in srgb, var(--accent) 40%, transparent)'}}/>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {db.selectedSubjects.slice(0,4).map(s=>(
                      <span key={s.id} className="text-[9px] nm-inset px-1.5 py-0.5 font-medium" style={{color:s.color}}>{s.name.split(' ')[0]}</span>
                    ))}
                    {db.selectedSubjects.length>4&&<span className="text-[9px] nm-inset px-1.5 py-0.5 text-[var(--text-muted)]">+{db.selectedSubjects.length-4}</span>}
                  </div>
                  <div className="flex items-center gap-4 pt-1 border-t border-[var(--nm-border)] text-[10px]">
                    {dl!==null&&<div className="flex items-center gap-1" style={{color:uc}}><Target size={10}/><span className="font-bold">{dl}d left</span></div>}
                    <div className="flex items-center gap-1 text-[var(--text-muted)]"><Clock size={10}/><span>{fmtSecs(ts)} studied</span></div>
                    <ChevronRight size={12} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors ml-auto"/>
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={onCreateNew}
            className="nm-card border-2 border-dashed border-[var(--nm-border)] hover:border-[var(--accent)] transition-all duration-300 p-8 flex flex-col items-center justify-center gap-3 group min-h-[200px]">
            <div className="w-11 h-11 nm-raised flex items-center justify-center group-hover:animate-pulse-accent">
              <PlusCircle size={20} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors"/>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">New Dashboard</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Upload a syllabus PDF</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
function MainApp() {
  const { currentUser, logout } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  const [view,            setView]            = useState('home');
  const [showSettings,    setShowSettings]    = useState(false);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('sempilot_theme') || localStorage.getItem('studydash_theme') || 'dark');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('sempilot_accent') || localStorage.getItem('studydash_accent') || 'var(--color-cyan)');

  useEffect(() => {
    localStorage.setItem('sempilot_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sempilot_accent', accentColor);
    document.documentElement.style.setProperty('--accent', accentColor);
  }, [accentColor]);

  const [dashboards, setDashboards] = useState([]);
  const [dashboardsLoaded, setDashboardsLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      let localData = [];
      try {
        const saved = localStorage.getItem('sempilot_db') || localStorage.getItem('studydash_db');
        if (saved) localData = JSON.parse(saved);
      } catch (e) { }

      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const cloudData = docSnap.data().dashboards || [];
            const mergedData = [...cloudData];
            let needsUpdate = false;
            localData.forEach(ld => {
              if (!mergedData.find(cd => cd.id === ld.id)) {
                mergedData.push(ld);
                needsUpdate = true;
              }
            });
            
            if (needsUpdate) {
              await setDoc(docRef, { dashboards: mergedData }, { merge: true });
            }
            setDashboards(mergedData);
          } else {
            await setDoc(docRef, { dashboards: localData }, { merge: true });
            setDashboards(localData);
          }
        } catch (err) {
          console.error("Failed to load cloud data", err);
          setDashboards(localData);
        }
      } else {
        setDashboards(localData);
      }
      setDashboardsLoaded(true);
    }
    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (!dashboardsLoaded) return;
    localStorage.setItem('sempilot_db', JSON.stringify(dashboards));
    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid);
      setDoc(docRef, { dashboards }, { merge: true }).catch(err => console.error("Cloud save failed", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboards]);
  const [activeDashId,    setActiveDashId]    = useState(null);
  const [pendingFile,     setPendingFile]     = useState(null);
  const [pendingDate,     setPendingDate]     = useState(null);
  const [pendingExamName, setPendingExamName] = useState(null);
  const [pendingSubjects, setPendingSubjects] = useState([]);

  const handleParsed = (file, date, examName, subjects) => {
    setPendingFile(file); setPendingDate(date); setPendingExamName(examName); setPendingSubjects(subjects); setView('modal');
  };

  const handleGenerate = subjects => {
    let totalMins = 0;
    subjects.forEach(s => s.topics.forEach(t => {
      const diff = typeof t === 'string' ? 'Medium' : (t.difficulty || 'Medium');
      totalMins += diff === 'Easy' ? 30 : diff === 'Hard' ? 90 : 60;
    }));
    const days = pendingDate ? Math.max(1, Math.ceil((new Date(pendingDate) - new Date()) / 86400000)) : 1;
    const baseMins = Math.round(totalMins / days);

    const nd = {
      id: Date.now().toString(),
      fileName: pendingFile?.name || 'Syllabus.pdf',
      examName: pendingExamName || 'My Exam',
      examDate: pendingDate,
      selectedSubjects: subjects,
      topicChecks: {},
      tasks: DAILY_TASKS_INITIAL.map(t => ({...t})),
      sessions: [],
      createdAt: new Date().toISOString(),
      baseDailyMinutes: baseMins
    };
    setDashboards(prev => [nd, ...prev]);
    setActiveDashId(nd.id);
    setView('dashboard');
  };

  const handleUpdate = (id, updates) => setDashboards(prev => prev.map(d => d.id===id?{...d,...updates}:d));
  const handleDelete = id => { setDashboards(prev => prev.filter(d => d.id!==id)); setActiveDashId(null); setView('home'); };
  const activeDash = dashboards.find(d => d.id===activeDashId);

  if (!currentUser && !guestMode) {
    return <Login onGuest={() => setGuestMode(true)} />;
  }

  return (
    <>
      {view==='home' && (
        <HomePage dashboards={dashboards}
          onOpen={id=>{setActiveDashId(id);setView('dashboard');}}
          onDelete={handleDelete} onCreateNew={()=>setView('upload')}
          onOpenSettings={() => setShowSettings(true)}
          theme={theme} setTheme={setTheme} />
      )}
      {view==='upload' && (
        <div className="relative">
          <button onClick={()=>setView('home')}
            className="fixed top-4 left-4 z-50 nm-btn p-2.5 rounded-xl flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            <ArrowLeft size={13}/><span className="text-xs hidden sm:inline">Home</span>
          </button>
          <UploadScreen onParsed={handleParsed}/>
        </div>
      )}
      {view==='modal' && (
        <>
          <div className="relative">
            <button onClick={()=>setView('home')}
              className="fixed top-4 left-4 z-40 nm-btn p-2.5 rounded-xl flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
              <ArrowLeft size={13}/><span className="text-xs hidden sm:inline">Home</span>
            </button>
            <UploadScreen onParsed={handleParsed}/>
          </div>
          <SubjectModal subjects={pendingSubjects} onGenerate={handleGenerate} onClose={()=>setView('upload')}/>
        </>
      )}
      {view==='dashboard' && activeDash && (
        <ErrorBoundary>
          <Dashboard db={activeDash}
            onUpdate={updates=>handleUpdate(activeDashId,updates)}
            onBack={()=>setView('home')}
            onDelete={()=>handleDelete(activeDashId)}
            onOpenSettings={() => setShowSettings(true)}
            theme={theme} setTheme={setTheme} />
        </ErrorBoundary>
      )}
      
      <SettingsSidebar isOpen={showSettings} onClose={() => setShowSettings(false)} 
        accentColor={accentColor} setAccentColor={setAccentColor} 
        onLoginClick={() => { setShowSettings(false); setGuestMode(false); }} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
