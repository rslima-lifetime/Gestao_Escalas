
import React, { useState } from 'react';
import { Plus, Trash2, ListChecks, GripVertical, ChevronDown, ChevronUp, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { AppDataV1, ChecklistSection, ChecklistItem } from '../types';

interface Props {
  data: AppDataV1;
  setData: React.Dispatch<React.SetStateAction<AppDataV1>>;
}

const ChecklistAdminTab: React.FC<Props> = ({ data, setData }) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const checklists = data.checklists || [];

  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSection: ChecklistSection = {
      id: crypto.randomUUID(),
      title: newSectionTitle.toUpperCase(),
      items: []
    };
    setData(prev => ({
      ...prev,
      checklists: [...(prev.checklists || []), newSection]
    }));
    setNewSectionTitle('');
    setExpandedSection(newSection.id);
  };

  const removeSection = (id: string) => {
    if (confirm('Deseja realmente excluir esta seção de checklist?')) {
      setData(prev => ({
        ...prev,
        checklists: (prev.checklists || []).filter(s => s.id !== id)
      }));
    }
  };

  const addItem = (sectionId: string, text: string) => {
    if (!text.trim()) return;
    setData(prev => ({
      ...prev,
      checklists: (prev.checklists || []).map(s => 
        s.id === sectionId 
          ? { ...s, items: [...s.items, { id: crypto.randomUUID(), text }] }
          : s
      )
    }));
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setData(prev => ({
      ...prev,
      checklists: (prev.checklists || []).map(s => 
        s.id === sectionId 
          ? { ...s, items: s.items.filter(i => i.id !== itemId) }
          : s
      )
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newChecklists = [...checklists];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newChecklists.length) return;
    [newChecklists[index], newChecklists[newIndex]] = [newChecklists[newIndex], newChecklists[index]];
    setData(prev => ({ ...prev, checklists: newChecklists }));
  };

  const moveItem = (sectionId: string, itemIndex: number, direction: 'up' | 'down') => {
    setData(prev => ({
      ...prev,
      checklists: (prev.checklists || []).map(s => {
        if (s.id !== sectionId) return s;
        const newItems = [...s.items];
        const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (newIndex < 0 || newIndex >= newItems.length) return s;
        [newItems[itemIndex], newItems[newIndex]] = [newItems[newIndex], newItems[itemIndex]];
        return { ...s, items: newItems };
      })
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <ListChecks size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Gerenciar Checklists</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Crie guias de rotina para os obreiros</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="NOME DA SEÇÃO (EX: ABERTURA)" 
            value={newSectionTitle}
            onChange={e => setNewSectionTitle(e.target.value)}
            className="flex-grow bg-slate-50 border border-slate-100 p-4 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 font-bold uppercase text-sm"
            onKeyPress={e => e.key === 'Enter' && addSection()}
          />
          <button 
            onClick={addSection}
            className="bg-blue-600 text-white px-6 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-100"
          >
            Adicionar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {checklists.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
             <ListChecks size={48} className="text-slate-200 mx-auto mb-4" />
             <p className="text-slate-300 font-black uppercase tracking-widest italic text-sm">Nenhum checklist cadastrado ainda</p>
          </div>
        ) : (
          checklists.map(section => (
            <div key={section.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group">
              <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>
                   <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <ListChecks size={20} />
                   </div>
                   <div>
                      <h3 className="font-black text-slate-800 uppercase tracking-tight">{section.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.items.length} itens cadastrados</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex flex-col border-r border-slate-100 pr-2 mr-2">
                      <button 
                        disabled={checklists.indexOf(section) === 0}
                        onClick={() => moveSection(checklists.indexOf(section), 'up')}
                        className="p-1.5 text-slate-300 hover:text-blue-500 disabled:opacity-0 transition-all"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        disabled={checklists.indexOf(section) === checklists.length - 1}
                        onClick={() => moveSection(checklists.indexOf(section), 'down')}
                        className="p-1.5 text-slate-300 hover:text-blue-500 disabled:opacity-0 transition-all"
                      >
                        <ArrowDown size={14} />
                      </button>
                   </div>
                   <button 
                     onClick={() => removeSection(section.id)}
                     className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                   >
                     <Trash2 size={18} />
                   </button>
                   <button 
                     onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                     className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                   >
                     {expandedSection === section.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                   </button>
                </div>
              </div>

              {expandedSection === section.id && (
                <div className="p-6 pt-0 bg-slate-50/30 border-t border-slate-50 animate-in slide-in-from-top-2">
                  <div className="space-y-3 mt-4">
                    {section.items.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 bg-white p-3 pl-4 rounded-2xl border border-slate-100 group/item">
                        <div className="flex flex-col opacity-40 sm:opacity-20 group-hover/item:opacity-100 transition-opacity pr-1 border-r border-slate-50">
                           <button 
                             disabled={idx === 0}
                             onClick={() => moveItem(section.id, idx, 'up')}
                             className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-0"
                           >
                             <ArrowUp size={12} />
                           </button>
                           <button 
                             disabled={idx === section.items.length - 1}
                             onClick={() => moveItem(section.id, idx, 'down')}
                             className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-0"
                           >
                             <ArrowDown size={12} />
                           </button>
                        </div>
                        <span className="flex-grow font-bold text-sm text-slate-700">{item.text}</span>
                        <button 
                          onClick={() => removeItem(section.id, item.id)}
                          className="opacity-0 group-item-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                       <input 
                         type="text" 
                         placeholder="NOVA ATIVIDADE..." 
                         className="flex-grow bg-white border border-slate-200 p-3 px-5 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100"
                         onKeyPress={e => {
                           if (e.key === 'Enter') {
                             addItem(section.id, (e.target as HTMLInputElement).value);
                             (e.target as HTMLInputElement).value = '';
                           }
                         }}
                       />
                       <button 
                         className="bg-slate-900 text-white px-4 rounded-2xl hover:bg-blue-600 transition"
                         onClick={(e) => {
                           const input = (e.currentTarget.previousSibling as HTMLInputElement);
                           addItem(section.id, input.value);
                           input.value = '';
                         }}
                       >
                         <Plus size={20} />
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChecklistAdminTab;
