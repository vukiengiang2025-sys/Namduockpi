import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'xlsx':
    case 'xls':
      return await parseExcel(file);
    case 'docx':
      return await parseDocx(file);
    case 'pdf':
      return await parsePdf(file);
    case 'txt':
      return await parseTxt(file);
    default:
      throw new Error('Định dạng file không được hỗ trợ. Hãy dùng Excel, PDF, Docx hoặc Txt.');
  }
}

async function parseExcel(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  let text = '';
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert to CSV-like format to maintain some structure
    text += `--- Sheet: ${sheetName} ---\n`;
    text += XLSX.utils.sheet_to_txt(sheet) + '\n\n';
  });
  
  return text;
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument(arrayBuffer);
  const pdf = await loadingTask.promise;
  let text = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    text += strings.join(' ') + '\n';
  }
  
  return text;
}

async function parseTxt(file: File): Promise<string> {
  return await file.text();
}
