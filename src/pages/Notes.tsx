import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { 
  Plus, Trash2, CheckCircle, Circle, Bell
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';

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

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 px-5 pt-8 pb-32 md:pb-12"
    >
      <motion.div variants={itemVariants} className="flex flex-col pt-2 mb-6">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Hệ thống Lời nhắc</p>
        <h1 className="text-2xl font-black text-white tracking-tight">Ghi chú & Lịch</h1>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-6">
        <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl">
          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Nhập việc cần làm..." 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <div className="flex flex-wrap gap-2 mb-1">
              {['urgent', 'customer', 'meeting', 'other'].map(tid => (
                <button 
                  key={tid}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tid ? '' : tid as any)}
                  className={cn(
                    "text-[10px] px-3 py-1.5 rounded-full font-semibold transition-all duration-200 cursor-pointer active:scale-95",
                    selectedTag === tid 
                      ? getTagColor(tid) + " shadow-md" 
                      : 'bg-slate-950/20 text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/15'
                  )}
                >
                  {getTagLabel(tid)}
                </button>
              ))}
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
              </div>
              <button 
                onClick={handleAdd}
                className="bg-yellow-500 hover:bg-yellow-400 text-yellow-950 px-6 py-3 rounded-xl transition-colors font-bold text-xs uppercase"
              >
                Ghi nhớ ngay
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {notes.map((note) => (
            <motion.div 
              key={note.id} 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -1 }}
              className={cn(
                "bg-slate-900/40 rounded-2xl p-4 border border-white/5 flex gap-4 items-start transition-all duration-300 shadow-md hover:shadow-lg hover:border-white/10", 
                note.isCompleted ? "opacity-45 bg-slate-950/20" : ""
              )}
            >
              <button 
                onClick={() => toggleNote(note.id)} 
                className="mt-0.5 cursor-pointer active:scale-90 transition-transform text-slate-500 hover:text-slate-300"
              >
                {note.isCompleted ? <CheckCircle className="w-5 h-5 text-yellow-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap mb-1">
                  {note.tag && <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider", getTagColor(note.tag))}>{getTagLabel(note.tag)}</span>}
                  <p className={cn("text-xs font-semibold leading-relaxed break-words", note.isCompleted ? "line-through text-slate-600" : "text-white")}>{note.text}</p>
                </div>
                {note.reminderTime && <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-1.5">⏱ Chuông báo: {note.reminderTime}</p>}
              </div>
              <button 
                onClick={() => deleteNote(note.id)} 
                className="text-slate-500 hover:text-red-400 active:scale-90 transition-all p-1 hover:bg-red-500/10 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
