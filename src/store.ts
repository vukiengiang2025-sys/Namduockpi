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

export interface KPIWeights {
  sales: number;
  coverage: number;
  month15Days: number;
  sku: number;
}

export interface AppSettings {
  geminiKey: string;
  themeColor: string;
  appTitle?: string;
  appIcon?: string;
  themeMode?: 'dark' | 'light';
  fontFamily?: 'sans' | 'serif' | 'mono';
  bgUrl?: string;
  dashboardLayout?: 'default' | 'details-first';
  kpiWeights?: KPIWeights;
}

interface AppState {
  months: MonthData[];
  quarters: QuarterData[];
  halfYears: HalfYearData[];
  selectedMonthIndex: number;
  notes: Note[];
  settings: AppSettings;
  updateMonth: (index: number, data: Partial<MonthData>) => void;
  updateQuarter: (index: number, data: Partial<QuarterData>) => void;
  updateHalfYear: (index: number, data: Partial<HalfYearData>) => void;
  setSelectedMonthIndex: (index: number) => void;
  importData: (data: any) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  toggleNote: (id: string) => void;
  deleteNote: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonthIndex: new Date().getMonth(),
      notes: [],
      settings: {
        geminiKey: '',
        themeColor: 'blue',
        appTitle: 'Hệ thống báo cáo KPI'
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
      updateSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings }
      }))
    }),
    {
      name: 'kpi-storage',
    }
  )
);

