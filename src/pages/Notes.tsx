import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { Plus, Trash2, CheckCircle, Circle, Bell, BrainCircuit, Sparkles, Loader2, ChevronDown, ChevronUp, FileUp, FileText, X } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { summarizeAsMemory, consolidateMemories } from '../services/memoryService';
import { parseFile } from '../utils/fileParser';

export default function Notes() {
  const { notes, addNote, toggleNote, deleteNote, memories, addMemory, deleteMemory } = useAppStore();
  const [newNote, setNewNote] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderType, setReminderType] = useState<'once' | 'daily'>('once');
  const [selectedTag, setSelectedTag] = useState<'urgent' | 'customer' | 'meeting' | 'other' | ''>('');
  
  // Memory State
  const [newMemoryText, setNewMemoryText] = useState('');
  const [isProcessingMemory, setIsProcessingMemory] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'memories'>('notes');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemoryText.trim() && !selectedFile) return;
    
    setIsProcessingMemory(true);
    try {
      let finalContent = newMemoryText;

      if (selectedFile) {
        const parsedText = await parseFile(selectedFile);
        finalContent = finalContent 
          ? `Nội dung mô tả: ${finalContent}\n\nDữ liệu từ file (${selectedFile.name}):\n${parsedText}`
          : parsedText;
      }

      const memory = await summarizeAsMemory(finalContent);
      addMemory(memory);
      setNewMemoryText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Đã tóm tắt và lưu Ký ức thành công!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessingMemory(false);
    }
  };

  const handleConsolidate = async () => {
    if (memories.length < 2) return;
    if (!confirm('AI sẽ gộp toàn bộ ký ức hiện tại thành một bản tóm tắt chiến lược duy nhất để tối ưu dung lượng và tốc độ xử lý. Bạn có chắc không?')) return;

    setIsConsolidating(true);
    try {
      const consolidated = await consolidateMemories(memories);
      
      // Delete old memories and add the new one
      for (const m of memories) {
        deleteMemory(m.id);
      }
      
      addMemory(consolidated);
      alert('Đã gộp và tối ưu hóa ký ức thành công!');
    } catch (error: any) {
      alert('Lỗi khi gộp ký ức: ' + error.message);
    } finally {
      setIsConsolidating(false);
    }
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
      <h1 className="text-2xl font-light text-white tracking-tight mb-6">Trí thức & <span className="font-bold">Ghi chú</span></h1>

      <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Nhắc nhở
        </button>
        <button
          onClick={() => setActiveTab('memories')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'memories' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <BrainCircuit className="w-4 h-4" />
          Ký ức AI
        </button>
      </div>

      {activeTab === 'notes' && (
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity:1, y:0}} className="space-y-6">
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
      )}

      {activeTab === 'memories' && (
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity:1, y:0}} className="space-y-6">
          <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl">
            <h2 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              Nạp dữ liệu cho AI
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Nạp dữ liệu (văn bản hoặc file Excel, PDF, Docx). AI sẽ đọc, tóm tắt và ghi nhớ để tư vấn chiến lược cho bạn mỗi ngày.
            </p>
            <div className="flex flex-col gap-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  selectedFile 
                    ? 'border-purple-500/50 bg-purple-500/5' 
                    : 'border-white/10 hover:border-purple-500/30 hover:bg-white/5'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.xlsx,.xls,.txt"
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-400 mb-1">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">Tải lên tài liệu</p>
                    <p className="text-[10px] text-slate-500">Hỗ trợ PDF, Docx, Excel, Txt</p>
                  </>
                )}
              </div>

              <textarea 
                placeholder="Mô tả thêm về tài liệu hoặc dán nội dung văn bản..." 
                value={newMemoryText}
                onChange={(e) => setNewMemoryText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-sans"
              />
              <button 
                onClick={handleAddMemory}
                disabled={isProcessingMemory || !newMemoryText.trim()}
                className="bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isProcessingMemory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isProcessingMemory ? 'AI Đang đọc & lưu...' : 'Lưu vào Ký ức'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {memories && memories.length >= 2 && (
              <button 
                onClick={handleConsolidate}
                disabled={isConsolidating}
                className="w-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-2xl py-3 text-xs text-purple-300 font-bold flex items-center justify-center gap-2 mb-4"
              >
                {isConsolidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {isConsolidating ? 'Đang tối ưu hóa bộ nhớ...' : 'Gộp tất cả ký ức (Tối ưu cho AI)'}
              </button>
            )}

            {!memories || memories.length === 0 ? (
              <p className="text-center text-slate-500 text-sm mt-10">AI chưa có ký ức nào.</p>
            ) : (
              memories.map((mem) => (
                <motion.div 
                  key={mem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 transition-opacity"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedMemoryId(expandedMemoryId === mem.id ? null : mem.id)}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {mem.tags.map(t => (
                          <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1">{mem.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{mem.summary}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <button onClick={() => deleteMemory(mem.id)} className="text-red-500 hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExpandedMemoryId(expandedMemoryId === mem.id ? null : mem.id)} className="text-slate-400 p-1">
                        {expandedMemoryId === mem.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedMemoryId === mem.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Điểm mấu chốt:</p>
                          <ul className="space-y-1.5">
                            {mem.keyPoints.map((kp, idx) => (
                              <li key={idx} className="flex gap-2 text-xs text-slate-300 items-start">
                                <span className="text-purple-400 font-bold">•</span>
                                <span>{kp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
