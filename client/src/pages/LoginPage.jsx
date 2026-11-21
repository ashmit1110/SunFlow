import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Lock, Mail, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { mockUsers } from '../services/mockData';

export function LoginPage() {
  const [email, setEmail] = useState('vikram@sunpower.demo');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (user) => {
    setEmail(user.email);
    setPassword('demo1234');
    login({ email: user.email, password: 'demo1234' }).then(() => {
      navigate('/dashboard', { replace: true });
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Solar Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/25">
            <Sun className="w-8 h-8 fill-slate-950 stroke-slate-950" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          SunFlow SaaS
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Solar Installation Management & Operations Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/80">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@sunpower.demo"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-bold"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to SunFlow
            </Button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-700">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Hackathon Demo Quick Login (1-Click)
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {mockUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(u)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-colors group"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block group-hover:text-amber-400 transition-colors">
                      {u.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {u.email}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 uppercase">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
