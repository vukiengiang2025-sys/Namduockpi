import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { 
  Plus, Trash2, CheckCircle, Circle, Bell, BrainCircuit, Sparkles, 
  Loader2, ChevronDown, ChevronUp, FileUp, FileText, X, MessageSquare, 
  Send, RefreshCcw, ArrowLeft
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { summarizeAsMemory, consolidateMemories } from '../services/memoryService';
import { chatWithContext } from '../services/aiService';
import { parseFile } from '../utils/fileParser';
import { cn } from '../lib/utils';

export default function Notes() {
  const { notes, addNote, toggleNote, deleteNote, memories, addMemory, deleteMemory } = useAppStore();
  const [newNote, setNewNote] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderType, setReminderType] = useState<'once' | 'daily'>('once');
  const [selectedTag, setSelectedTag] = useState<'urgent' | 'customer' | 'meeting' | 'other' | ''>('');
  
  // Memory State
  const [newMemoryText, setNewMemoryText] = useState('');
  const [isProcessingMemory, setIsProcessingMemory] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'memories'>('notes');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedContext, setParsedContext] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Chat State
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [showChat, setShowChat] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsParsing(true);
      setParsedContext('');
      setQuickAnswer('');
      setShowChat(false);
      try {
        const text = await parseFile(file);
        setParsedContext(text);
      } catch (err: any) {
        alert("Lỗi khi đọc file: " + err.message);
        setSelectedFile(null);
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleQuickChat = async () => {
    const context = (newMemoryText + "\n" + parsedContext).trim();
    if (!context || !quickQuestion.trim()) return;

    setIsAsking(true);
    try {
      const answer = await chatWithContext(context, quickQuestion);
      setQuickAnswer(answer);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAsking(false);
    }
  };

  const handleAddMemory = async () => {
    const combinedContent = (newMemoryText + "\n" + parsedContext).trim();
    if (!combinedContent) return;
    
    setIsProcessingMemory(true);
    try {
      const memory = await summarizeAsMemory(combinedContent);
      addMemory(memory);
      setNewMemoryText('');
      setSelectedFile(null);
      setParsedContext('');
      setQuickAnswer('');
      setQuickQuestion('');
      setShowChat(false);
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
      <div className="flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Trung tâm tri thức</span>
        </div>
      </div>
      
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-light text-white tracking-tight">Ký ức & <span className="font-bold">Ghi chú</span></h1>
      </div>

      <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Lời nhắc
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
            {/* Input fields as before */}
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
                    onClick={() => setSelectedTag(tid as any)}
                    className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                      selectedTag === tid ? getTagColor(tid) : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
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
              <div key={note.id} className={cn("bg-slate-900/40 rounded-2xl p-4 border border-white/5 flex gap-3", note.isCompleted && "opacity-50")}>
                <button onClick={() => toggleNote(note.id)} className="mt-1">
                  {note.isCompleted ? <CheckCircle className="w-5 h-5 text-yellow-500" /> : <Circle className="w-5 h-5 text-slate-500" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {note.tag && <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-black uppercase", getTagColor(note.tag))}>{getTagLabel(note.tag)}</span>}
                    <p className={cn("text-sm", note.isCompleted ? "line-through text-slate-600" : "text-white")}>{note.text}</p>
                  </div>
                  {note.reminderTime && <p className="text-[10px] text-slate-500">Chuông báo: {note.reminderTime}</p>}
                </div>
                <button onClick={() => deleteNote(note.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'memories' && (
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity:1, y:0}} className="space-y-6">
          <div className="bg-slate-900/40 rounded-3xl p-5 border border-white/5 backdrop-blur-xl">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-400" /> Nạp Trí Thức
                </h2>
                {parsedContext && (
                  <button onClick={() => setShowChat(!showChat)} className="text-[10px] font-bold text-purple-400 hover:underline flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {showChat ? 'Đóng hỏi nhanh' : 'Hỏi nhanh tài liệu'}
                  </button>
                )}
             </div>

             <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                    isParsing ? "border-yellow-500/50 bg-yellow-500/5" : 
                    selectedFile ? "border-purple-500/50 bg-purple-500/5" : 
                    "border-white/10 hover:border-purple-500/30 hover:bg-white/5"
                  )}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.xlsx,.xls,.txt" className="hidden" />
                  
                  {isParsing ? (
                    <>
                      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                      <p className="text-sm font-bold text-yellow-500">Đang đọc tài liệu...</p>
                      <p className="text-[10px] text-slate-500 text-center">Chúng tôi đang trích xuất dữ liệu để nạp vào bộ não AI</p>
                    </>
                  ) : selectedFile ? (
                    <div className="flex items-center gap-4 w-full">
                       <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                          <FileText className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{(selectedFile.size / 1024).toFixed(1)} KB • Sẵn sàng nạp</p>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setParsedContext(''); }} className="p-2 hover:bg-white/10 rounded-xl text-slate-500"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                       <div className="w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center text-slate-500 shadow-inner">
                          <FileUp className="w-7 h-7" />
                       </div>
                       <div className="text-center">
                          <p className="text-sm font-bold text-white">Thả tài liệu vào đây</p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Hỗ trợ PDF, EXCEL, DOCX (Max 10MB)</p>
                       </div>
                    </>
                  )}
                </div>

                <AnimatePresence>
                  {showChat && parsedContext && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="bg-slate-950/50 rounded-2xl p-4 border border-purple-500/20 overflow-hidden"
                    >
                       <p className="text-[10px] font-black text-purple-400 uppercase mb-3 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Truy xuất thông tin nhanh
                       </p>
                       <div className="space-y-4">
                          {quickAnswer && (
                            <div className="bg-purple-500/10 p-3 rounded-xl border border-white/5">
                               <p className="text-[11px] text-slate-300 italic leading-relaxed">"{quickAnswer}"</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                             <input 
                              type="text" 
                              placeholder="Hỏi bất cứ điều gì về tài liệu này..." 
                              value={quickQuestion}
                              onChange={(e) => setQuickQuestion(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleQuickChat()}
                              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-purple-500"
                             />
                             <button 
                               onClick={handleQuickChat}
                               disabled={isAsking || !quickQuestion.trim()}
                               className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-400 disabled:opacity-50 transition-all shadow-lg"
                             >
                               {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <textarea 
                    placeholder="Dán nội dung văn bản hoặc mô tả thêm..." 
                    value={newMemoryText}
                    onChange={(e) => setNewMemoryText(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-sans"
                  />
                  <button 
                    onClick={handleAddMemory}
                    disabled={isProcessingMemory || (!newMemoryText.trim() && !parsedContext)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white py-3.5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3"
                  >
                    {isProcessingMemory ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isProcessingMemory ? 'Đang tóm tắt & nạp...' : 'Nạp vào hệ thống Ký ức'}
                  </button>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kho tri thức đã nạp</h3>
                {memories.length > 2 && (
                  <button onClick={handleConsolidate} className="text-[10px] text-yellow-500 font-bold hover:underline">Tối ưu hóa bộ nhớ</button>
                )}
             </div>
             
             {memories.length === 0 ? (
               <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-600">
                  <BrainCircuit className="w-10 h-10 mb-4 opacity-20" />
                  <p className="text-xs italic">AI đang chờ bạn nạp dữ liệu đầu tiên...</p>
               </div>
             ) : (
               memories.map(mem => (
                 <div key={mem.id} className="bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-hidden">
                    <div 
                      className="p-5 cursor-pointer hover:bg-white/5 transition-all"
                      onClick={() => setExpandedMemoryId(expandedMemoryId === mem.id ? null : mem.id)}
                    >
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {mem.tags.map(t => <span key={t} className="text-[8px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-black uppercase">#{t}</span>)}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteMemory(mem.id); }} className="text-slate-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                       </div>
                       <h4 className="text-sm font-bold text-white mb-2">{mem.title}</h4>
                       <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{mem.summary}</p>
                    </div>
                    
                    <AnimatePresence>
                      {expandedMemoryId === mem.id && (
                        <motion.div initial={{height:0}} animate={{height:'auto'}} exit={{height:0}} className="overflow-hidden bg-slate-950/30">
                           <div className="p-5 border-t border-white/5 space-y-4">
                              <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Thông tin cốt lõi</p>
                                <ul className="space-y-2">
                                   {mem.keyPoints.map((kp, idx) => (
                                     <li key={idx} className="flex gap-3 text-[11px] text-slate-300">
                                        <span className="text-purple-500 font-bold">•</span>
                                        <span className="leading-relaxed">{kp}</span>
                                     </li>
                                   ))}
                                </ul>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <p className="text-[8px] text-slate-600 italic">Nạp ngày {new Date(mem.createdAt).toLocaleDateString('vi-VN')}</p>
                                <button 
                                  onClick={() => { setQuickQuestion(`Giải thích thêm về ${mem.title}`); setShowChat(true); window.scrollTo({top:0, behavior:'smooth'}); }}
                                  className="text-[10px] text-purple-400 font-bold flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3 h-3" /> Truy vấn thêm
                                </button>
                              </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
               ))
             )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
