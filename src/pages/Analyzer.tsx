import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { Sparkles, Upload, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';

export default function Analyzer() {
  const { settings } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fileData, setFileData] = useState<{name: string, content: string} | null>(null);
  const [prompt, setPrompt] = useState('Hãy tóm tắt và đánh giá các dữ liệu trong tài liệu này.');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsReading(true);
    setFileData(null);
    setAnalysisResult('');

    try {
      const buffer = await file.arrayBuffer();
      let extractedText = '';

      if (file.name.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        extractedText = result.value;
      } else if (file.name.endsWith('.xlsx')) {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        extractedText = XLSX.utils.sheet_to_csv(firstSheet);
      } else {
         alert('Vui lòng chọn file .docx hoặc .xlsx');
         setIsReading(false);
         return;
      }

      setFileData({
        name: file.name,
        content: extractedText.substring(0, 15000) // limit to avoid max tokens
      });
    } catch (err) {
      alert('Lỗi khi đọc file');
      console.error(err);
    } finally {
      setIsReading(false);
    }
  };

  const processWithAI = async () => {
    if (!fileData) return;
    if (!settings.geminiKey) {
      alert('Vui lòng nhập Gemini API Key trong phần Cài đặt.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult('');

    try {
      const ai = new GoogleGenAI({ apiKey: settings.geminiKey });
      const fullPrompt = `${prompt}\n\nDữ liệu tài liệu:\n${fileData.content}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt
      });

      if (response.text) {
        setAnalysisResult(response.text);
      }
    } catch (err: any) {
      setAnalysisResult('Lỗi API: ' + err.message);
    } finally {
      setIsAnalyzing(false);
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
        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Trí tuệ nhân tạo</span>
      </div>
      <h1 className="text-2xl font-light text-white tracking-tight mb-8">AI Phân tích <span className="font-bold">Dữ liệu</span></h1>

      <div className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-white/5 backdrop-blur-xl">
        <input 
          type="file" 
          accept=".docx,.xlsx" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        
        {!fileData && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-500/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-500/5 transition-colors gap-3"
          >
            {isReading ? (
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-indigo-400" />
            )}
            <p className="text-sm font-medium text-indigo-300">Nhấn để tải lên file</p>
            <p className="text-xs text-slate-500 text-center">Hỗ trợ .docx, .xlsx</p>
          </div>
        )}

        {fileData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 overflow-hidden">
                {fileData.name.endsWith('xlsx') ? <FileSpreadsheet className="w-5 h-5 text-green-400 shrink-0" /> : <FileText className="w-5 h-5 text-blue-400 shrink-0"/>}
                <span className="text-sm text-slate-300 truncate">{fileData.name}</span>
              </div>
              <button onClick={() => setFileData(null)} className="text-xs text-slate-500 hover:text-white shrink-0 ml-2">Xóa</button>
            </div>

            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
              placeholder="Nhập yêu cầu cho AI (ví dụ: Tóm tắt nội dung...)"
            />

            <button 
              onClick={processWithAI}
              disabled={isAnalyzing}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isAnalyzing ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
            </button>
          </div>
        )}
      </div>

      {analysisResult && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 rounded-3xl p-5 shadow-2xl border border-indigo-500/20 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-300">Kết quả phân tích</h3>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {analysisResult}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
