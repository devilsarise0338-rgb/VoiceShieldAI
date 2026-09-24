import React from 'react';

export const AgentsPage = () => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 py-6 border-b border-border bg-card">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Agents</h1>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground font-mono">
          <span>console</span>
          <span>/</span>
          <span>agents</span>
        </div>
      </div>
      <div className="p-8">
        <div className="bg-card border border-border rounded-sm p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <h2 className="text-sm font-semibold text-foreground">Agent-based workflow automation</h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-md">
            This module is currently in development. Future updates will allow autonomous agents to cross-verify caller identity using secondary authentication channels.
          </p>
        </div>
      </div>
    </div>
  );
};
