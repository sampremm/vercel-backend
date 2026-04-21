import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Terminal } from 'lucide-react';

export default function TerminalLogs({ buildId }) {
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Connect statically to the backend WebSocket Gateway
    const socket = io('http://localhost:9000');
    
    // Dynamically join the build room securely based on the fetched ECS ID
    socket.emit('subscribe', `logs:${buildId}`);

    socket.on('message', (message) => {
      setLogs((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [buildId]);

  // Auto-scroll logic mimicking a physical terminal flow
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="relative h-full w-full bg-[#050505] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono text-[13px] leading-relaxed group/terminal">
      {/* Glossy Top Bar */}
      <div className="bg-gradient-to-b from-white/10 to-transparent border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10 w-full backdrop-blur-md">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)] border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)] border border-green-500/50"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center space-x-2 text-gray-500/80 font-medium">
            <Terminal className="w-3.5 h-3.5" />
            <span className="opacity-80">build_runner_ecs • {buildId.split('-')[0]}</span>
          </div>
        </div>
      </div>
      
      {/* Log Output Area */}
      <div className="flex-1 p-5 overflow-y-auto w-full space-y-1.5 scroll-smooth custom-scrollbar relative">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center blur-[0.5px]">
            <div className="text-gray-500 animate-pulse tracking-wide flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
              <span>Awaiting Docker Container Initialization [AWS ECS Fargate]...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className={`break-words flex space-x-3 items-start animate-in slide-in-from-left-2 fade-in duration-300 ${log.toLowerCase().includes('error') ? 'text-red-400 font-medium' : 'text-gray-300'}`}>
                <span className="text-blue-500/70 select-none font-bold mt-0.5">❯</span>
                <span className="flex-1">{log}</span>
              </div>
            ))}
          </div>
        )}
        <div ref={logsEndRef} className="h-4" />
      </div>
    </div>
  );
}
