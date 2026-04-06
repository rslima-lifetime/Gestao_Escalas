import React, { useState, useEffect } from 'react';
import { UserPlus, CalendarDays, ClipboardList, Database, Download, Upload, Trash2, Save, FolderOpen, X, History, Cloud, CloudOff, LogOut, User, ChevronDown, Edit2, Shield } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { AppDataV1, Obreiro, SavedScale } from './types';
import ObreirosTab from './components/ObreirosTab';
import GerenciarMesTab from './components/GerenciarMesTab';
import RelatorioTab from './components/RelatorioTab';
import GestaoAcessosTab from './components/GestaoAcessosTab';
import { MONTHS } from './constants';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import { db, auth } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const LOCAL_STORAGE_KEY = 'adfare_system_v1';

const INITIAL_OBREIROS: Obreiro[] = [
  { id: 'init-1', name: 'Ana Paula', role: 'Ob.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-2', name: 'Lais', role: 'Ob.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-3', name: 'Miriam', role: 'Ob.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-4', name: 'Vinicius', role: 'Dc.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-5', name: 'Ednaldo', role: 'Dc.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-6', name: 'Robertinho', role: 'Dc.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-7', name: 'Roberto Pai', role: 'Dc.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-8', name: 'Junior', role: 'Dc.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-9', name: 'Alexandre', role: 'Dc.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-10', name: 'Ruan', role: 'Dc.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-11', name: 'Suzana', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-12', name: 'Priscila', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-13', name: 'Quesia', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-14', name: 'Luzinete', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-15', name: 'Flávia', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-16', name: 'Taiane', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-17', name: 'Tatiane', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-18', name: 'Brenda', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-19', name: 'Alexia', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-20', name: 'Andreia', role: 'Dca.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
  { id: 'init-21', name: 'Ramon', role: 'Ob.', preferredRole: 'ambos', balance: 0, fixedDays: [], restrictions: [] },
];

const App: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'obreiros' | 'mes' | 'relatorio' | 'usuarios'>('obreiros');
  const [data, setData] = useState<AppDataV1>({
    obreiros: INITIAL_OBREIROS,
    cultos: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    savedScales: []
  });
  
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [userProfile, setUserProfile] = useState<{ cargo?: string, nome?: string, photoURL?: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // Edit profile form state
  const [editNome, setEditNome] = useState('');
  const [editCargo, setEditCargo] = useState('Pastor');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);


  useEffect(() => {
    if (!user) return;
    
    const loadCloudData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const cloudData = userDoc.data() as AppDataV1 & { cargo?: string, nome?: string, photoURL?: string };
          
          setUserProfile({
            cargo: cloudData.cargo,
            nome: cloudData.nome || user.displayName || 'Usuário',
            photoURL: cloudData.photoURL || user.photoURL || ''
          });

          // Prevenir que campos de perfil contaminem os dados do App (Evita reescrever)
          const { cargo, nome, photoURL, email, createdAt, ...appDataOnly } = cloudData;
          
          const savedObreiros = appDataOnly.obreiros || [];
          const missingObreiros = INITIAL_OBREIROS.filter(
            initOb => !savedObreiros.some((savedOb: Obreiro) => savedOb.id === initOb.id)
          );
          
          setData({
             ...appDataOnly,
             obreiros: [...savedObreiros, ...missingObreiros],
             savedScales: appDataOnly.savedScales || []
          });
        } else {
          // Migração do LocalStorage para Nuvem no primeiro acesso
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          let initialData = { ...data };

          if (saved) {
            const parsed = JSON.parse(saved);
            const savedObreiros = parsed.obreiros || [];
            const missingObreiros = INITIAL_OBREIROS.filter(
              initOb => !savedObreiros.some((savedOb: Obreiro) => savedOb.id === initOb.id)
            );
            
            initialData = {
              ...parsed,
               obreiros: [...savedObreiros, ...missingObreiros],
               savedScales: parsed.savedScales || []
            };
            alert('Dados locais encontrados! Estamos migrando sua escala antiga para a sua nova conta na nuvem.');
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
          
          setData(initialData);
          await setDoc(doc(db, 'users', user.uid), initialData);
        }
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setDataLoaded(true);
      }
    };
    
    loadCloudData();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await updateProfile(user, { displayName: editNome });
      await setDoc(doc(db, 'users', user.uid), { nome: editNome, cargo: editCargo }, { merge: true });
      setUserProfile(prev => ({ ...prev, nome: editNome, cargo: editCargo }));
      setShowEditProfile(false);
    } catch (err) {
      console.error("Erro ao atualizar perfil", err);
      alert("Houve um erro ao atualizar os dados do perfil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Sincronização automática para a nuvem
  useEffect(() => {
    if (!user || !dataLoaded) return;
    
    const saveToCloud = async () => {
      setSyncStatus('syncing');
      try {
        await setDoc(doc(db, 'users', user.uid), data, { merge: true });
        setSyncStatus('synced');
      } catch (err) {
        console.error("Erro ao salvar", err);
        setSyncStatus('error');
      }
    };
    
    const timer = setTimeout(saveToCloud, 1500); // Debounce
    return () => clearTimeout(timer);
  }, [data, user, dataLoaded]);

  if (!user) {
    return <Login />;
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Cloud className="text-blue-500 animate-bounce" size={48} />
        <p className="text-sm font-black uppercase text-slate-400 tracking-widest animate-pulse">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_adfare_completo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowBackupMenu(false);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData.obreiros) {
          setData(importedData);
          alert("Backup importado com sucesso! Seus dados foram restaurados para a nuvem.");
        }
      } catch (e) {
        alert("Erro ao importar backup. Verifique o arquivo.");
      }
    };
    reader.readAsText(file);
    setShowBackupMenu(false);
    e.target.value = '';
  };

  const handleResetBalances = () => {
    if (window.confirm("Isso zerará o saldo de todos os obreiros. As escalas atuais não serão afetadas. Continuar?")) {
      setData(prev => ({
        ...prev,
        obreiros: prev.obreiros.map(o => ({ ...o, balance: 0 }))
      }));
    }
    setShowBackupMenu(false);
  };

  const saveCurrentScaleToLibrary = () => {
    if (data.cultos.length === 0) {
      alert("Não há escala para salvar.");
      return;
    }
    const name = prompt("Dê um nome para esta escala (salvará também os saldos atuais):", `${MONTHS[data.currentMonth]} ${data.currentYear} - Final`);
    if (!name) return;

    const newSaved: SavedScale = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toLocaleString(),
      month: data.currentMonth,
      year: data.currentYear,
      cultos: JSON.parse(JSON.stringify(data.cultos)),
      obreiros: JSON.parse(JSON.stringify(data.obreiros))
    };

    setData(prev => ({
      ...prev,
      savedScales: [newSaved, ...prev.savedScales]
    }));
    alert("Escala e configurações salvas na biblioteca!");
    setShowBackupMenu(false);
  };

  const loadScaleFromLibrary = (scale: SavedScale) => {
    if (confirm(`Isso substituirá a escala E os saldos dos obreiros ativos pelos dados de "${scale.name}". Deseja continuar?`)) {
      setData(prev => ({
        ...prev,
        currentMonth: scale.month,
        currentYear: scale.year,
        cultos: JSON.parse(JSON.stringify(scale.cultos)),
        obreiros: JSON.parse(JSON.stringify(scale.obreiros || prev.obreiros))
      }));
      setShowLibrary(false);
      setActiveTab('mes');
    }
  };

  const deleteScaleFromLibrary = (id: string) => {
    if (confirm("Remover esta escala da biblioteca?")) {
      setData(prev => ({
        ...prev,
        savedScales: prev.savedScales.filter(s => s.id !== id)
      }));
    }
  };

  const handleLogout = async () => {
    if (confirm("Deseja desconectar sua conta?")) {
      await signOut(auth);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-950 text-white p-4 shadow-md no-print sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter italic uppercase leading-none">ADFARE</h1>
            <span className="text-[9px] font-black text-blue-400 tracking-[0.3em] uppercase mt-1">Gestão de Escala</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[14px]" title={syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'synced' ? 'Salvo na Nuvem' : 'Erro ao Salvar'}>
              {syncStatus === 'syncing' ? <Cloud className="animate-pulse text-blue-300" size={16} /> : syncStatus === 'synced' ? <Cloud className="text-emerald-400" size={16} /> : <CloudOff className="text-rose-400" size={16} />}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowBackupMenu(false); }}
                className={`flex items-center gap-3 pr-3 py-1 pl-1 rounded-full transition-all border ${showProfileMenu ? 'bg-blue-900 border-blue-700 shadow-xl' : 'bg-blue-900/40 border-blue-800 hover:bg-blue-800'}`}
              >
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Perfil" className="w-8 h-8 rounded-full object-cover border-2 border-blue-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-blue-200 border-2 border-blue-500">
                    <User size={16} />
                  </div>
                )}
                <div className="flex flex-col items-start hidden sm:flex max-w-[120px]">
                  <span className="text-xs font-black text-white truncate w-full">{userProfile?.nome || user.displayName || 'Usuário'}</span>
                  <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest truncate w-full">{userProfile?.cargo || 'Membro'}</span>
                </div>
                <ChevronDown size={14} className="text-blue-300 ml-1 hidden sm:block" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[28px] shadow-2xl py-3 text-gray-800 border border-slate-100 animate-in fade-in slide-in-from-top-2 overflow-hidden z-50">
                  <div className="px-5 py-3 border-b border-slate-50 mb-2 flex items-center gap-3">
                     {userProfile?.photoURL ? (
                        <img src={userProfile.photoURL} alt="Perfil" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                          <User size={24} />
                        </div>
                      )}
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-black text-slate-800 truncate">{userProfile?.nome || user.displayName || 'Usuário'}</span>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest truncate">{userProfile?.cargo || 'Membro'}</span>
                        <span className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</span>
                      </div>
                  </div>
                  
                  <button onClick={() => {
                    setEditNome(userProfile?.nome || user.displayName || '');
                    setEditCargo(userProfile?.cargo || 'Membro');
                    setShowEditProfile(true);
                    setShowProfileMenu(false);
                  }} className="w-full text-left px-5 py-3 hover:bg-blue-50 flex items-center gap-3 group mt-1">
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Edit2 size={16} />
                    </div>
                    <span className="text-sm font-black uppercase text-slate-700 tracking-tighter">Editar Perfil</span>
                  </button>

                  <div className="border-t border-slate-50 my-1"></div>

                  <button onClick={handleLogout} className="w-full text-left px-5 py-3 hover:bg-rose-50 text-rose-600 flex items-center gap-3 group">
                    <div className="bg-rose-100 p-2 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <LogOut size={16} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-tighter">Sair da Conta</span>
                  </button>
                </div>
              )}
            </div>
          
            <div className="relative">
              <button 
                onClick={() => { setShowBackupMenu(!showBackupMenu); setShowProfileMenu(false); }} 
                className={`p-2.5 rounded-2xl transition-all ${showBackupMenu ? 'bg-blue-600 shadow-lg' : 'bg-blue-900/60 hover:bg-blue-800'}`}
              >
                <Database size={22} />
              </button>
              {showBackupMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[28px] shadow-2xl py-3 text-gray-800 border border-slate-100 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-50 mb-2">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ações de Dados</span>
                  </div>
                  
                  <button onClick={saveCurrentScaleToLibrary} className="w-full text-left px-5 py-3 hover:bg-blue-50 flex items-center gap-3 group">
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Save size={16} />
                    </div>
                    <span className="text-sm font-black text-slate-700">Salvar Snapshot Completo</span>
                  </button>

                  <button onClick={() => { setShowLibrary(true); setShowBackupMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-emerald-50 flex items-center gap-3 group">
                    <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <History size={16} />
                    </div>
                    <span className="text-sm font-black text-slate-700">Biblioteca de Salvos</span>
                  </button>

                  <div className="border-t border-slate-50 my-2"></div>

                  <button onClick={handleExportBackup} className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 group">
                    <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                      <Download size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">Exportar Backup</span>
                  </button>

                  <label className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer group">
                    <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                      <Upload size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">Importar Backup</span>
                    <input type="file" className="hidden" accept=".json" onChange={handleImportBackup} />
                  </label>

                  <div className="border-t border-slate-50 my-2"></div>

                  <button onClick={handleResetBalances} className="w-full text-left px-5 py-3 hover:bg-rose-50 text-rose-600 flex items-center gap-3 group mb-1">
                    <div className="bg-rose-100 p-2 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <Trash2 size={16} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-tighter">Zerar Saldos Ativos</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b no-print sticky top-[68px] z-40 shadow-sm overflow-x-auto">
        <div className="max-w-4xl mx-auto flex min-w-max md:min-w-0">
          {[
            { id: 'obreiros', label: 'OBREIROS', icon: UserPlus },
            { id: 'mes', label: 'GERENCIAR', icon: CalendarDays },
            { id: 'relatorio', label: 'MURAL', icon: ClipboardList },
            ...(userProfile?.cargo === 'Pastor' ? [{ id: 'usuarios', label: 'ACESSOS', icon: Shield }] : [])
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 text-[10px] font-black tracking-widest border-b-4 transition-all flex flex-col items-center gap-1.5 ${activeTab === tab.id ? 'border-blue-900 text-blue-900 bg-blue-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-grow max-w-4xl mx-auto w-full p-4 pb-24">
        {activeTab === 'obreiros' && <ObreirosTab data={data} setData={setData} />}
        {activeTab === 'mes' && <GerenciarMesTab data={data} setData={setData} />}
        {activeTab === 'relatorio' && <RelatorioTab data={data} setData={setData} />}
        {activeTab === 'usuarios' && userProfile?.cargo === 'Pastor' && <GestaoAcessosTab />}
      </main>

      {showLibrary && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <History className="text-blue-400" /> Biblioteca de Escalas
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Snapshot de escalas e obreiros</p>
              </div>
              <button onClick={() => setShowLibrary(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3 flex-grow bg-slate-50">
              {data.savedScales.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <FolderOpen size={48} className="text-slate-200" />
                  <p className="text-slate-300 font-black uppercase tracking-widest italic">Nenhuma escala salva ainda</p>
                </div>
              ) : (
                data.savedScales.map(scale => (
                  <div key={scale.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                    <div className="flex-grow min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                          {MONTHS[scale.month]} {scale.year}
                        </span>
                        <span className="text-[9px] font-black text-slate-300 uppercase leading-none">{scale.createdAt}</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-lg uppercase tracking-tighter truncate">{scale.name}</h4>
                      <div className="flex gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{scale.cultos.length} cultos</p>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">• {scale.obreiros?.length || 0} obreiros salvos</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => loadScaleFromLibrary(scale)}
                        className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                        title="Restaurar Tudo"
                      >
                        <FolderOpen size={20} />
                      </button>
                      <button 
                        onClick={() => deleteScaleFromLibrary(scale.id)}
                        className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                        title="Excluir"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-white border-t border-slate-50 shrink-0">
              <button onClick={() => setShowLibrary(false)} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                Fechar Biblioteca
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter">Editar Perfil</h3>
                <button onClick={() => setShowEditProfile(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20} /></button>
             </div>

             <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Nome de Exibição</label>
                  <input 
                    type="text" 
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold"
                    placeholder="Seu Nome"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Seu Cargo Ministerial</label>
                  <select 
                    value={editCargo}
                    onChange={(e) => setEditCargo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-bold"
                    required
                  >
                    {["Pastor", "Evangelista", "Missionário/Missionária", "Presbítero", "Diácono/Diaconisa", "Obreiro/Obreira", "Membro"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="w-full bg-blue-600 text-white p-4 rounded-3xl font-black uppercase tracking-widest mt-6 hover:bg-blue-700 transition"
                >
                  {isUpdatingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </button>
             </form>
          </div>
        </div>
      )}

      <footer className="no-print fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-3 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] z-30">
        ADFARE &copy; {new Date().getFullYear()} • MINISTÉRIO FAMÍLIA RESTAURADA
      </footer>
    </div>
  );
};

export default App;
