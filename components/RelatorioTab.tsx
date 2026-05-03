
import React, { useRef, useState, useMemo } from 'react';
import { Key, Users, Search, X, Smartphone, Printer, Share2, CalendarDays, FileDown, ChevronLeft, ChevronRight, Zap, ShieldCheck, Quote, Calendar, Wine, Link as LinkIcon, Check, ChevronDown, Megaphone, ListChecks, ChevronUp } from 'lucide-react';
import { AppDataV1, Culto } from '../types';
import { MONTHS, DAYS_SHORT } from '../constants';

interface Props {
  data: AppDataV1;
  setData?: React.Dispatch<React.SetStateAction<AppDataV1>>;
  isPublic?: boolean;
}

const RelatorioTab: React.FC<Props> = ({ data, setData, isPublic = false }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [viewMode, setViewMode] = useState<'print' | 'mobile' | 'weekly'>(isPublic ? 'mobile' : 'weekly');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [copyingLink, setCopyingLink] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);
  const [showPublicChecklist, setShowPublicChecklist] = useState(false);
  const [editingChecklistCultoId, setEditingChecklistCultoId] = useState<string | null>(null);
  const [currentObservation, setCurrentObservation] = useState('');
  const [expandedPublicSections, setExpandedPublicSections] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showPublicAnnouncement, setShowPublicAnnouncement] = useState(() => {
    if (!isPublic || !data.announcement || !data.announcement.active) return false;
    const dismissedId = localStorage.getItem('adfare_dismissed_announcement_id');
    return dismissedId !== data.announcement.id;
  });

  // Re-check announcement if it changes
  React.useEffect(() => {
    if (isPublic && data.announcement && data.announcement.active) {
       const dismissedId = localStorage.getItem('adfare_dismissed_announcement_id');
       if (dismissedId !== data.announcement.id) {
          setShowPublicAnnouncement(true);
       }
    }
  }, [data.announcement, isPublic]);
  
  // Refs para visualização (com escala)
  const weeklyPreviewRef = useRef<HTMLDivElement>(null);
  const mobilePreviewRef = useRef<HTMLDivElement>(null);

  // Refs para exportação (ocultos, sem escala, largura fixa)
  const weeklyExportRef = useRef<HTMLDivElement>(null);
  const mobileExportRef = useRef<HTMLDivElement>(null);

  const WHATSAPP_MESSAGE = "Paz, obreiros. Atenção à escala. Deus se agrade do trabalho de nossas mãos. Qualquer dificuldade me avisem.";

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData?.(prev => ({ ...prev, currentMonth: parseInt(e.target.value) }));
    setSelectedWeek(0);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData?.(prev => ({ ...prev, currentYear: parseInt(e.target.value) }));
    setSelectedWeek(0);
  };

  const abbreviateRole = (role: string) => {
    const map: Record<string, string> = {
      'Pastor': 'Pr.',
      'Pastora': 'Pra.',
      'Evangelista': 'Ev.',
      'Missionário': 'Miss.',
      'Missionária': 'Miss.',
      'Presbítero': 'Pb.',
      'Diácono': 'Dc.',
      'Diaconisa': 'Dca.',
      'Obreiro': 'Ob.',
      'Obreira': 'Ob.'
    };
    return map[role.trim()] || role.trim();
  };

  const getWorkerDisplayName = (id: string | undefined) => {
    if (!id) return '---';
    const obreiro = data.obreiros.find(o => o.id === id);
    if (!obreiro) return '---';
    const name = obreiro.name.length > 40 ? obreiro.name.substring(0, 37) + '...' : obreiro.name;
    const shortRole = abbreviateRole(obreiro.role);
    return `${shortRole} ${name.toUpperCase()}`;
  };

  // Filtra cultos pelo mês e ano selecionados, além do filtro de nome
  const sortedCultos = useMemo(() => {
    return [...data.cultos]
      .filter(culto => {
        const d = new Date(culto.date + "T12:00:00");
        return d.getMonth() === data.currentMonth && d.getFullYear() === data.currentYear;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .filter(culto => {
        if (!filterName) return true;
        const f = filterName.toLowerCase();
        const getObreiroName = (id: string) => data.obreiros.find(o => o.id === id)?.name.toLowerCase() || '';
        const namesInCulto = [
          ...culto.workersAbertura.map(getObreiroName), 
          ...culto.workersApoio.map(getObreiroName), 
          getObreiroName(culto.santaCeiaWorkers?.arrumarMesa || ''), 
          getObreiroName(culto.santaCeiaWorkers?.desarrumarMesa || ''), 
          getObreiroName(culto.santaCeiaWorkers?.servirPao || ''), 
          getObreiroName(culto.santaCeiaWorkers?.servirVinho || '')
        ];
        return namesInCulto.some(name => name.includes(f));
      });
  }, [data.cultos, data.obreiros, filterName, data.currentMonth, data.currentYear]);

  const weeks = useMemo(() => {
    if (sortedCultos.length === 0) return [];
    const weeksMap = new Map<string, Culto[]>();
    sortedCultos.forEach(culto => {
      const d = new Date(culto.date + "T12:00:00");
      const day = d.getDay(); 
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(d);
      monday.setDate(d.getDate() - diffToMonday);
      const weekKey = monday.toISOString().split('T')[0];
      if (!weeksMap.has(weekKey)) weeksMap.set(weekKey, []);
      weeksMap.get(weekKey)?.push(culto);
    });
    return Array.from(weeksMap.keys()).sort().map(key => weeksMap.get(key) || []);
  }, [sortedCultos]);

  const cultosToShow = viewMode === 'weekly' ? (weeks[selectedWeek] || []) : sortedCultos;

  const weekRangeLabel = useMemo(() => {
    if (viewMode !== 'weekly' || !cultosToShow.length) return "";
    const baseDate = new Date(cultosToShow[0].date + "T12:00:00");
    const day = baseDate.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const mon = new Date(baseDate);
    mon.setDate(baseDate.getDate() - diffToMonday);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const mStart = MONTHS[mon.getMonth()].toUpperCase();
    const mEnd = MONTHS[sun.getMonth()].toUpperCase();
    if (mon.getMonth() !== sun.getMonth()) return `${mon.getDate()} de ${mStart} a ${sun.getDate()} de ${mEnd}`;
    return `${mon.getDate()} a ${sun.getDate()} de ${mStart}`;
  }, [cultosToShow, viewMode]);

  const handleExportPDF = () => {
    if (viewMode !== 'print') {
      setViewMode('print');
      setTimeout(() => window.print(), 200);
    } else {
      window.print();
    }
  };

  const handleExportImage = async () => {
    const element = viewMode === 'weekly' ? weeklyExportRef.current : mobileExportRef.current;
    if (!element) return;
    
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // @ts-ignore
    if (typeof html2canvas !== 'undefined') {
      // @ts-ignore
      html2canvas(element, {
        scale: 4, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 420,
        windowWidth: 420,
        onclone: (clonedDoc: any) => {
          const clonedEl = clonedDoc.getElementById(element.id);
          if (clonedEl) {
            clonedEl.style.opacity = '1';
            clonedEl.style.display = 'flex';
            clonedEl.style.width = '420px';
            clonedEl.style.position = 'relative';
          }
        }
      }).then(async (canvas) => {
        const fileName = `ESCALA_ADFARE_${viewMode === 'weekly' ? 'SEMANAL' : 'MENSAL'}_${MONTHS[data.currentMonth].toUpperCase()}.jpg`;
        
        canvas.toBlob(async (blob: Blob | null) => {
          if (!blob) {
            setIsExporting(false);
            return;
          }

          const file = new File([blob], fileName, { type: 'image/jpeg' });
          
          // @ts-ignore
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Escala ADFARE',
                text: WHATSAPP_MESSAGE,
              });
            } catch (err) {
              downloadImage(canvas, fileName);
            }
          } else {
            downloadImage(canvas, fileName);
            const waUrl = `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
            window.open(waUrl, '_blank');
          }
          setIsExporting(false);
        }, 'image/jpeg', 1.0);
        
      }).catch((e) => {
        console.error("Erro na exportação:", e);
        setIsExporting(false);
      });
    } else {
      setIsExporting(false);
    }
  };

  const handleCopyPublicLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const publicUrl = `${baseUrl}?view=public`;
    
    setCopyingLink(true);
    navigator.clipboard.writeText(publicUrl).then(() => {
      setTimeout(() => setCopyingLink(false), 2000);
    });
  };

  const downloadImage = (canvas: HTMLCanvasElement, fileName: string) => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const handleOpenChecklist = (culto: Culto) => {
    setEditingChecklistCultoId(culto.id);
    setCurrentObservation(culto.checklistResults?.observation || '');
    
    // Load checked items
    const newChecked: Record<string, boolean> = {};
    culto.checklistResults?.checkedItems.forEach(id => {
      newChecked[id] = true;
    });
    setCheckedItems(newChecked);
    setShowPublicChecklist(true);
  };

  const handleSaveChecklist = () => {
    if (!editingChecklistCultoId) return;

    const checkedIds = Object.keys(checkedItems).filter(id => checkedItems[id]);
    
    setData?.(prev => ({
      ...prev,
      cultos: prev.cultos.map(c => 
        c.id === editingChecklistCultoId 
          ? { 
              ...c, 
              checklistResults: { 
                checkedItems: checkedIds, 
                observation: currentObservation, 
                updatedAt: new Date().toISOString() 
              } 
            } 
          : c
      )
    }));

    setShowPublicChecklist(false);
    setEditingChecklistCultoId(null);
    alert("Checklist e observações salvos com sucesso!");
  };

  const handleToggleSection = (sectionId: string, itemIds: string[], allChecked: boolean) => {
    const newChecked = { ...checkedItems };
    itemIds.forEach(id => {
      newChecked[id] = !allChecked;
    });
    setCheckedItems(newChecked);
  };

  const getChecklistProgress = (culto: Culto) => {
    if (!data.checklists || data.checklists.length === 0) return null;
    
    const totalItems = data.checklists.reduce((acc, s) => acc + s.items.length, 0);
    if (totalItems === 0) return null;

    const checkedCount = culto.checklistResults?.checkedItems.length || 0;
    const percentage = Math.round((checkedCount / totalItems) * 100);

    return {
      percentage,
      count: checkedCount,
      total: totalItems
    };
  };

  const renderDigitalLayout = (ref: React.RefObject<HTMLDivElement>, id: string, title: string, dateLabel: string, cultos: Culto[], isExport = false) => (
    <div 
      ref={ref} 
      id={id} 
      className={`bg-white w-[420px] flex flex-col p-6 shadow-sm relative overflow-visible box-border ${isExport ? 'fixed left-[-2000px] top-0 z-[-1]' : ''}`}
    >
      <div className="bg-adfare-navy rounded-[32px] p-8 pb-10 text-white mb-8 border-b-[6px] border-adfare-orange shadow-xl relative z-10 overflow-visible">
        <div className="flex flex-col overflow-visible">
          <div className="flex justify-between items-start mb-6 overflow-visible">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} className="text-blue-500" />
                <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase leading-normal">{title}</span>
              </div>
              <h1 className="text-[38px] font-black italic tracking-tight leading-[0.9] text-white uppercase">ADFARE</h1>
            </div>
            <div className="bg-blue-900 w-12 h-12 rounded-xl border border-blue-800 flex items-center justify-center shrink-0">
              <CalendarDays size={20} className="text-blue-300" />
            </div>
          </div>
          <div className="bg-white rounded-[24px] min-h-[64px] py-4 px-6 border-[3px] border-blue-800 flex items-center justify-center shadow-inner overflow-visible">
            <span className="text-[19px] font-black uppercase tracking-tight leading-tight text-blue-950 block text-center">
              {dateLabel}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mb-8 overflow-visible">
        {cultos.length === 0 ? (
          <div className="py-20 text-center text-slate-300 font-black uppercase text-xs italic tracking-widest leading-none">Nenhuma escala para exibir em {MONTHS[data.currentMonth].toUpperCase()}</div>
        ) : (
          cultos.map((culto) => (
            <div key={culto.id} className={`rounded-[32px] p-5 shadow-sm border-[2px] flex flex-col gap-5 overflow-visible ${culto.isSantaCeia ? 'bg-purple-900 border-purple-800 text-white' : 'bg-white border-slate-100'}`}>
              <div className="flex items-start gap-5 overflow-visible">
                <div className={`relative w-16 h-16 flex flex-col items-center justify-center shrink-0 shadow-md ${culto.isSantaCeia ? 'text-purple-900' : 'text-white'}`}>
                  <div className={`absolute inset-0 rounded-[24px] pointer-events-none ${culto.isSantaCeia ? 'bg-white' : 'bg-blue-900'}`}></div>
                  <div className="relative z-10 text-[9px] font-black opacity-60 uppercase leading-none mb-1 text-center w-full">{DAYS_SHORT[culto.dayOfWeek]}</div>
                  <div className="relative z-10 text-[28px] font-black leading-none text-center w-full">{culto.date.split('-')[2]}</div>
                </div>
                <div className="flex-grow min-w-0 overflow-visible">
                  <div className="flex justify-between items-center mb-3 min-w-0 flex-grow gap-2">
                    <h4 className={`text-[13px] font-black uppercase leading-normal pt-1.5 pb-1 -my-1.5 truncate ${culto.isSantaCeia ? 'text-white' : 'text-slate-900'}`}>{culto.isSantaCeia ? '★ SANTA CEIA' : culto.name}</h4>
                    <div className={`relative shrink-0 px-3 py-1.5 flex items-center justify-center ${culto.isSantaCeia ? 'text-white' : 'text-blue-900'}`}>
                      <div className={`absolute inset-0 rounded-full pointer-events-none ${culto.isSantaCeia ? 'bg-purple-800' : 'bg-blue-50'}`}></div>
                      <div className="relative z-10 text-[10px] font-black leading-none">{culto.time}H</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 overflow-visible">
                    <div className={`flex flex-col p-3 rounded-[20px] min-w-0 overflow-visible ${culto.isSantaCeia ? 'bg-white/10' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-1.5 mb-2 overflow-visible"><Key size={12} className={culto.isSantaCeia ? 'text-purple-300' : 'text-blue-600'} /><span className={`text-[8px] font-black uppercase leading-normal ${culto.isSantaCeia ? 'text-purple-300' : 'text-slate-400'}`}>Abertura</span></div>
                      <span className={`text-[10px] font-black uppercase leading-normal pt-1.5 pb-1 -my-1.5 truncate ${culto.isSantaCeia ? 'text-white' : 'text-slate-800'}`}>{getWorkerDisplayName(culto.workersAbertura[0])}</span>
                    </div>
                    <div className={`flex flex-col p-3 rounded-[20px] min-w-0 overflow-visible ${culto.isSantaCeia ? 'bg-white/10' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-1.5 mb-2 overflow-visible"><Users size={12} className={culto.isSantaCeia ? 'text-purple-300' : 'text-emerald-600'} /><span className={`text-[8px] font-black uppercase leading-normal ${culto.isSantaCeia ? 'text-purple-300' : 'text-slate-400'}`}>Apoio</span></div>
                      <span className={`text-[10px] font-black uppercase leading-normal pt-1.5 pb-1 -my-1.5 truncate ${culto.isSantaCeia ? 'text-white' : 'text-slate-800'}`}>{getWorkerDisplayName(culto.workersApoio[0])}</span>
                    </div>
                  </div>

                  {culto.isSantaCeia && (
                    <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-y-4 gap-x-3">
                      <div className="flex flex-col overflow-visible">
                        <div className="text-[7px] font-black uppercase text-purple-300 leading-normal mb-1">Arrumação da Mesa</div>
                        <div className="text-[10px] font-black uppercase text-white truncate leading-normal pt-1.5 pb-1 -my-1.5">{getWorkerDisplayName(culto.santaCeiaWorkers?.arrumarMesa)}</div>
                      </div>
                      <div className="flex flex-col overflow-visible">
                        <div className="text-[7px] font-black uppercase text-purple-300 leading-normal mb-1">Desarrumação da Mesa</div>
                        <div className="text-[10px] font-black uppercase text-white truncate leading-normal pt-1.5 pb-1 -my-1.5">{getWorkerDisplayName(culto.santaCeiaWorkers?.desarrumarMesa)}</div>
                      </div>
                      <div className="flex flex-col overflow-visible">
                        <div className="text-[7px] font-black uppercase text-purple-300 leading-normal mb-1">Servir o Pão</div>
                        <div className="text-[10px] font-black uppercase text-white truncate leading-normal pt-1.5 pb-1 -my-1.5">{getWorkerDisplayName(culto.santaCeiaWorkers?.servirPao)}</div>
                      </div>
                      <div className="flex flex-col overflow-visible">
                        <div className="text-[7px] font-black uppercase text-purple-300 leading-normal mb-1">Servir o Vinho</div>
                        <div className="text-[10px] font-black uppercase text-white truncate leading-normal pt-1.5 pb-1 -my-1.5">{getWorkerDisplayName(culto.santaCeiaWorkers?.servirVinho)}</div>
                      </div>
                    </div>
                  )}

                  {isPublic && data.checklists && data.checklists.length > 0 && (() => {
                    const progress = getChecklistProgress(culto);
                    return (
                      <div className="mt-4 pt-4 border-t border-slate-100/10 flex flex-col gap-3">
                         <div className="flex items-center justify-between">
                            <button 
                              onClick={() => handleOpenChecklist(culto)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${progress?.percentage === 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}
                            >
                              <ListChecks size={14} />
                              {progress?.percentage === 100 ? 'Checklist 100%' : (progress?.percentage ? `${progress.percentage}% Concluído` : 'Abrir Checklist')}
                            </button>
                            {culto.checklistResults?.observation && (
                              <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase italic">
                                <Check size={10} className="text-emerald-500" /> Possui Observações
                              </div>
                            )}
                         </div>
                         {progress && progress.percentage > 0 && (
                           <div className="w-full h-1.5 bg-slate-100/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${progress.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                style={{ width: `${progress.percentage}%` }}
                              ></div>
                           </div>
                         )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative mb-10 overflow-visible">
        <div className="absolute top-0 left-0 w-2 h-full bg-adfare-gradient"></div>
        <div className="flex items-start gap-4 overflow-visible">
          <Quote size={28} className="text-blue-100 shrink-0" />
          <div className="flex-grow overflow-visible">
            <p className="text-[14px] font-bold text-slate-700 italic leading-[1.6] mb-5">
              "Portanto, meus amados irmãos, sede firmes e constantes, sempre abundantes na obra do Senhor, sabendo que o vosso trabalho não é vão no Senhor."
            </p>
            <div className="flex items-center gap-3 overflow-visible">
              <div className="h-[2px] w-6 bg-blue-600 rounded-full"></div>
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-normal">1 Coríntios 15:58</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 pb-4 flex flex-col items-center gap-2 text-center opacity-30 overflow-visible">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none">Família Restaurada</span>
        <span className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.1em] leading-none">Gerenciamento Digital ADFARE</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Filtros e Controles */}
      <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 no-print space-y-4">
        <div className="flex flex-col gap-4">
          {!isPublic && (
            <div className="flex gap-2">
              <div className="flex-grow relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900/30" size={18} />
                 <select 
                  value={data.currentMonth} 
                  onChange={handleMonthChange} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-900 uppercase text-xs outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                >
                  {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                </select>
              </div>
              <select 
                value={data.currentYear} 
                onChange={handleYearChange} 
                className="min-w-[100px] px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-900 text-xs outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none text-center"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {isPublic && (
              <div className="flex items-center gap-2 mb-1 ml-2">
                <Users size={12} className="text-blue-500" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Localize sua escala rápida:
                </label>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 z-10" size={18} />
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={isPublic ? "SELECIONE OU BUSQUE SEU NOME..." : "Buscar por nome..."} 
                  value={filterName} 
                  onChange={e => {
                    setFilterName(e.target.value);
                    if (isPublic) setShowSuggestions(true);
                  }} 
                  onFocus={() => isPublic && setShowSuggestions(true)}
                  className={`w-full pl-11 pr-20 py-4 bg-white border border-slate-200 rounded-[24px] font-black text-sm text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 uppercase tracking-tight shadow-sm ${isPublic ? 'bg-blue-50/30 border-blue-100' : ''}`} 
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {filterName && (
                    <button onClick={() => { setFilterName(''); setShowSuggestions(false); }} className="text-slate-400 hover:text-rose-500 transition-colors p-1 active:scale-90">
                      <X size={18} />
                    </button>
                  )}
                  {isPublic && (
                    <button onClick={() => setShowSuggestions(!showSuggestions)} className="text-slate-300 hover:text-blue-500 transition-colors p-1">
                      <ChevronDown size={18} className={`transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {isPublic && showSuggestions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)}></div>
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-h-[300px] overflow-y-auto">
                    <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Escolha na lista abaixo:</span>
                    </div>
                    {data.obreiros
                      .filter(o => !filterName || o.name.toLowerCase().includes(filterName.toLowerCase()))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(o => (
                        <button
                          key={o.id}
                          onClick={() => {
                            setFilterName(o.name);
                            setShowSuggestions(false);
                          }}
                          className={`w-full text-left px-5 py-3.5 hover:bg-blue-50 flex items-center justify-between group transition-colors ${filterName === o.name ? 'bg-blue-50' : ''}`}
                        >
                          <span className={`text-[11px] font-black uppercase tracking-tight ${filterName === o.name ? 'text-blue-600' : 'text-slate-700'}`}>
                            {o.name}
                          </span>
                          {filterName === o.name && <Check size={14} className="text-blue-600" />}
                        </button>
                      ))}
                    {data.obreiros.filter(o => !filterName || o.name.toLowerCase().includes(filterName.toLowerCase())).length === 0 && (
                      <div className="p-8 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                        Nenhum obreiro encontrado
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {!isPublic && (
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setViewMode('weekly')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${viewMode === 'weekly' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}><Zap size={14} /> Semana</button>
              <button onClick={() => setViewMode('mobile')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${viewMode === 'mobile' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}><Smartphone size={14} /> Mês</button>
              <button onClick={() => setViewMode('print')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${viewMode === 'print' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}><Printer size={14} /> Mural</button>
            </div>
          )}
        </div>

        {viewMode === 'weekly' && weeks.length > 0 && !isPublic && (
          <div className="flex items-center justify-between bg-blue-50 p-2 rounded-2xl border border-blue-100">
            <button disabled={selectedWeek === 0} onClick={() => setSelectedWeek(w => Math.max(0, w - 1))} className="p-2 text-blue-900 disabled:opacity-20 active:scale-90 transition-transform"><ChevronLeft size={24} /></button>
            <div className="text-center px-2 min-w-0">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">Semana {selectedWeek + 1}</span>
              <p className="text-[8px] font-bold text-blue-400 uppercase tracking-tight mt-0.5 truncate leading-none">{weekRangeLabel.toLowerCase()}</p>
            </div>
            <button disabled={selectedWeek === weeks.length - 1} onClick={() => setSelectedWeek(w => Math.min(weeks.length - 1, w + 1))} className="p-2 text-blue-900 disabled:opacity-20 active:scale-90 transition-transform"><ChevronRight size={24} /></button>
          </div>
        )}

        {!isPublic && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleExportPDF()} disabled={isExporting || cultosToShow.length === 0} className="py-4 bg-adfare-navy text-white rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
              <FileDown size={14} /> Salvar PDF
            </button>
            <button onClick={handleExportImage} disabled={isExporting || cultosToShow.length === 0 || viewMode === 'print'} className="py-4 bg-adfare-gradient text-white rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-[0_8px_30px_rgb(243,112,33,0.3)] active:scale-95 transition-all disabled:opacity-50">
              {isExporting ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Share2 size={14} />} 
              {isExporting ? 'Processando...' : 'ZAP / Imagem'}
            </button>
          </div>
        )}

        {!isPublic && (
          <button 
            onClick={handleCopyPublicLink} 
            className={`w-full py-4 mt-3 rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-sm ${copyingLink ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {copyingLink ? <Check size={14} /> : <LinkIcon size={14} />}
            {copyingLink ? 'Link Copiado!' : 'Copiar Link Público para Obreiros'}
          </button>
        )}

        {copyingLink && (
          <div className="w-full py-4 mt-4 bg-emerald-50 text-emerald-600 rounded-[24px] font-black text-[10px] uppercase tracking-widest text-center animate-in fade-in zoom-in-95">
             Link Copiado! Compartilhe no WhatsApp
          </div>
        )}
      </div>

      {/* RENDERIZADORES DE EXPORTAÇÃO (OCULTOS) */}
      <div className="pointer-events-none opacity-0 h-0 overflow-hidden">
        {renderDigitalLayout(weeklyExportRef, 'weekly-export-container', 'ESCALA SEMANAL', weekRangeLabel || '---', weeks[selectedWeek] || [], true)}
        {renderDigitalLayout(mobileExportRef, 'mobile-export-container', 'ESCALA MENSAL', `${MONTHS[data.currentMonth].toUpperCase()} ${data.currentYear}`, sortedCultos, true)}
      </div>

      {/* Visualização da Escala Digital */}
      <div className="flex flex-col items-center gap-6 pb-20 overflow-visible no-print">
        <div className="scale-[0.85] sm:scale-100 origin-top overflow-visible">
          {viewMode === 'weekly' && renderDigitalLayout(weeklyPreviewRef, 'weekly-preview', 'ESCALA SEMANAL', weekRangeLabel || '---', cultosToShow)}
          {viewMode === 'mobile' && renderDigitalLayout(mobilePreviewRef, 'mobile-preview', 'ESCALA MENSAL', `${MONTHS[data.currentMonth].toUpperCase()} ${data.currentYear}`, sortedCultos)}
        </div>
      </div>

      {/* Layout de Impressão */}
      {viewMode === 'print' && (
        <div className="w-full overflow-hidden flex justify-center pb-10 sm:block print:pb-0">
          <div className="relative w-[794px] min-h-[1123px] print:w-full print:min-h-0 mx-auto">
             <div className="absolute left-1/2 -translate-x-1/2 origin-top scale-[0.45] sm:scale-100 sm:relative sm:left-0 sm:translate-x-0 print:static print:transform-none">
              <div className="bg-white shadow-2xl overflow-hidden flex flex-col border border-slate-200 p-[40px] pdf-page-canvas print:shadow-none print:border-none" ref={reportRef}>
                <div className="border-b-[3px] border-blue-900 pb-2 mb-4 flex justify-between items-end shrink-0">
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter text-blue-950 italic uppercase leading-none">ADFARE</h1>
                    <p className="text-blue-600 font-black tracking-[0.2em] text-[9px] uppercase mt-1">Ministério Família Restaurada</p>
                  </div>
                  <div className="bg-blue-900 text-white px-6 py-2 rounded-full shadow-sm">
                    <span className="text-sm font-black uppercase tracking-widest">{MONTHS[data.currentMonth]} {data.currentYear}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-4 flex-grow content-start overflow-hidden">
                  {sortedCultos.length === 0 ? (
                    <div className="col-span-3 text-center py-20 text-slate-300 font-black uppercase">Nenhuma escala para {MONTHS[data.currentMonth]}</div>
                  ) : (
                    sortedCultos.flatMap((culto) => {
                      const cards = [];
                      
                      // Card Principal do Culto
                      cards.push(
                        <div key={culto.id} className={`pdf-card flex flex-col border border-slate-200 rounded-[20px] overflow-hidden bg-white shadow-sm min-h-[130px] ${culto.isSantaCeia ? 'border-purple-200' : ''}`}>
                          <div className={`px-4 py-2 flex justify-between items-center border-b border-slate-100 ${culto.isSantaCeia ? 'bg-purple-50' : 'bg-slate-50'}`}>
                            <span className={`text-[11px] font-black uppercase leading-tight ${culto.isSantaCeia ? 'text-purple-800' : 'text-blue-950'}`}>{culto.isSantaCeia ? '★ SANTA CEIA' : culto.name}</span>
                            <span className="text-[11px] font-black text-blue-900 leading-none shrink-0 ml-2">{culto.time}H</span>
                          </div>
                          <div className="flex items-stretch flex-grow min-h-0">
                            <div className={`w-12 flex flex-col items-center justify-center shrink-0 ${culto.isSantaCeia ? 'bg-purple-900 text-white' : 'bg-blue-900 text-white'}`}>
                              <span className="text-[9px] font-black opacity-70 mb-0.5 uppercase leading-none">{DAYS_SHORT[culto.dayOfWeek]}</span>
                              <span className="text-3xl font-black leading-none">{culto.date.split('-')[2]}</span>
                            </div>
                            <div className="flex-grow p-3 flex flex-col justify-center space-y-3">
                              <div className="flex items-center gap-2">
                                <Key size={14} className="text-blue-600 shrink-0" />
                                <div className="flex flex-col min-w-0"><span className="text-[8px] font-black text-blue-400 uppercase leading-none mb-0.5">ABERTURA</span><span className="text-xs font-black text-slate-900 uppercase leading-tight">{getWorkerDisplayName(culto.workersAbertura[0])}</span></div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users size={14} className="text-emerald-600 shrink-0" />
                                <div className="flex flex-col min-w-0"><span className="text-[8px] font-black text-emerald-400 uppercase leading-none mb-0.5">APOIO</span><span className="text-xs font-black text-slate-900 uppercase leading-tight">{getWorkerDisplayName(culto.workersApoio[0])}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );

                      // Card Secundário (Equipe de Santa Ceia)
                      if (culto.isSantaCeia) {
                        cards.push(
                          <div key={`${culto.id}-ceia`} className="pdf-card flex flex-col border border-purple-200 rounded-[20px] overflow-hidden bg-white shadow-sm min-h-[130px]">
                            <div className="px-4 py-2 flex justify-between items-center border-b border-purple-100 bg-purple-50">
                              <span className="text-[11px] font-black uppercase leading-tight text-purple-800">EQUIPE DA CEIA</span>
                              <span className="text-[11px] font-black text-purple-900 leading-none shrink-0 ml-2">{culto.time}H</span>
                            </div>
                            <div className="flex items-stretch flex-grow min-h-0">
                              <div className="w-12 flex flex-col items-center justify-center shrink-0 bg-purple-900 text-white">
                                <span className="text-[9px] font-black opacity-70 mb-0.5 uppercase leading-none">{DAYS_SHORT[culto.dayOfWeek]}</span>
                                <span className="text-3xl font-black leading-none">{culto.date.split('-')[2]}</span>
                              </div>
                              <div className="flex-grow p-3 flex flex-col justify-center">
                                <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[7px] font-black text-blue-400 uppercase leading-none mb-0.5">ARRUMAÇÃO</span>
                                    <span className="text-[10px] font-black text-slate-900 uppercase leading-tight">{getWorkerDisplayName(culto.santaCeiaWorkers?.arrumarMesa)}</span>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[7px] font-black text-blue-400 uppercase leading-none mb-0.5">DESARRUMAÇÃO</span>
                                    <span className="text-[10px] font-black text-slate-900 uppercase leading-tight">{getWorkerDisplayName(culto.santaCeiaWorkers?.desarrumarMesa)}</span>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[7px] font-black text-blue-400 uppercase leading-none mb-0.5">SERVIR PÃO</span>
                                    <span className="text-[10px] font-black text-slate-900 uppercase leading-tight">{getWorkerDisplayName(culto.santaCeiaWorkers?.servirPao)}</span>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[7px] font-black text-blue-400 uppercase leading-none mb-0.5">SERVIR VINHO</span>
                                    <span className="text-[10px] font-black text-slate-900 uppercase leading-tight">{getWorkerDisplayName(culto.santaCeiaWorkers?.servirVinho)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return cards;
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DE AVISO PÚBLICO */}
      {showPublicAnnouncement && data.announcement && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col relative border border-white/20">
            <div className="absolute top-0 left-0 w-full h-2 bg-adfare-gradient"></div>
            
            <div className="p-8 pb-4 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-[32px] flex items-center justify-center text-orange-600 mb-6 shadow-inner">
                <Megaphone size={40} />
              </div>
              
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">Aviso Importante</h3>
              <div className="h-1 w-12 bg-orange-200 rounded-full mb-6"></div>
              
              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 w-full mb-6">
                <p className="text-slate-700 font-bold leading-relaxed text-sm whitespace-pre-wrap">
                  {data.announcement.text}
                </p>
              </div>

              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-8">
                Publicado em {new Date(data.announcement.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="p-8 pt-0 flex flex-col gap-3">
              <button 
                onClick={() => setShowPublicAnnouncement(false)}
                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Entendi, Fechar
              </button>
              
              <button 
                onClick={() => {
                  if (data.announcement) {
                    localStorage.setItem('adfare_dismissed_announcement_id', data.announcement.id);
                    setShowPublicAnnouncement(false);
                  }
                }}
                className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
              >
                Não ver mais este aviso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKLIST PÚBLICO */}
      {showPublicChecklist && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 no-print">
           <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="p-8 bg-blue-600 text-white flex justify-between items-start shrink-0 relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <ListChecks size={28} /> Checklist de Rotina
                    </h3>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1 opacity-80">Guia passo-a-passo para o obreiro</p>
                 </div>
                 <button onClick={() => setShowPublicChecklist(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3 flex-grow bg-slate-50/50">
                 {data.checklists?.map(section => {
                    const itemIds = section.items.map(i => i.id);
                    const allChecked = itemIds.length > 0 && itemIds.every(id => checkedItems[id]);
                    
                    return (
                      <div key={section.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all">
                        <div className="w-full flex items-center justify-between p-5">
                            <button 
                              onClick={() => setExpandedPublicSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                              className="flex items-center gap-3 flex-grow text-left"
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${expandedPublicSections[section.id] ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-500'}`}>
                                  <ListChecks size={16} />
                                </div>
                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{section.title}</h4>
                                {expandedPublicSections[section.id] ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                            </button>
                            
                            <button 
                              onClick={() => handleToggleSection(section.id, itemIds, allChecked)}
                              className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${allChecked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                            >
                              {allChecked ? 'Tudo OK' : 'Marcar Tudo'}
                            </button>
                        </div>
                        
                        {expandedPublicSections[section.id] && (
                            <div className="px-5 pb-5 pt-2 grid gap-2 animate-in slide-in-from-top-2">
                              {section.items.map(item => (
                                  <label 
                                    key={item.id} 
                                    className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all cursor-pointer ${checkedItems[item.id] ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-50 shadow-sm hover:border-blue-200'}`}
                                  >
                                    <div className="relative flex items-center justify-center">
                                        <input 
                                          type="checkbox" 
                                          className="peer hidden" 
                                          checked={!!checkedItems[item.id]}
                                          onChange={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                        />
                                        <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${checkedItems[item.id] ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-100' : 'bg-slate-50 border-slate-200 text-transparent'}`}>
                                          <Check size={16} strokeWidth={4} />
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold tracking-tight leading-snug transition-all ${checkedItems[item.id] ? 'text-emerald-700 line-through opacity-60' : 'text-slate-700'}`}>
                                      {item.text}
                                    </span>
                                  </label>
                              ))}
                              {section.items.length === 0 && (
                                <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">Nenhuma atividade cadastrada</p>
                              )}
                            </div>
                        )}
                      </div>
                    );
                 })}
              </div>

              <div className="p-8 bg-white border-t border-slate-100 shrink-0 flex flex-col gap-3">
                 <div className="mb-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Observações / Ocorrências</label>
                    <textarea 
                      value={currentObservation}
                      onChange={(e) => setCurrentObservation(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm"
                      placeholder="Relate aqui qualquer observação importante sobre o culto..."
                    />
                 </div>
                 
                 <button 
                   onClick={handleSaveChecklist}
                   className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                 >
                   Salvar Checklist
                 </button>
                 <button 
                   onClick={() => {
                     if (confirm("Deseja limpar todas as seleções?")) {
                       setCheckedItems({});
                     }
                   }}
                   className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-rose-500 transition-colors"
                 >
                   Limpar Seleções
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RelatorioTab;
