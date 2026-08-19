import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  UploadCloud,
  FileText,
  Building,
  Bookmark,
  RefreshCw,
  Database,
  Search,
  CheckCircle2,
  X,
  FolderArchive,
  Zap,
  Calendar,
  Layers,
  ShieldCheck,
  Eye,
  Download,
  ExternalLink,
  ChevronDown,
  Sun,
  Sunset,
  Moon,
  Trash2
} from 'lucide-react';
import { knowledgeHubAPI } from '../../services/api';

const getTimeSegment = (timestampStr) => {
  if (!timestampStr) return 'Afternoon / Noon (12:00 PM - 05:00 PM)';
  const parts = timestampStr.split(' ');
  if (parts.length < 2) return 'Afternoon / Noon (12:00 PM - 05:00 PM)';
  const timeParts = parts[1].split(':');
  const hour = parseInt(timeParts[0], 10);
  if (isNaN(hour)) return 'Afternoon / Noon (12:00 PM - 05:00 PM)';
  if (hour < 12) return 'Morning (08:00 AM - 12:00 PM)';
  if (hour < 17) return 'Afternoon / Noon (12:00 PM - 05:00 PM)';
  return 'Evening & Night (05:00 PM - 12:00 AM)';
};

export default function KnowledgeHubWorkspace({ activeWorkspace, onNavigateToSearch, onNavigateToResponse }) {
  // Navigation tab state: 'records', 'add', or 'chroma'
  const [activeTab, setActiveTab] = useState('records');

  // Records Section State & Filters
  const [recordSearch, setRecordSearch] = useState('');
  const [recordDepartmentFilter, setRecordDepartmentFilter] = useState('all');

  // Add Knowledge Form State
  const [departmentSelect, setDepartmentSelect] = useState('Engineering & Product');
  const [customDepartment, setCustomDepartment] = useState('');
  const [categorySelect, setCategorySelect] = useState('Decision');
  const [customCategory, setCustomCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('High');
  const [tags, setTags] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // History & Vector Store State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryDoc, setSelectedHistoryDoc] = useState(null);

  const [chromaItems, setChromaItems] = useState([]);
  const [totalVectors, setTotalVectors] = useState(0);
  const [chromaLoading, setChromaLoading] = useState(false);
  const [chromaSearch, setChromaSearch] = useState('');
  const [chromaDepartmentFilter, setChromaDepartmentFilter] = useState('all');

  // Accordion Expand/Collapse State (collapsed by default)
  const [expandedDates, setExpandedDates] = useState({});
  const toggleDate = (dateKey) => setExpandedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));

  // View Online PDF Modal
  const [viewPdfModalDoc, setViewPdfModalDoc] = useState(null);

  useEffect(() => {
    fetchHistory();
    fetchChromaHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await knowledgeHubAPI.getHistory();
      if (res && res.history) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchChromaHistory = async () => {
    setChromaLoading(true);
    try {
      const res = await knowledgeHubAPI.getChromaHistory();
      if (res && res.items) {
        setChromaItems(res.items);
        setTotalVectors(res.total_vectors || res.items.length);
      }
    } catch (err) {
      console.error('Failed to fetch ChromaDB history:', err);
    } finally {
      setChromaLoading(false);
    }
  };

  const handleDeleteRecord = async (item, isVectorStore = false) => {
    const itemName = item.name || item.filename || item.id;
    if (!window.confirm(`Are you sure you want to delete ${isVectorStore ? 'this vector chunk' : 'this document record'} (${itemName})?`)) return;

    try {
      if (isVectorStore) {
        await knowledgeHubAPI.deleteChromaVector(item.id);
        setChromaItems((prev) => prev.filter((chunk) => chunk.id !== item.id));
        setTotalVectors((prev) => Math.max(0, prev - 1));
      } else {
        const recordId = item.id || item.name || item.filename;
        await knowledgeHubAPI.deleteRecord(recordId);
        setHistoryList((prev) => prev.filter((rec) => (rec.id !== item.id && rec.name !== item.name)));
        fetchChromaHistory();
      }
    } catch (err) {
      console.error('Delete record error:', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all uploaded files, ChromaDB vectors, and PostgreSQL records? This action cannot be undone.')) {
      try {
        await knowledgeHubAPI.clearAllData();
        await fetchHistory();
        await fetchChromaHistory();
      } catch (err) {
        console.error('Failed to clear data:', err);
      }
    }
  };

  const handleViewOnline = (item) => {
    setViewPdfModalDoc(item);
  };

  const handleDownloadFile = (item) => {
    const fileName = item.name || 'document';
    const content = `COGNIVA ENTERPRISE RECORD\nTITLE: ${item.title || fileName}\nCATEGORY: ${item.category || 'General'}\nDEPARTMENT: ${item.department || 'General'}\nDATE: ${item.timestamp || ''}\n\nCONTENT / DESCRIPTION:\n${item.description || item.reason || 'Physical file record payload.'}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.includes('.') ? fileName : `${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadChunk = (item) => {
    const fileName = item.filename || item.name || 'chunk';
    const chunkContent = item.preview || item.description || 'ChromaDB Vector Store Chunk Payload';
    const blob = new Blob([chunkContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_chunk.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() && !selectedFile) {
      setErrorMessage('Please provide a Knowledge Title or attach a document to upload.');
      return;
    }

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const finalDept = departmentSelect === 'Custom' ? customDepartment || 'General' : departmentSelect;
    const finalCat = categorySelect === 'Custom' ? customCategory || 'General' : categorySelect;

    try {
      if (selectedFile) {
        await knowledgeHubAPI.uploadDocument(selectedFile);
      } else {
        await knowledgeHubAPI.addTextKnowledge({
          title,
          description,
          department: finalDept,
          category: finalCat,
          reason,
          priority,
          tags: tags.join(',')
        });
      }

      setSuccessMessage(
        selectedFile
          ? `Document "${selectedFile.name}" successfully uploaded & vector indexed into ChromaDB!`
          : `Knowledge record "${title}" successfully indexed into ChromaDB & PostgreSQL!`
      );

      setTitle('');
      setDescription('');
      setReason('');
      setTags([]);
      setSelectedFile(null);
      setCustomDepartment('');
      setCustomCategory('');

      fetchHistory();
      fetchChromaHistory();
    } catch (err) {
      console.error('Error saving knowledge entry:', err);
      setErrorMessage(err.message || 'Failed to index knowledge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter ALL Uploaded Records
  const filteredFileRecords = historyList.filter((item) => {
    const itemName = item.name || item.filename || item.title || '';
    const matchesSearch =
      recordSearch === '' ||
      itemName.toLowerCase().includes(recordSearch.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(recordSearch.toLowerCase())) ||
      (item.department && item.department.toLowerCase().includes(recordSearch.toLowerCase()));

    const matchesDepartment =
      recordDepartmentFilter === 'all' ||
      (item.department && item.department.toLowerCase().includes(recordDepartmentFilter.toLowerCase()));

    return matchesSearch && matchesDepartment;
  });

  const groupedRecordsByDateAndTime = filteredFileRecords.reduce((acc, item) => {
    const rawDate = item.timestamp ? item.timestamp.split(' ')[0] : new Date().toISOString().split('T')[0];
    const timeSegment = getTimeSegment(item.timestamp);

    if (!acc[rawDate]) acc[rawDate] = {};
    if (!acc[rawDate][timeSegment]) {
      acc[rawDate][timeSegment] = [];
    }

    acc[rawDate][timeSegment].push(item);
    return acc;
  }, {});

  const sortedRecordDates = Object.keys(groupedRecordsByDateAndTime).sort((a, b) => (a < b ? 1 : -1));

  // Filtered Chroma Vector Items
  const filteredChromaItems = chromaItems.filter((item) => {
    const itemName = item.filename || item.name || item.id || '';
    const matchesSearch =
      chromaSearch === '' ||
      itemName.toLowerCase().includes(chromaSearch.toLowerCase()) ||
      (item.preview && item.preview.toLowerCase().includes(chromaSearch.toLowerCase())) ||
      (item.department && item.department.toLowerCase().includes(chromaSearch.toLowerCase()));

    const matchesDepartment =
      chromaDepartmentFilter === 'all' ||
      (item.department && item.department.toLowerCase().includes(chromaDepartmentFilter.toLowerCase()));

    return matchesSearch && matchesDepartment;
  });

  const groupedChromaByDateAndTime = filteredChromaItems.reduce((acc, item) => {
    const rawDate = item.timestamp ? item.timestamp.split(' ')[0] : new Date().toISOString().split('T')[0];
    const timeSegment = getTimeSegment(item.timestamp);

    if (!acc[rawDate]) acc[rawDate] = {};
    if (!acc[rawDate][timeSegment]) {
      acc[rawDate][timeSegment] = [];
    }

    acc[rawDate][timeSegment].push(item);
    return acc;
  }, {});

  const sortedChromaDates = Object.keys(groupedChromaByDateAndTime).sort((a, b) => (a < b ? 1 : -1));

  const renderRecordsTable = (data, isVectorStore = false) => (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
      <table className="w-full text-left text-xs text-slate-700 font-sans border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold text-slate-500">
          <tr>
            <th className="py-3 px-4">Record Name / Title</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Department</th>
            <th className="py-3 px-4">Size / Length</th>
            <th className="py-3 px-4">Accurate Timestamp</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data && data.length > 0 ? (
            data.map((item, idx) => {
              const fileName = item.filename || item.name || 'Uploaded Document';
              const chunkIndexDisplay = item.chunk_index !== undefined ? item.chunk_index + 1 : idx + 1;
              const chunkTitle = isVectorStore ? `${fileName} (Chunk #${chunkIndexDisplay})` : fileName;
              const chunkTypeDisplay = isVectorStore ? 'Document Chunk' : (item.type || item.category || 'PDF Document');

              return (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      {isVectorStore ? (
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span className="truncate max-w-[240px]" title={chunkTitle}>
                        {chunkTitle}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isVectorStore
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                      {chunkTypeDisplay}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{item.department || 'Engineering'}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {item.size_formatted || (item.char_count ? `${item.char_count} chars` : '420 chars')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {item.timestamp || '2026-08-05 21:41'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <button
                        onClick={() => setSelectedHistoryDoc(item)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>{isVectorStore ? 'Inspect Chunk Payload' : 'Inspect'}</span>
                      </button>

                      {!isVectorStore && (
                        <button
                          onClick={() => handleViewOnline(item)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View Online</span>
                        </button>
                      )}

                      <button
                        onClick={() => (isVectorStore ? handleDownloadChunk(item) : handleDownloadFile(item))}
                        className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isVectorStore ? 'Download Chunk' : 'Download'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRecord(item, isVectorStore)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                        title={isVectorStore ? 'Delete ChromaDB vector chunk' : 'Delete document record'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                No records found matching your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="w-full p-8 space-y-8 select-none text-left font-sans text-slate-900">
      {/* UNIFIED KNOWLEDGE HUB HEADER CARD WITH INTEGRATED TABS */}
      <div className="bg-indigo-600 text-white border border-indigo-500 rounded-2xl p-6 shadow-lg shadow-indigo-500/20 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center shadow-xs shrink-0">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Knowledge Hub</h1>


            </div>
            <p className="text-sm text-indigo-100 font-medium mt-1">
              Upload, organize, and manage the knowledge your team needs.
            </p>
          </div>
        </div>

        {/* 3 Integrated Navigation Tab Buttons */}
        <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-md p-1.5 rounded-xl border border-white/20 relative z-10 self-start xl:self-auto shrink-0">
          <button
            onClick={() => {
              setActiveTab('records');
              fetchHistory();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'records'
              ? 'bg-white text-indigo-600 shadow-md font-extrabold'
              : 'text-white hover:bg-white/15'
              }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Records</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'add'
              ? 'bg-white text-indigo-600 shadow-md font-extrabold'
              : 'text-white hover:bg-white/15'
              }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Knowledge</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('chroma');
              fetchChromaHistory();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'chroma'
              ? 'bg-white text-indigo-600 shadow-md font-extrabold'
              : 'text-white hover:bg-white/15'
              }`}
          >
            <Zap className="w-4 h-4" />
            <span>ChromaDB Vectors</span>
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <X className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: RECORDS SECTION */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-indigo-600 border border-indigo-500/40 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-indigo-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">INDEXED DOCUMENTS</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 text-2xl font-extrabold text-white">{filteredFileRecords.length}</div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">PostgreSQL Physical File Entries</p>
            </div>

            <div className="bg-indigo-600 border border-indigo-500/40 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-indigo-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">VECTOR CHUNKS</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 text-2xl font-extrabold text-white">{totalVectors}</div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">Active ChromaDB Vector Chunks</p>
            </div>

            <div className="bg-indigo-600 border border-indigo-500/40 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-indigo-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">DEPARTMENTS</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 text-2xl font-extrabold text-white">
                {new Set(filteredFileRecords.map((h) => h.department).filter(Boolean)).size || 5}
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">Active Organizational Units</p>
            </div>

            <div className="bg-indigo-600 border border-indigo-500/40 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-indigo-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">VECTOR ENGINE</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 text-base font-bold text-white flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Operational</span>
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">384-d Cosine Metric Ready</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
                <FolderArchive className="w-5.5 h-5.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">Records Inventory</h2>

                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Inspect, view online, and download physical files uploaded by employees grouped by date and timestamp.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchHistory}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                <span>Sync Records</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Wipe all uploaded physical files, ChromaDB vectors, and PostgreSQL records"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All Data</span>
              </button>

              <button
                onClick={() => setActiveTab('add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  placeholder="Search records by filename or department..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs w-full md:w-auto justify-end">
                <Building className="w-4 h-4 text-slate-400" />
                <select
                  value={recordDepartmentFilter}
                  onChange={(e) => setRecordDepartmentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  <option value="engineering">Engineering & Product</option>
                  <option value="hr">HR & Governance</option>
                  <option value="finance">Finance & Legal</option>
                  <option value="general">General Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {sortedRecordDates.length > 0 ? (
            sortedRecordDates.map((dateStr, idx) => {
              const timeSegments = groupedRecordsByDateAndTime[dateStr];
              const segmentKeys = Object.keys(timeSegments);
              const totalDocsInDate = segmentKeys.reduce((acc, seg) => acc + (timeSegments[seg]?.length || 0), 0);
              const isExpanded = expandedDates[dateStr] !== undefined ? Boolean(expandedDates[dateStr]) : (idx === 0);

              return (
                <div key={dateStr} className="bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl shadow-xs overflow-hidden transition-all">
                  <div
                    onClick={() => toggleDate(dateStr)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          📅 Date: {dateStr === new Date().toISOString().split('T')[0] ? `Today (${dateStr})` : dateStr}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {totalDocsInDate} {totalDocsInDate === 1 ? 'Record' : 'Records'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-400">
                      <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                        {isExpanded ? 'Hide History' : 'View History'}
                      </span>
                      <div className={`p-1 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-indigo-50 text-indigo-600' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                      {segmentKeys.map((segmentName) => {
                        const records = timeSegments[segmentName];
                        if (!records || records.length === 0) return null;

                        return (
                          <div key={segmentName} className="mb-6 last:mb-0 space-y-3">
                            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                              {segmentName.includes('Morning') ? (
                                <Sun className="w-4 h-4 text-amber-500" />
                              ) : segmentName.includes('Afternoon') ? (
                                <Sunset className="w-4 h-4 text-orange-500" />
                              ) : (
                                <Moon className="w-4 h-4 text-indigo-500" />
                              )}
                              <span className="uppercase tracking-wider font-extrabold">{segmentName}</span>
                            </div>
                            {renderRecordsTable(records, false)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 text-base">No employee uploaded records found.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD KNOWLEDGE FORM */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
                <PlusCircle className="w-5.5 h-5.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">Add Enterprise Knowledge</h2>
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">
                    Vector Store Indexer
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Upload PDF/DOCX documents or submit structured text entries to automatically index into ChromaDB & PostgreSQL.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Department
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={departmentSelect}
                    onChange={(e) => setDepartmentSelect(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Engineering & Product">Engineering & Product</option>
                    <option value="HR & Governance">HR & Governance</option>
                    <option value="Finance & Legal">Finance & Legal</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="IT & Infrastructure">IT & Infrastructure</option>
                    <option value="General Enterprise">General Enterprise</option>
                    <option value="Custom">+ Custom Department...</option>
                  </select>
                </div>

                {departmentSelect === 'Custom' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      placeholder="Type custom department name..."
                      className="w-full px-4 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category
                </label>
                <div className="relative">
                  <Bookmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={categorySelect}
                    onChange={(e) => setCategorySelect(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Decision">Decision</option>
                    <option value="Company Policy">Company Policy</option>
                    <option value="SOP (Standard Operating Procedure)">SOP (Standard Operating Procedure)</option>
                    <option value="Meeting Notes">Meeting Notes</option>
                    <option value="Incident Report">Incident Report</option>
                    <option value="Architecture Spec">Architecture Spec</option>
                    <option value="Custom">+ Custom Category...</option>
                  </select>
                </div>

                {categorySelect === 'Custom' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Type custom category name..."
                      className="w-full px-4 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a short, clear title"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Description / Document Body <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">{description.length} / 1000</span>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of this knowledge..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Upload Employee Document (PDF, DOCX, TXT)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-8 text-center transition-all cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.ppt,.pptx,.txt"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedFile ? (
                      <span className="text-indigo-600 font-bold flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>Attached: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      </span>
                    ) : (
                      <span>Upload File - Drag and drop files here or click to browse</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Supports PDF, DOCX, PPTX, TXT (Max 20MB)</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Indexing Document into Vector Store...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Save Record & Index Document</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: CHROMADB VECTOR STORE */}
      {activeTab === 'chroma' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-indigo-600 border border-indigo-500/40 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-indigo-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">TOTAL VECTOR CHUNKS</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 text-2xl font-extrabold text-white">{totalVectors} Chunks</div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">Payload Chunks in Vector Store</p>
            </div>

            <div className="bg-indigo-600 border border-indigo-500/40 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-indigo-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">VECTOR DIMENSIONS</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 text-2xl font-extrabold text-white">384-d</div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">Dense Float32 Embedding Space</p>
            </div>

            <div className="bg-indigo-600 border border-indigo-500/40 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-indigo-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">EMBEDDING MODEL</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 text-base font-bold text-white">all-MiniLM-L6-v2</div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">SentenceTransformer Engine</p>
            </div>

            <div className="bg-indigo-600 border border-indigo-500/40 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-indigo-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">DISTANCE METRIC</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 text-base font-bold text-white">Cosine Similarity</div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">High-Precision Indexing</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
                <Zap className="w-5.5 h-5.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">ChromaDB Vector Store</h2>
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">
                    Dense Semantic Embeddings
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Inspect dense 384-dimensional vector payload chunks indexed with filename metadata and timestamp separation.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchChromaHistory}
                disabled={chromaLoading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${chromaLoading ? 'animate-spin' : ''}`} />
                <span>Re-Scan Vectors</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Wipe all uploaded physical files, ChromaDB vectors, and PostgreSQL records"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All Data</span>
              </button>

              <button
                onClick={() => setActiveTab('add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Vector Knowledge</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={chromaSearch}
                  onChange={(e) => setChromaSearch(e.target.value)}
                  placeholder="Search vector chunks by title, payload text or timestamp..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs w-full md:w-auto justify-end">
                <Building className="w-4 h-4 text-slate-400" />
                <select
                  value={chromaDepartmentFilter}
                  onChange={(e) => setChromaDepartmentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  <option value="engineering">Engineering & Product</option>
                  <option value="hr">HR & Governance</option>
                  <option value="finance">Finance & Legal</option>
                  <option value="general">General Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {sortedChromaDates.length > 0 ? (
            sortedChromaDates.map((dateStr, idx) => {
              const timeSegments = groupedChromaByDateAndTime[dateStr];
              const segmentKeys = Object.keys(timeSegments);
              const totalChunksInDate = segmentKeys.reduce((acc, seg) => acc + (timeSegments[seg]?.length || 0), 0);
              const isExpanded = expandedDates[`chroma_${dateStr}`] !== undefined ? Boolean(expandedDates[`chroma_${dateStr}`]) : (idx === 0);

              return (
                <div key={dateStr} className="bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl shadow-xs overflow-hidden transition-all">
                  <div
                    onClick={() => toggleDate(`chroma_${dateStr}`)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          📅 Date: {dateStr === new Date().toISOString().split('T')[0] ? `Today (${dateStr})` : dateStr}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {totalChunksInDate} {totalChunksInDate === 1 ? 'Chunk' : 'Chunks'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-400">
                      <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                        {isExpanded ? 'Hide Chunks' : 'View Chunks'}
                      </span>
                      <div className={`p-1 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-indigo-50 text-indigo-600' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                      {segmentKeys.map((segmentName) => {
                        const chunks = timeSegments[segmentName];
                        if (!chunks || chunks.length === 0) return null;

                        return (
                          <div key={segmentName} className="mb-6 last:mb-0 space-y-3">
                            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                              {segmentName.includes('Morning') ? (
                                <Sun className="w-4 h-4 text-amber-500" />
                              ) : segmentName.includes('Afternoon') ? (
                                <Sunset className="w-4 h-4 text-orange-500" />
                              ) : (
                                <Moon className="w-4 h-4 text-indigo-500" />
                              )}
                              <span className="uppercase tracking-wider font-extrabold">{segmentName}</span>
                            </div>
                            {renderRecordsTable(chunks, true)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 text-base">No active ChromaDB vector store chunks found.</p>
            </div>
          )}
        </div>
      )}

      {/* INSPECT MODAL */}
      {selectedHistoryDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-xl text-left">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {selectedHistoryDoc.filename ? <Zap className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {selectedHistoryDoc.filename || selectedHistoryDoc.name || selectedHistoryDoc.title || 'Record Detail'}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <span>Department: {selectedHistoryDoc.department || 'Engineering'}</span>
                    <span>•</span>
                    <span>Category: {selectedHistoryDoc.category || selectedHistoryDoc.type || 'Document'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryDoc(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Timestamp</span>
                  <span className="text-slate-800 font-bold font-mono">{selectedHistoryDoc.timestamp || '2026-08-05 21:41'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">File Extension / Size</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {selectedHistoryDoc.extension || '.pdf'} ({selectedHistoryDoc.size_formatted || '14.2 KB'})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Document Payload Content / Abstract
                </span>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed max-h-60 overflow-y-auto border border-slate-800 shadow-inner">
                  {selectedHistoryDoc.preview || selectedHistoryDoc.description || selectedHistoryDoc.reason || 'No text payload available.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedHistoryDoc(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONLINE PDF VIEWER MODAL */}
      {viewPdfModalDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {viewPdfModalDoc.name || viewPdfModalDoc.filename || 'Document Online Viewer'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Department: {viewPdfModalDoc.department || 'General'} • {viewPdfModalDoc.timestamp || '2026-08-05'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadFile(viewPdfModalDoc)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original</span>
                </button>
                <button
                  onClick={() => setViewPdfModalDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex flex-col items-center">
              <div className="bg-white border border-slate-200 rounded-xl shadow-md p-8 max-w-2xl w-full space-y-6 text-left font-sans">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                      {viewPdfModalDoc.extension || '.pdf'} Document
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{viewPdfModalDoc.size_formatted || 'Enterprise Document'}</span>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-slate-800">
                  <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                    {viewPdfModalDoc.title || viewPdfModalDoc.name || 'Document Content Preview'}
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {viewPdfModalDoc.preview || viewPdfModalDoc.description || viewPdfModalDoc.reason || 'Document content payload rendered for online inspection.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
