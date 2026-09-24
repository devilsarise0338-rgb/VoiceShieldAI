import React from 'react';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@tremor/react';

const historyData = Array.from({ length: 15 }).map((_, i) => {
  const isHighRisk = i % 7 === 0;
  const isMediumRisk = i % 5 === 0 && !isHighRisk;
  return {
    id: `CAL-94${21 - i}`,
    caller: isHighRisk ? 'Unknown/Spoofed' : 'Verified Caller',
    timestamp: `2026-09-23 14:${(32 - i).toString().padStart(2, '0')}:12`,
    score: isHighRisk ? 98.4 - i : isMediumRisk ? 45.6 + i : 1.2 + (i * 0.1),
    risk: isHighRisk ? 'HIGH' : isMediumRisk ? 'MEDIUM' : 'LOW',
  };
});

export const HistoryPage = () => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 py-6 border-b border-border bg-card">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">History</h1>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground font-mono">
          <span>console</span>
          <span>/</span>
          <span>history</span>
        </div>
      </div>
      <div className="p-8 max-w-[1200px]">
        <div className="bg-card border border-border rounded-sm">
          <Table className="mt-0">
            <TableHead>
              <TableRow className="border-b border-border">
                <TableHeaderCell className="text-muted-foreground text-xs font-medium px-6 py-3">Call ID</TableHeaderCell>
                <TableHeaderCell className="text-muted-foreground text-xs font-medium px-6 py-3">Caller</TableHeaderCell>
                <TableHeaderCell className="text-muted-foreground text-xs font-medium px-6 py-3 text-right">Timestamp</TableHeaderCell>
                <TableHeaderCell className="text-muted-foreground text-xs font-medium px-6 py-3 text-right">Score</TableHeaderCell>
                <TableHeaderCell className="text-muted-foreground text-xs font-medium px-6 py-3">Risk Level</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 border-b border-border last:border-none">
                  <TableCell className="px-6 py-2 text-sm font-mono">{item.id}</TableCell>
                  <TableCell className="px-6 py-2 text-sm">{item.caller}</TableCell>
                  <TableCell className="px-6 py-2 text-sm font-mono text-right text-muted-foreground">{item.timestamp}</TableCell>
                  <TableCell className="px-6 py-2 text-sm font-mono text-right">
                    <span className={item.score > 90 ? 'text-destructive' : item.score > 40 ? 'text-warning' : 'text-accent'}>
                      {item.score.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-2">
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
