import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Lock, User, Mail } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:9000/auth/signup', { name, email, password });
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#000000] px-4 selection:bg-blue-500/30 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="flex flex-col items-center justify-center mb-10 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 shadow-lg flex items-center justify-center relative">
            <Box className="w-6 h-6 text-white z-10" />
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur rounded-xl"></div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Create an account</h1>
          <p className="text-gray-400 text-sm">Join the platform to deploy applications instantly.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-400 block px-1">Full Name</label>
            <div className="relative group/input">
              <User className="w-5 h-5 absolute left-3.5 top-3 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-700"
                placeholder="John Doe"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-400 block px-1">Email address</label>
            <div className="relative group/input">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-700"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-400 block px-1">Password</label>
            <div className="relative group/input">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white hover:border-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-700"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full bg-white text-black font-semibold rounded-xl py-3 hover:bg-gray-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-6"
          >
            Create Account →
          </button>
        </form>
        <p className="mt-8 text-center text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-white hover:text-blue-400 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
