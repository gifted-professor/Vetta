import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem('vetta_last_email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login delay
    setTimeout(() => {
      localStorage.setItem('vetta_auth', 'true');
      localStorage.setItem('vetta_last_email', email);
      setLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center font-sans text-slate-900">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 mb-6">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-400 font-bold text-sm mt-2">Sign in to access Vetta Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm outline-none focus:border-indigo-500 transition-all font-medium"
              placeholder="admin@vetta.ai"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm outline-none focus:border-indigo-500 transition-all font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
