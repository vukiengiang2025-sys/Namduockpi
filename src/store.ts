import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MonthData {
  salesTarget: number;
  salesActual: number;
  coverageTarget: number;
  coverageActual: number;
  sales15DaysActual: number;
  skuActual: number;
  customName: string;
  customPoints: number;
}

export interface QuarterData {
  custom1Name: string;
  custom1Points: number;
  custom2Name: string;
  custom2Points: number;
}

export interface HalfYearData {
  customName: string;
  customPoints: number;
}

export interface Note {
  id: string;
  text: string;
  createdAt: number;
  isCompleted: boolean;
  reminderTime?: string;
  reminderType?: 'once' | 'daily';
  tag?: 'urgent' | 'customer' | 'meeting' | 'other';
}

export interface Memory {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  tags: string[];
  createdAt: number;
  embedding?: number[];
}

export interface TaskLog {
  id: string;
  taskId: string;
  text: string;
  planned: number;
  done: number;
  kpiAtStart: number;
  kpiAtEnd: number;
  timestamp: number;
  type?: 'coverage' | 'sales' | 'sku' | 'other';
}

export interface UserProfile {
  skills: {
    coverage: number; 
    sales: number;
    sku: number;
  };
  preferredHours?: {
    morning: number;
    afternoon: number;
  };
}

export interface StrategyLog {
  id: string;
  focus: string;
  successScore: number;
  monthIndex: number;
  timestamp: number;
}

export interface DailyTask {
  id: string;
  text: string;
  target?: number;
  done: number;
  isCompleted: boolean;
  isStarted?: boolean;
  priority: 'high' | 'medium' | 'low';
  expectedImpact?: string;
  confidence?: number;
  createdAt: number;
  timer?: number;
  kpiAtStart?: number;
  type?: 'coverage' | 'sales' | 'sku' | 'other';
}

export interface DailySnapshot {
  date: string;
  timestamp: number;
  salesActual: number;
  coverageActual: number;
  skuActual: number;
  kpiScore: number;
  tasksCompleted: number;
  tasksTotal: number;
}


export interface KPIWeights {
  sales: number;
  coverage: number;
  month15Days: number;
  sku: number;
}

