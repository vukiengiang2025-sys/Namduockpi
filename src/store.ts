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
    coverage: number; // 0.0 - 2.0 (1.0 is baseline)
    sales: number;
    sku: number;
  };
  preferredHours?: {
    morning: number; // weight
    afternoon: number;
  };
}

export interface StrategyLog {
  id: string;
  focus: string;
  successScore: number; // 0-100 based on KPI growth vs target
  monthIndex: number;
  timestamp: number;
}

export interface DailyTask {
  id: string;
  text: string;
  target?: number;
  done: number;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
  expectedImpact?: string;
  confidence?: number;
  createdAt: number;
  kpiAtStart?: number;
}

export interface WeeklyReport {
  id: string;
  startDate: string;
  endDate: string;
  monthIndex: number;
  stats: {
    avgKpiScore: number;
    salesGrowth: number;
    tasksCompletionRate: number;
    topPerformers: string[];
    attribution: {
      organic: number; // % contribution from trend
      effort: number;  // % contribution from actions
    };
  };
  analysis: {
    why: string;
    focus: string;
    actionPlan: string[];
    bestActionType: string;
  };
  createdAt: number;
}

export interface AIAction {
  task: string;
  priority: 'high' | 'medium' | 'low';
  target?: number;
  impact?: string;
  confidence: number;
  confidenceDetails?: {
    dataQuality: number;
    historicalSupport: number;
    memoryMatch: number;
  };
  type?: 'coverage' | 'sales' | 'sku' | 'other';
}

export interface AIInsight {
  status: 'tốt' | 'nguy hiểm' | 'rất nguy hiểm' | string;
  main_issue: string;
  actions: AIAction[];
  daily_target?: string;
  references?: string[];
  riskAlert?: string;
}

export interface DailySnapshot {
  date: string; // YYYY-MM-DD
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
  geminiKey: string;
  geminiModel?: string;
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

interface AppState {
  months: MonthData[];
  quarters: QuarterData[];
  halfYears: HalfYearData[];
  selectedMonthIndex: number;
  notes: Note[];
  memories: Memory[];
  dailyTasks: DailyTask[];
  dailySnapshots: DailySnapshot[];
  weeklyReports: WeeklyReport[];
  taskLogs: TaskLog[];
  strategyLogs: StrategyLog[];
  userProfile: UserProfile;
  lastInsight: AIInsight | null;
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
  setDailyTasks: (tasks: Omit<DailyTask, 'id' | 'createdAt' | 'done' | 'isCompleted'>[], currentKpi?: number) => void;
  toggleDailyTask: (id: string) => void;
  updateDailyTaskProgress: (id: string, done: number) => void;
  addDailySnapshot: (snapshot: DailySnapshot) => void;
  addWeeklyReport: (report: WeeklyReport) => void;
  logTask: (log: Omit<TaskLog, 'id' | 'timestamp'>) => void;
  addStrategyLog: (log: Omit<StrategyLog, 'id' | 'timestamp'>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setLastInsight: (insight: AIInsight | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonthIndex: new Date().getMonth(),
      notes: [],
      memories: [],
      dailyTasks: [],
      dailySnapshots: [],
      weeklyReports: [],
      taskLogs: [],
      strategyLogs: [],
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
      lastInsight: null,
      settings: {
        geminiKey: '',
        geminiModel: 'gemini-3-flash-preview',
        themeColor: 'blue',
        appTitle: 'NAMDUOC KPI',
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
        settings: data.settings || state.settings
      })),
      addNote: (note) => set((state) => ({
        notes: [{ ...note, id: Math.random().toString(36).substring(2, 9), createdAt: Date.now() }, ...state.notes]
      })),
      toggleNote: (id) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, isCompleted: !n.isCompleted } : n)
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(n => n.id !== id)
      })),
      addMemory: (memory) => set((state) => ({
        memories: [{ ...memory, id: Math.random().toString(36).substring(2, 9), createdAt: Date.now() }, ...(state.memories || [])]
      })),
      deleteMemory: (id) => set((state) => ({
        memories: (state.memories || []).filter(n => n.id !== id)
      })),
      setDailyTasks: (tasks, currentKpi) => set({
        dailyTasks: tasks.map(t => ({
          ...t,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          done: 0,
          isCompleted: false,
          kpiAtStart: currentKpi
        }))
      }),
      toggleDailyTask: (id) => set((state) => ({
        dailyTasks: state.dailyTasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted, done: !t.isCompleted ? (t.target || 0) : 0 } : t)
      })),
      updateDailyTaskProgress: (id, done) => set((state) => ({
        dailyTasks: state.dailyTasks.map(t => t.id === id ? { ...t, done, isCompleted: t.target ? done >= t.target : t.isCompleted } : t)
      })),
      addDailySnapshot: (snapshot) => set((state) => ({
        dailySnapshots: [...state.dailySnapshots.filter(s => s.date !== snapshot.date), snapshot].slice(-60) // Keep 2 months
      })),
      addWeeklyReport: (report) => set((state) => ({
        weeklyReports: [report, ...state.weeklyReports].slice(0, 52) // Keep 1 year
      })),
      logTask: (log) => set((state) => ({
        taskLogs: [{ ...log, id: Math.random().toString(36).substring(2, 9), timestamp: Date.now() }, ...state.taskLogs].slice(0, 100)
      })),
      addStrategyLog: (log) => set((state) => ({
        strategyLogs: [{ ...log, id: Math.random().toString(36).substring(2, 9), timestamp: Date.now() }, ...state.strategyLogs].slice(0, 50)
      })),
      updateUserProfile: (profile) => set((state) => ({
        userProfile: { ...state.userProfile, ...profile }
      })),
      setLastInsight: (lastInsight) => set({ lastInsight }),
      updateSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings }
      }))
    }),
    {
      name: 'kpi-storage',
    }
  )
);

