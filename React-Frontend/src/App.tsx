import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import type { Finding, ReviewResponse } from './types';

type TabType = 'results' | 'plan';
type LogType = 'info' | 'success' | 'error' | 'warning' | 'agent' | 'api';

interface LogMessage {
  timestamp: string;
  type: LogType;
  message: string;
  agent?: string;
}

const API_URL = 'http://localhost:5000/api';

const sampleSecurityCode = `def authenticate(user, password="admin123"):
    if user == "admin":
        return True
    return False

def process_input(data):
    eval(data)
    return data`;

function App() {
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('sample.py');
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ReviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('results');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogType = 'info', agent?: string) => {
    setLogs(prev => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        agent,
      },
    ]);
  };

  const divider = (label: string) => {
    addLog(`================ ${label} ================`, 'info');
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const checkApi = async () => {
      try {
        await axios.get(`${API_URL}/health`);
        setIsApiConnected(true);
        addLog('CodeMAS API Server connected at http://localhost:5000', 'success', 'api');
        addLog('Waiting for review request', 'info', 'system');
      } catch {
        setIsApiConnected(false);
        addLog('API server is offline. Start Flask on port 5000.', 'error', 'api');
      }
    };

    checkApi();
  }, []);

  const handleReview = async (): Promise<void> => {
    if (!code.trim()) {
      addLog('Cannot start review: no code provided', 'warning', 'orchestrator');
      return;
    }

    const startedAt = performance.now();
    setLoading(true);
    setReport(null);

    divider('CODE REVIEW INITIATED');
    addLog(`Input file: ${fileName}`, 'info', 'orchestrator');
    addLog(`Code size: ${code.length} characters`, 'info', 'orchestrator');
    addLog(`Lines: ${code.split('\n').length}`, 'info', 'orchestrator');
    addLog('Coordinator Agent queued', 'agent', 'coordinator');

    try {
      const response = await axios.post(`${API_URL}/review`, { code, filename: fileName });

      if (response.data.success) {
        const data = response.data as ReviewResponse;

        addLog('Coordinator Agent completed review plan', 'success', 'coordinator');
        addLog(
          `Plan: style=${data.plan.style_review}, logic=${data.plan.logic_review}, security=${data.plan.security_review}`,
          'info',
          'coordinator',
        );

        if (data.plan.style_review) {
          addLog('Style Reviewer Agent executed', 'agent', 'style');
          addLog(`${countFindings(data, 'style')} style findings returned`, 'success', 'style');
        } else {
          addLog('Style Reviewer Agent skipped', 'info', 'style');
        }

        if (data.plan.logic_review) {
          addLog('Logic Reviewer Agent executed', 'agent', 'logic');
          addLog(`${countFindings(data, 'logic')} logic findings returned`, 'success', 'logic');
        } else {
          addLog('Logic Reviewer Agent skipped by plan', 'info', 'logic');
        }

        if (data.plan.security_review) {
          addLog('Security Reviewer Agent executed', 'agent', 'security');
          addLog(`${countFindings(data, 'security')} security findings returned`, 'success', 'security');
        } else {
          addLog('Security Reviewer Agent skipped by plan', 'info', 'security');
        }

        divider('REVIEW SUMMARY');
        addLog(`Overall status: ${data.report.overall_status}`, 'success', 'report');
        addLog(`Total findings: ${data.report.summary.total_findings}`, 'info', 'report');
        addLog(`Security risk: ${data.report.summary.security_risk.toUpperCase()}`, 'info', 'report');
        if (data.report_path) {
          addLog(`Report saved: ${data.report_path}`, 'success', 'report');
        }
        if (data.execution_log?.length) {
          divider('BACKEND EXECUTION LOG');
          data.execution_log.forEach(entry => addLog(entry, 'api', 'backend'));
        }
        addLog(`Elapsed time: ${((performance.now() - startedAt) / 1000).toFixed(1)} seconds`, 'info', 'system');

        setReport(data);
        setActiveTab('results');
      } else {
        addLog(`Review failed: ${response.data.error}`, 'error', 'api');
      }
    } catch {
      addLog('Connection failed. Confirm Flask is running on port 5000.', 'error', 'api');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog(`Loading local file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'info', 'editor');

    const reader = new FileReader();
    reader.onload = e => {
      setCode(e.target?.result as string);
      setFileName(file.name);
      addLog(`File loaded into editor: ${file.name}`, 'success', 'editor');
    };
    reader.readAsText(file);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Console cleared', 'info', 'system');
  };

  const terminalPrefix = (type: LogType): string => {
    switch (type) {
      case 'success':
        return '[ok]';
      case 'error':
        return '[err]';
      case 'warning':
        return '[warn]';
      case 'agent':
        return '[agent]';
      case 'api':
        return '[api]';
      default:
        return '[info]';
    }
  };

  const logColor = (type: LogType): string => {
    switch (type) {
      case 'success':
        return 'text-teal-300';
      case 'error':
        return 'text-rose-300';
      case 'warning':
        return 'text-amber-300';
      case 'agent':
        return 'text-cyan-300';
      case 'api':
        return 'text-violet-300';
      default:
        return 'text-slate-300';
    }
  };

  const severityBadge = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-950 text-rose-200 border-rose-700';
      case 'high':
        return 'bg-orange-950 text-orange-200 border-orange-700';
      case 'medium':
        return 'bg-amber-950 text-amber-100 border-amber-700';
      case 'low':
        return 'bg-emerald-950 text-emerald-100 border-emerald-700';
      default:
        return 'bg-slate-900 text-slate-200 border-slate-700';
    }
  };

  const metricCards = [
    { label: 'Findings', value: report?.report.summary.total_findings ?? 0, sub: 'issues returned' },
    { label: 'Style', value: `${report?.report.summary.style_score ?? 100}`, sub: 'quality score' },
    { label: 'Logic', value: `${report?.report.summary.logic_score ?? 100}`, sub: 'correctness score' },
    { label: 'Risk', value: report?.report.summary.security_risk?.toUpperCase() ?? 'SAFE', sub: 'security posture' },
  ];

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <div className="border-b border-white/10 bg-[#101729]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-md border border-cyan-400/30 bg-cyan-400/10 font-mono text-sm text-cyan-200">
              CH
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-[0.22em] text-white">CODEHOLLA</h1>
              <p className="font-mono text-xs text-slate-400">Local multi-agent code review console</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusPill connected={isApiConnected} />
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-300">
              4 agents armed
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_520px]">
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            {metricCards.map(card => (
              <div key={card.label} className="rounded-md border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                <p className="mt-2 truncate text-2xl font-semibold text-white">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-md border border-white/10 bg-[#111827] shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0e1526] px-4 py-3">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-slate-400">source editor</div>
              <div className="font-mono text-xs text-slate-500">
                {code.length} chars / {code.split('\n').length} lines
              </div>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="min-w-0 rounded-md border border-white/10 bg-[#0b1020] px-4 py-3 font-mono text-sm text-slate-200 outline-none ring-cyan-400/30 placeholder:text-slate-600 focus:ring-2"
                placeholder="filename.py"
              />
              <label className="cursor-pointer rounded-md border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10">
                Upload file
                <input type="file" accept=".py" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                onClick={handleReview}
                disabled={loading}
                className="rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Analyzing...' : 'Run review'}
              </button>
            </div>

            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={sampleSecurityCode}
              className="h-[500px] w-full resize-none border-t border-white/10 bg-[#080d19] p-5 font-mono text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <TemplateButton label="simple.py" onClick={() => setCode('def add(a, b):\n    return a + b')} />
            <TemplateButton
              label="security.py"
              onClick={() => setCode('def login(pwd="admin123"):\n    print(pwd)\n    return True\n\npassword = "secret"')}
            />
            <TemplateButton
              label="logic.py"
              onClick={() =>
                setCode('def complex(x):\n    if x > 10:\n        for i in range(x):\n            if i % 2 == 0:\n                print(i)\n    return x')
              }
            />
            <TemplateButton label="clear" muted onClick={() => setCode('')} />
          </div>

          {report && (
            <div className="overflow-hidden rounded-md border border-white/10 bg-[#111827]">
              <div className="flex border-b border-white/10">
                <TabButton active={activeTab === 'results'} label="Results" onClick={() => setActiveTab('results')} />
                <TabButton active={activeTab === 'plan'} label="Plan" onClick={() => setActiveTab('plan')} />
              </div>

              <div className="max-h-[360px] overflow-y-auto p-5">
                {activeTab === 'results' ? (
                  <ResultsView findings={report.report.findings} severityBadge={severityBadge} />
                ) : (
                  <PlanView report={report} />
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="xl:sticky xl:top-6 xl:h-[calc(100vh-48px)]">
          <div className="flex h-full min-h-[620px] flex-col overflow-hidden rounded-md border border-cyan-400/20 bg-[#050915] shadow-2xl shadow-cyan-950/30">
            <div className="flex items-center justify-between border-b border-cyan-400/20 bg-[#08101f] px-4 py-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">backend terminal mirror</p>
                <p className="mt-1 font-mono text-[11px] text-slate-500">frontend console stream</p>
              </div>
              <button onClick={clearLogs} className="rounded-md border border-white/10 px-3 py-2 font-mono text-xs text-slate-400 hover:bg-white/5">
                clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-6">
              {logs.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-slate-600">
                  <div>
                    <div className="mx-auto mb-4 h-12 w-12 rounded-md border border-white/10 bg-white/5" />
                    <p>System ready</p>
                    <p className="mt-1">Enter code and run a review</p>
                  </div>
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={`${log.timestamp}-${idx}`} className="group flex gap-2 rounded px-2 py-1 hover:bg-white/[0.03]">
                    <span className="shrink-0 text-slate-600">[{log.timestamp}]</span>
                    <span className="shrink-0 text-slate-500">{terminalPrefix(log.type)}</span>
                    <span className={`min-w-0 break-words ${logColor(log.type)}`}>
                      {log.agent && <span className="text-slate-500">[{log.agent.toUpperCase()}] </span>}
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function countFindings(data: ReviewResponse, category: string): number {
  return data.report.findings.filter(finding => finding.category === category).length;
}

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 font-mono text-xs ${connected ? 'border-teal-400/30 bg-teal-400/10 text-teal-200' : 'border-rose-400/30 bg-rose-400/10 text-rose-200'}`}>
      API {connected ? 'ONLINE' : 'OFFLINE'}
    </div>
  );
}

