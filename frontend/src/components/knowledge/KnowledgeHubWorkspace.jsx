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
  Trash2,
  Clock,
  Timer,
  Info,
  TriangleAlert,
  Lock,
  Building2
} from 'lucide-react';
import { knowledgeHubAPI, adminAPI, API_BASE_URL } from '../../services/api';

const formatDisplayTimestamp = (ts) => {
  if (!ts) return 'Just now';
  if (/am|pm/i.test(ts)) return ts;
  
  const parts = ts.split(' ');
  if (parts.length >= 2) {
    const [datePart, timePart] = parts;
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (!isNaN(h)) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${datePart} ${String(h12).padStart(2, '0')}:${m} ${ampm}`;
    }
  }
  return ts;
};

const getTimeSegment = (timestampStr) => {
  if (!timestampStr) return 'Afternoon / Noon (12:00 PM - 05:00 PM)';
  const lower = timestampStr.toLowerCase();
  if (lower.includes('pm') || lower.includes('am')) {
    const match = timestampStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const ampm = match[3].toLowerCase();
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      if (hour < 12) return 'Morning (08:00 AM - 12:00 PM)';
      if (hour < 17) return 'Afternoon / Noon (12:00 PM - 05:00 PM)';
      return 'Evening & Night (05:00 PM - 12:00 AM)';
    }
  }
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
  const [historyScope, setHistoryScope] = useState('all'); // 'all' or 'mine'
  // Navigation tab state: 'records', 'add', or 'chroma'
  const [activeTab, setActiveTab] = useState('records');
  const [isChromaUnlocked, setIsChromaUnlocked] = useState(false);

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
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timelineStep, setTimelineStep] = useState(0);
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

  const [expandedDocuments, setExpandedDocuments] = useState({});
  const toggleDocument = (docKey) => setExpandedDocuments((prev) => ({ ...prev, [docKey]: !prev[docKey] }));

  // View Online PDF Modal
  const [viewPdfModalDoc, setViewPdfModalDoc] = useState(null);

  // Chroma Info Modal State
  const [showChromaInfo, setShowChromaInfo] = useState(false);

  // Delete Confirmation Modal State
  const [deleteDialog, setDeleteDialog] = useState(null);

  // Custom Unlock Modal State
  const [unlockStep, setUnlockStep] = useState(null); // 'confirm', 'password', or null
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  useEffect(() => {
    fetchHistory();
    fetchChromaHistory();
  }, []);

  useEffect(() => {
    let interval;
    if (loading) {
      setElapsedTime(0);
      setTimelineStep(1);
      interval = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 0.1;
          if (newTime > 1.5 && newTime < 3) setTimelineStep(2);
          if (newTime >= 3) setTimelineStep(3);
          return newTime;
        });
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchHistory = async (scopeOverride = null) => {
    setHistoryLoading(true);
    try {
      const activeScope = scopeOverride || historyScope;
      const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');
      const uploader = currentUser?.id || currentUser?.email || currentUser?.full_name || '';
      const res = await knowledgeHubAPI.getHistory(
        uploader,
        activeScope,
        currentUser?.org_id || null,
        currentUser?.user_type || 'employee'
      );
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

  const handleUnlockChroma = () => {
    setUnlockStep('confirm');
    setUnlockPassword('');
    setUnlockError('');
  };

  const submitUnlockPassword = async (e) => {
    e?.preventDefault();
    try {
      const res = await adminAPI.getVectorPassword();
      if (unlockPassword === res.password) {
        setIsChromaUnlocked(true);
        setActiveTab('chroma');
        setUnlockStep(null);
      } else {
        setUnlockError('Incorrect password. Please try again.');
      }
    } catch {
      setUnlockError('Server error checking password.');
    }
  };

  const handleSyncAll = async () => {
    await Promise.all([fetchHistory(), fetchChromaHistory()]);
  };

  const handleDeleteRecord = (item, isVectorStore = false) => {
    const itemName = item.name || item.filename || item.id;
    setDeleteDialog({
      action: 'record',
      item,
      isVectorStore,
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete ${isVectorStore ? 'this vector chunk' : 'this document record'} (${itemName})? This cannot be undone.`
    });
  };

  const handleClearAll = () => {
    setDeleteDialog({
      action: 'clearAll',
      title: 'Wipe All Data',
      message: 'Are you sure you want to delete all uploaded files, ChromaDB vectors, and PostgreSQL records? This action cannot be undone.'
    });
  };

  const confirmDeleteAction = async () => {
    if (!deleteDialog) return;
    const { action, item, isVectorStore } = deleteDialog;
    const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');

    try {
      if (action === 'clearAll') {
        await knowledgeHubAPI.clearAllData(currentUser?.user_type, currentUser?.org_id);
        await fetchHistory();
        await fetchChromaHistory();
      } else if (action === 'record') {
        if (isVectorStore) {
          await knowledgeHubAPI.deleteChromaVector(item.id);
          setChromaItems((prev) => prev.filter((chunk) => chunk.id !== item.id));
          setTotalVectors((prev) => Math.max(0, prev - 1));
        } else {
          const recordId = item.id || item.name || item.filename;
          const delRes = await knowledgeHubAPI.deleteRecord(
            recordId,
            currentUser?.id,
            currentUser?.email,
            currentUser?.user_type,
            currentUser?.org_id
          );
          if (delRes && delRes.success === false) {
            alert(delRes.message || 'Permission Denied: You can only remove data you personally uploaded.');
            return;
          }
          setHistoryList((prev) => prev.filter((rec) => (rec.id !== item.id && rec.name !== item.name)));
          fetchChromaHistory();
        }
      }
    } catch (err) {
      console.error('Delete action error:', err);
      alert(err.response?.data?.detail || err.response?.data?.message || 'Failed to delete record.');
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleViewOnline = (item) => {
    const fileName = item.name || item.filename;
    if (fileName) {
      window.open(`${API_BASE_URL}/upload/file/${fileName}`, '_blank');
    }
  };

  const handleDownloadFile = (item) => {
    const fileName = item.name || item.filename;
    if (fileName) {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/upload/file/${fileName}?download=true`;
      link.download = fileName; // Enforce download behavior
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => {
        const combined = [...prev];
        newFiles.forEach(file => {
           if (!combined.some(f => f.name === file.name)) {
               combined.push(file);
           }
        });
        return combined;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() && selectedFiles.length === 0) {
      setErrorMessage('Please provide a Knowledge Title or attach documents to upload.');
      return;
    }

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const finalDept = departmentSelect === 'Custom' ? customDepartment || 'General' : departmentSelect;
    const finalCat = categorySelect === 'Custom' ? customCategory || 'General' : categorySelect;

    const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');
    const uploaderEmail = currentUser?.email || 'employee@cogniva.ai';
    const uploaderName = currentUser?.full_name || 'Enterprise Employee';
    const userOrgId = currentUser?.org_id || null;
    const userId = currentUser?.id || null;

    try {
      if (selectedFiles.length > 0) {
        // Upload all selected files in parallel with multi-tenant org metadata
        await Promise.all(selectedFiles.map(file => knowledgeHubAPI.uploadDocument(file, uploaderEmail, uploaderName, finalDept, userOrgId, userId)));
      } else {
        await knowledgeHubAPI.addKnowledgeText({
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
        selectedFiles.length > 0
          ? `${selectedFiles.length} Document(s) successfully uploaded & vector indexed into ChromaDB!`
          : `Knowledge record "${title}" successfully indexed into ChromaDB & PostgreSQL!`
      );

      setTitle('');
      setDescription('');
      setReason('');
      setTags([]);
      setSelectedFiles([]);
      setCustomDepartment('');
      setCustomCategory('');

      // Add a small delay to ensure backend vector DB fully flushed its index
      await new Promise(resolve => setTimeout(resolve, 800));

      await fetchHistory();
      await fetchChromaHistory();
    } catch (err) {
      console.error('Error saving knowledge entry:', err);
      const apiDetail = err.response?.data?.detail;
      setErrorMessage(apiDetail || err.message || 'Failed to index knowledge. Please try again.');
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
            <th className="py-3 px-4">Uploader</th>
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
                      <div className="truncate max-w-[240px]">
                        <span className="block truncate font-bold text-slate-900" title={chunkTitle}>
                          {chunkTitle}
                        </span>
                        {!isVectorStore && item.chunks && item.chunks > 1 && (
                          <span className="text-[10px] font-semibold text-indigo-600 block">
                            {item.chunks} chunks indexed
                          </span>
                        )}
                      </div>
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
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.uploaded_by || 'Enterprise Employee'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{item.department || 'Engineering'}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {item.size_formatted || (item.char_count ? `${item.char_count} chars` : '420 chars')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 border border-slate-200/80 font-semibold text-slate-700">
                      {formatDisplayTimestamp(item.timestamp)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end items-center space-x-2">
                      {isVectorStore && (
                        <button
                          onClick={() => setSelectedHistoryDoc(item)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Inspect Chunk Payload</span>
                        </button>
                      )}

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

                      {(() => {
                        // Central Database ("All Knowledge") protection:
                        // Files cannot be deleted in All Knowledge because it represents the central shared organizational knowledgebase.
                        if (!isVectorStore && historyScope === 'all') {
                          return (
                            <span
                              className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200/90 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center space-x-1 select-none"
                              title="Central Knowledge Base: Protected organizational asset."
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Central DB</span>
                            </span>
                          );
                        }

                        // In "My Uploads" (or Chroma inspector), allow the employee to delete their own uploaded documents
                        const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');
                        const isSuperAdmin = currentUser?.user_type === 'cogniva_admin';
                        const isOrgAdmin = currentUser?.user_type === 'org_admin';
                        const isOwner = item.is_owner || 
                          (item.user_id && currentUser?.id && String(item.user_id) === String(currentUser.id)) ||
                          (item.uploaded_by && (
                            item.uploaded_by.toLowerCase() === currentUser?.email?.toLowerCase() ||
                            item.uploaded_by.toLowerCase() === currentUser?.full_name?.toLowerCase()
                          ));
                        const canDeleteItem = item.can_delete !== undefined ? item.can_delete : (isSuperAdmin || isOrgAdmin || isOwner);

                        if (canDeleteItem) {
                          return (
                            <button
                              onClick={() => handleDeleteRecord(item, isVectorStore)}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                              title={isVectorStore ? 'Delete ChromaDB vector chunk' : 'Delete my uploaded document'}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          );
                        } else {
                          return (
                            <button
                              disabled
                              className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg text-[11px] font-medium cursor-not-allowed inline-flex items-center space-x-1 select-none"
                              title={`Protected: Uploaded by ${item.uploaded_by || 'Colleague'}. You can only delete documents you personally uploaded.`}
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Protected</span>
                            </button>
                          );
                        }
                      })()}
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
            onClick={() => setActiveTab('records')}
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

          {!isChromaUnlocked ? (
            <button
              onClick={handleUnlockChroma}
              className="px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center cursor-pointer text-white hover:bg-white/15"
              title="Unlock ChromaDB Vectors"
            >
              <Info className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('chroma')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${activeTab === 'chroma'
                ? 'bg-white text-indigo-600 shadow-md font-extrabold'
                : 'text-white hover:bg-white/15'
                }`}
            >
              <Zap className="w-4 h-4" />
              <span>ChromaDB Vectors</span>
            </button>
          )}
        </div>
      </div>

      {/* TIMELINE PROGRESS INDICATOR */}
      {(loading || (successMessage && elapsedTime > 0)) && activeTab === 'add' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4.5 h-4.5 text-indigo-500" />
              <span>Processing Timeline</span>
            </h3>
            <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono border border-indigo-100 shadow-inner flex items-center space-x-2">
              <Timer className="w-3.5 h-3.5" />
              <span>{elapsedTime.toFixed(1)}s elapsed</span>
            </span>
          </div>

          <div className="relative mt-6 px-4">
            {/* Timeline line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-slate-100 rounded-full hidden sm:block"></div>

            <div className="relative z-10 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 text-xs font-semibold">
              <div className="flex flex-col items-center flex-1 bg-white pt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2.5 transition-all duration-300 ${timelineStep >= 1 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200/50' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {timelineStep > 1 || !loading ? <CheckCircle2 className="w-5 h-5" /> : <RefreshCw className="w-5 h-5 animate-spin" />}
                </div>
                <span className={timelineStep >= 1 ? 'text-indigo-900 font-bold' : 'text-slate-400'}>Initialize Request</span>
              </div>

              <div className="flex flex-col items-center flex-1 bg-white pt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2.5 transition-all duration-300 ${timelineStep >= 2 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200/50' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {timelineStep > 2 || !loading ? <CheckCircle2 className="w-5 h-5" /> : (timelineStep === 2 ? <RefreshCw className="w-5 h-5 animate-spin" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />)}
                </div>
                <span className={timelineStep >= 2 ? 'text-indigo-900 font-bold' : 'text-slate-400'}>Upload Document</span>
              </div>

              <div className="flex flex-col items-center flex-1 bg-white pt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2.5 transition-all duration-300 ${!loading && successMessage ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200/50' : (timelineStep >= 3 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200/50' : 'bg-slate-50 border-slate-200 text-slate-400')}`}>
                  {!loading && successMessage ? <CheckCircle2 className="w-5 h-5" /> : (timelineStep === 3 ? <RefreshCw className="w-5 h-5 animate-spin" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />)}
                </div>
                <span className={!loading && successMessage ? 'text-emerald-700 font-bold' : (timelineStep >= 3 ? 'text-indigo-900 font-bold' : 'text-slate-400')}>Vector Indexing</span>
              </div>
            </div>

            {/* Horizontal Progress Bar Below Timeline */}
            <div className="mt-8 px-2">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-[400ms] ease-out ${!loading && successMessage ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}
                  style={{
                    width: !loading && successMessage
                      ? '100%'
                      : (loading ? `${Math.min(95, 10 + (elapsedTime * 15))}%` : '0%')
                  }}
                >
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${!loading && successMessage ? 'text-emerald-600' : 'text-indigo-500 animate-pulse'}`}>
                  {!loading && successMessage ? 'Process Complete - 100%' : 'Processing...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* TAB PROGRESS/ALERTS ARE OUTSIDE TABS TO PERSIST GLOBALLY */}
      {/* TAB 1: RECORDS SECTION */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                {new Set(filteredFileRecords.map((h) => h.department).filter(Boolean)).size || 0}
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">Active Organizational Units</p>
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
                onClick={handleSyncAll}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading || chromaLoading ? 'animate-spin' : ''}`} />
                <span>Sync Records</span>
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

              <div className="flex items-center space-x-3 text-xs w-full md:w-auto justify-end">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setHistoryScope('all'); fetchHistory('all'); }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      historyScope === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Knowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHistoryScope('mine'); fetchHistory('mine'); }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      historyScope === 'mine' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    My Uploads
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
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
          </div>

          {sortedRecordDates.length > 0 ? (
            sortedRecordDates.map((dateStr, idx) => {
              const timeSegments = groupedRecordsByDateAndTime[dateStr];
              const segmentKeys = Object.keys(timeSegments).sort((a, b) => {
                const order = { 'Morning': 1, 'Afternoon': 2, 'Evening': 3 };
                const getOrder = (s) => order[Object.keys(order).find(k => s.includes(k))] || 4;
                return getOrder(a) - getOrder(b);
              });
              const totalDocsInDate = segmentKeys.reduce((acc, seg) => acc + (timeSegments[seg]?.length || 0), 0);
              const isExpanded = expandedDates[dateStr] !== undefined ? Boolean(expandedDates[dateStr]) : false;

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
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedFiles.length > 0 ? (
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-indigo-600 font-bold flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>Attached: {selectedFiles.length} file(s)</span>
                        </span>
                        <span className="text-xs text-indigo-500 font-medium max-w-[250px] truncate block text-center">
                          {selectedFiles.map(f => f.name).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span>Upload Files - Drag and drop multiple files here or click to browse</span>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-row items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex flex-wrap flex-col sm:flex-row sm:items-center gap-2 mb-0.5">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">ChromaDB Vector Store</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Inspect your vectorized data chunks
                </p>
              </div>
            </div>

            <div className="flex flex-wrap flex-col sm:flex-row sm:items-center gap-2 xl:shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowChromaInfo(true)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-slate-200 shrink-0"
                  title="View ChromaDB Vectors Configuration Details"
                >
                  <Info className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSyncAll}
                  disabled={chromaLoading || historyLoading}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${chromaLoading || historyLoading ? 'animate-spin' : ''}`} />
                  <span>Re-Scan Vectors</span>
                </button>

                {(() => {
                  const currentUser = JSON.parse(localStorage.getItem('cogniva_user') || '{}');
                  const isOrgAdmin = currentUser?.user_type === 'org_admin' || currentUser?.user_type === 'cogniva_admin';
                  if (isOrgAdmin) {
                    return (
                      <button
                        onClick={handleClearAll}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        title="Wipe organization uploaded files, ChromaDB vectors, and PostgreSQL records"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Clear All Data</span>
                      </button>
                    );
                  }
                  return (
                    <div className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 select-none" title="All documents are securely shared across colleagues within your organization">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Shared Org Hub</span>
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => setActiveTab('add')}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
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
              const segmentKeys = Object.keys(timeSegments).sort((a, b) => {
                const order = { 'Morning': 1, 'Afternoon': 2, 'Evening': 3 };
                const getOrder = (s) => order[Object.keys(order).find(k => s.includes(k))] || 4;
                return getOrder(a) - getOrder(b);
              });
              const totalChunksInDate = segmentKeys.reduce((acc, seg) => acc + (timeSegments[seg]?.length || 0), 0);
              const isExpanded = expandedDates[`chroma_${dateStr}`] !== undefined ? Boolean(expandedDates[`chroma_${dateStr}`]) : false;

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

                            {(() => {
                              // Group chunks by doc title/filename
                              const docGroups = chunks.reduce((acc, chunk) => {
                                const fname = chunk.filename || chunk.name || 'Unknown Document';
                                if (!acc[fname]) acc[fname] = [];
                                acc[fname].push(chunk);
                                return acc;
                              }, {});

                              return Object.keys(docGroups).map((docName) => {
                                const docChunks = docGroups[docName];
                                const docKey = `${dateStr}_${segmentName}_${docName}`;
                                const isDocExpanded = expandedDocuments[docKey];

                                return (
                                  <div key={docKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-2 mb-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                    <div
                                      onClick={() => toggleDocument(docKey)}
                                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50/50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-slate-800">{docName}</h4>
                                          <div className="flex items-center space-x-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{docChunks.length} {docChunks.length === 1 ? 'Chunk' : 'Chunks'}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Click to {isDocExpanded ? 'hide' : 'view'} chunks</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${isDocExpanded ? 'rotate-180 bg-indigo-50 text-indigo-600' : ''}`}>
                                        <ChevronDown className="w-4 h-4" />
                                      </div>
                                    </div>

                                    {isDocExpanded && (
                                      <div className="border-t border-slate-100 p-0 bg-slate-50/30">
                                        {renderRecordsTable(docChunks, true)}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
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
      {/* CHROMA INFO MODAL */}
      {showChromaInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    ChromaDB Configuration
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowChromaInfo(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Linked Vectors</span>
                <span className="font-extrabold text-indigo-600 text-sm bg-indigo-50 px-2 py-0.5 rounded-md">{totalVectors} Chunks</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Embedding Model</span>
                <span className="font-bold text-slate-800 text-sm px-2 py-0.5 bg-slate-100 rounded-md">all-MiniLM-L6-v2</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Distance Metric</span>
                <span className="font-bold text-slate-800 text-sm">Cosine Similarity</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNLOCK CHROMA VECTOR MODAL */}
      {unlockStep && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-left transform scale-100 transition-all">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {unlockStep === 'confirm' ? 'Restricted Area' : 'Authentication Required'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {unlockStep === 'confirm' ? 'Enterprise Vectors' : 'Enter Admin Password'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnlockStep(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {unlockStep === 'confirm' && (
              <div className="space-y-6">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Do you want to see the advanced ChromaDB vector chunking datasets? It is not allowed for employeers!
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setUnlockStep(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setUnlockStep('password')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            )}

            {unlockStep === 'password' && (
              <form onSubmit={submitUnlockPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={unlockPassword}
                    onChange={(e) => {
                      setUnlockPassword(e.target.value);
                      if (unlockError) setUnlockError('');
                    }}
                    placeholder="Enter password..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
                  />
                  {unlockError && <p className="text-[11px] font-bold text-rose-500 mt-1">{unlockError}</p>}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setUnlockStep(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    Unlock Access
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl text-left transform scale-100 transition-all">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <TriangleAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{deleteDialog.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{deleteDialog.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-8">
              <button
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
