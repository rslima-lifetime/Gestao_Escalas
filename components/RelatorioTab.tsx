
import React, { useRef, useState, useMemo } from 'react';
import { Key, Users, Search, X, Smartphone, Printer, Share2, CalendarDays, FileDown, ChevronLeft, ChevronRight, Zap, ShieldCheck, Quote, Calendar, Wine } from 'lucide-react';
import { AppDataV1, Culto } from '../types';
import { MONTHS, DAYS_SHORT } from '../constants';

interface Props {
  data: AppDataV1;
  setData?: React.Dispatch<React.SetStateAction<AppDataV1>>;
}

const RelatorioTab: React.FC<Props> = ({ data, setData }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [viewMode, setViewMode] = useState<'print' | 'mobile' | 'weekly'>('weekly');
  const [selectedWeek, setSelectedWeek] = useState(0);
  
  const reportRef = useRef<HTMLDivElement>(null);
  
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

  const getWorkerDisplayName = (id: string | undefined) => {
    if (!id) return '---';
    const obreiro = data.obreiros.find(o => o.id === id);
    if (!obreiro) return '---';
    const name = obreiro.name.length > 40 ? obreiro.name.substring(0, 37) + '...' : obreiro.name;
    return `${obreiro.role} ${name}`.toUpperCase();
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
        scale: 3, 
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
        const fileName = `ESCALA_ADFARE_${viewMode === 'weekly' ? 'SEMANAL' : 'MENSAL'}_${MONTHS[data.currentMonth].toUpperCase()}.png`;
        
        canvas.toBlob(async (blob: Blob | null) => {
          if (!blob) {
            setIsExporting(false);
            return;
          }

          const file = new File([blob], fileName, { type: 'image/png' });
          
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
        }, 'image/png');
        
      }).catch((e) => {
        console.error("Erro na exportação:", e);
        setIsExporting(false);
      });
    } else {
      setIsExporting(false);
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement, fileName: string) => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input type="text" placeholder="Buscar por nome do obreiro..." value={filterName} onChange={e => setFilterName(e.target.value)} className="w-full pl-9 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 outline-none placeholder:text-slate-300" />
            {filterName && <button onClick={() => setFilterName('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"><X size={14} /></button>}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setViewMode('weekly')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${viewMode === 'weekly' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}><Zap size={14} /> Semana</button>
            <button onClick={() => setViewMode('mobile')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${viewMode === 'mobile' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}><Smartphone size={14} /> Mês</button>
            <button onClick={() => setViewMode('print')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${viewMode === 'print' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}><Printer size={14} /> Mural</button>
          </div>
        </div>

        {viewMode === 'weekly' && weeks.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-2 rounded-2xl border border-blue-100">
            <button disabled={selectedWeek === 0} onClick={() => setSelectedWeek(w => Math.max(0, w - 1))} className="p-2 text-blue-900 disabled:opacity-20 active:scale-90 transition-transform"><ChevronLeft size={24} /></button>
            <div className="text-center px-2 min-w-0">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">Semana {selectedWeek + 1}</span>
              <p className="text-[8px] font-bold text-blue-400 uppercase tracking-tight mt-0.5 truncate leading-none">{weekRangeLabel.toLowerCase()}</p>
            </div>
            <button disabled={selectedWeek === weeks.length - 1} onClick={() => setSelectedWeek(w => Math.min(weeks.length - 1, w + 1))} className="p-2 text-blue-900 disabled:opacity-20 active:scale-90 transition-transform"><ChevronRight size={24} /></button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleExportPDF()} disabled={isExporting || cultosToShow.length === 0} className="py-4 bg-adfare-navy text-white rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
            <FileDown size={14} /> Salvar PDF
          </button>
          <button onClick={handleExportImage} disabled={isExporting || cultosToShow.length === 0 || viewMode === 'print'} className="py-4 bg-adfare-gradient text-white rounded-2xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-[0_8px_30px_rgb(243,112,33,0.3)] active:scale-95 transition-all disabled:opacity-50">
            {isExporting ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Share2 size={14} />} 
            {isExporting ? 'Processando...' : 'ZAP / Imagem'}
          </button>
        </div>
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
        <div className="w-full overflow-hidden flex justify-center pb-10 sm:block">
          <div className="relative" style={{ width: '794px', height: '1123px' }}>
             <div className="absolute left-1/2 -translate-x-1/2 origin-top scale-[0.45] sm:scale-100 sm:relative sm:left-0 sm:translate-x-0">
              <div className="bg-white shadow-2xl overflow-hidden flex flex-col border border-slate-200 p-[40px] pdf-page-canvas" ref={reportRef}>
                <div className="border-b-4 border-blue-900 pb-4 mb-8 flex justify-between items-end shrink-0">
                  <div>
                    <h1 className="text-5xl font-black tracking-tighter text-blue-950 italic uppercase leading-none">ADFARE</h1>
                    <p className="text-blue-600 font-black tracking-[0.2em] text-[11px] uppercase mt-1">Ministério Família Restaurada</p>
                  </div>
                  <div className="bg-blue-900 text-white px-8 py-3 rounded-full shadow-lg">
                    <span className="text-lg font-black uppercase tracking-widest">{MONTHS[data.currentMonth]} {data.currentYear}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-6 flex-grow content-start overflow-hidden">
                  {sortedCultos.length === 0 ? (
                    <div className="col-span-2 text-center py-20 text-slate-300 font-black uppercase">Nenhuma escala para {MONTHS[data.currentMonth]}</div>
                  ) : (
                    sortedCultos.map((culto) => (
                      <div key={culto.id} className={`pdf-card flex flex-col border border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-sm min-h-[160px] ${culto.isSantaCeia ? 'border-purple-200' : ''}`}>
                        <div className={`px-4 py-2 flex justify-between items-center border-b border-slate-100 ${culto.isSantaCeia ? 'bg-purple-50' : 'bg-slate-50'}`}>
                          <span className={`text-[10px] font-black uppercase truncate max-w-[70%] leading-none ${culto.isSantaCeia ? 'text-purple-800' : 'text-blue-950'}`}>{culto.isSantaCeia ? '★ SANTA CEIA' : culto.name}</span>
                          <span className="text-[10px] font-black text-blue-900 leading-none">{culto.time}H</span>
                        </div>
                        <div className="flex items-stretch flex-grow min-h-0">
                          <div className={`w-14 flex flex-col items-center justify-center shrink-0 ${culto.isSantaCeia ? 'bg-purple-900 text-white' : 'bg-blue-900 text-white'}`}>
                            <span className="text-[9px] font-black opacity-70 mb-0.5 uppercase leading-none">{DAYS_SHORT[culto.dayOfWeek]}</span>
                            <span className="text-3xl font-black leading-none">{culto.date.split('-')[2]}</span>
                          </div>
                          <div className="flex-grow p-4 flex flex-col justify-center space-y-3">
                            <div className="flex items-center gap-3">
                              <Key size={14} className="text-blue-600 shrink-0" />
                              <div className="flex flex-col min-w-0"><span className="text-[7px] font-black text-blue-400 uppercase leading-none mb-0.5">ABERTURA</span><span className="text-[12px] font-black text-slate-900 uppercase truncate leading-none">{getWorkerDisplayName(culto.workersAbertura[0])}</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Users size={14} className="text-emerald-600 shrink-0" />
                              <div className="flex flex-col min-w-0"><span className="text-[7px] font-black text-emerald-400 uppercase leading-none mb-0.5">APOIO</span><span className="text-[12px] font-black text-slate-900 uppercase truncate leading-none">{getWorkerDisplayName(culto.workersApoio[0])}</span></div>
                            </div>

                            {culto.isSantaCeia && (
                              <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-start gap-2">
                                  <Wine size={12} className="text-purple-600 shrink-0 mt-0.5" />
                                  <div className="flex flex-col min-w-0 flex-grow">
                                    <span className="text-[6px] font-black text-purple-400 uppercase leading-none mb-1">Equipe de Santa Ceia</span>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[5px] font-black text-slate-400 uppercase leading-none">Arrumação</span>
                                        <span className="text-[8px] font-bold text-slate-700 truncate leading-tight">{getWorkerDisplayName(culto.santaCeiaWorkers?.arrumarMesa)}</span>
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[5px] font-black text-slate-400 uppercase leading-none">Desarrumação</span>
                                        <span className="text-[8px] font-bold text-slate-700 truncate leading-tight">{getWorkerDisplayName(culto.santaCeiaWorkers?.desarrumarMesa)}</span>
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[5px] font-black text-slate-400 uppercase leading-none">Servir Pão</span>
                                        <span className="text-[8px] font-bold text-slate-700 truncate leading-tight">{getWorkerDisplayName(culto.santaCeiaWorkers?.servirPao)}</span>
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[5px] font-black text-slate-400 uppercase leading-none">Servir Vinho</span>
                                        <span className="text-[8px] font-bold text-slate-700 truncate leading-tight">{getWorkerDisplayName(culto.santaCeiaWorkers?.servirVinho)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatorioTab;
