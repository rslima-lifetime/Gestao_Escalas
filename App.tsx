
import React, { useState, useEffect } from 'react';
import { UserPlus, CalendarDays, ClipboardList, Database, Download, Upload, Trash2, Save, FolderOpen, X, History } from 'lucide-react';
import { AppDataV1, Obreiro, SavedScale } from './types';
import ObreirosTab from './components/ObreirosTab';
import GerenciarMesTab from './components/GerenciarMesTab';
import RelatorioTab from './components/RelatorioTab';
import { MONTHS } from './constants';

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
  const [activeTab, setActiveTab] = useState<'obreiros' | 'mes' | 'relatorio'>('obreiros');
  const [data, setData] = useState<AppDataV1>({
    obreiros: INITIAL_OBREIROS,
    cultos: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    savedScales: []
  });
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        const savedObreiros = parsed.obreiros || [];
        const missingObreiros = INITIAL_OBREIROS.filter(
          initOb => !savedObreiros.some((savedOb: Obreiro) => savedOb.id === initOb.id)
        );
        const mergedObreiros = [...savedObreiros, ...missingObreiros];

        setData(prev => ({
          ...prev,
          ...parsed,
          obreiros: mergedObreiros,
          savedScales: parsed.savedScales || []
        }));
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

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
          alert("Backup importado com sucesso! Tudo foi restaurado.");
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
      obreiros: JSON.parse(JSON.stringify(data.obreiros)) // Snapshot dos obreiros
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
        obreiros: JSON.parse(JSON.stringify(scale.obreiros || prev.obreiros)) // Restaura obreiros se existirem no backup
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-950 text-white p-4 shadow-md no-print sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter italic uppercase leading-none">ADFARE</h1>
            <span className="text-[9px] font-black text-blue-400 tracking-[0.3em] uppercase mt-1">Gestão de Escala</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowBackupMenu(!showBackupMenu)} 
              className={`p-2.5 rounded-2xl transition-all ${showBackupMenu ? 'bg-blue-600 shadow-lg' : 'hover:bg-blue-900'}`}
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
                  <span className="text-sm font-bold text-slate-600">Exportar Backup Total</span>
                </button>

                <label className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer group">
                  <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                    <Upload size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Importar Backup</span>
                  <input type="file" className="hidden" accept=".json" onChange={handleImportBackup} />
                </label>

                <div className="border-t border-slate-50 my-2"></div>

                <button onClick={handleResetBalances} className="w-full text-left px-5 py-3 hover:bg-rose-50 text-rose-600 flex items-center gap-3 group">
                  <div className="bg-rose-100 p-2 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Trash2 size={16} />
                  </div>
                  <span className="text-sm font-black uppercase tracking-tighter">Zerar Saldos Ativos</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white border-b no-print sticky top-[68px] z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex">
          {[
            { id: 'obreiros', label: 'OBREIROS', icon: UserPlus },
            { id: 'mes', label: 'GERENCIAR', icon: CalendarDays },
            { id: 'relatorio', label: 'MURAL', icon: ClipboardList }
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

      <footer className="no-print fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-3 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] z-30">
        ADFARE &copy; {new Date().getFullYear()} • MINISTÉRIO FAMÍLIA RESTAURADA
      </footer>
    </div>
  );
};

export default App;
