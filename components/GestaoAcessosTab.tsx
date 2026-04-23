import React, { useState, useEffect } from 'react';
import { db, auth as primaryAuth, firebaseConfig } from '../lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, getAuth, createUserWithEmailAndPassword, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import { Shield, ShieldAlert, KeyRound, Trash2, UserPlus, Mail, Lock, User, RefreshCw, X, AlertCircle, Search } from 'lucide-react';

interface FirebaseUserDoc {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  photoURL?: string;
  createdAt?: string;
}

const CARGOS = [
  "Pastor",
  "Evangelista",
  "Missionário/Missionária",
  "Presbítero",
  "Diácono/Diaconisa",
  "Obreiro/Obreira",
  "Membro"
];

// CARGOS removido daqui para evitar duplicação ou moved para constante global se necessário
// Mas no arquivo original ele estava aqui. Vou manter apenas a importação do config.

const GestaoAcessosTab: React.FC = () => {
  const [users, setUsers] = useState<FirebaseUserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New user state
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCargo, setNewCargo] = useState('Membro');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList: FirebaseUserDoc[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as FirebaseUserDoc);
      });
      setUsers(usersList);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const secondaryAppName = "SecondaryApp_" + Date.now();
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      await setPersistence(secondaryAuth, inMemoryPersistence);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUid = userCredential.user.uid;

      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);

      await setDoc(doc(db, "users", newUid), {
        nome: newNome,
        email: newEmail,
        cargo: newCargo,
        photoURL: '',
        createdAt: new Date().toISOString()
      });

      alert("Conta de acesso criada com sucesso!");
      setShowAddModal(false);
      setNewNome('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      alert("Erro ao criar usuário: " + (error.message || "Aconteceu uma falha."));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return (
      u.nome.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s) || 
      u.cargo.toLowerCase().includes(s)
    );
  }).sort((a,b) => a.nome.localeCompare(b.nome));

  const handlePasswordReset = async (email: string) => {
    if (confirm(`Tem certeza que deseja enviar um e-mail de redefinição de senha para ${email}?`)) {
      try {
        await sendPasswordResetEmail(primaryAuth, email);
        alert(`O e-mail contendo o link de redefinição de senha foi enviado para ${email}. Avise o membro para olhar a caixa de entrada.`);
      } catch (error) {
        console.error("Erro ao enviar redefinição:", error);
        alert("Ocorreu um erro ao tentar enviar o e-mail.");
      }
    }
  };

  const handleDeleteUser = async (user: FirebaseUserDoc) => {
    if (confirm(`ATENÇÃO! EXCLUIR ACESSO: Você apagará a conta de ${user.nome}.\nEle não listará mais neste perfil, porém devido à segurança do Google, a credencial primária dele no Auth não pode ser excluída pelo navegador (Apenas manual no painel Firebase se desejado). Realmente ocultá-lo/removê-lo do banco de dados?`)) {
      try {
        await deleteDoc(doc(db, "users", user.id));
        setUsers(users.filter(u => u.id !== user.id));
        alert("Perfil excluído com sucesso.");
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Erro ao tentar excluir.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
            <Shield className="text-rose-500" /> Painel de Segurança e Acessos
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            EXCLUSIVO PARA PASTOR: Administre as contas.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-adfare-gradient text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 shadow-[0_8px_30px_rgb(243,112,33,0.3)] transition-all flex items-center gap-2"
        >
          <UserPlus size={16} /> Nova Conta de Membro
        </button>
      </div>

      <div className="bg-rose-50 p-4 rounded-[24px] border border-rose-100 flex gap-3 text-rose-800 text-xs items-start">
        <ShieldAlert size={20} className="shrink-0 mt-0.5" />
        <p>
          Este painel permite a visualização e controle de contas vinculadas ao sistema atual. Se o Pastor excluir uma conta, os registros de "saldo" da escala continuam atrelados até que as escalas sejam limpas. Você pode redefinir as contas por e-mail oficial (Reset Password) da Google.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="Filtrar por nome, email ou cargo..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm" 
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
           <RefreshCw size={32} className="animate-spin" />
           <p className="text-[10px] font-black tracking-widest uppercase">Buscando Contas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(u => (
            <div key={u.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
              <div className="flex items-center gap-3">
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.nome} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tighter truncate">{u.nome || "Não definido"}</span>
                  <span className="text-[10px] font-bold text-adfare-orange uppercase tracking-widest">{u.cargo || "Membro"}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-[16px] border border-slate-100 flex items-center gap-2">
                <Mail size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 truncate">{u.email}</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                <button 
                  onClick={() => handlePasswordReset(u.email)}
                  className="flex-1 bg-amber-50 text-amber-600 hover:bg-amber-100 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                >
                  <KeyRound size={12} /> Resetar Senha
                </button>
                <button 
                  onClick={() => handleDeleteUser(u)}
                  className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                  disabled={primaryAuth.currentUser?.uid === u.id}
                  title={primaryAuth.currentUser?.uid === u.id ? "Você não pode excluir a sua própria conta logada." : "Excluir Registro"}
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionarl Conta */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="bg-adfare-navy p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                  <UserPlus className="text-adfare-orange" size={20} /> Cadastrar Membro
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
               <div className="bg-blue-50 text-blue-800 p-3 rounded-2xl text-[10px] font-bold flex gap-2 items-start mb-2 border border-blue-100">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>Crie o acesso de um obreiro/membro agora. Ele poderá fazer login na plataforma imediatamente com a senha inserida aqui.</p>
               </div>

               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Nome Completo</label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input required type="text" value={newNome} onChange={e => setNewNome(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 font-bold text-sm" placeholder="Ex: Roberto Lima" />
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Cargo Declarado</label>
                 <select required value={newCargo} onChange={e => setNewCargo(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 font-bold text-sm appearance-none cursor-pointer">
                   {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>

               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Email Oficial (Login)</label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 font-bold text-sm" placeholder="usuario@email.com" />
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Senha Inicial</label>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 font-bold text-sm" placeholder="Minimo 6 caracteres" />
                 </div>
               </div>

               <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Cancelar</button>
                 <button disabled={submitting} type="submit" className="flex-[2] px-4 py-3 bg-adfare-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-50">
                   {submitting ? 'Aguarde...' : 'Criar Registro'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoAcessosTab;
