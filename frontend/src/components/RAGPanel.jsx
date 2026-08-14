import React, { useState, useRef } from 'react';
import { useChat } from '../hooks/useChat';

const RAGPanel = ({ onClose }) => {
  const { uploadPDFs } = useChat();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setStatus(null);
    try {
      const res = await uploadPDFs(files);
      setStatus({ type: 'success', message: res.messages || `Successfully processed ${files.length} documents!` });
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to process documents. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-sage-200">
        <div className="px-6 py-4 border-b border-sage-100 flex justify-between items-center bg-warm-50/50">
          <h2 className="font-bold text-warm-800 text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Knowledge Base
          </h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-700 p-1 rounded-full hover:bg-warm-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-warm-600">
            Upload PDF documents to train YogaKickFit AI on your own custom knowledge (e.g. specialized yoga manuals, kickboxing guides).
          </p>
          
          <div 
            className="border-2 border-dashed border-sage-300 rounded-xl p-8 text-center cursor-pointer hover:bg-sage-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              multiple 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <svg className="mx-auto h-12 w-12 text-sage-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <p className="text-sm font-medium text-warm-700">Click to browse or drag and drop</p>
            <p className="text-xs text-warm-400 mt-1">PDF files only (max 10MB each)</p>
          </div>

          {files.length > 0 && (
            <div className="bg-sage-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <ul className="text-sm text-warm-700 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-sage-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                    <span className="truncate">{f.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status && (
            <div className={`p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {status.message}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-sage-100 flex justify-end gap-3 bg-warm-50/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-warm-600 hover:text-warm-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-sage-600 rounded-lg shadow hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {uploading ? (
              <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...</>
            ) : 'Upload to Knowledge Base'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RAGPanel;
