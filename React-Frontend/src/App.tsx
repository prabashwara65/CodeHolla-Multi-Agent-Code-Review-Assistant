import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type { ReviewResponse, Finding } from './types';

type TabType = 'editor' | 'results' | 'plan';

interface LogMessage {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'agent' | 'api';
  message: string;
  agent?: string;
}

const API_URL = 'http://localhost:5000/api';

function App() {
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('sample.py');
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ReviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Add log function
  const addLog = (message: string, type: LogMessage['type'] = 'info', agent?: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      agent
    }]);
  };

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Check API health on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        await axios.get(`${API_URL}/health`);
        setIsApiConnected(true);
        addLog('Connected to CodeHolla API Server', 'success');
        addLog('Waiting for code review request...', 'info');
      } catch {
        setIsApiConnected(false);
        addLog('API Server not responding - Make sure backend is running on port 5000', 'error');
      }
    };
    checkApi();
  }, []);

  const handleReview = async (): Promise<void> => {
    if (!code.trim()) {
      addLog('Cannot start review: No code provided', 'warning');
      return;
    }

    setLoading(true);
    
    addLog('═══════════════════════════════════════════════════════', 'info');
    addLog('CODE REVIEW INITIATED', 'agent', 'orchestrator');
    addLog(`Target file: ${fileName}`, 'info');
    addLog(`Code size: ${code.length} characters, ${code.split('\n').length} lines`, 'info');
    
    try {
      // Step 1: Coordinator
      addLog('COORDINATOR AGENT - Analyzing code structure', 'agent', 'coordinator');
      
      const response = await axios.post(`${API_URL}/review`, { code, filename: fileName });
      
      if (response.data.success) {
        const data = response.data as ReviewResponse;
        
        addLog(`Review Plan Generated: Style=${data.plan.style_review}, Logic=${data.plan.logic_review}, Security=${data.plan.security_review}`, 'success');
        
        // Step 2: Style Reviewer
        if (data.plan.style_review) {
          addLog('STYLE REVIEWER AGENT - Checking PEP8 compliance', 'agent', 'style');
          addLog(`Style analysis complete: ${data.report.findings.filter(f => f.category === 'style').length} issues found`, 'success');
        }
        
        // Step 3: Logic Reviewer
        if (data.plan.logic_review) {
          addLog('LOGIC REVIEWER AGENT - Detecting bugs and edge cases', 'agent', 'logic');
          addLog(`Logic analysis complete: ${data.report.findings.filter(f => f.category === 'logic').length} issues found`, 'success');
        } else {
          addLog('LOGIC REVIEWER AGENT - Skipped (no complex logic detected)', 'info');
        }
        
        // Step 4: Security Reviewer
        if (data.plan.security_review) {
          addLog('SECURITY REVIEWER AGENT - Scanning vulnerabilities', 'agent', 'security');
          addLog(`Security analysis complete: ${data.report.findings.filter(f => f.category === 'security').length} vulnerabilities found`, 'success');
        } else {
          addLog('SECURITY REVIEWER AGENT - Skipped (no security concerns)', 'info');
        }
        
        // Final summary
        addLog('═══════════════════════════════════════════════════════', 'success');
        addLog(`REVIEW COMPLETE: ${data.report.summary.total_findings} total issues found`, 'success');
        addLog(`Overall Status: ${data.report.overall_status} | Security Risk: ${data.report.summary.security_risk.toUpperCase()}`, 'info');
        
        setReport(data);
        setActiveTab('results');
      } else {
        addLog(`Review failed: ${response.data.error}`, 'error');
      }
    } catch (error) {
      addLog('Connection failed - Make sure backend is running on port 5000', 'error');
    }
    setLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    addLog(`Uploading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'info');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setCode(e.target?.result as string);
      setFileName(file.name);
      addLog(`File loaded: ${file.name}`, 'success');
    };
    reader.readAsText(file);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Console cleared', 'info');
  };

  const getLogIcon = (type: string): string => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '!';
      case 'agent': return '▶';
      case 'api': return '↻';
      default: return '○';
    }
  };

  const getLogColor = (type: string): string => {
    switch(type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'agent': return 'text-blue-400';
      case 'api': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityBadge = (severity: string): string => {
    switch(severity) {
      case 'critical': return 'bg-red-50 text-red-700 border border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border border-green-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">&lt;/&gt;</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">CODEHOLLA</h1>
                <p className="text-xs text-gray-500 font-mono">Multi-Agent Code Review System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isApiConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`w-2 h-2 rounded-full ${isApiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-mono ${isApiConnected ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isApiConnected ? 'API CONNECTED' : 'API DISCONNECTED'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-xs text-gray-600 font-mono">4 AGENTS ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-xs font-mono uppercase">Total Reviews</p><p className="text-3xl font-bold text-gray-900 mt-1">{report?.report.summary.total_findings || 0}</p></div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><span className="text-xl">📊</span></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-xs font-mono uppercase">Style Score</p><p className="text-3xl font-bold text-gray-900 mt-1">{report?.report.summary.style_score || 100}/100</p></div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><span className="text-xl">🎨</span></div>
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-700 rounded-full transition-all" style={{ width: `${report?.report.summary.style_score || 100}%` }}></div></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-xs font-mono uppercase">Logic Score</p><p className="text-3xl font-bold text-gray-900 mt-1">{report?.report.summary.logic_score || 100}/100</p></div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><span className="text-xl">🧠</span></div>
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-700 rounded-full transition-all" style={{ width: `${report?.report.summary.logic_score || 100}%` }}></div></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-xs font-mono uppercase">Security Risk</p><p className={`text-xl font-bold mt-1 ${report?.report.summary.security_risk === 'dangerous' ? 'text-red-600' : report?.report.summary.security_risk === 'caution' ? 'text-amber-600' : 'text-emerald-600'}`}>{report?.report.summary.security_risk?.toUpperCase() || 'SAFE'}</p></div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"><span className="text-xl">🔒</span></div>
            </div>
          </div>
        </div>

        {/* Main Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT PANEL - Code Editor */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="border-b border-gray-200 px-5 py-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div></div>
                    <span className="text-sm font-mono text-gray-600 ml-2">editor.py</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono"><span>{code.length} chars</span><span>{code.split('\n').length} lines</span></div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex gap-3 mb-4">
                  <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white" placeholder="filename.py" />
                  <label className="px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition flex items-center gap-2">📁 Upload<input type="file" accept=".py" onChange={handleFileUpload} className="hidden" /></label>
                  <button onClick={handleReview} disabled={loading} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2">{loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Analyzing...</> : '▶ Review Code'}</button>
                </div>
                
                <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder='# Enter Python code here\n# Example:\ndef authenticate(user, password="admin123"):\n    if user == "admin":\n        return True\n    return False\n\ndef process_input(data):\n    eval(data)\n    return data' className="w-full h-[440px] font-mono text-sm p-5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none" />
              </div>
            </div>

            {/* Quick Templates */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCode('# Simple function\ndef add(a, b):\n    return a + b')} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition font-mono">simple.py</button>
              <button onClick={() => setCode('def login(pwd="admin123"):\n    print(pwd)\n    return True\n\npassword = "secret"')} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition font-mono">security.py</button>
              <button onClick={() => setCode('def complex(x):\n    if x > 10:\n        for i in range(x):\n            if i % 2 == 0:\n                print(i)\n    return x')} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition font-mono">logic.py</button>
              <button onClick={() => setCode('')} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-400 hover:bg-gray-50 transition font-mono">clear</button>
            </div>
          </div>

          {/* RIGHT PANEL - Live Logs Terminal */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gray-950 px-5 py-3 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-amber-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div></div>
                  <span className="text-sm font-mono text-gray-500 ml-2">terminal@codeholla:~$</span>
                </div>
                <button onClick={clearLogs} className="text-xs text-gray-500 hover:text-gray-300 transition px-2 py-1 rounded hover:bg-gray-800 font-mono">clear</button>
              </div>
              
              <div className="h-[440px] overflow-y-auto p-4 bg-gray-900">
                {logs.length === 0 ? (
                  <div className="text-center py-16"><div className="text-5xl mb-4 text-gray-700">◉</div><p className="text-gray-500 font-mono">System Ready</p><p className="text-xs text-gray-700 mt-2 font-mono">Enter code and click "Review Code"</p></div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="mb-2 flex items-start gap-2 hover:bg-gray-800/50 rounded px-2 py-1 transition font-mono text-xs">
                      <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                      <span className="text-gray-600 shrink-0">{getLogIcon(log.type)}</span>
                      <span className={`break-all ${getLogColor(log.type)}`}>{log.agent && <span className="text-gray-600">[{log.agent.toUpperCase()}] </span>}{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Results Panel */}
            {report && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-fadeIn">
                <div className="flex border-b border-gray-200">
                  <button onClick={() => setActiveTab('results')} className={`flex-1 px-5 py-3 text-sm font-mono font-medium transition ${activeTab === 'results' ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>📋 RESULTS</button>
                  <button onClick={() => setActiveTab('plan')} className={`flex-1 px-5 py-3 text-sm font-mono font-medium transition ${activeTab === 'plan' ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>🎯 PLAN</button>
                </div>

                <div className="p-5 max-h-[320px] overflow-y-auto">
                  {activeTab === 'results' && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-gray-500 text-xs font-mono uppercase">Overall Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-medium ${report.report.overall_status === 'FAIL' ? 'bg-red-50 text-red-700 border border-red-200' : report.report.overall_status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{report.report.overall_status}</span>
                      </div>
                      
                      <div><h4 className="text-xs font-mono text-gray-500 mb-3 uppercase">Quality Metrics</h4><div className="space-y-3"><div><div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Style Compliance</span><span className="font-mono font-bold">{report.report.summary.style_score}%</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-700 rounded-full" style={{ width: `${report.report.summary.style_score}%` }}></div></div></div><div><div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Logic Correctness</span><span className="font-mono font-bold">{report.report.summary.logic_score}%</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-700 rounded-full" style={{ width: `${report.report.summary.logic_score}%` }}></div></div></div></div></div>
                      
                      {report.report.findings.length > 0 && (<div><h4 className="text-xs font-mono text-gray-500 mb-3 uppercase">Findings ({report.report.findings.length})</h4><div className="space-y-2">{report.report.findings.slice(0, 4).map((finding, idx) => (<div key={idx} className="p-3 bg-gray-50 rounded-lg border-l-2 border-l-gray-700"><div className="flex gap-2 mb-2 flex-wrap"><span className={`text-xs px-2 py-0.5 rounded-full font-mono ${getSeverityBadge(finding.severity)}`}>{finding.severity.toUpperCase()}</span><span className="text-xs text-gray-500 font-mono">Line {finding.line}</span></div><p className="text-sm text-gray-700 mb-2">{finding.message}</p><p className="text-xs text-gray-500 font-mono">💡 {finding.suggestion}</p></div>))}</div></div>)}
                    </div>
                  )}

                  {activeTab === 'plan' && (
                    <div className="space-y-3">
                      <div className={`p-4 rounded-lg border ${report.plan.style_review ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}><div className="flex items-center gap-3"><span className="text-2xl">🎨</span><div><div className="font-mono font-semibold">STYLE REVIEWER</div><div className="text-xs text-gray-600 font-mono">{report.plan.style_review ? 'ENABLED - PEP8 compliance' : 'DISABLED'}</div></div></div></div>
                      <div className={`p-4 rounded-lg border ${report.plan.logic_review ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}><div className="flex items-center gap-3"><span className="text-2xl">🧠</span><div><div className="font-mono font-semibold">LOGIC REVIEWER</div><div className="text-xs text-gray-600 font-mono">{report.plan.logic_review ? 'ENABLED - Bug detection' : 'DISABLED - No complex logic'}</div></div></div></div>
                      <div className={`p-4 rounded-lg border ${report.plan.security_review ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}><div className="flex items-center gap-3"><span className="text-2xl">🔒</span><div><div className="font-mono font-semibold">SECURITY REVIEWER</div><div className="text-xs text-gray-600 font-mono">{report.plan.security_review ? 'ENABLED - Vulnerability scan' : 'DISABLED - No security concerns'}</div></div></div></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-12 py-6 text-center border-t border-gray-200 bg-white">
        <p className="text-gray-400 text-xs font-mono uppercase">CODEHOLLA • MULTI-AGENT SYSTEM • CWD ARCHITECTURE • OLLAMA LLM</p>
        <p className="text-gray-300 text-xs mt-1 font-mono">LOCAL EXECUTION • ZERO CLOUD COSTS</p>
      </footer>
    </div>
  );
}

export default App;