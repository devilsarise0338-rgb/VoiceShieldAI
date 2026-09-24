import React from 'react';
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@tremor/react';

const recentCalls = [
  { id: 'CAL-9421', caller: 'John Doe', timestamp: '2026-09-23 14:32:01', score: 98.4, risk: 'HIGH', action: 'Blocked' },
  { id: 'CAL-9420', caller: 'Jane Smith', timestamp: '2026-09-23 14:28:45', score: 1.2, risk: 'LOW', action: 'Allowed' },
  { id: 'CAL-9419', caller: 'Unknown', timestamp: '2026-09-23 14:15:22', score: 45.6, risk: 'MEDIUM', action: 'Flagged' },
];

export const DashboardPage = () => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 py-6 border-b border-border bg-card">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground font-mono">
          <span>console</span>
          <span>/</span>
          <span>dashboard</span>
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-[1200px]">
        {/* Simplified table view to match new style */}
        <div className="bg-card border border-border rounded-sm">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <Table className="mt-0">
            <TableHead>
              <TableRow className="border-b border-border">
                <TableHeaderCell className="text-muted-foreground text-xs font-medium">Call ID</TableHeaderCell>
                <TableHeaderCell className="text-muted-foreground text-xs font-medium">Caller</TableHeaderCell>
                <TableHeaderCell className="text-muted-foreground text-xs font-medium text-right">Timestamp</TableHeaderCell>
                <TableHeaderCell className="text-muted-foreground text-xs font-medium text-right">Score</TableHeaderCell>
                <TableHeaderCell className="text-muted-foreground text-xs font-medium">Risk Level</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentCalls.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 border-b border-border last:border-none transition-colors">
                  <TableCell className="text-sm font-mono">{item.id}</TableCell>
                  <TableCell className="text-sm">{item.caller}</TableCell>
                  <TableCell className="text-sm font-mono text-right text-muted-foreground">{item.timestamp}</TableCell>
                  <TableCell className="text-sm font-mono text-right">
                    <span className={item.score > 90 ? 'text-destructive' : item.score > 40 ? 'text-warning' : 'text-accent'}>
                      {item.score.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-sm ${
                      item.risk === 'HIGH' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                      item.risk === 'MEDIUM' ? 'bg-warning/10 text-warning border-warning/20' : 
                      'bg-accent/10 text-accent border-accent/20'
                    }`}>
                      {item.risk}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
