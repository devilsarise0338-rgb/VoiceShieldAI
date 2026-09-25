import React from 'react';
import { useData } from '../context/DataContext';
import { RiskBadge } from '../components/common/RiskBadge';

export const HistoryPage = () => {
  const { analyses, deleteAnalysis } = useData();

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold text-foreground">Analysis History</h1>
        <p className="mt-1 text-xs text-muted-foreground">Actual AASIST responses produced in this session.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="border-b border-border bg-muted/30 text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">File</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Spoof risk</th>
              <th className="px-5 py-3 font-medium">Verdict</th>
              <th className="px-5 py-3 font-medium">Model</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {analyses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No real analyses yet.
                </td>
              </tr>
            ) : (
              analyses.map((analysis) => (
                <tr key={analysis.id} className="hover:bg-muted/20">
                  <td className="px-5 py-4 font-medium text-foreground">{analysis.file_name || 'Unnamed audio'}</td>
                  <td className="px-5 py-4 font-mono text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-mono text-foreground">{analysis.spoof_risk_score}%</td>
                  <td className="px-5 py-4">
                    <RiskBadge level={analysis.risk_level} resultLabel={analysis.result_label} />
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{analysis.model_version}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      className="text-rose-400 hover:text-rose-300"
                      onClick={() => deleteAnalysis(analysis.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