function TemplateButton({ label, onClick, muted = false }: { label: string; onClick: () => void; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-3 py-2 font-mono text-xs transition ${
        muted
          ? 'border-white/10 bg-transparent text-slate-500 hover:text-slate-300'
          : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/10'
      }`}
    >
      {label}
    </button>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition ${
        active ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

function ResultsView({ findings, severityBadge }: { findings: Finding[]; severityBadge: (severity: string) => string }) {
  if (findings.length === 0) {
    return <p className="font-mono text-sm text-slate-500">No findings returned by the agent swarm.</p>;
  }

  return (
    <div className="space-y-3">
      {findings.map((finding, idx) => (
        <div key={`${finding.agent}-${finding.line}-${idx}`} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-1 font-mono text-[11px] uppercase ${severityBadge(finding.severity)}`}>{finding.severity}</span>
            <span className="font-mono text-xs text-slate-500">line {finding.line}</span>
            <span className="font-mono text-xs text-slate-500">{finding.agent}</span>
          </div>
          <p className="text-sm text-slate-200">{finding.message}</p>
          <p className="mt-2 font-mono text-xs text-slate-500">Fix: {finding.suggestion}</p>
        </div>
      ))}
    </div>
  );
}

function PlanView({ report }: { report: ReviewResponse }) {
  const items = [
    ['STYLE REVIEWER', report.plan.style_review, 'PEP8 and readability checks'],
    ['LOGIC REVIEWER', report.plan.logic_review, 'Bug and edge-case detection'],
    ['SECURITY REVIEWER', report.plan.security_review, 'Secret and vulnerability scan'],
  ] as const;

  return (
    <div className="space-y-3">
      {items.map(([name, enabled, description]) => (
        <div key={name} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="font-mono text-sm text-slate-200">{name}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          <span className={`rounded border px-3 py-1 font-mono text-xs ${enabled ? 'border-teal-400/30 text-teal-200' : 'border-slate-700 text-slate-500'}`}>
            {enabled ? 'ENABLED' : 'SKIPPED'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default App;
