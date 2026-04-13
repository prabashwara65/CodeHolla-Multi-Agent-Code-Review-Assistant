import React, { useState } from 'react';
import { api } from './services/api';
import type{ ReviewResponse, Finding } from './types';

type TabType = 'editor' | 'results' | 'plan';

function App() {
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('sample.py');
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ReviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('editor');

  const handleReview = async (): Promise<void> => {
    if (!code.trim()) {
      alert('Please enter some code to review');
      return;
    }

    setLoading(true);
    try {
      const response = await api.reviewCode(code, fileName);
      if (response.success) {
        setReport(response);
        setActiveTab('results');
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      console.error('Review failed:', error);
      alert('Failed to review code. Make sure the backend is running on port 5000');
    }
    setLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setCode(e.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsText(file);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <header className="bg-black/50 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold text-white text-center">🤖 CodeHolla</h1>
          <p className="text-gray-300 text-center mt-2">Multi-Agent Code Review Assistant | Powered by Ollama LLM</p>
          <p className="text-gray-400 text-center text-sm mt-1">API: http://localhost:5000</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-3 mb-6">
          <button onClick={() => setActiveTab('editor')} className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'editor' ? 'bg-white text-purple-600 shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'}`}>✏️ Code Editor</button>
          <button onClick={() => setActiveTab('results')} disabled={!report} className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'results' ? 'bg-white text-purple-600 shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'} ${!report && 'opacity-50 cursor-not-allowed'}`}>📊 Results</button>
          <button onClick={() => setActiveTab('plan')} disabled={!report} className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'plan' ? 'bg-white text-purple-600 shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'} ${!report && 'opacity-50 cursor-not-allowed'}`}>🎯 Review Plan</button>
        </div>

        {activeTab === 'editor' && (
          <div className="bg-white rounded-xl shadow-2xl p-6">
            <div className="flex gap-3 mb-4 flex-wrap">
              <input type="text" placeholder="Filename" value={fileName} onChange={(e) => setFileName(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <label className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition">📁 Upload .py File<input type="file" accept=".py" onChange={handleFileUpload} className="hidden" /></label>
              <button onClick={handleReview} disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition">{loading ? '🔄 Reviewing...' : '🔍 Start Review'}</button>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder='# Enter your Python code here&#10;# Example:&#10;def hello():&#10;    print("Hello World")&#10;&#10;password = "hardcoded123"' className="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-900 text-gray-100" />
            {loading && (<div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div><p className="mt-4 text-gray-600">🤖 Agents are analyzing your code...</p><p className="text-sm text-gray-500">⏱️ This may take 30-60 seconds</p></div>)}
          </div>
        )}

        {activeTab === 'results' && report && (
          <div className="bg-white rounded-xl shadow-2xl p-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Review Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><span className="text-gray-500">File:</span><p className="font-semibold">{report.report.filename}</p></div>
                <div><span className="text-gray-500">Status:</span><p className={`inline-block px-3 py-1 rounded-full text-white text-sm ${getStatusColor(report.report.overall_status)}`}>{report.report.overall_status}</p></div>
                <div><span className="text-gray-500">Findings:</span><p className="font-semibold">{report.report.summary.total_findings}</p></div>
                <div><span className="text-gray-500">High Severity:</span><p className="font-semibold text-red-600">{report.report.summary.high_severity_count}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 rounded-lg p-4 text-center"><div className="text-gray-600">Style Score</div><div className="text-3xl font-bold text-purple-600">{report.report.summary.style_score}/100</div><div className="w-full bg-gray-300 rounded-full h-2 mt-2"><div className="bg-purple-600 rounded-full h-2" style={{ width: `${report.report.summary.style_score}%` }}></div></div></div>
              <div className="bg-gray-100 rounded-lg p-4 text-center"><div className="text-gray-600">Logic Score</div><div className="text-3xl font-bold text-blue-600">{report.report.summary.logic_score}/100</div><div className="w-full bg-gray-300 rounded-full h-2 mt-2"><div className="bg-blue-600 rounded-full h-2" style={{ width: `${report.report.summary.logic_score}%` }}></div></div></div>
              <div className="bg-gray-100 rounded-lg p-4 text-center"><div className="text-gray-600">Security Risk</div><div className={`text-3xl font-bold ${report.report.summary.security_risk === 'dangerous' ? 'text-red-600' : report.report.summary.security_risk === 'caution' ? 'text-yellow-600' : 'text-green-600'}`}>{report.report.summary.security_risk.toUpperCase()}</div></div>
            </div>

            <div className="mb-6"><h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Findings ({report.report.findings.length})</h2>{report.report.findings.map((finding: Finding, idx: number) => (<div key={idx} className="border-l-4 border-purple-600 bg-gray-50 rounded-lg p-4 mb-3"><div className="flex gap-2 mb-2 flex-wrap"><span className="font-bold text-purple-600">{finding.category.toUpperCase()}</span><span className={`px-2 py-1 rounded-full text-white text-xs ${getSeverityColor(finding.severity)}`}>{finding.severity}</span><span className="text-gray-500">Line {finding.line}</span></div><p className="text-gray-700 mb-2">{finding.message}</p><p className="text-blue-600 text-sm">💡 {finding.suggestion}</p></div>))}</div>

            <div><h2 className="text-xl font-bold text-gray-800 mb-4">💡 Recommendations</h2><ul className="list-disc list-inside space-y-2">{report.report.recommendations.map((rec: string, idx: number) => (<li key={idx} className="text-gray-700">{rec}</li>))}</ul></div>
          </div>
        )}

        {activeTab === 'plan' && report && (
          <div className="bg-white rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">🎯 Coordinator Review Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-lg p-6 text-center border-2 ${report.plan.style_review ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}><div className="text-4xl mb-3">🎨</div><div className="font-bold text-lg mb-2">Style Reviewer</div><div className={`font-semibold mb-3 ${report.plan.style_review ? 'text-green-600' : 'text-red-600'}`}>{report.plan.style_review ? '✅ ENABLED' : '❌ DISABLED'}</div><div className="text-sm text-gray-600">{report.plan.style_review ? 'Checking PEP8 compliance, line length, naming conventions' : 'Skipped - No style issues expected'}</div></div>
              <div className={`rounded-lg p-6 text-center border-2 ${report.plan.logic_review ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}><div className="text-4xl mb-3">🧠</div><div className="font-bold text-lg mb-2">Logic Reviewer</div><div className={`font-semibold mb-3 ${report.plan.logic_review ? 'text-green-600' : 'text-red-600'}`}>{report.plan.logic_review ? '✅ ENABLED' : '❌ DISABLED'}</div><div className="text-sm text-gray-600">{report.plan.logic_review ? 'Analyzing complex logic, edge cases, control flow' : 'Skipped - No complex logic detected'}</div></div>
              <div className={`rounded-lg p-6 text-center border-2 ${report.plan.security_review ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}><div className="text-4xl mb-3">🔒</div><div className="font-bold text-lg mb-2">Security Reviewer</div><div className={`font-semibold mb-3 ${report.plan.security_review ? 'text-green-600' : 'text-red-600'}`}>{report.plan.security_review ? '✅ ENABLED' : '❌ DISABLED'}</div><div className="text-sm text-gray-600">{report.plan.security_review ? 'Scanning for vulnerabilities, hardcoded secrets, dangerous functions' : 'Skipped - No security concerns detected'}</div></div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-black/50 backdrop-blur-md text-center py-4 mt-8">
        <p className="text-gray-300 text-sm">CodeHolla | Multi-Agent System | Coordinator-Worker-Delegator Architecture | Local LLM (Ollama)</p>
        <p className="text-gray-400 text-xs mt-1">Backend: http://localhost:5000 | Frontend: http://localhost:3000</p>
      </footer>
    </div>
  );
}

export default App;