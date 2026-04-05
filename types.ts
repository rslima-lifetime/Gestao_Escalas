
export enum DayOfWeek {
  DOMINGO = 0,
  SEGUNDA = 1,
  TERÇA = 2,
  QUARTA = 3,
  QUINTA = 4,
  SEXTA = 5,
  SÁBADO = 6
}

export type PreferredRole = 'abertura' | 'apoio' | 'ambos';

export interface Obreiro {
  id: string;
  name: string;
  role: string;
  preferredRole: PreferredRole; // Especialidade na escala
  balance: number;
  fixedDays: number[];
  restrictions: number[];
  linkedWorkerId?: string; // ID do parceiro fixo (ex: cônjuge)
}

export interface SantaCeiaWorkers {
  arrumarMesa: string;
  desarrumarMesa: string;
  servirPao: string;
  servirVinho: string;
}

export interface Culto {
  id: string;
  date: string;
  dayOfWeek: number;
  time: string;
  name: string;
  isSantaCeia: boolean;
  workersAbertura: string[]; // IDs dos obreiros de Abertura/Fechamento
  workersApoio: string[];     // IDs dos obreiros de Apoio
  santaCeiaWorkers?: SantaCeiaWorkers;
}

export interface SavedScale {
  id: string;
  name: string;
  createdAt: string;
  month: number;
  year: number;
  cultos: Culto[];
  obreiros: Obreiro[]; // Snapshot das configurações dos obreiros
}

export interface AppDataV1 {
  obreiros: Obreiro[];
  cultos: Culto[];
  currentMonth: number;
  currentYear: number;
  savedScales: SavedScale[];
}
