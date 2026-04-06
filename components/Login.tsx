import React, { useState, useRef } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { Lock, Mail, LogIn, UserPlus, User, ImagePlus, UserRound } from 'lucide-react';

const CARGOS = [
  "Pastor",
  "Evangelista",
  "Missionário/Missionária",
  "Presbítero",
  "Diácono/Diaconisa",
  "Obreiro/Obreira"
];

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState(CARGOS[0]);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const clearForm = () => {
     setEmail('');
     setPassword('');
     setNome('');
     setCargo(CARGOS[0]);
     setFoto(null);
     setFotoPreview(null);
     setError('');
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!nome) throw new Error("O nome completo é obrigatório para cadastro.");
        
        // 1. Cria usuário
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let photoURL = '';

        // 2. Faz upload da foto, se houver
        if (foto) {
          const fileRef = ref(storage, `profile_pictures/${user.uid}`);
          await uploadBytes(fileRef, foto);
          photoURL = await getDownloadURL(fileRef);
        }

        // 3. Atualiza o profile do Auth
        await updateProfile(user, {
          displayName: nome,
          ...(photoURL && { photoURL })
        });

        // 4. Salva documento extra no Firestore
        await setDoc(doc(db, "users", user.uid), {
          nome,
          email,
          cargo,
          photoURL,
          createdAt: new Date().toISOString()
        });
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
            
            {!isLogin && (
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus size={32} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-white text-[10px] font-black uppercase tracking-widest text-center px-2">Trocar<br/>Foto</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <span className="text-[10px] text-slate-400 uppercase mt-2 font-bold select-none">Foto de Perfil (Opcional)</span>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Nome Completo *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                    placeholder="João da Silva"
                    required
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Cargo Ministerial *</label>
                <div className="relative">
                  <select 
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all appearance-none cursor-pointer"
                    required
                  >
                    {CARGOS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">E-mail { !isLogin && '*' }</label>
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
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Senha { !isLogin && '*' }</label>
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
              onClick={handleToggleMode}
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
