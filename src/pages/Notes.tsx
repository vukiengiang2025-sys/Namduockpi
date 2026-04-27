import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { Plus, Trash2, CheckCircle, Circle, Bell } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export default function Notes() {
  const { notes, addNote, toggleNote, deleteNote } = useAppStore();
  const [newNote, setNewNote] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderType, setReminderType] = useState<'once' | 'daily'>('once');
  const [selectedTag, setSelectedTag] = useState<'urgent' | 'customer' | 'meeting' | 'other' | ''>('');

  // Request permissions on init
  useEffect(() => {
    const initNotifications = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.log("Notifications request error", e);
      }
    }
    initNotifications();
  }, []);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    
    addNote({
      text: newNote,
      isCompleted: false,
      reminderTime: reminderTime || undefined,
      reminderType: reminderTime ? reminderType : undefined,
      tag: selectedTag || undefined
    });

    if (reminderTime) {
      try {
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const now = new Date();
        now.setHours(hours, minutes, 0, 0);
        if (now.getTime() < Date.now()) {
          now.setDate(now.getDate() + 1);
        }

        const scheduleConfig: any = reminderType === 'daily' 
          ? { at: now, repeats: true, every: 'day' } 
          : { at: now };

        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: selectedTag ? `Nhắc nhở [${selectedTag}]` : "Nhắc nhở công việc",
                body: newNote,
                id: Math.floor(Math.random() * 100000),
                schedule: scheduleConfig
              }
            ]
          });
        } else {
          console.log('Skipped local notification schedule (not native platform)');
        }
      } catch (e) {
        console.error("Local notifications failed", e);
      }
    }

    setNewNote('');
    setReminderTime('');
    setSelectedTag('');
  };

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'customer': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'meeting': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'other':
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getTagLabel = (tag?: string) => {
    switch (tag) {
      case 'urgent': return '#Gấp';
      case 'customer': return '#Khách_hàng';
      case 'meeting': return '#Họp';
      case 'other': return '#Khác';
      default: return '';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 px-5 pt-8 pb-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Quản lý</span>
      </div>
      <h1 className="text-2xl font-light text-white tracking-tight mb-8">Ghi chú & <span className="font-bold">Nhắc nhở</span></h1>

      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl">
        <div className="flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="Việc cần làm..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <div className="flex flex-wrap gap-2 mb-1">
            {[
              { id: 'urgent', label: '#Gấp' },
              { id: 'customer', label: '#Khách_hàng' },
              { id: 'meeting', label: '#Họp' },
              { id: 'other', label: '#Khác' },
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setSelectedTag(t.id as any)}
                className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                  selectedTag === t.id ? getTagColor(t.id) : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
            {selectedTag && (
              <button onClick={() => setSelectedTag('')} className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300">
                Tuỳ chọn xoá thẻ
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="time" 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              {reminderTime && (
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value as 'once' | 'daily')}
                  className="bg-slate-950/50 border border-white/10 rounded-xl px-3 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="once">1 lần</option>
                  <option value="daily">Mỗi ngày</option>
                </select>
              )}
            </div>
            <button 
              onClick={handleAdd}
              className="bg-yellow-500 hover:bg-yellow-400 text-yellow-950 px-4 py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 mt-2 sm:mt-0"
            >
              <Plus className="w-4 h-4" />
              Thêm
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-center text-slate-500 text-sm mt-10">Chưa có ghi chú nào.</p>
        ) : (
          notes.map((note) => (
            <motion.div 
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-slate-900/40 rounded-2xl p-4 border border-white/5 flex items-start gap-3 transition-opacity ${note.isCompleted ? 'opacity-50' : 'opacity-100'}`}
            >
              <button onClick={() => toggleNote(note.id)} className="mt-1 shrink-0">
                {note.isCompleted ? <CheckCircle className="w-5 h-5 text-yellow-500" /> : <Circle className="w-5 h-5 text-slate-500" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {note.tag && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTagColor(note.tag)}`}>
                      {getTagLabel(note.tag)}
                    </span>
                  )}
                  <p className={`text-sm ${note.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{note.text}</p>
                </div>
                {note.reminderTime && (
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
                    <Bell className="w-3 h-3" />
                    Nhắc lúc {note.reminderTime} ({note.reminderType === 'daily' ? 'Mỗi ngày' : '1 lần'})
                  </p>
                )}
              </div>
              <button onClick={() => deleteNote(note.id)} className="text-red-500 hover:text-red-400 p-1 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>

    </motion.div>
  );
}
