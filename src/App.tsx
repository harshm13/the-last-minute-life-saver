import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  Flame, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Send, 
  ChevronRight, 
  Zap, 
  Lightbulb, 
  FileText, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  ArrowRight, 
  TrendingUp, 
  ShieldAlert,
  Compass,
  AlertCircle,
  Copy,
  Check,
  X,
  Play,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, SubTask, Habit, CalendarBlock, CoachMessage } from "./types";

const CATEGORIES = ["Work", "Study", "Personal", "Health", "Finance", "Chores"];
const VOICE_SPEAKERS = [
  { name: "Kore (Warm Masculine)", id: "Kore" },
  { name: "Zephyr (Energetic Neutral)", id: "Zephyr" },
  { name: "Puck (Sassy/Brilliant)", id: "Puck" },
  { name: "Fenrir (Firm Leader)", id: "Fenrir" },
  { name: "Charon (Soft Academic)", id: "Charon" }
];

export default function App() {
  // --- Persistent States ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("saver_tasks");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "1",
        title: "Finalize Marketing Deck",
        notes: "Create key slides, check competitor numbers, and proofread. High-stake presentation for key investors tomorrow morning.",
        category: "Work",
        deadline: new Date(Date.now() + 86400000).toISOString().split("T")[0], // tomorrow
        priority: "High",
        isUrgent: true,
        isImportant: true,
        isCompleted: false,
        procrastinationRisk: "Critical",
        gettingStartedTip: "Open your presentation app and write down just 3 bullet points for slide 1.",
        timeBlockMinutes: 45
      },
      {
        id: "2",
        title: "Submit Chemistry Lab Report",
        notes: "Enter titration data and structure your main thesis statement. Procrastinated last week - cannot miss another assignment.",
        category: "Study",
        deadline: new Date(Date.now() + 172800000).toISOString().split("T")[0], // in 2 days
        priority: "High",
        isUrgent: true,
        isImportant: true,
        isCompleted: false,
        procrastinationRisk: "High",
        gettingStartedTip: "Write the title of the lab report and create three headers in a new text doc."
      },
      {
        id: "3",
        title: "Renew Health Insurance Policy",
        notes: "Gather documents and check the premium pricing on the state portal. Coverage lapses next week.",
        category: "Finance",
        deadline: new Date(Date.now() + 345600000).toISOString().split("T")[0], // in 4 days
        priority: "Medium",
        isUrgent: false,
        isImportant: true,
        isCompleted: false,
        procrastinationRisk: "Moderate",
        gettingStartedTip: "Find last year's coverage file in your email inbox."
      },
      {
        id: "4",
        title: "Fix Commuter Bicycle Chain Puncture",
        notes: "Need it to ride to physical therapy on Friday.",
        category: "Personal",
        deadline: new Date(Date.now() + 518400000).toISOString().split("T")[0], // in 6 days
        priority: "Low",
        isUrgent: false,
        isImportant: false,
        isCompleted: true,
        procrastinationRisk: "Low"
      }
    ];
  });

  const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>(() => {
    const saved = localStorage.getItem("saver_blocks");
    if (saved) return JSON.parse(saved);
    return [
      {
        start: "09:00",
        end: "10:30",
        title: "Study Block: Chemistry Titration Data",
        taskId: "2",
        type: "focus",
        reason: "Highest brain power window - excellent for math analysis."
      },
      {
        start: "10:30",
        end: "10:45",
        title: "Physical Reset & Hydrate",
        taskId: "",
        type: "break",
        reason: "Move eyes away from text to avoid critical exhaustion fatigue."
      },
      {
        start: "11:00",
        end: "12:30",
        title: "Sprint: Investor Marketing Deck Drafting",
        taskId: "1",
        type: "focus",
        reason: "Knock out priority work before lunchtime energy dip."
      },
      {
        start: "12:30",
        end: "13:30",
        title: "Active Recovery Lunch Break",
        taskId: "",
        type: "break",
        reason: "Screen downtime is necessary to restore working memory."
      }
    ];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("saver_habits");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "hab-1",
        title: "Plan Agenda & Check Prioritization",
        streak: 14,
        history: [],
        isCompletedToday: true
      },
      {
        id: "hab-2",
        title: "Hydrate: Drink 3 Liters of Water",
        streak: 5,
        history: [],
        isCompletedToday: false
      },
      {
        id: "hab-3",
        title: "Focused Deep Work (No socials) (30 mins)",
        streak: 2,
        history: [],
        isCompletedToday: true
      }
    ];
  });

  const [chatMessages, setChatMessages] = useState<CoachMessage[]>(() => {
    const saved = localStorage.getItem("saver_chat");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "msg-1",
        role: "assistant",
        content: "Hey, I'm your Last-Minute Life Saver Coach. What critical deadline are we tackling? Don't let paralysis win. Let's build a step-by-step roadmap right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // --- UI Layout state ---
  const [activeTab, setActiveTab] = useState<"dashboard" | "matrix" | "chat" | "habits">("dashboard");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // --- New task input form states ---
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Work");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // --- New Habit input form states ---
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [showAddHabitInput, setShowAddHabitInput] = useState(false);

  // --- Voice / Audio Control States ---
  const [speakerVoice, setSpeakerVoice] = useState("Kore");
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSoundSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // --- Action Advisor / Postpone Control States ---
  const [isPostponing, setIsPostponing] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [postponeFeedback, setPostponeFeedback] = useState<{
    verdict: string;
    response: string;
    compromiseAction: string;
  } | null>(null);
  const [isLoadingDelayAdvisor, setIsLoadingDelayAdvisor] = useState(false);
  
  // --- AI State Processing ---
  const [isCompilingSchedule, setIsCompilingSchedule] = useState(false);
  const [aiCoachingNote, setAiCoachingNote] = useState(() => {
    return localStorage.getItem("saver_coach_note") || "Click 'Optimize Time blocks' to get tailored, procrastination-proof daily schedule tips from Gemini.";
  });

  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Speech Recognition support (webkitSpeechRecognition)
  const recognitionRef = useRef<any>(null);

  // --- Synced Local Storage Saves ---
  useEffect(() => {
    localStorage.setItem("saver_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("saver_blocks", JSON.stringify(calendarBlocks));
  }, [calendarBlocks]);

  useEffect(() => {
    localStorage.setItem("saver_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("saver_chat", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem("saver_coach_note", aiCoachingNote);
  }, [aiCoachingNote]);

  // Handle active task synchronization for details-sidebar updates
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);

  // Audio browser initiation API
  const getAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume context if suspended (common browser interaction guard)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Convert Base64 raw int16 pcm returned by gemini-3.1-flash-tts-preview into playable Float32 buffer
  const playPCMBase64 = async (base64PCM: string) => {
    try {
      stopTalking();
      const ctx = getAudioContext();
      
      const binaryString = atob(base64PCM);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        // Normalize int16 value [-32768, 32767] to float range [-1.0, 1.0]
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Audio model outputs 24kHz standard rate
      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
      };

      currentSoundSourceRef.current = source;
      setIsSpeaking(true);
      source.start();
    } catch (e) {
      console.error("PCM rendering failed:", e);
      setIsSpeaking(false);
    }
  };

  const stopTalking = () => {
    if (currentSoundSourceRef.current) {
      try {
        currentSoundSourceRef.current.stop();
      } catch (err) {}
      currentSoundSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Web SpeechDictation browser API 
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition isn't supported in this browser. Please type directly.");
      return;
    }

    if (!recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => `${prev} ${transcript}`.trim());
      };

      rec.onerror = (event: any) => {
        console.error("Speech assessment error:", event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onnomatch = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      recognitionRef.current.stop();
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- API Integrations ---

  // 1. Create task + Automatically Prioritize through AI
  const handleAddNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    const tempId = Date.now().toString();
    const tentativeTask: Task = {
      id: tempId,
      title: newTaskTitle.trim(),
      notes: newTaskNotes.trim(),
      category: newTaskCategory,
      deadline: newTaskDeadline || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      priority: "Medium",
      isUrgent: false,
      isImportant: false,
      isCompleted: false,
      procrastinationRisk: "Moderate"
    };

    // Optimistically add
    setTasks(prev => [...prev, tentativeTask]);

    try {
      const response = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tentativeTask.title,
          notes: tentativeTask.notes,
          deadline: tentativeTask.deadline,
          category: tentativeTask.category,
          currentScheduleCount: tasks.filter(t => !t.isCompleted).length
        })
      });

      if (!response.ok) throw new Error("Backend priority check did not complete successfully.");
      const data = await response.json();

      // Merge prioritized results
      setTasks(prev => prev.map(t => {
        if (t.id === tempId) {
          return {
            ...t,
            priority: data.priority,
            isUrgent: data.isUrgent,
            isImportant: data.isImportant,
            procrastinationRisk: data.procrastinationRisk,
            savingExplanation: data.explanation,
            timeBlockMinutes: data.timeBlockMinutes,
            gettingStartedTip: data.gettingStartedTip
          };
        }
        return t;
      }));

    } catch (err) {
      console.error(err);
      // Keep optimistic values if failed
    } finally {
      setNewTaskTitle("");
      setNewTaskNotes("");
      setNewTaskCategory("Work");
      setNewTaskDeadline("");
      setIsCreatingTask(false);
      setShowAddTaskModal(false);
    }
  };

  // 2. Automate Calendar Time Blocks Optimizer
  const handleOptimizeSchedule = async () => {
    setIsCompilingSchedule(true);
    try {
      const activeTasks = tasks.filter(t => !t.isCompleted).map(t => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        deadline: t.deadline,
        priority: t.priority,
        isUrgent: t.isUrgent,
        isImportant: t.isImportant,
        duration: t.timeBlockMinutes || 30
      }));

      const response = await fetch("/api/autoschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTasks,
          workingHoursStart: "08:30",
          workingHoursEnd: "21:30"
        })
      });

      if (!response.ok) throw new Error("Daily schedule optimize failed.");
      const data = await response.json();

      if (data.blocks && Array.isArray(data.blocks)) {
        setCalendarBlocks(data.blocks);
      }
      if (data.coachingNote) {
        setAiCoachingNote(data.coachingNote);
      }
    } catch (err) {
      console.error("Optimization failed:", err);
      // Fallback fallback warning
      setAiCoachingNote("AI Block Scheduler is temporarily busy. Keep trying or focus on the top Eisenhower quadrant!");
    } finally {
      setIsCompilingSchedule(false);
    }
  };

  // 3. Procrastination Breaker API
  const handleBreakParalysis = async (task: Task) => {
    setIsLoadingBreakdown(true);
    try {
      const response = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          notes: task.notes,
          deadline: task.deadline
        })
      });

      if (!response.ok) throw new Error("Task decomposition failed.");
      const data = await response.json();

      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            subtasks: data.subtasks?.map((sub: any) => ({ ...sub, isCompleted: false })),
            draftContent: data.draftContent,
            procrastinationQuote: data.procrastinationQuote,
            breakdownApplied: true
          };
        }
        return t;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  // Toggle subtask status
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks?.map(sub => {
            if (sub.id === subtaskId) {
              return { ...sub, isCompleted: !sub.isCompleted };
            }
            return sub;
          })
        };
      }
      return t;
    }));
  };

  // 4. Delay Advisor / Postpone Constraint assessment
  const handleRequestDelay = async () => {
    if (!selectedTask || !delayReason.trim()) return;
    setIsLoadingDelayAdvisor(true);
    setPostponeFeedback(null);

    try {
      const response = await fetch("/api/advisor/delay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedTask.title,
          deadline: selectedTask.deadline,
          notes: selectedTask.notes,
          priority: selectedTask.priority,
          delayReason: delayReason.trim()
        })
      });

      if (!response.ok) throw new Error("Delay analyzer failed.");
      const data = await response.json();

      setPostponeFeedback({
        verdict: data.verdict,
        response: data.response,
        compromiseAction: data.compromiseAction
      });
    } catch (err) {
      console.error(err);
      setPostponeFeedback({
        verdict: "procrastination",
        response: "Nice try! I couldn't reach the stress impact calculator, but let's be real: putting this off will make tomorrow stressful. Give it 5 minutes instead.",
        compromiseAction: "Work on the task outline for exactly 5 minutes now, then evaluate!"
      });
    } finally {
      setIsLoadingDelayAdvisor(false);
    }
  };

  // Perform standard postponement or compromise 
  const executePostponeCompromise = (reschedule: boolean) => {
    if (!selectedTask) return;
    
    if (reschedule) {
      // Modify deadline forward by 1 day
      const current = new Date(selectedTask.deadline);
      current.setDate(current.getDate() + 1);
      const newDead = current.toISOString().split("T")[0];

      setTasks(prev => prev.map(t => {
        if (t.id === selectedTask.id) {
          return { ...t, deadline: newDead };
        }
        return t;
      }));
    } else {
      // Compromise starts - convert the compromise tip into a direct Subtask
      if (postponeFeedback?.compromiseAction) {
        const compromiseSub: SubTask = {
          id: `compromise-${Date.now()}`,
          title: postponeFeedback.compromiseAction,
          isCompleted: false
        };
        setTasks(prev => prev.map(t => {
          if (t.id === selectedTask.id) {
            return {
              ...t,
              subtasks: t.subtasks ? [compromiseSub, ...t.subtasks] : [compromiseSub],
              breakdownApplied: true
            };
          }
          return t;
        }));
      }
    }

    // Reset modals/views
    setDelayReason("");
    setPostponeFeedback(null);
    setIsPostponing(false);
  };

  // 5. Active Coach Conversation
  const handleSendCoachChat = async (promptOverride?: string) => {
    const textToSend = promptOverride || chatInput.trim();
    if (!textToSend && !isSendingChat) return;

    if (!promptOverride) {
      setChatInput("");
    }

    const newUserMsg: CoachMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatMessages, newUserMsg];
    setChatMessages(updatedHistory);
    setIsSendingChat(true);

    try {
      // Limit context sizing
      const messagesPayload = updatedHistory.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesPayload,
          speechEnabled: speechEnabled,
          voiceName: speakerVoice
        })
      });

      if (!response.ok) throw new Error("Coach response failed.");
      const data = await response.json();

      const assistantMsg: CoachMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, assistantMsg]);

      // If speech synthesis generated standard PCM, trigger playback immediately
      if (speechEnabled && data.audio) {
        playPCMBase64(data.audio);
      }

    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Oops! My prioritization modules had a quick stutter, but remember: small steps prevent heavy stress. Choose a task right now and do 5 minutes of focused preparation.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // --- Core State Updates ---
  const handleToggleTaskCompleted = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, isCompleted: !t.isCompleted };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTask?.id === id) setSelectedTask(null);
    setTasks(prev => prev.filter(t => t.id !== id));
    // Clear blocks as well
    setCalendarBlocks(prev => prev.filter(b => b.taskId !== id));
  };

  const handleToggleHabitCompleted = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const completedToday = !h.isCompletedToday;
        let streak = h.streak;
        if (completedToday) {
          streak += 1;
        } else {
          streak = Math.max(0, streak - 1);
        }
        return {
          ...h,
          isCompletedToday: completedToday,
          streak
        };
      }
      return h;
    }));
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const habit: Habit = {
      id: `hab-${Date.now()}`,
      title: newHabitTitle.trim(),
      streak: 0,
      history: [],
      isCompletedToday: false
    };

    setHabits(prev => [...prev, habit]);
    setNewHabitTitle("");
    setShowAddHabitInput(false);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleCopyOutline = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // --- Statistics helper variables ---
  const activeTasksCount = tasks.filter(t => !t.isCompleted).length;
  const criticalTasksCount = tasks.filter(t => !t.isCompleted && t.procrastinationRisk === "Critical").length;
  const habitsDoneCount = habits.filter(h => h.isCompletedToday).length;
  const habitsPercentage = habits.length ? Math.round((habitsDoneCount / habits.length) * 100) : 0;
  const completedTasksCount = tasks.filter(t => t.isCompleted).length;
  const weeklyTaskCompletionRate = tasks.length ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white" id="main_layout">
      {/* HEADER SECTION */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6" id="app_header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-950/40 animate-pulse">
              <Zap className="text-white w-5 h-5 fill-white/20" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
                The Last-Minute Life Saver
              </h1>
              <p className="text-xs text-rose-400/90 font-mono tracking-wider">
                PROACTIVE AI-POWERED PRODUCTIVITY OUTCOME SYSTEM
              </p>
            </div>
          </div>

          {/* Core Analytics Dashboard Widgets */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-4 text-xs font-mono">
            
            {/* Risk Indicator */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col min-w-[70px] sm:min-w-[90px]">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider">Deadlines</span>
              <span className="flex items-center gap-1 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${criticalTasksCount > 0 ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`}></span>
                <span className="font-bold text-slate-200">{criticalTasksCount} Critical</span>
              </span>
            </div>

            {/* Streak Indicator */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col min-w-[70px] sm:min-w-[90px]">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider">Completion</span>
              <span className="font-bold text-slate-200 mt-0.5 flex items-center gap-1 text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {weeklyTaskCompletionRate}%
              </span>
            </div>

            {/* Daily Habit Metric */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col min-w-[70px] sm:min-w-[90px]">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider">Habit Stk</span>
              <span className="font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                {habitsDoneCount}/{habits.length}
              </span>
            </div>

          </div>

        </div>
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="main_content">
        
        {/* LEFT & CENTER INTERACTIVE PANELS (TABS SWITCHED) */}
        <div className="lg:col-span-8 flex flex-col gap-6" id="workspace_column">
          
          {/* NAVIGATION TAB CONTROLLERS */}
          <div className="flex border-b border-slate-800 p-1 bg-slate-900/60 rounded-xl" id="tab_navigation">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition font-display ${
                activeTab === "dashboard"
                  ? "bg-slate-800 text-white shadow-sm font-bold border-b-2 border-rose-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab_dashboard_btn"
            >
              <Calendar className="w-4 h-4" />
              <span>Time-Box Hub</span>
            </button>
            <button
              onClick={() => setActiveTab("matrix")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition font-display ${
                activeTab === "matrix"
                  ? "bg-slate-800 text-white shadow-sm font-bold border-b-2 border-rose-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab_matrix_btn"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Eisenhower Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition font-display ${
                activeTab === "chat"
                  ? "bg-slate-800 text-white shadow-sm font-bold border-b-2 border-rose-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab_chat_btn"
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Proactive Coach</span>
            </button>
            <button
              onClick={() => setActiveTab("habits")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition font-display ${
                activeTab === "habits"
                  ? "bg-slate-800 text-white shadow-sm font-bold border-b-2 border-rose-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab_habits_btn"
            >
              <Flame className="w-4 h-4" />
              <span>Habit Streaks</span>
            </button>
          </div>

          {/* ACTIVE TAB SPACE */}
          <div className="min-h-[500px]" id="tab_panel_container">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: DASHBOARD TIME-BLOCK TIMELINE */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard_tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                  id="tab_dashboard_view"
                >
                  {/* PROACTIVE COACH HIGHLIGHT ADVISORY HERO */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden" id="coach_hero_advisory">
                    {/* Visual subtle grids */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="text-amber-400 w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100 font-display flex items-center gap-2">
                            Today's Proactive Dynamic Advice
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                            "{aiCoachingNote}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleOptimizeSchedule}
                        disabled={isCompilingSchedule}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm text-amber-300 hover:text-amber-200 transition flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
                        id="auto_schedule_btn"
                      >
                        <Zap className={`w-4 h-4 fill-amber-300/10 ${isCompilingSchedule ? "animate-spin" : ""}`} />
                        <span>{isCompilingSchedule ? "Syncing Time blocks..." : "AI Auto-Schedule Blocks"}</span>
                      </button>
                    </div>
                  </div>

                  {/* TIMELINE DISPLAY SCHEDULER */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5" id="schedule_timeline_box">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="text-slate-400 w-4.5 h-4.5" />
                        <h3 className="font-semibold text-slate-200 font-display">Time-Block Schedule Timeline</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">8:00 AM - 10:00 PM</span>
                    </div>

                    {calendarBlocks.length === 0 ? (
                      <div className="text-center py-10 px-4">
                        <p className="text-slate-500 text-sm">No segments scheduled for today yet.</p>
                        <p className="text-xs text-rose-400 mt-2">Click "AI Auto-Schedule Blocks" to optimize your day based on deadlines!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {calendarBlocks.map((block, idx) => {
                          const linkedTask = tasks.find(t => t.id === block.taskId);
                          
                          return (
                            <div 
                              key={idx}
                              className={`border rounded-xl p-3 sm:p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                block.type === "focus" 
                                  ? "bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-sm"
                                  : block.type === "break"
                                  ? "bg-emerald-950/20 border-emerald-900/30 hover:border-emerald-800/40"
                                  : "bg-indigo-950/20 border-indigo-900/30 hover:border-indigo-800/40"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Time Frame Tags */}
                                <div className="text-center min-w-[70px] bg-slate-800 text-slate-300 font-mono text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 uppercase tracking-tight">
                                  {block.start} - {block.end}
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-slate-100 text-sm flex items-center gap-1.5">
                                    {block.title}
                                    {block.type === "focus" && <span className="text-[10px] bg-rose-500/20 border border-rose-500/30 text-rose-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">FOCUS</span>}
                                    {block.type === "break" && <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">REST</span>}
                                  </h4>
                                  <p className="text-xs text-slate-400 mt-1 italic">
                                    Why: {block.reason}
                                  </p>

                                  {linkedTask && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                                        Assigned: {linkedTask.category}
                                      </span>
                                      {linkedTask.isCompleted && (
                                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono font-medium">
                                          <CheckCircle className="w-3 h-3" /> Done
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {linkedTask && (
                                  <button
                                    onClick={() => {
                                      setSelectedTask(linkedTask);
                                      if (linkedTask.procrastinationRisk === "Critical" || linkedTask.procrastinationRisk === "High") {
                                        // Auto trigger check
                                      }
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 transition hover:text-white cursor-pointer"
                                  >
                                    Inspect Task
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: EISENHOWER SMART MATRIX */}
              {activeTab === "matrix" && (
                <motion.div
                  key="matrix_tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                  id="tab_matrix_view"
                >
                  {/* Grid Layout of the Eisenhower 2x2 Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="matrix_grid_2x2">
                    
                    {/* Quadrant 1: Urgent & Important */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[300px]">
                      <div className="flex items-center justify-between border-b border-rose-500/20 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                          <h4 className="font-semibold text-rose-400 font-display text-sm uppercase tracking-wide">
                            Q1: Urgent & Important
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded">Do Immediately</span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 flex flex-col">
                        {tasks.filter(t => t.isUrgent && t.isImportant).length === 0 ? (
                          <div className="text-center py-10 text-slate-600 text-xs my-auto">
                            No critical paralysis tasks here. Excellent breath control!
                          </div>
                        ) : (
                          tasks.filter(t => t.isUrgent && t.isImportant).map(task => (
                            <TaskRow 
                              key={task.id} 
                              task={task} 
                              onToggle={handleToggleTaskCompleted} 
                              onDelete={(e) => handleDeleteTask(task.id, e)}
                              onSelect={() => setSelectedTask(task)}
                              isSelected={selectedTask?.id === task.id}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Quadrant 2: Important & Not Urgent */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[300px]">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                          <h4 className="font-semibold text-amber-400 font-display text-sm uppercase tracking-wide">
                            Q2: Important, Not Urgent
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded">Schedule Plan</span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 flex flex-col">
                        {tasks.filter(t => !t.isUrgent && t.isImportant).length === 0 ? (
                          <div className="text-center py-10 text-slate-600 text-xs my-auto">
                            Empty space. Long-term goals are better with proactive habits.
                          </div>
                        ) : (
                          tasks.filter(t => !t.isUrgent && t.isImportant).map(task => (
                            <TaskRow 
                              key={task.id} 
                              task={task} 
                              onToggle={handleToggleTaskCompleted} 
                              onDelete={(e) => handleDeleteTask(task.id, e)}
                              onSelect={() => setSelectedTask(task)}
                              isSelected={selectedTask?.id === task.id}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Quadrant 3: Urgent & Not Important */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[300px]">
                      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                          <h4 className="font-semibold text-indigo-400 font-display text-sm uppercase tracking-wide">
                            Q3: Urgent, Not Important
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded">Delegate / Quick Tackle</span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 flex flex-col">
                        {tasks.filter(t => t.isUrgent && !t.isImportant).length === 0 ? (
                          <div className="text-center py-10 text-slate-600 text-xs my-auto">
                            No urgent distractions registered. Beautiful focus protection.
                          </div>
                        ) : (
                          tasks.filter(t => t.isUrgent && !t.isImportant).map(task => (
                            <TaskRow 
                              key={task.id} 
                              task={task} 
                              onToggle={handleToggleTaskCompleted} 
                              onDelete={(e) => handleDeleteTask(task.id, e)}
                              onSelect={() => setSelectedTask(task)}
                              isSelected={selectedTask?.id === task.id}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Quadrant 4: Not Urgent & Not Important */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[300px]">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                          <h4 className="font-semibold text-slate-400 font-display text-sm uppercase tracking-wide">
                            Q4: Unimportant & Non-Urgent
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-500 px-2 py-0.5 rounded">Minimize / Drop</span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 flex flex-col">
                        {tasks.filter(t => !t.isUrgent && !t.isImportant).length === 0 ? (
                          <div className="text-center py-10 text-slate-600 text-xs my-auto">
                            No junk tasks cluttered here.
                          </div>
                        ) : (
                          tasks.filter(t => !t.isUrgent && !t.isImportant).map(task => (
                            <TaskRow 
                              key={task.id} 
                              task={task} 
                              onToggle={handleToggleTaskCompleted} 
                              onDelete={(e) => handleDeleteTask(task.id, e)}
                              onSelect={() => setSelectedTask(task)}
                              isSelected={selectedTask?.id === task.id}
                            />
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Add New Task Entry Point Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowAddTaskModal(true)}
                      className="bg-gradient-to-r from-rose-500 to-amber-500 shadow-lg shadow-rose-950/20 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition flex items-center gap-2 text-sm select-none cursor-pointer"
                      id="trigger_new_task_modal"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span>Add New Task (AI Auto-Prioritized)</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: PROACTIVE AI VOICE COACH CHAT */}
              {activeTab === "chat" && (
                <motion.div
                  key="chat_tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[550px] relative overflow-hidden"
                  id="tab_chat_view"
                >
                  {/* Coach audio control panel bar */}
                  <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <Volume2 className="w-4.5 h-4.5 animate-bounce" />
                      <span className="font-bold tracking-wider uppercase">Vocal Voice Engine Active</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Voice Selection */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 uppercase">Voice:</span>
                        <select
                          value={speakerVoice}
                          onChange={(e) => setSpeakerVoice(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded text-slate-300 px-1.5 py-0.5 outline-none text-[11px]"
                        >
                          {VOICE_SPEAKERS.map(sp => (
                            <option key={sp.id} value={sp.id}>{sp.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Speaks Toggle */}
                      <button
                        onClick={() => {
                          setSpeechEnabled(!speechEnabled);
                          if (speechEnabled) stopTalking();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition text-[11px] font-bold border ${
                          speechEnabled
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-850"
                        }`}
                      >
                        {speechEnabled ? <Volume2 className="w-3 h-3 text-rose-400" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
                        <span>{speechEnabled ? "Voice On" : "Muted"}</span>
                      </button>
                    </div>
                  </div>

                  {/* CHAT BUBBLES LIST */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col" id="chat_feed_scroller">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={msg.id || i}
                        className={`max-w-[85%] flex flex-col gap-1.5 p-3 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-slate-800 text-slate-100 rounded-tr-none self-end"
                            : "bg-slate-950 border border-slate-800 text-slate-100 rounded-tl-none self-start"
                        }`}
                      >
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        
                        <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-500 mt-1 pb-0.5 border-t border-slate-800/10">
                          <span>{msg.timestamp}</span>
                          {msg.role === "assistant" && msg.content && !isSpeaking && (
                            <button
                              onClick={() => {
                                // Manual Speak synthesis trigger
                                const client = fetch("/api/coach/chat", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    messages: [{ role: "assistant", content: msg.content }],
                                    speechEnabled: true,
                                    voiceName: speakerVoice
                                  })
                                }).then(r => r.json()).then(data => {
                                  if (data.audio) playPCMBase64(data.audio);
                                });
                              }}
                              className="text-[9px] uppercase tracking-wider text-rose-400/80 hover:text-rose-400 flex items-center gap-0.5"
                            >
                              <Volume2 className="w-2.5 h-2.5" /> Re-speak
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isSendingChat && (
                      <div className="max-w-[70px] bg-slate-950 border border-slate-800 p-2.5 rounded-2xl rounded-tl-none self-start flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    )}
                  </div>

                  {/* COCH ADVISORY SUGGESTION CLICKS */}
                  <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleSendCoachChat("Give me prioritized agenda recommendations for today")}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-300 transition cursor-pointer"
                    >
                      "How do I prioritize?"
                    </button>
                    <button
                      onClick={() => handleSendCoachChat("I'm experiencing absolute procrastination freeze today. How do I kickstart?")}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-300 transition cursor-pointer"
                    >
                      "I'm feeling frozen"
                    </button>
                    <button
                      onClick={() => handleSendCoachChat("Explain the Eisenhower matrix benefit simply.")}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-300 transition cursor-pointer"
                    >
                      "Matrix Philosophy"
                    </button>
                  </div>

                  {/* CHAT INPUT AREA */}
                  <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
                    {/* Dictation voice input */}
                    <button
                      onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition flex-shrink-0 cursor-pointer ${
                        isRecording 
                          ? "bg-rose-500/20 border-rose-500 text-rose-500 animate-pulse" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                      title={isRecording ? "Listening... click to stop" : "Talk to micro-coach"}
                    >
                      {isRecording ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSendingChat) handleSendCoachChat();
                      }}
                      placeholder={isRecording ? "Listening... dictate your voice..." : "Type task concern..."}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                      disabled={isSendingChat}
                    />

                    {/* Send trigger */}
                    <button
                      onClick={() => handleSendCoachChat()}
                      disabled={isSendingChat || !chatInput.trim()}
                      className="bg-gradient-to-r from-rose-500 to-amber-500 w-10 h-10 rounded-xl flex items-center justify-center transition hover:opacity-95 select-none cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-4.5 h-4.5 text-white" />
                    </button>
                  </div>

                </motion.div>
              )}

              {/* TAB 4: GOAL & HABIT STREAK TRACKER */}
              {activeTab === "habits" && (
                <motion.div
                  key="habits_tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                  id="tab_habits_view"
                >
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5" id="habits_manager_box">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20 animate-pulse" />
                        <h3 className="font-semibold text-slate-200 font-display">Consistent Habit Stacking</h3>
                      </div>
                      <span className="text-xs text-amber-400 font-mono font-bold">{habitsPercentage}% today</span>
                    </div>

                    <p className="text-xs text-slate-400 font-sans mb-3 leading-relaxed">
                      Habit chains reduce start execution paralysis. Every consecutive day increases your momentum score!
                    </p>

                    <div className="space-y-3">
                      {habits.map(habit => (
                        <div 
                          key={habit.id}
                          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition ${
                            habit.isCompletedToday
                              ? "bg-slate-950/40 border-slate-800/60 opacity-80"
                              : "bg-slate-900 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleHabitCompleted(habit.id)}
                              className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            >
                              {habit.isCompletedToday ? (
                                <CheckCircle className="text-emerald-400 w-6 h-6 fill-emerald-500/10" />
                              ) : (
                                <Circle className="text-slate-600 hover:text-slate-400 w-6 h-6" />
                              )}
                            </button>
                            
                            <div>
                              <span className={`text-xs sm:text-sm font-medium ${habit.isCompletedToday ? "line-through text-slate-500" : "text-slate-200"}`}>
                                {habit.title}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-1 rounded-lg">
                              <Flame className="w-4 h-4 fill-amber-500/20" />
                              <span className="font-bold">{habit.streak} day streak</span>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="text-slate-600 hover:text-rose-500 transition cursor-pointer"
                              title="Delete habit"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {showAddHabitInput ? (
                      <form onSubmit={handleAddHabit} className="mt-4 flex items-center gap-2 border-t border-slate-850 pt-4">
                        <input
                          type="text"
                          value={newHabitTitle}
                          onChange={(e) => setNewHabitTitle(e.target.value)}
                          placeholder="E.g., 20-min focused study chunk..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition text-slate-200"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="bg-rose-500 hover:bg-rose-600 font-bold px-4 py-2 rounded-xl text-xs text-white cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddHabitInput(false);
                            setNewHabitTitle("");
                          }}
                          className="text-slate-500 hover:text-slate-300 px-2 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowAddHabitInput(true)}
                        className="mt-4 border border-dashed border-slate-800 hover:border-slate-600 rounded-xl p-3 text-center text-xs text-slate-400 hover:text-slate-300 w-full transition cursor-pointer"
                      >
                        + Stack a New Daily Habit
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT SIDEBAR: LAST-MINUTE ADVISOR PANEL / SELECTED TASK INSPECTOR */}
        <div className="lg:col-span-4 flex flex-col gap-6" id="coaching_sidebar">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 sticky top-24" id="task_details_card">
            
            {!selectedTask ? (
              <div className="text-center py-10 px-4 flex flex-col items-center justify-center h-[460px]">
                <div className="w-14 h-14 bg-slate-850 rounded-2xl flex items-center justify-center text-slate-600 mb-4 border border-slate-800">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-300 font-display text-sm">No Task Inspected</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[220px]">
                  Select any task from the matrix block or agenda timeline to invoke its AI Action Breakdown center.
                </p>
                
                {/* Visual fast advice prompt */}
                <span className="text-[10px] font-mono border border-slate-800 text-slate-500 bg-slate-950 rounded px-2 py-1 mt-6">
                  Ready to break paralysis
                </span>
              </div>
            ) : (
              <div className="flex flex-col h-[520px] overflow-y-auto pr-1" id="active_details_workspace">
                
                {/* Header Information */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                      {selectedTask.category} Task
                    </span>
                    <h3 className="font-bold text-slate-100 font-display text-base tracking-tight mt-1">
                      {selectedTask.title}
                    </h3>
                  </div>
                  
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-slate-500 hover:text-slate-300 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Deadline countdown warnings */}
                <div className="flex items-center justify-between text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-4">
                  <span className="text-slate-500">Deadline:</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    {selectedTask.deadline}
                  </span>
                </div>

                <p className="text-xs text-slate-400 italic font-sans border-l-2 border-slate-700 pl-2.5 py-0.5 mb-4 leading-relaxed">
                  "{selectedTask.notes || 'No notes provided for this task.'}"
                </p>

                {/* Eisenhower quadrant explanation from priority module */}
                {selectedTask.savingExplanation && (
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl mb-4 text-[11px] leading-relaxed">
                    <div className="text-rose-400 font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-rose-500" /> AI Matrix Assignment Alignment
                    </div>
                    <span className="text-slate-300">{selectedTask.savingExplanation}</span>
                  </div>
                )}

                {/* Tip box highlight */}
                {selectedTask.gettingStartedTip && (
                  <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-xl mb-5 text-[11px] leading-relaxed">
                    <span className="font-bold text-amber-400 block mb-0.5 font-display">2-MIN FRICTION BUSTER TIP:</span>
                    <span className="text-amber-200 font-medium font-sans">"{selectedTask.gettingStartedTip}"</span>
                  </div>
                )}

                {/* CONTROL BUTTON ACTIONS PANEL */}
                <div className="flex flex-col gap-2 mb-4" id="ai_actions_block">
                  
                  {/* Action 1: Procrastination Paralysis Breaker */}
                  {!selectedTask.breakdownApplied ? (
                    <button
                      onClick={() => handleBreakParalysis(selectedTask)}
                      disabled={isLoadingBreakdown}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs sm:text-xs tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isLoadingBreakdown ? "Constructing Roadmap..." : "AI Break Paralysis Steps"}</span>
                    </button>
                  ) : (
                    <div className="border border-slate-800 p-3 rounded-xl bg-slate-950/60">
                      
                      {/* Granular actionable subtasks checklists */}
                      <span className="text-[10px] font-mono text-slate-400 tracking-wide block mb-2 uppercase">
                        AI Granular Breakdown Matrix:
                      </span>
                      
                      <div className="space-y-2">
                        {selectedTask.subtasks?.map(sub => (
                          <div key={sub.id} className="flex items-start gap-2 text-[11px]">
                            <button
                              onClick={() => handleToggleSubtask(selectedTask.id, sub.id)}
                              className="mt-0.5 text-slate-500 hover:text-emerald-400 transition"
                            >
                              {sub.isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-700" />
                              )}
                            </button>
                            <span className={sub.isCompleted ? "line-through text-slate-500" : "text-slate-300 font-medium"}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Content Outline Draft Generative support */}
                      {selectedTask.draftContent && (
                        <div className="mt-4 border-t border-slate-800 pt-3">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 uppercase">
                              <FileText className="w-3.5 h-3.5" /> AI Starter Draft Outline
                            </span>
                            <button
                              onClick={() => handleCopyOutline(selectedTask.draftContent || "")}
                              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 border border-slate-800 px-1.5 py-0.5 rounded bg-slate-900 transition"
                            >
                              {copyFeedback ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copyFeedback ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          <pre className="text-[10px] font-mono bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-slate-300 max-h-[140px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
                            {selectedTask.draftContent}
                          </pre>
                        </div>
                      )}

                      {/* Procrastination Nudge Warning Quote */}
                      {selectedTask.procrastinationQuote && (
                        <div className="mt-3 bg-slate-900 p-2 rounded border border-slate-850 text-[10px] italic text-rose-300/90 leading-snug">
                          "{selectedTask.procrastinationQuote}"
                        </div>
                      )}

                      <button
                        onClick={() => handleBreakParalysis(selectedTask)}
                        disabled={isLoadingBreakdown}
                        className="mt-3 text-slate-500 hover:text-rose-400 text-[10px] font-mono uppercase tracking-wider block text-center w-full"
                      >
                        {isLoadingBreakdown ? "Regenerating..." : "[ Regenerate Outline ]"}
                      </button>
                    </div>
                  )}

                  {/* Action 2: Trigger Postponement advisor restriction */}
                  <button
                    onClick={() => {
                      setIsPostponing(true);
                      setPostponeFeedback(null);
                    }}
                    className="border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-300 font-bold py-2 rounded-xl text-xs sm:text-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reschedule / Postpone Task</span>
                  </button>

                  {/* Task completion toggle */}
                  <button
                    onClick={() => handleToggleTaskCompleted(selectedTask.id)}
                    className={`mt-2 font-bold py-2 rounded-xl text-xs sm:text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedTask.isCompleted 
                        ? "bg-slate-800 text-slate-400 hover:bg-slate-750" 
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{selectedTask.isCompleted ? "Mark Uncompleted" : "Complete Task Now"}</span>
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-600 text-xs py-4 text-center mt-auto" id="app_footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
          <span>The Last-Minute Life Saver System — AI Studio Build</span>
          <span className="text-[11px] text-slate-500 font-display">Crafted to protect user outcomes from final hour delay strategies.</span>
        </div>
      </footer>

      {/* --- MODAL 1: ADD NEW TASK (AI AUTO-PRIORITIZED) --- */}
      <AnimatePresence>
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="task_form_modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-950 border-b border-slate-850 p-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-100 font-display flex items-center gap-2">
                  <Sparkles className="text-rose-500 w-4.5 h-4.5 animate-pulse" /> Add Task (Let AI Prioritize & Tag)
                </h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddNewTask} className="p-5 space-y-4">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase">Task Directive / Title*</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="E.g., Write Titration Data lab report..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                {/* Category & Deadline in Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-400 uppercase">Category</label>
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-rose-500 transition"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-400 uppercase">Deadline Date</label>
                    <input
                      type="date"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-250 focus:outline-none focus:border-rose-500 transition text-slate-300"
                    />
                  </div>
                </div>

                {/* Notes Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase">Task Context & Details (Highly recommended)</label>
                  <textarea
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    placeholder="Add details details (e.g. 'Stuck because I don't understand the Titration calculations' or 'I need help structuring outline'). The more context, the smarter the AI break steps."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 h-24 focus:outline-none focus:border-rose-500 transition resize-none leading-relaxed"
                  />
                </div>

                {/* Bottom Trigger */}
                <div className="border-t border-slate-850 pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTask || !newTaskTitle.trim()}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 select-none disabled:opacity-40"
                  >
                    {isCreatingTask ? "AI Prioritizing..." : "Analyze and Categorize"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: DELAY RESIGNATION POSTPONE ADVISOR --- */}
      <AnimatePresence>
        {isPostponing && selectedTask && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
              id="delay_checker_modal"
            >
              <div className="bg-slate-950 border-b border-slate-850 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 w-5 h-5" />
                  <h3 className="font-bold text-slate-100 font-display">
                    Last-Minute Postponement Advisor
                  </h3>
                </div>
                <button
                  onClick={() => setIsPostponing(false)}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-mono text-slate-400">Inspecting delay impact for:</span>
                  <h4 className="font-bold text-slate-200 mt-1">{selectedTask.title}</h4>
                  <span className="text-xs text-slate-500 font-mono">Current Deadline: {selectedTask.deadline}</span>
                </div>

                {/* Form Input Reason */}
                {!postponeFeedback ? (
                  <div className="space-y-3">
                    <label className="text-xs font-mono text-slate-400 uppercase">
                      Provide your honest explanation for postponing this task:
                    </label>
                    <textarea
                      required
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      placeholder="E.g., 'I am too exhausted to structure slides right now', 'I will wake up early tomorrow instead', 'Missing titration numbers from my partner'."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 h-24 focus:outline-none focus:border-amber-500 transition resize-none leading-relaxed"
                    />

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsPostponing(false)}
                        className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRequestDelay}
                        disabled={isLoadingDelayAdvisor || !delayReason.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer select-none"
                      >
                        {isLoadingDelayAdvisor ? "Evaluating Stress Risk..." : "Apply Delay Risk Test"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4" id="postpone_feedback_panel">
                    {/* Diagnostic verdict */}
                    <div className={`p-4 rounded-xl border flex gap-3 ${
                      postponeFeedback.verdict === "procrastination" 
                        ? "bg-rose-950/20 border-rose-900/35 text-rose-400" 
                        : "bg-emerald-950/20 border-emerald-900/35 text-emerald-400"
                    }`}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-slate-900 border border-slate-800">
                        {postponeFeedback.verdict === "procrastination" ? (
                          <AlertCircle className="w-5 h-5 text-rose-500 animate-bounce" />
                        ) : (
                          <CheckSquare className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider block font-bold">
                          VERDICT: {postponeFeedback.verdict === "procrastination" ? "Sneaky Procrastination Detected" : "Reasonable Delay Constraint"}
                        </span>
                        <p className="text-slate-300 text-xs leading-relaxed mt-1 pb-1">
                          "{postponeFeedback.response}"
                        </p>
                      </div>
                    </div>

                    {/* Compromise recommendation block */}
                    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl">
                      <span className="text-xs font-bold text-amber-400 block font-display">
                        RECOMMENDED IMMEDIATE COMPROMISE:
                      </span>
                      <p className="text-xs text-amber-200 mt-1 leading-relaxed">
                        "{postponeFeedback.compromiseAction}"
                      </p>
                    </div>

                    {/* Choice triggers */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-850">
                      
                      <button
                        onClick={() => executePostponeCompromise(false)}
                        className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow"
                      >
                        I accept: Do 5-Min Compromise Instead
                      </button>

                      <button
                        onClick={() => executePostponeCompromise(true)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Override & Reschedule Task Anyway
                      </button>

                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- SUB-COMPONENT: Individual Task matrix row widget ---
interface TaskRowProps {
  key?: any;
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (e: React.MouseEvent) => void;
  onSelect: () => void;
  isSelected?: boolean;
}

function TaskRow({ task, onToggle, onDelete, onSelect, isSelected }: TaskRowProps) {
  
  // Decide badge colors
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "Critical": return "bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse";
      case "High": return "bg-amber-500/15 border-amber-500/30 text-amber-400";
      case "Moderate": return "bg-indigo-500/15 border-indigo-500/30 text-indigo-400";
      default: return "bg-slate-800 border-slate-700 text-slate-400";
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`border rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition select-none ${
        isSelected 
          ? "bg-slate-850 border-rose-500/60 shadow-lg shadow-rose-950/10" 
          : "bg-slate-950 border-slate-850 hover:border-slate-800"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        
        {/* Completion checkbox check */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          className="text-slate-400 hover:text-rose-400 transition cursor-pointer flex-shrink-0"
        >
          {task.isCompleted ? (
            <CheckCircle className="text-emerald-400 w-5 h-5 fill-emerald-500/10" />
          ) : (
            <Circle className="text-slate-700 hover:text-slate-500 w-5 h-5" />
          )}
        </button>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h5 className={`text-xs sm:text-sm font-medium leading-snug truncate ${task.isCompleted ? "line-through text-slate-500" : "text-slate-200"}`}>
            {task.title}
          </h5>
          
          <div className="flex items-center gap-2 mt-1.5 font-mono text-[9px] flex-wrap">
            <span className="bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded">
              {task.category}
            </span>
            <span className={`border px-1.5 py-0.5 rounded ${getRiskBadgeColor(task.procrastinationRisk)}`}>
              {task.procrastinationRisk} Risk
            </span>
            {task.deadline && (
              <span className="text-slate-500 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5 text-rose-500" />
                {task.deadline}
              </span>
            )}
          </div>
        </div>

      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onDelete}
          className="p-1 text-slate-700 hover:text-rose-400 rounded transition cursor-pointer"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronRight className="w-4 h-4 text-slate-600" />
      </div>

    </div>
  );
}
