import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import TerminalLogs from '../components/TerminalLogs';
import { GitBranch, Rocket, Box, LogOut, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const { logout } = useContext(AuthContext);
  const [gitURL, setGitURL] = useState('');
  const [slug, setSlug] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployRes, setDeployRes] = useState(null);

  const handleDeploy = async (e) => {
    e.preventDefault();
    setDeploying(true);
    setDeployRes(null);
    try {
      const res = await axios.post('http://localhost:9000/project', { gitURL, slug });
      setDeployRes(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
    setDeploying(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-gray-100 font-sans selection:bg-purple-500/30">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black border border-white/10 group-hover:border-white/30 transition-colors">
            <Box className="w-5 h-5 text-gray-200 group-hover:text-white transition-colors" />
            <div className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-gray-200 group-hover:text-white transition-colors">Vercel Clone</span>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-white flex items-center space-x-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-white/5">
          <span>Sign Out</span>
          <LogOut className="w-4 h-4 opacity-70" />
        </button>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-start mt-4">
        
        {/* Left Column: Input Panel */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">Deploy your project</h2>
                <p className="text-gray-400 text-[15px]">Import a Git repository to instantly dispatch a Serverless ECS build pipeline.</p>
              </div>
              
              <form onSubmit={handleDeploy} className="space-y-5">
                <div>
                  <label className="text-[13px] font-medium text-gray-300 block mb-2 flex items-center space-x-2 uppercase tracking-wider">
                    <GitBranch className="w-4 h-4 text-gray-400"/> 
                    <span>Git Repository URL</span>
                  </label>
                  <input 
                    type="url" 
                    value={gitURL}
                    onChange={(e) => setGitURL(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-white hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600 block text-[15px]"
                    placeholder="https://github.com/username/project"
                    required
                  />
                </div>

                <div>
                  <label className="text-[13px] font-medium text-gray-300 block mb-2 flex items-center space-x-2 uppercase tracking-wider">
                    <Box className="w-4 h-4 text-gray-400"/> 
                    <span>Project Identifier (Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-white hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600 block text-[15px]"
                    placeholder="my-cool-project"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={deploying}
                    className="w-full bg-white text-black font-medium text-[15px] rounded-lg py-3 hover:bg-gray-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                  >
                    <Rocket className={`w-4 h-4 ${deploying ? 'animate-pulse' : ''}`}/>
                    <span>{deploying ? 'Dispatching to AWS...' : 'Deploy'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Queued Deployment Status */}
          {deployRes && (
            <div className="relative group animate-in fade-in slide-in-from-top-4">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 rounded-2xl blur opacity-70"></div>
              <div className="relative bg-[#0a0a0a] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center space-x-3 text-emerald-400 mb-2">
                  <CheckCircle2 className="w-5 h-5 shadow-emerald-500/50 drop-shadow-md"/>
                  <h3 className="font-medium text-lg tracking-tight text-white">Deployment Queued</h3>
                </div>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">Your application has been securely provisioned onto an AWS Fargate container and is awaiting logs.</p>
                
                <div className="space-y-3">
                  <div className="group/item flex flex-col bg-black/50 rounded-lg px-4 py-3 border border-white/5 hover:border-white/10 transition-colors">
                    <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest mb-1">Production Domain</span>
                    <a href={deployRes.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-[14px] transition-colors truncate">
                      {deployRes.url}
                    </a>
                  </div>
                  <div className="flex justify-between items-center bg-black/50 rounded-lg px-4 py-3 border border-white/5 hover:border-white/10 transition-colors mt-2">
                    <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest">Build ID</span>
                    <span className="text-gray-300 text-sm font-mono tracking-tight bg-white/5 px-2 py-0.5 rounded">{deployRes.buildId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Terminal */}
        <div className="h-full min-h-[550px] animate-in fade-in slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
          {deployRes ? (
            <div className="relative h-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-70"></div>
              <TerminalLogs buildId={deployRes.buildId} />
            </div>
          ) : (
            <div className="h-full bg-gradient-to-b from-[#0a0a0a] to-[#040404] border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-12 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="relative z-10 flex flex-col items-center">
                <Box className="w-16 h-16 mb-6 text-gray-700 group-hover:text-gray-500 transition-colors duration-500" strokeWidth={1} />
                <h3 className="text-xl font-medium tracking-tight text-gray-300 mb-2">No active deployments</h3>
                <p className="text-gray-500 max-w-sm text-[15px] leading-relaxed">Execute a deployment on the left panel to instantly stream compiling container logs via WebSockets across the AWS perimeter.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
