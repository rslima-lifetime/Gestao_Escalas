
import React, { useState, useRef } from 'react';
import { UserPlus, Trash2, Edit2, Check, X, Key, Users, Layers, Plus, CheckSquare, Square, CalendarCheck, CalendarX, Link as LinkIcon } from 'lucide-react';
import { AppDataV1, Obreiro, PreferredRole } from '../types';
import { SCHEDULING_SLOTS } from '../constants';

interface Props {
  data: AppDataV1;
  setData: React.Dispatch<React.SetStateAction<AppDataV1>>;
}

const ObreirosTab: React.FC<Props> = ({ data, setData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const topRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<Obreiro>({
    id: '',
    name: '',
    role: '',
    preferredRole: 'ambos',
    balance: 0,
    fixedDays: [],
    restrictions: [],
    linkedWorkerId: undefined
  });

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      role: '',
      preferredRole: 'ambos',
      balance: 0,
      fixedDays: [],
      restrictions: [],
      linkedWorkerId: undefined
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.role) {
      alert("Preencha o nome e o cargo.");
      return;
    }

    setData(prev => {
      let newObreiros = [...prev.obreiros];
      const currentId = editingId || crypto.randomUUID();
      const updatedWorker = { ...formData, id: currentId };

      // Lógica de Vínculo Bidirecional
      if (editingId) {
        newObreiros = newObreiros.map(o => o.id === editingId ? updatedWorker : o);
      } else {
        newObreiros.push(updatedWorker);
      }

      // Se vinculei a alguém, preciso atualizar essa pessoa também para apontar de volta
      if (updatedWorker.linkedWorkerId) {
        newObreiros = newObreiros.map(o => {
          if (o.id === updatedWorker.linkedWorkerId) {
            return { ...o, linkedWorkerId: updatedWorker.id };
          }
          // Se esse obreiro estava vinculado a outra pessoa antes, limpa o vínculo antigo
          if (o.linkedWorkerId === updatedWorker.id && o.id !== updatedWorker.linkedWorkerId) {
            return { ...o, linkedWorkerId: undefined };
          }
          return o;
        });
      } else {
        // Se removi o vínculo, remove da outra pessoa também
        newObreiros = newObreiros.map(o => o.linkedWorkerId === updatedWorker.id ? { ...o, linkedWorkerId: undefined } : o);
      }

      return { ...prev, obreiros: newObreiros };
    });

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja remover este obreiro?")) {
      setData(prev => ({
        ...prev,
        obreiros: prev.obreiros.filter(o => o.id !== id).map(o => o.linkedWorkerId === id ? { ...o, linkedWorkerId: undefined } : o)
      }));
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === data.obreiros.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.obreiros.map(o => o.id)));
    }
  };

  const bulkUpdateRole = (role: PreferredRole) => {
    if (selectedIds.size === 0) return;
    setData(prev => ({
      ...prev,
      obreiros: prev.obreiros.map(o => 
        selectedIds.has(o.id) ? { ...o, preferredRole: role } : o
      )
    }));
    setSelectedIds(new Set());
    alert(`Atualizado ${selectedIds.size} membros.`);
  };

  const handleEdit = (obreiro: Obreiro) => {
    setFormData(obreiro);
    setEditingId(obreiro.id);
    setIsAdding(true);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const toggleFixedDay = (slotId: number) => {
    setFormData(prev => {
      const fixedDays = prev.fixedDays.includes(slotId) ? prev.fixedDays.filter(id => id !== slotId) : [...prev.fixedDays, slotId];
      const restrictions = prev.restrictions.filter(id => id !== slotId);
      return { ...prev, fixedDays, restrictions };
    });
  };

  const toggleRestriction = (slotId: number) => {
    setFormData(prev => {
      const restrictions = prev.restrictions.includes(slotId) ? prev.restrictions.filter(id => id !== slotId) : [...prev.restrictions, slotId];
      const fixedDays = prev.fixedDays.filter(id => id !== slotId);
      return { ...prev, restrictions, fixedDays };
    });
  };

  return (
    <div className="space-y-6" ref={topRef}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black flex items-center gap-2 text-blue-950 uppercase tracking-tighter">
          <UserPlus size={24} className="text-blue-600" />
          Corpo de Obreiros
        </h2>
        <div className="flex gap-2">
          {data.obreiros.length > 0 && (
            <button onClick={selectAll} className="p-2.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-100 rounded-xl transition-all shadow-sm">
              {selectedIds.size === data.obreiros.length ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
          )}
          {!isAdding && (
            <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg">
              <Plus size={16} /> Novo
            </button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky top-[125px] z-30 bg-blue-900 p-4 rounded-[24px] shadow-2xl animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-800">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase">{selectedIds.size} selecionados</div>
            <button onClick={() => setSelectedIds(new Set())} className="text-white/50 hover:text-white transition-colors"><X size={18} /></button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => bulkUpdateRole('abertura')} className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl flex items-center justify-center gap-2 transition-all"><Key size={16} /> <span className="text-[9px] font-black uppercase">Abertura</span></button>
            <button onClick={() => bulkUpdateRole('apoio')} className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl flex items-center justify-center gap-2 transition-all"><Users size={16} /> <span className="text-[9px] font-black uppercase">Apoio</span></button>
            <button onClick={() => bulkUpdateRole('ambos')} className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl flex items-center justify-center gap-2 transition-all"><Layers size={16} /> <span className="text-[9px] font-black uppercase">Ambos</span></button>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-[40px] shadow-2xl border border-blue-50 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Nome Completo</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold uppercase" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Cargo</label>
              <input type="text" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold uppercase" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50/50 p-5 rounded-[32px] border border-blue-100/50">
              <label className="flex items-center gap-2 text-[10px] font-black text-blue-900 uppercase mb-3 tracking-widest">
                <LinkIcon size={14} /> Vínculo de Escala (Parceiro/Cônjuge)
              </label>
              <select 
                value={formData.linkedWorkerId || ''} 
                onChange={e => setFormData({ ...formData, linkedWorkerId: e.target.value || undefined })}
                className="w-full p-4 bg-white border border-blue-100 rounded-2xl font-bold text-blue-900 outline-none"
              >
                <option value="">Sem Vínculo</option>
                {data.obreiros
                  .filter(o => o.id !== editingId)
                  .sort((a,b) => a.name.localeCompare(b.name))
                  .map(o => (
                    <option key={o.id} value={o.id}>{o.name.toUpperCase()}</option>
                  ))
                }
              </select>
              <p className="text-[8px] font-bold text-blue-400 mt-2 uppercase px-2">Obreiros vinculados serão escalados juntos no mesmo culto (um na abertura e outro no apoio).</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-200/50">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 text-center tracking-widest">Especialidade Individual</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'abertura', icon: Key, label: 'Só Abertura', color: 'bg-blue-900' },
                  { id: 'apoio', icon: Users, label: 'Só Apoio', color: 'bg-emerald-600' },
                  { id: 'ambos', icon: Layers, label: 'Ambos', color: 'bg-slate-700' }
                ].map(role => (
                  <button key={role.id} onClick={() => setFormData({...formData, preferredRole: role.id as PreferredRole})} className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${formData.preferredRole === role.id ? `${role.color} border-transparent text-white shadow-xl scale-[1.02]` : 'bg-white border-transparent text-slate-400'}`}>
                    <role.icon size={22} />
                    <span className="text-[9px] font-black uppercase">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/30 p-5 rounded-[32px] border border-emerald-100/50">
                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase mb-3 tracking-widest"><CalendarCheck size={14} /> Dias Fixos</label>
                <div className="flex flex-wrap gap-2">
                  {SCHEDULING_SLOTS.map(slot => (
                    <button key={slot.id} onClick={() => toggleFixedDay(slot.id)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${formData.fixedDays.includes(slot.id) ? 'bg-emerald-600 border-transparent text-white shadow-lg scale-105' : 'bg-white border-emerald-50 text-emerald-200 hover:border-emerald-100 hover:text-emerald-400'}`}>{slot.short}</button>
                  ))}
                </div>
              </div>
              <div className="bg-rose-50/30 p-5 rounded-[32px] border border-rose-100/50">
                <label className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase mb-3 tracking-widest"><CalendarX size={14} /> Restrições</label>
                <div className="flex flex-wrap gap-2">
                  {SCHEDULING_SLOTS.map(slot => (
                    <button key={slot.id} onClick={() => toggleRestriction(slot.id)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${formData.restrictions.includes(slot.id) ? 'bg-rose-500 border-transparent text-white shadow-lg scale-105' : 'bg-white border-rose-50 text-rose-200 hover:border-rose-100 hover:text-rose-400'}`}>{slot.short}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className="flex-grow bg-blue-900 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-2 shadow-2xl uppercase tracking-tighter"><Check size={20} /> {editingId ? 'Salvar Edição' : 'Finalizar Cadastro'}</button>
            <button onClick={resetForm} className="bg-slate-100 text-slate-400 px-8 py-5 rounded-[24px] font-black"><X size={20} /></button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.obreiros.length === 0 ? (
          <div className="col-span-full text-center py-24 text-slate-200 font-black uppercase tracking-[0.3em] italic">Vazio</div>
        ) : (
          data.obreiros.sort((a,b) => a.name.localeCompare(b.name)).map(obreiro => (
            <div key={obreiro.id} onClick={() => toggleSelection(obreiro.id)} className={`bg-white p-5 rounded-[32px] border transition-all flex items-center gap-4 cursor-pointer relative group ${selectedIds.has(obreiro.id) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 shadow-sm hover:border-blue-200'}`}>
              <div className={`shrink-0 transition-colors ${selectedIds.has(obreiro.id) ? 'text-blue-600' : 'text-slate-200 group-hover:text-slate-300'}`}>
                {selectedIds.has(obreiro.id) ? <CheckSquare size={22} /> : <Square size={22} />}
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm ${obreiro.preferredRole === 'abertura' ? 'bg-blue-50 border-blue-100 text-blue-600' : obreiro.preferredRole === 'apoio' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                {obreiro.preferredRole === 'abertura' ? <Key size={24} /> : obreiro.preferredRole === 'apoio' ? <Users size={24} /> : <Layers size={24} />}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] font-black bg-blue-900 text-white px-2 py-0.5 rounded-full uppercase">{obreiro.role}</span>
                  <h3 className="font-black text-slate-900 text-sm truncate uppercase tracking-tighter">{obreiro.name}</h3>
                  {obreiro.linkedWorkerId && <div className="text-blue-400" title="Possui Vínculo"><LinkIcon size={12} /></div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Saldo: {obreiro.balance}</span>
                  {obreiro.fixedDays.length > 0 && <span className="text-[8px] font-black text-emerald-500 uppercase">★ {obreiro.fixedDays.length} fixos</span>}
                  {obreiro.restrictions.length > 0 && <span className="text-[8px] font-black text-rose-400 uppercase">ø {obreiro.restrictions.length} restr.</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(obreiro); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(obreiro.id); }} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ObreirosTab;
