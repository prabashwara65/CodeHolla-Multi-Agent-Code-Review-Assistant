import React, { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import type { ReviewResponse, Finding } from './types';

type TabType = 'results' | 'plan';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'agent';
  message: string;
}

function App() {
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('sample.py');
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ReviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('results');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleReview = async (): Promise<void> => {
    if (!code.trim()) {
      addLog('Please enter some code to review', 'warning');
      return;
    }

    setLoading(true);
    setLogs([]);
    addLog('🚀 Starting Code Review Process', 'info');
    addLog(`📁 File: ${fileName}`, 'info');
    addLog(`📝 Code size: ${code.length} characters`, 'info');
    
    try {
      addLog('🤖 Calling Coordinator Agent...', 'agent');
      const response = await api.reviewCode(code, fileName);
      
      if (response.success) {
        addLog(`✅ Coordinator Plan: Style=${response.plan.style_review}, Logic=${response.plan.logic_review}, Security=${response.plan.security_review}`, 'success');
        
        if (response.plan.style_review) {
          addLog('🎨 Style Reviewer: Analyzing PEP8 compliance...', 'agent');
        }
        if (response.plan.logic_review) {
          addLog('🧠 Logic Reviewer: Checking for bugs and edge cases...', 'agent');
        }
        if (response.plan.security_review) {
          addLog('🔒 Security Reviewer: Scanning for vulnerabilities...', 'agent');
        }
        
        addLog(`📊 Review Complete! Found ${response.report.summary.total_findings} issues`, 'success');
        addLog(`📈 Status: ${response.report.overall_status} | Security Risk: ${response.report.summary.security_risk}`, 'info');
        
        setReport(response);
        setActiveTab('results');
      } else {
        addLog(`❌ Error: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Review failed:', error);
      addLog('❌ Failed to connect to backend. Make sure server is running on port 5000', 'error');
    }
    setLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    addLog(`📂 Uploading file: ${file.name}`, 'info');
    const reader = new FileReader();
    reader.onload = (e) => {
      setCode(e.target?.result as string);
      setFileName(file.name);
      addLog(`✅ File loaded: ${file.name} (${file.size} bytes)`, 'success');
    };
    reader.readAsText(file);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared', 'info');
  };

  const getLogIcon = (type: string) => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'agent': return '🤖';
      default: return '📌';
    }
  };

  const getLogColor = (type: string) => {
    switch(type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'agent': return 'text-purple-400';
      default: return 'text-blue-400';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch(severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'FAIL': return 'bg-red-600';
      case 'WARNING': return 'bg-yellow-500';
      case 'PASS': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-bounce">🤖</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">CodeHolla</h1>
                <p className="text-xs text-gray-400">Multi-Agent Code Review Assistant</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Ollama Active</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-purple-400">4 Agents Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-6 py-6">
        {/* Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT SIDE - Code Editor */}
          <div className="space-y-4">
            {/* Code Input Card */}
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-5 py-3 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-400 ml-2">editor.py</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{code.length} chars</span>
                    <span className="text-xs text-gray-500">{code.split('\n').length} lines</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex gap-3 mb-4 flex-wrap">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="filename.py"
                  />
                  <label className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-medium cursor-pointer hover:shadow-lg transition-all">
                    📁 Upload
                    <input type="file" accept=".py" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    onClick={handleReview}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Reviewing...
                      </span>
                    ) : (
                      '🚀 Start Review'
                    )}
                  </button>
                </div>
                
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder='# Enter your Python code here
# Example:
def hello():
    print("Hello World")
    
password = "hardcoded123"

def insecure():
    eval(user_input)'
                  className="w-full h-[400px] font-mono text-sm p-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>

            {/* Quick Examples */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCode('# Simple function\ndef add(a, b):\n    return a + b')} className="px-3 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-400 hover:bg-gray-700 transition">Simple</button>
              <button onClick={() => setCode('def login(username, password="admin123"):\n    if username == "admin":\n        print("Welcome")\n    return True')} className="px-3 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-400 hover:bg-gray-700 transition">With Password</button>
              <button onClick={() => setCode('import os\n\ndef process(data):\n    eval(data)\n    os.system("rm -rf /")')} className="px-3 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-400 hover:bg-gray-700 transition">Security Issues</button>
              <button onClick={() => setCode('def complex_logic(x):\n    if x > 10:\n        if x < 20:\n            for i in range(x):\n                print(i)\n        else:\n            return x * 2\n    return x')} className="px-3 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-400 hover:bg-gray-700 transition">Complex Logic</button>
            </div>
          </div>

          {/* RIGHT SIDE - Live Logs & Results */}
          <div className="space-y-4">
            {/* Live Logs Terminal */}
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-mono text-gray-400 ml-2">terminal@codeholla:~$</span>
                  </div>
                  <button onClick={clearLogs} className="text-xs text-gray-500 hover:text-gray-300 transition">Clear</button>
                </div>
              </div>
              
              <div className="h-[300px] overflow-y-auto p-4 font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">
                    <div className="text-4xl mb-2">🖥️</div>
                    <p>Ready for code review</p>
                    <p className="text-xs mt-2">Enter code and click "Start Review"</p>
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="mb-2 flex items-start gap-2 group hover:bg-gray-800/30 rounded px-2 py-1 transition">
                      <span className="text-gray-600 text-xs shrink-0">[{log.timestamp}]</span>
                      <span className="shrink-0">{getLogIcon(log.type)}</span>
                      <span className={`${getLogColor(log.type)} break-all`}>{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Results / Plan Tabs */}
            {report && (
              <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="flex border-b border-gray-700">
                  <button onClick={() => setActiveTab('results')} className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'results' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-200'}`}>📊 Results</button>
                  <button onClick={() => setActiveTab('plan')} className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'plan' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-200'}`}>🎯 Review Plan</button>
                </div>

                <div className="p-4 max-h-[400px] overflow-y-auto">
                  {activeTab === 'results' && (
                    <div className="space-y-4">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Overall Status</span>
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(report.report.overall_status)}`}>
                          {report.report.overall_status}
                        </span>
                      </div>
                      
                      {/* Scores */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-gray-800 rounded-lg"><div className="text-xs text-gray-400">Style</div><div className="text-xl font-bold text-purple-400">{report.report.summary.style_score}</div></div>
                        <div className="text-center p-2 bg-gray-800 rounded-lg"><div className="text-xs text-gray-400">Logic</div><div className="text-xl font-bold text-blue-400">{report.report.summary.logic_score}</div></div>
                        <div className="text-center p-2 bg-gray-800 rounded-lg"><div className="text-xs text-gray-400">Security Risk</div><div className={`text-sm font-bold ${report.report.summary.security_risk === 'dangerous' ? 'text-red-400' : report.report.summary.security_risk === 'caution' ? 'text-yellow-400' : 'text-green-400'}`}>{report.report.summary.security_risk.toUpperCase()}</div></div>
                      </div>
                      
                      {/* Findings */}
                      {report.report.findings.length > 0 ? (
                        <div><h3 className="text-sm font-semibold text-gray-300 mb-2">🔍 Findings ({report.report.findings.length})</h3>{report.report.findings.slice(0, 5).map((finding, idx) => (<div key={idx} className="mb-2 p-2 bg-gray-800/50 rounded-lg"><div className="flex gap-2 mb-1 flex-wrap"><span className={`text-xs px-2 py-0.5 rounded-full text-white ${getSeverityColor(finding.severity)}`}>{finding.severity}</span><span className="text-xs text-gray-500">Line {finding.line}</span></div><p className="text-xs text-gray-300">{finding.message.slice(0, 100)}</p></div>))}</div>
                      ) : (<div className="text-center py-4 text-gray-500">✅ No issues found!</div>)}
                    </div>
                  )}

                  {activeTab === 'plan' && (
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${report.plan.style_review ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800'}`}><div className="flex items-center gap-2"><span className="text-2xl">🎨</span><div><div className="font-semibold">Style Reviewer</div><div className="text-xs text-gray-400">{report.plan.style_review ? '✅ Enabled - Checking PEP8 compliance' : '❌ Disabled'}</div></div></div></div>
                      <div className={`p-3 rounded-lg ${report.plan.logic_review ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800'}`}><div className="flex items-center gap-2"><span className="text-2xl">🧠</span><div><div className="font-semibold">Logic Reviewer</div><div className="text-xs text-gray-400">{report.plan.logic_review ? '✅ Enabled - Analyzing complex logic' : '❌ Disabled - No complex logic detected'}</div></div></div></div>
                      <div className={`p-3 rounded-lg ${report.plan.security_review ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800'}`}><div className="flex items-center gap-2"><span className="text-2xl">🔒</span><div><div className="font-semibold">Security Reviewer</div><div className="text-xs text-gray-400">{report.plan.security_review ? '✅ Enabled - Scanning for vulnerabilities' : '❌ Disabled - No security concerns'}</div></div></div></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative mt-8 py-4 text-center border-t border-white/10">
        <p className="text-gray-500 text-xs">CodeHolla | Multi-Agent System | Coordinator-Worker-Delegator | Ollama LLM</p>
      </footer>
    </div>
  );
}

export default App;