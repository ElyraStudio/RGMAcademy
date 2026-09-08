import futsalImg from "@/assets/futsal.jpg";
import voleiImg from "@/assets/volei.jpg";
import beachImg from "@/assets/beachtennis.jpg";

export type Turno = "manha" | "tarde" | "noite";
export type ReservaStatus = "pendente" | "confirmada" | "cancelada";

export interface Quadra {
  id: string;
  nome: string;
  tipo_esporte: string;
  foto_url: string | null;
  ativa: boolean;
  ordem: number;
}

export interface Preco {
  id: string;
  quadra_id: string;
  turno: Turno;
  valor: number;
}

export interface Reserva {
  id: string;
  quadra_id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  nome_cliente: string;
  telefone: string;
  status: ReservaStatus;
  recorrente: boolean;
  dia_semana_recorrencia: number | null;
  serie_id: string | null;
  serie_ativa: boolean;
  observacao: string | null;
  created_at: string;
}

export interface Bloqueio {
  id: string;
  quadra_id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  motivo: string | null;
}

export const HORA_ABERTURA = 6;
export const HORA_FECHAMENTO = 23;

export const TURNO_LABEL: Record<Turno, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export interface Slot {
  inicio: string;
  fim: string;
  turno: Turno;
}

export function gerarSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let h = HORA_ABERTURA; h < HORA_FECHAMENTO; h++) {
    slots.push({
      inicio: `${String(h).padStart(2, "0")}:00`,
      fim: `${String(h + 1).padStart(2, "0")}:00`,
      turno: turnoDaHora(h),
    });
  }
  return slots;
}

export function turnoDaHora(hora: number): Turno {
  if (hora < 12) return "manha";
  if (hora < 18) return "tarde";
  return "noite";
}

export function turnoDoHorario(horario: string): Turno {
  return turnoDaHora(Number(horario.slice(0, 2)));
}

export function hhmm(valor: string): string {
  return valor.slice(0, 5);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function formatarDataCurta(iso: string): string {
  const d = fromISODate(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatarDataLonga(iso: string): string {
  const d = fromISODate(iso);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function moeda(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function fotoDaQuadra(quadra: Quadra): string {
  if (quadra.foto_url) return quadra.foto_url;
  const tipo = quadra.tipo_esporte.toLowerCase();
  if (tipo.includes("vol")) return voleiImg;
  if (tipo.includes("beach") || tipo.includes("tennis") || tipo.includes("areia"))
    return beachImg;
  return futsalImg;
}

export function whatsappLink(telefone: string): string {
  const digits = telefone.replace(/\D/g, "");
  const comDdi = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${comDdi}`;
}