export interface AppSettings {
  themeColor: string;
  appTitle?: string;
  appIcon?: string;
  themeMode?: 'dark' | 'light';
  fontFamily?: 'sans' | 'serif' | 'mono';
  bgUrl?: string;
  dashboardLayout?: 'default' | 'details-first';
  kpiWeights?: KPIWeights;
  kpiRules?: any;
  customPrompts?: {
    memorySummary?: string;
    memoryConsolidation?: string;
    kpiAnalysis?: string;
  };
  skuTiers?: { threshold: number; score: number }[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface AppState {
  months: MonthData[];
  quarters: QuarterData[];
  halfYears: HalfYearData[];
  selectedMonthIndex: number;
  notes: Note[];
  memories: Memory[];
  dailyTasks: DailyTask[];
  dailySnapshots: DailySnapshot[];
  taskLogs: TaskLog[];
  strategyLogs: StrategyLog[];
  streak: number;
  toasts: Toast[];
  userProfile: UserProfile;
  settings: AppSettings;
  updateMonth: (index: number, data: Partial<MonthData>) => void;
  updateQuarter: (index: number, data: Partial<QuarterData>) => void;
  updateHalfYear: (index: number, data: Partial<HalfYearData>) => void;
  setSelectedMonthIndex: (index: number) => void;
  importData: (data: any) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  toggleNote: (id: string) => void;
  deleteNote: (id: string) => void;
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;
  setDailyTasks: (tasks: Omit<DailyTask, 'id' | 'createdAt' | 'done' | 'isCompleted' | 'isStarted'>[], currentKpi?: number) => void;
  toggleDailyTask: (id: string) => void;
  startDailyTask: (id: string) => void;
  updateDailyTaskProgress: (id: string, done: number) => void;
  addDailySnapshot: (snapshot: DailySnapshot) => void;
  logTask: (log: Omit<TaskLog, 'id' | 'timestamp'>) => void;
  addStrategyLog: (log: Omit<StrategyLog, 'id' | 'timestamp'>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonthIndex: new Date().getMonth(),
      notes: [],
      memories: [],
      dailyTasks: [],
      dailySnapshots: [],
      taskLogs: [],
      strategyLogs: [],
      streak: 0,
      toasts: [],
      userProfile: {
        skills: {
          coverage: 1.0,
          sales: 1.0,
          sku: 1.0
        },
        preferredHours: {
          morning: 1.2,
          afternoon: 0.8
        }
      },
      settings: {
        themeColor: 'blue',
        appTitle: 'NAMDUOC TDV',
        customPrompts: {
          memorySummary: 'Bạn là trợ lý dữ liệu. Hãy đọc nội dung sau và tóm tắt thành các ý chính quan trọng về chính sách, sản phẩm hoặc chỉ tiêu KPI. Giữ lại các con số quan trọng.',
          memoryConsolidation: 'Bạn là chuyên gia tối ưu hóa dữ liệu. Hãy tổng hợp nhiều bản ghi nhớ thành một bản "SIÊU TÓM TẮT" duy nhất súc tích, giữ lại toàn bộ con số kpi, chiết khấu và chiến lược cốt lõi.',
          kpiAnalysis: 'Bạn là chuyên gia tư vấn chiến lược dựa trên dữ liệu KPI và ghi nhớ hệ thống.'
        },
        skuTiers: [
          { threshold: 3.3, score: 4.0 },
          { threshold: 3.5, score: 4.5 },
          { threshold: 3.7, score: 5.0 },
          { threshold: 3.9, score: 5.5 },
          { threshold: 4.1, score: 6.0 },
          { threshold: 4.3, score: 6.5 },
          { threshold: 4.5, score: 7.0 },
          { threshold: 4.7, score: 7.5 }
        ]
      },
      months: Array(12).fill(0).map(() => ({
        salesTarget: 0,
        salesActual: 0,
        coverageTarget: 0,
        coverageActual: 0,
        sales15DaysActual: 0,
        skuActual: 0,
        customName: 'Chỉ tiêu tùy chỉnh',
        customPoints: 0,
      })),
      quarters: Array(4).fill(0).map(() => ({
        custom1Name: 'Chỉ tiêu 1',
        custom1Points: 0,
        custom2Name: 'Chỉ tiêu 2',
        custom2Points: 0,
      })),
      halfYears: Array(2).fill(0).map(() => ({
        customName: 'Chỉ tiêu tùy chỉnh',
        customPoints: 0,
      })),
      updateMonth: (index, data) => set((state) => {
        const newMonths = [...state.months];
        newMonths[index] = { ...newMonths[index], ...data };
        return { months: newMonths };
      }),
      updateQuarter: (index, data) => set((state) => {
        const newQs = [...state.quarters];
        newQs[index] = { ...newQs[index], ...data };
        return { quarters: newQs };
      }),
      updateHalfYear: (index, data) => set((state) => {
        const newHs = [...state.halfYears];
        newHs[index] = { ...newHs[index], ...data };
        return { halfYears: newHs };
      }),
      setSelectedMonthIndex: (index: number) => set({ selectedMonthIndex: index }),
      importData: (data: any) => set((state) => ({
        months: data.months || state.months,
        quarters: data.quarters || state.quarters,
        halfYears: data.halfYears || state.halfYears,
        notes: data.notes || state.notes,
        memories: data.memories || state.memories,
        settings: data.settings || state.settings,
        dailySnapshots: data.dailySnapshots || state.dailySnapshots,
        taskLogs: data.taskLogs || state.taskLogs,
        strategyLogs: data.strategyLogs || state.strategyLogs,
        userProfile: data.userProfile || state.userProfile
      })),
      addNote: (note) => set((state) => ({
        notes: [{ ...note, id: crypto.randomUUID().slice(0, 8), createdAt: Date.now() }, ...state.notes]
      })),
      toggleNote: (id) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, isCompleted: !n.isCompleted } : n)
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(n => n.id !== id)
      })),
      addMemory: (memory) => set((state) => ({
        memories: [{ ...memory, id: crypto.randomUUID().slice(0, 8), createdAt: Date.now() }, ...(state.memories || [])]
      })),
      deleteMemory: (id) => set((state) => ({
        memories: (state.memories || []).filter(n => n.id !== id)
      })),
      setDailyTasks: (tasks, currentKpi) => set({
        dailyTasks: tasks.map(t => ({
          ...t,
          id: crypto.randomUUID().slice(0, 8),
          createdAt: Date.now(),
          done: 0,
          timer: 0,
          isCompleted: false,
          isStarted: false,
          kpiAtStart: currentKpi
        }))
      }),
      toggleDailyTask: (id) => set((state) => ({
        dailyTasks: state.dailyTasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted, done: !t.isCompleted ? (t.target || 0) : 0, isStarted: !t.isCompleted } : t)
      })),
      startDailyTask: (id) => set((state) => ({
        dailyTasks: state.dailyTasks.map(t => t.id === id ? { ...t, isStarted: true } : t)
      })),
      updateDailyTaskProgress: (id, done) => set((state) => ({
        dailyTasks: state.dailyTasks.map(t => t.id === id ? { ...t, done, isCompleted: t.target ? done >= t.target : t.isCompleted, isStarted: true } : t)
      })),
      addDailySnapshot: (snapshot) => set((state) => ({
        dailySnapshots: [...state.dailySnapshots.filter(s => s.date !== snapshot.date), snapshot].slice(-60)
      })),
      logTask: (log) => set((state) => ({
        taskLogs: [{ ...log, id: crypto.randomUUID().slice(0, 8), timestamp: Date.now() }, ...state.taskLogs].slice(0, 100)
      })),
      addStrategyLog: (log) => set((state) => ({
        strategyLogs: [{ ...log, id: crypto.randomUUID().slice(0, 8), timestamp: Date.now() }, ...state.strategyLogs].slice(0, 50)
      })),
      updateUserProfile: (profile) => set((state) => ({
        userProfile: { ...state.userProfile, ...profile }
      })),
      updateSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings }
      })),
      addToast: (toast) => set((state) => ({
        // @ts-ignore
        toasts: [{ ...toast, id: crypto.randomUUID().slice(0, 8) }, ...(state.toasts || [])]
      })),
      removeToast: (id) => set((state) => ({
        // @ts-ignore
        toasts: (state.toasts || []).filter(t => t.id !== id)
      }))
    }),
    {
      name: 'kpi-storage',
    }
  )
);
