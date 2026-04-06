import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, Mail, LogIn, UserPlus } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos.');
      } else {
        setError(err.message || 'Ocorreu um erro na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-blue-950 p-8 text-white text-center">
          <h1 className="text-3xl font-black tracking-tighter italic uppercase">ADFARE</h1>
          <p className="text-[10px] font-black text-blue-400 tracking-[0.3em] uppercase mt-2">Gestão de Escala</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-6 text-center">
            {isLogin ? 'Entrar no Sistema' : 'Criar Nova Conta'}
          </h2>

          {error && (
             <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl text-center uppercase">
               {error}
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">E-mail</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                  placeholder="seu@email.com"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Senha</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                  placeholder="******"
                  required
                  autoComplete="current-password"
                  minLength={6}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white p-4 rounded-3xl font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xl disabled:opacity-50 mt-4"
            >
              {loading ? 'Aguarde...' : isLogin ? <><LogIn size={18} /> Entrar</> : <><UserPlus size={18} /> Criar Conta</>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              {isLogin ? 'Não tem conta? Crie uma' : 'Já tem conta? Fazer Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
