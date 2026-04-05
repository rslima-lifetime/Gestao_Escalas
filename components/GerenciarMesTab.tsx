
import React, { useState, useMemo } from 'react';
import { CalendarDays, Plus, Trash2, Wand2, Key, Users, X, Wine, RefreshCw, Search, Link as LinkIcon, AlertCircle, History, Clock, CheckCircle2, Star, Sparkles, TrendingUp, ChevronDown, MousePointer2 } from 'lucide-react';
import { AppDataV1, Culto, Obreiro } from '../types';
import { MONTHS, DEFAULT_CULTOS, DAYS_FULL } from '../constants';

interface Props {
  data: AppDataV1;
  setData: React.Dispatch<React.SetStateAction<AppDataV1>>;
}

const GerenciarMesTab: React.FC<Props> = ({ data, setData }) => {
  const [showAddManual, setShowAddManual] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPicker, setShowPicker] = useState<{ cultoId: string, role: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newCulto, setNewCulto] = useState({
    date: '',
    time: '19:30',
    name: '',
    isSantaCeia: false
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

  const cultosDoMes = useMemo(() => {
    return data.cultos.filter(c => {
      const d = new Date(c.date + "T12:00:00");
      return d.getMonth() === data.currentMonth && d.getFullYear() === data.currentYear;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [data.cultos, data.currentMonth, data.currentYear]);

  // Inteligência para encontrar escalas vazias
  const emptyScalesCount = useMemo(() => {
    return cultosDoMes.filter(c => c.workersAbertura.length === 0 || c.workersApoio.length === 0).length;
  }, [cultosDoMes]);

  const firstEmptyScaleId = useMemo(() => {
    const firstEmpty = cultosDoMes.find(c => c.workersAbertura.length === 0 || c.workersApoio.length === 0);
    return firstEmpty ? firstEmpty.id : null;
  }, [cultosDoMes]);

  const scrollToFirstEmpty = () => {
    if (firstEmptyScaleId) {
      const element = document.getElementById(`culto-${firstEmptyScaleId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Adiciona um pequeno efeito visual de "flash" para indicar onde caiu
        element.classList.add('ring-4', 'ring-blue-400/30');
        setTimeout(() => element.classList.remove('ring-4', 'ring-blue-400/30'), 2000);
      }
    }
  };

  const recalculateGlobalBalances = (obreiros: Obreiro[], allCultos: Culto[]): Obreiro[] => {
    return obreiros.map(obreiro => {
      const count = allCultos.reduce((acc, culto) => {
        const isAbertura = culto.workersAbertura.includes(obreiro.id);
        const isApoio = culto.workersApoio.includes(obreiro.id);
        return acc + (isAbertura ? 1 : 0) + (isApoio ? 1 : 0);
      }, 0);
      return { ...obreiro, balance: count };
    });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData(prev => ({ ...prev, currentMonth: parseInt(e.target.value) }));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData(prev => ({ ...prev, currentYear: parseInt(e.target.value) }));
  };

  const handleGenerateBase = () => {
    if (cultosDoMes.length > 0 && !confirm(`Já existem ${cultosDoMes.length} cultos em ${MONTHS[data.currentMonth]}. Deseja adicionar os cultos padrão do sistema a este mês?`)) return;
    
    const daysInMonth = new Date(data.currentYear, data.currentMonth + 1, 0).getDate();
    const generated: Culto[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(data.currentYear, data.currentMonth, day);
      const dayOfWeek = date.getDay();
      const dayCultos = DEFAULT_CULTOS.filter(c => c.day === dayOfWeek);
      
      dayCultos.forEach(c => {
        const dateStr = date.toISOString().split('T')[0];
        const exists = data.cultos.some(old => old.date === dateStr && old.time === c.time && old.name === c.name);
        
        if (!exists) {
          generated.push({
            id: crypto.randomUUID(),
            date: dateStr,
            dayOfWeek,
            time: c.time,
            name: c.name,
            isSantaCeia: false,
            workersAbertura: [],
            workersApoio: [],
            santaCeiaWorkers: { arrumarMesa: '', desarrumarMesa: '', servirPao: '', servirVinho: '' }
          });
        }
      });
    }

    if (generated.length === 0) {
      alert("Nenhum novo culto padrão foi adicionado.");
      return;
    }

    setData(prev => ({
      ...prev,
      cultos: [...prev.cultos, ...generated].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    }));
  };

  const handleClearMonthSchedule = () => {
    if (cultosDoMes.length === 0) return;
    if (!confirm(`Deseja remover todos os obreiros escalados APENAS no mês de ${MONTHS[data.currentMonth]}?`)) return;
    
    setData(prev => {
      const updatedCultos = prev.cultos.map(c => {
        const d = new Date(c.date + "T12:00:00");
        if (d.getMonth() === data.currentMonth && d.getFullYear() === data.currentYear) {
          return {
            ...c,
            workersAbertura: [],
            workersApoio: [],
            santaCeiaWorkers: { arrumarMesa: '', desarrumarMesa: '', servirPao: '', servirVinho: '' }
          };
        }
        return c;
      });
      return { ...prev, cultos: updatedCultos, obreiros: recalculateGlobalBalances(prev.obreiros, updatedCultos) };
    });
  };

  const handleAddManual = () => {
    if (!newCulto.date || !newCulto.name) return alert("Preencha a data e o nome.");
    const dateObj = new Date(newCulto.date + "T12:00:00");
    const culto: Culto = {
      id: crypto.randomUUID(),
      date: newCulto.date,
      dayOfWeek: dateObj.getDay(),
      time: newCulto.time,
      name: newCulto.name,
      isSantaCeia: newCulto.isSantaCeia,
      workersAbertura: [],
      workersApoio: [],
      santaCeiaWorkers: { arrumarMesa: '', desarrumarMesa: '', servirPao: '', servirVinho: '' }
    };
    
    setData(prev => ({ 
      ...prev, 
      cultos: [...prev.cultos, culto].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)) 
    }));
    
    setNewCulto({ date: '', time: '19:30', name: '', isSantaCeia: false });
    setShowAddManual(false);
  };

  const assignWorker = (cultoId: string, obreiroId: string, role: string) => {
    setData(prev => {
      const obreiro = prev.obreiros.find(o => o.id === obreiroId);
      const updatedCultos = prev.cultos.map(c => {
        if (c.id !== cultoId) return c;
        
        if (role === 'abertura' || role === 'apoio') {
          let workersAbertura = c.workersAbertura.filter(id => id !== obreiroId);
          let workersApoio = c.workersApoio.filter(id => id !== obreiroId);
          
          if (role === 'abertura') {
            workersAbertura = [obreiroId];
            if (obreiro?.linkedWorkerId && workersApoio.length === 0) {
              workersApoio = [obreiro.linkedWorkerId];
            }
          } else {
            workersApoio = [obreiroId];
            if (obreiro?.linkedWorkerId && workersAbertura.length === 0) {
              workersAbertura = [obreiro.linkedWorkerId];
            }
          }
          
          return { ...c, workersAbertura, workersApoio };
        }
        
        return { ...c, santaCeiaWorkers: { ...(c.santaCeiaWorkers || { arrumarMesa: '', desarrumarMesa: '', servirPao: '', servirVinho: '' }), [role]: obreiroId } };
      });
      return { ...prev, cultos: updatedCultos, obreiros: recalculateGlobalBalances(prev.obreiros, updatedCultos) };
    });
    setShowPicker(null);
  };

  const removeWorker = (cultoId: string, obreiroId: string, role: string) => {
    setData(prev => {
      const updatedCultos = prev.cultos.map(c => {
        if (c.id !== cultoId) return c;
        if (role === 'abertura') return { ...c, workersAbertura: c.workersAbertura.filter(id => id !== obreiroId) };
        if (role === 'apoio') return { ...c, workersApoio: c.workersApoio.filter(id => id !== obreiroId) };
        return { ...c, santaCeiaWorkers: { ...(c.santaCeiaWorkers || { arrumarMesa: '', desarrumarMesa: '', servirPao: '', servirVinho: '' }), [role]: '' } };
      });
      return { ...prev, cultos: updatedCultos, obreiros: recalculateGlobalBalances(prev.obreiros, updatedCultos) };
    });
  };

  const handleGenerateScale = () => {
    if (data.obreiros.length < 2) return alert("Mínimo 2 obreiros.");
    if (cultosDoMes.length === 0) return alert("Não há cultos criados para este mês.");
    
    setIsGenerating(true);
    
    setData(prev => {
      let tempObreiros = JSON.parse(JSON.stringify(prev.obreiros)) as Obreiro[];
      const globalCultos = JSON.parse(JSON.stringify(prev.cultos)) as Culto[];
      
      const cultosToProcess = globalCultos.filter(c => {
        const d = new Date(c.date + "T12:00:00");
        return d.getMonth() === data.currentMonth && d.getFullYear() === data.currentYear;
      }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

      cultosToProcess.forEach((culto) => {
        const d = new Date(culto.date + "T12:00:00");
        const slotId = (d.getDay() === 0) ? (parseInt(culto.time.split(':')[0]) < 14 ? 0 : 7) : d.getDay();
        
        const selectForRole = (target: 'abertura' | 'apoio') => {
          const otherRole = target === 'abertura' ? 'apoio' : 'abertura';
          const currentList = target === 'abertura' ? culto.workersAbertura : culto.workersApoio;
          const otherList = target === 'abertura' ? culto.workersApoio : culto.workersAbertura;
          
          if (currentList.length >= 1) return;

          if (otherList.length > 0) {
            const personAlreadyIn = tempObreiros.find(o => o.id === otherList[0]);
            if (personAlreadyIn?.linkedWorkerId) {
              const partner = tempObreiros.find(o => o.id === personAlreadyIn.linkedWorkerId);
              if (partner && !partner.restrictions.includes(slotId) && !culto.workersAbertura.includes(partner.id) && !culto.workersApoio.includes(partner.id)) {
                 if (target === 'abertura') culto.workersAbertura.push(partner.id);
                 else culto.workersApoio.push(partner.id);
                 partner.balance += 1;
                 return;
              }
            }
          }

          let candidates = tempObreiros.filter(o => 
            !o.restrictions.includes(slotId) && 
            !culto.workersAbertura.includes(o.id) && 
            !culto.workersApoio.includes(o.id) && 
            (o.preferredRole === target || o.preferredRole === 'ambos')
          );
          
          if (candidates.length === 0) {
            candidates = tempObreiros.filter(o => 
              !o.restrictions.includes(slotId) && 
              !culto.workersAbertura.includes(o.id) && 
              !culto.workersApoio.includes(o.id)
            );
          }
          
          if (candidates.length === 0) return;
          
          const minBal = Math.min(...candidates.map(o => o.balance));
          const eligible = candidates.filter(o => o.balance === minBal);
          const winner = eligible[Math.floor(Math.random() * eligible.length)];
          
          const targetWorker = tempObreiros.find(o => o.id === winner.id);
          if (targetWorker) {
            if (target === 'abertura') culto.workersAbertura.push(targetWorker.id); 
            else culto.workersApoio.push(targetWorker.id);
            targetWorker.balance += 1;

            if (targetWorker.linkedWorkerId && otherList.length === 0) {
               const partner = tempObreiros.find(o => o.id === targetWorker.linkedWorkerId);
               if (partner && !partner.restrictions.includes(slotId)) {
                 if (otherRole === 'abertura') culto.workersAbertura.push(partner.id);
                 else culto.workersApoio.push(partner.id);
                 partner.balance += 1;
               }
            }
          }
        };
        
        selectForRole('abertura');
        selectForRole('apoio');
      });
      
      return { 
        ...prev, 
        cultos: globalCultos, 
        obreiros: recalculateGlobalBalances(tempObreiros, globalCultos) 
      };
    });

    setTimeout(() => { 
      setIsGenerating(false); 
      alert(`Escala de ${MONTHS[data.currentMonth]} distribuída com sucesso.`); 
    }, 800);
  };

  const getObreiroAssignments = (workerId: string) => {
    return data.cultos
      .filter(c => 
        c.workersAbertura.includes(workerId) || 
        c.workersApoio.includes(workerId) ||
        c.santaCeiaWorkers?.arrumarMesa === workerId ||
        c.santaCeiaWorkers?.desarrumarMesa === workerId ||
        c.santaCeiaWorkers?.servirPao === workerId ||
        c.santaCeiaWorkers?.servirVinho === workerId
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const filteredCultos = cultosDoMes.filter(culto => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const getObreiroName = (id: string) => data.obreiros.find(o => o.id === id)?.name.toLowerCase() || '';
    const namesInCulto = [
      ...culto.workersAbertura.map(getObreiroName), 
      ...culto.workersApoio.map(getObreiroName), 
      getObreiroName(culto.santaCeiaWorkers?.arrumarMesa || ''), 
      getObreiroName(culto.santaCeiaWorkers?.desarrumarMesa || ''), 
      getObreiroName(culto.santaCeiaWorkers?.servirPao || ''), 
      getObreiroName(culto.santaCeiaWorkers?.servirVinho || '')
    ];
    return namesInCulto.some(name => name.includes(s));
  });

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black flex items-center gap-2 text-blue-900 uppercase tracking-tighter"><CalendarDays size={24} /> Gerenciar Mês</h2>
          <div className="bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-2 border border-emerald-100">
            <TrendingUp size={12} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase">Saldos Acumulados</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex gap-3 flex-grow">
            <select 
              value={data.currentMonth} 
              onChange={handleMonthChange} 
              className="flex-grow p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-900 uppercase outline-none focus:ring-2 focus:ring-blue-100"
            >
              {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
            </select>
            <select 
              value={data.currentYear} 
              onChange={handleYearChange} 
              className="min-w-[110px] p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-900 outline-none focus:ring-2 focus:ring-blue-100"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-stretch gap-2">
            <button onClick={handleGenerateBase} className="flex-grow sm:flex-none px-6 bg-blue-50 text-blue-700 border border-blue-100 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Criar Cultos Base</button>
            <button onClick={() => setShowAddManual(true)} className="bg-slate-900 text-white p-4 rounded-2xl active:scale-95 transition-transform shadow-lg flex items-center justify-center min-w-[56px]"><Plus size={24} /></button>
          </div>
        </div>

        {cultosDoMes.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-10 text-center flex flex-col items-center gap-4">
            <AlertCircle size={40} className="text-slate-300" />
            <div className="space-y-1">
              <p className="font-black text-slate-400 uppercase tracking-widest text-sm italic">Nenhum culto para {MONTHS[data.currentMonth].toUpperCase()}</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase">Clique em "Criar Cultos Base" para começar este mês.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input type="text" placeholder="Filtrar por nome do obreiro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={18} /></button>}
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Botão de Navegação Rápida para Vagas */}
              {emptyScalesCount > 0 && !searchTerm && (
                <button 
                  onClick={scrollToFirstEmpty} 
                  className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 py-4 rounded-[20px] flex items-center justify-center gap-3 group transition-all animate-in slide-in-from-top-2"
                >
                  <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <MousePointer2 size={16} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-black text-blue-900 uppercase leading-none">Ir para próxima vaga</span>
                    <span className="text-[9px] font-bold text-blue-400 uppercase">{emptyScalesCount} {emptyScalesCount === 1 ? 'escala pendente' : 'escalas pendentes'}</span>
                  </div>
                  <ChevronDown size={20} className="text-blue-300 animate-bounce ml-2" />
                </button>
              )}

              {!searchTerm && (
                <>
                  <button onClick={handleGenerateScale} disabled={isGenerating} className={`w-full py-6 rounded-[24px] text-white font-black flex items-center justify-center gap-4 shadow-2xl transition-all ${isGenerating ? 'bg-slate-400' : 'bg-blue-900 active:scale-95'}`}><Wand2 size={24} /> {isGenerating ? 'DISTRIBUINDO...' : 'DISTRIBUIR NO MÊS (GLOBAL)'}</button>
                  <button onClick={handleClearMonthSchedule} className="w-full py-4 border-2 border-slate-100 rounded-[20px] text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95"><RefreshCw size={16} /> Limpar Escala deste Mês</button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        {filteredCultos.map((culto) => (
          <div key={culto.id} id={`culto-${culto.id}`} className="bg-white p-6 rounded-[48px] border border-slate-100 shadow-sm transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black bg-blue-900 text-white px-3 py-1 rounded-full">{culto.date.split('-').reverse().join('/')}</span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${culto.isSantaCeia ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{culto.isSantaCeia ? 'SANTA CEIA' : culto.name.toUpperCase()}</span>
                </div>
                <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">{DAYS_FULL[culto.dayOfWeek]} • {culto.time}H</h4>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setData(prev => ({
                      ...prev,
                      cultos: prev.cultos.map(c => c.id === culto.id ? { ...c, isSantaCeia: !c.isSantaCeia } : c)
                    }));
                  }} 
                  className={`p-4 rounded-2xl border shadow-sm transition-all ${culto.isSantaCeia ? 'bg-purple-600 border-purple-600 text-white shadow-purple-200' : 'bg-slate-50 border-slate-100 text-slate-300 hover:text-purple-400'}`}
                >
                  <Wine size={20} />
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Remover este culto permanentemente?")) {
                      setData(prev => {
                        const updatedCultos = prev.cultos.filter(c => c.id !== culto.id);
                        return { ...prev, cultos: updatedCultos, obreiros: recalculateGlobalBalances(prev.obreiros, updatedCultos) };
                      });
                    }
                  }} 
                  className="p-4 bg-slate-50 text-slate-300 rounded-2xl border border-slate-100 shadow-sm hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className={`p-4 rounded-[32px] border transition-colors ${culto.workersAbertura.length === 0 ? 'bg-blue-50/80 border-blue-200 animate-pulse-gentle' : 'bg-blue-50/40 border-blue-50/50'}`}>
                  <span className="text-[9px] font-black text-blue-900 uppercase block mb-3">Abertura</span>
                  {culto.workersAbertura.map(wid => {
                    const obreiro = data.obreiros.find(x => x.id === wid);
                    return (
                      <div key={wid} className="bg-white p-3 rounded-xl border border-blue-100 flex justify-between items-center mb-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 uppercase">{obreiro?.name}</span>
                          <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full" title="Saldo Acumulado">
                            {obreiro?.balance || 0}
                          </span>
                          {obreiro?.linkedWorkerId && <LinkIcon size={10} className="text-blue-400" />}
                        </div>
                        <button onClick={() => removeWorker(culto.id, wid, 'abertura')} className="text-rose-400 hover:text-rose-600 transition-colors"><X size={16} /></button>
                      </div>
                    );
                  })}
                  {culto.workersAbertura.length === 0 && <button onClick={() => setShowPicker({ cultoId: culto.id, role: 'abertura' })} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-[10px] font-black text-blue-300 uppercase hover:bg-blue-50 transition-colors">+ Abertura</button>}
                </div>
                <div className={`p-4 rounded-[32px] border transition-colors ${culto.workersApoio.length === 0 ? 'bg-emerald-50/80 border-emerald-200 animate-pulse-gentle' : 'bg-emerald-50/40 border-emerald-50/50'}`}>
                  <span className="text-[9px] font-black text-emerald-900 uppercase block mb-3">Apoio</span>
                  {culto.workersApoio.map(wid => {
                    const obreiro = data.obreiros.find(x => x.id === wid);
                    return (
                      <div key={wid} className="bg-white p-3 rounded-xl border border-emerald-100 flex justify-between items-center mb-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 uppercase">{obreiro?.name}</span>
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full" title="Saldo Acumulado">
                            {obreiro?.balance || 0}
                          </span>
                          {obreiro?.linkedWorkerId && <LinkIcon size={10} className="text-emerald-400" />}
                        </div>
                        <button onClick={() => removeWorker(culto.id, wid, 'apoio')} className="text-rose-400 hover:text-rose-600 transition-colors"><X size={16} /></button>
                      </div>
                    );
                  })}
                  {culto.workersApoio.length === 0 && <button onClick={() => setShowPicker({ cultoId: culto.id, role: 'apoio' })} className="w-full py-3 border-2 border-dashed border-emerald-200 rounded-xl text-[10px] font-black text-emerald-300 uppercase hover:bg-emerald-50 transition-colors">+ Apoio</button>}
                </div>
              </div>

              {culto.isSantaCeia && (
                <div className="bg-purple-50/40 p-4 rounded-[32px] border border-purple-100 space-y-2">
                  <span className="text-[9px] font-black text-purple-900 uppercase block mb-2">Equipe Santa Ceia</span>
                  {[{ key: 'arrumarMesa', label: 'Arrumação' }, { key: 'desarrumarMesa', label: 'Desarrumação' }, { key: 'servirPao', label: 'Pão' }, { key: 'servirVinho', label: 'Vinho' }].map(role => {
                    const wid = culto.santaCeiaWorkers?.[role.key as keyof typeof culto.santaCeiaWorkers];
                    const obreiro = data.obreiros.find(o => o.id === wid);
                    return (
                      <div key={role.key} className="bg-white/80 p-2 rounded-xl border border-purple-100 flex flex-col">
                        <span className="text-[8px] font-black text-purple-400 uppercase leading-none mb-1">{role.label}</span>
                        {wid ? (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-slate-900 truncate uppercase">{obreiro?.name}</span>
                              <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1 rounded-full">S: {obreiro?.balance || 0}</span>
                            </div>
                            <button onClick={() => removeWorker(culto.id, '', role.key)} className="text-rose-400 p-1 hover:text-rose-600"><X size={12} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setShowPicker({ cultoId: culto.id, role: role.key })} className="text-[9px] font-black text-purple-600 uppercase text-left hover:underline">+ Selecionar</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <h3 className="font-black uppercase tracking-tighter flex items-center gap-3"><History size={20} className="text-blue-400" /> Escalar Obreiro</h3>
                <span className="text-[10px] font-bold text-blue-400 uppercase">Ref: {data.cultos.find(c => c.id === showPicker.cultoId)?.date.split('-').reverse().join('/')} - {data.cultos.find(c => c.id === showPicker.cultoId)?.name}</span>
              </div>
              <button onClick={() => setShowPicker(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="bg-blue-50 px-6 py-2 border-b border-blue-100 shrink-0">
               <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">Cálculo de Saldo Baseado em Todo o Histórico de Cultos</span>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 flex-grow bg-slate-50">
              {(() => {
                const activeCulto = data.cultos.find(c => c.id === showPicker.cultoId);
                const refDate = activeCulto ? new Date(activeCulto.date + "T00:00:00") : new Date();

                // Analisar todos os obreiros para encontrar o maior descanso
                const workerStats = data.obreiros.map(o => {
                  const assignments = getObreiroAssignments(o.id);
                  const pastAssignments = assignments.filter(c => c.id !== showPicker.cultoId && new Date(c.date + "T00:00:00") < refDate).reverse();
                  const futureAssignments = assignments.filter(c => c.id !== showPicker.cultoId && new Date(c.date + "T00:00:00") > refDate);
                  const inCurrentCulto = assignments.some(c => c.id === showPicker.cultoId);
                  
                  const lastScale = pastAssignments[0] || null;
                  const nextScale = futureAssignments[0] || null;
                  
                  let diffDays = 999; 
                  if (lastScale) {
                    const scaleDate = new Date(lastScale.date + "T00:00:00");
                    diffDays = Math.round((refDate.getTime() - scaleDate.getTime()) / (1000 * 3600 * 24));
                  }

                  return { o, lastScale, nextScale, inCurrentCulto, diffDays };
                });

                const maxRest = Math.max(...workerStats.map(s => s.diffDays));
                
                return workerStats
                  .sort((a, b) => {
                    if (a.inCurrentCulto !== b.inCurrentCulto) return a.inCurrentCulto ? 1 : -1;
                    if (a.diffDays !== b.diffDays) return b.diffDays - a.diffDays;
                    // Em caso de mesmo descanso, prioriza quem tem menor saldo global (acumulado)
                    if (a.o.balance !== b.o.balance) return a.o.balance - b.o.balance;
                    return a.o.name.localeCompare(b.o.name);
                  })
                  .map(({ o, lastScale, nextScale, inCurrentCulto, diffDays }) => {
                    const relevantScale = nextScale || lastScale;
                    const isSuggestion = diffDays === maxRest && !inCurrentCulto;

                    let isToday = inCurrentCulto;
                    let isFuture = false;
                    let absDays = 0;
                    let scaleLabel = "";
                    let subLabel = "";

                    if (relevantScale) {
                      const scaleDate = new Date(relevantScale.date + "T00:00:00");
                      const diffTime = scaleDate.getTime() - refDate.getTime();
                      const daysFromRef = Math.round(diffTime / (1000 * 3600 * 24));
                      
                      isFuture = daysFromRef > 0;
                      absDays = Math.abs(daysFromRef);

                      if (isToday) {
                        scaleLabel = "JÁ ESCALADO NESTE DIA";
                        subLabel = "ESCOLHA OUTRO OBREIRO SE POSSÍVEL";
                      } else if (isFuture) {
                        scaleLabel = "ESCALA POSTERIOR";
                        subLabel = absDays === 1 ? "DAQUI A 1 DIA (APÓS ESTE)" : `DAQUI A ${absDays} DIAS`;
                      } else {
                        scaleLabel = absDays < 7 ? "TRABALHOU RECENTEMENTE" : "FOLGA CONFIRMADA";
                        subLabel = `${absDays} DIAS DE DESCANSO`;
                      }
                    } else if (isToday) {
                      scaleLabel = "JÁ ESCALADO NESTE DIA";
                      subLabel = "ESCOLHA OUTRO OBREIRO SE POSSÍVEL";
                    } else {
                      scaleLabel = "DISPONÍVEL";
                      subLabel = "NUNCA FOI ESCALADO ANTES";
                    }

                    const isRecentPast = !isFuture && !isToday && lastScale && absDays < 7;
                    const isLongPast = !isFuture && !isToday && (!lastScale || absDays >= 15);

                    return (
                      <button 
                        key={o.id} 
                        onClick={() => assignWorker(showPicker.cultoId, o.id, showPicker.role)} 
                        className={`w-full p-4 bg-white flex flex-col rounded-[28px] border transition-all group relative overflow-hidden ${isSuggestion ? 'border-amber-400 shadow-amber-50 ring-2 ring-amber-100/50' : 'border-slate-100 hover:border-blue-400 hover:shadow-lg'}`}
                      >
                        {isSuggestion && (
                          <div className="absolute top-0 right-0 bg-amber-400 text-white px-3 py-1 rounded-bl-xl flex items-center gap-1 animate-pulse">
                            <Sparkles size={10} />
                            <span className="text-[8px] font-black uppercase">Sugestão</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start w-full mb-3">
                          <div className="text-left">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[8px] font-black bg-blue-900 text-white px-2 py-0.5 rounded-full uppercase leading-none">{o.role}</span>
                              {o.linkedWorkerId && <LinkIcon size={12} className="text-blue-400" />}
                            </div>
                            <span className="font-black text-slate-900 uppercase text-base leading-none group-hover:text-blue-600">{o.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[7px] font-black text-slate-300 uppercase block leading-none mb-1">Total Acumulado</span>
                            <span className="text-lg font-black text-blue-600 leading-none">{o.balance}</span>
                          </div>
                        </div>

                        <div className={`w-full p-3 rounded-2xl flex items-center gap-3 border transition-colors 
                          ${isToday ? 'bg-emerald-50 border-emerald-100' : isRecentPast ? 'bg-rose-50 border-rose-100' : isFuture ? 'bg-indigo-50 border-indigo-100' : (isLongPast ? 'bg-emerald-50 border-emerald-100/50' : 'bg-slate-50 border-slate-100')}`}>
                          
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 
                            ${isToday ? 'bg-emerald-600 text-white' : isRecentPast ? 'bg-rose-500 text-white' : isFuture ? 'bg-indigo-600 text-white' : (isLongPast ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600')}`}>
                             {isToday ? <CheckCircle2 size={16} /> : (isFuture ? <CalendarDays size={16} /> : (isLongPast ? <Star size={16} /> : <Clock size={16} />))}
                          </div>
                          
                          <div className="flex flex-col text-left min-w-0">
                            <span className={`text-[7px] font-black uppercase leading-none mb-1 
                              ${isToday ? 'text-emerald-600' : isRecentPast ? 'text-rose-600' : isFuture ? 'text-indigo-600' : (isLongPast ? 'text-emerald-600' : 'text-slate-400')}`}>
                              {scaleLabel}
                            </span>
                            {relevantScale && (
                              <span className={`text-[10px] font-black uppercase truncate leading-tight 
                                ${isToday ? 'text-emerald-700' : isRecentPast ? 'text-rose-700' : isFuture ? 'text-indigo-700' : 'text-slate-600'}`}>
                                {relevantScale.date.split('-').reverse().join('/')} - {relevantScale.name}
                              </span>
                            )}
                            <span className={`text-[8px] font-bold uppercase mt-0.5 
                              ${isToday ? 'text-emerald-400' : isRecentPast ? 'text-rose-400' : isFuture ? 'text-indigo-400' : (isLongPast ? 'text-emerald-400' : 'text-blue-400')}`}>
                              {subLabel}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  });
              })()}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-50 shrink-0">
               <button onClick={() => setShowPicker(null)} className="w-full py-4 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest active:scale-95 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showAddManual && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center"><h3 className="font-black uppercase tracking-tighter">Novo Culto Manual</h3><button onClick={() => setShowAddManual(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data</label>
                <input type="date" value={newCulto.date} onChange={e => setNewCulto({...newCulto, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Horário</label>
                <input type="time" value={newCulto.time} onChange={e => setNewCulto({...newCulto, time: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome do Evento</label>
                <input type="text" value={newCulto.name} onChange={e => setNewCulto({...newCulto, name: e.target.value})} placeholder="EX: CULTO DE DOUTRINA" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none uppercase" />
              </div>
              <button onClick={() => setNewCulto({...newCulto, isSantaCeia: !newCulto.isSantaCeia})} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${newCulto.isSantaCeia ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                <span className="font-black uppercase tracking-tighter">É Santa Ceia?</span>
                <Wine size={20} className={newCulto.isSantaCeia ? 'text-purple-600' : 'text-slate-200'} />
              </button>
              <button onClick={handleAddManual} className="w-full py-5 bg-blue-900 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">Adicionar Culto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarMesTab;
