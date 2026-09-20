import React, { useState } from 'react';
import {
  FolderSearch,
  Plus,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  ArrowRight,
  X,
  Send,
  Shield,
  Filter,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Investigation, InvestigationPriority, InvestigationStatus } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const InvestigationsPage: React.FC = () => {
  const { investigations, createInvestigation, updateInvestigation, addInvestigationNote } = useData();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<Investigation | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  // New Case Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<InvestigationPriority>('high');
  const [assignedTo, setAssignedTo] = useState('Incident Response Cell');
  const [targetIndividual, setTargetIndividual] = useState('');
  const [detectedCaller, setDetectedCaller] = useState('');

  const filteredCases = investigations.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    return true;
  });

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createInvestigation({
      user_id: 'usr_current',
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'open',
      assigned_to: assignedTo,
      target_individual: targetIndividual || undefined,
      detected_caller: detectedCaller || undefined,
    });

    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
    setTargetIndividual('');
    setDetectedCaller('');
  };

  const handleAddNote = async (caseId: string) => {
    if (!newNote.trim()) return;
    await addInvestigationNote(caseId, newNote.trim(), 'Lead Forensics Analyst');
    setNewNote('');
    // refresh selectedCase
    const updated = investigations.find((c) => c.id === caseId);
    if (updated) setSelectedCase({ ...updated });
  };

  const handleStatusChange = async (caseId: string, newStatus: InvestigationStatus) => {
    await updateInvestigation(caseId, { status: newStatus });
    const updated = investigations.find((c) => c.id === caseId);
    if (updated) setSelectedCase({ ...updated, status: newStatus });
  };

  const getPriorityBadge = (p: InvestigationPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700/80';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Incident Investigation Workspace
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Case management, forensic telemetry evidence chain-of-custody, and multi-analyst response notes.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Open Investigation Case</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Cases</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          {filteredCases.length} of {investigations.length} cases
        </span>
      </div>

      {/* Main Cases Grid */}
      {filteredCases.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No Investigation Cases Found"
          description="There are currently no security incidents matching your filter."
          actionLabel="Create Incident Case"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedCase(inv)}
              className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm transition hover:border-blue-500/40 hover:bg-slate-850/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize border ${getPriorityBadge(
                      inv.priority
                    )}`}
                  >
                    {inv.priority}
                  </span>
                  <span className="font-mono text-xs text-blue-400 font-medium">{inv.id}</span>
                </div>

                <h3 className="font-semibold text-slate-200 text-sm group-hover:text-blue-400 transition">
                  {inv.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">{inv.description}</p>

                <div className="mt-4 space-y-1.5 rounded-lg bg-slate-950/80 p-3 border border-slate-800/80 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Target:</span>
                    <span className="text-slate-200 font-medium">{inv.target_individual || 'Command HQ'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned:</span>
                    <span className="text-slate-300">{inv.assigned_to || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeline Events:</span>
                    <span className="text-blue-400 font-mono">
                      {selectedCase?.timeline?.length || inv.timeline_events?.length || 1} logs
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                <span className="text-xs text-slate-400">
                  Status: <strong className="text-white capitalize font-medium">{inv.status.replace('_', ' ')}</strong>
                </span>
                <span className="text-xs font-medium text-blue-400 group-hover:underline flex items-center gap-1">
                  Manage Workspace <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Investigation Workspace Modal / Drawer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800/90 bg-[#0c1220] p-6 shadow-2xl text-slate-100 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize border ${getPriorityBadge(
                      selectedCase.priority
                    )}`}
                  >
                    {selectedCase.priority}
                  </span>
                  <span className="font-mono text-xs text-blue-400 font-medium">{selectedCase.id}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mt-1.5">{selectedCase.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedCase.description}</p>
              </div>

              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status change toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Case Status:</span>
                <select
                  value={selectedCase.status}
                  onChange={(e) => handleStatusChange(selectedCase.id, e.target.value as InvestigationStatus)}
                  className="rounded-lg bg-slate-950 px-2.5 py-1 text-xs text-blue-400 border border-slate-800 font-medium focus:outline-none"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="text-slate-400 text-xs">
                Assigned Unit: <span className="text-slate-200 font-medium">{selectedCase.assigned_to}</span>
              </div>
            </div>

            {/* Timeline of Events */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Chain-of-Custody Timeline
              </h4>

              <div className="space-y-2 border-l-2 border-slate-800 pl-4 ml-2">
                {(selectedCase.timeline || selectedCase.timeline_events || []).map((evt: any, idx: number) => (
                  <div key={idx} className="relative text-xs">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-400" />
                    <div className="rounded-xl bg-slate-900/40 p-3 border border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-200">{evt.action || evt.title}</span>
                        <span className="font-mono text-[10px]">{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collaborative Analyst Notes */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                Forensic Analyst Notes ({selectedCase.notes?.length || 0})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {selectedCase.notes?.map((n) => (
                  <div key={n.id} className="rounded-xl bg-slate-900/40 p-3 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="text-blue-400 font-medium">{n.author_name}</span>
                      <span className="font-mono text-[10px]">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{n.note_text || n.content}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNote(selectedCase.id);
                  }}
                  placeholder="Record forensic observation, vocoder model inference, or adversary telemetry..."
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddNote(selectedCase.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-800/80 pt-3">
              <button
                onClick={() => setSelectedCase(null)}
                className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Close Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800/90 bg-[#0c1220] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">Open Incident Investigation</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Incident Case Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Synthetic Voice Impersonation - Emergency Authorization Call"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Targeted Individual / Executive
                </label>
                <input
                  type="text"
                  value={targetIndividual}
                  onChange={(e) => setTargetIndividual(e.target.value)}
                  placeholder="e.g. Finance Director or Executive Member"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Incident Description & Forensic Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Suspected cloned audio dispatch with zero-shot neural artifacts..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as InvestigationPriority)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Unit
                  </label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 shadow-sm transition"
                >
                  Initialize Case Workspace →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
