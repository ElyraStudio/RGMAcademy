import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CalendarDays, Repeat, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  Quadra,
  Preco,
  Turno,
  TURNO_LABEL,
  DIAS_SEMANA,
  addDays,
  formatarDataLonga,
  fotoDaQuadra,
  gerarSlots,
  hhmm,
  moeda,
  toISODate,
  fromISODate,
  turnoDoHorario,
} from "@/lib/agenda";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RGM Academy — Reserve sua quadra" },
      {
        name: "description",
        content:
          "Escolha a quadra, veja os horários livres e reserve na hora. Futsal, vôlei e beach tennis na RGM Academy.",
      },
      { property: "og:title", content: "RGM Academy — Reserve sua quadra" },
      {
        property: "og:description",
        content: "Horários em tempo real, reserva rápida e opção de horário fixo semanal.",
      },
    ],
  }),
  component: Home,
});

interface SlotOcupado {
  data: string;
  horario_inicio: string;
  horario_fim: string;
  tipo: string;
}

const SEMANAS_RECORRENCIA = 12;

function Home() {
  const queryClient = useQueryClient();
  const slots = useMemo(() => gerarSlots(), []);
  const hoje = useMemo(() => toISODate(new Date()), []);
  const [quadraId, setQuadraId] = useState<string | null>(null);
  const [dia, setDia] = useState<string>(hoje);
  const [inicioSemana, setInicioSemana] = useState<Date>(new Date());
  const [slotSelecionado, setSlotSelecionado] = useState<{ inicio: string; fim: string } | null>(
    null,
  );

  const { data: quadras = [], isLoading: carregandoQuadras } = useQuery({
    queryKey: ["quadras-publicas"],
    queryFn: async (): Promise<Quadra[]> => {
      const { data, error } = await supabase
        .from("quadras")
        .select("*")
        .eq("ativa", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Quadra[];
    },
  });

  const { data: precos = [] } = useQuery({
    queryKey: ["precos-publicos"],
    queryFn: async (): Promise<Preco[]> => {
      const { data, error } = await supabase.from("precos").select("*");
      if (error) throw error;
      return (data ?? []) as Preco[];
    },
  });

  const quadraAtual = quadras.find((q) => q.id === quadraId) ?? quadras[0] ?? null;

  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toISODate(addDays(inicioSemana, i))),
    [inicioSemana],
  );

  const diaAtivo = dias.includes(dia) ? dia : (dias[0] as string);

  const { data: ocupados = [] } = useQuery({
    queryKey: ["disponibilidade", quadraAtual?.id, dias[0], dias[6]],
    enabled: !!quadraAtual,
    queryFn: async (): Promise<SlotOcupado[]> => {
      const { data, error } = await supabase.rpc("disponibilidade", {
        _quadra_id: quadraAtual!.id,
        _de: dias[0]!,
        _ate: dias[6]!,

      });
      if (error) throw error;
      return (data ?? []) as SlotOcupado[];
    },
  });

  function statusDoSlot(data: string, inicio: string): "livre" | "ocupado" | "bloqueado" | "passado" {
    const agora = new Date();
    const dataHora = fromISODate(data);
    dataHora.setHours(Number(inicio.slice(0, 2)), 0, 0, 0);
    if (dataHora.getTime() < agora.getTime()) return "passado";
    const achado = ocupados.find((o) => o.data === data && hhmm(o.horario_inicio) === inicio);
    if (!achado) return "livre";
    return achado.tipo === "bloqueado" ? "bloqueado" : "ocupado";
  }

  function precoDoSlot(inicio: string): number | null {
    if (!quadraAtual) return null;
    const turno = turnoDoHorario(inicio);
    const p = precos.find((x) => x.quadra_id === quadraAtual.id && x.turno === turno);
    return p ? Number(p.valor) : null;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-sky)" }}>
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              RGM
            </div>
            <div>
              <p className="text-base font-semibold leading-tight">RGM Academy</p>
              <p className="text-xs text-muted-foreground">Agendamento de quadras</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">
              <ShieldCheck className="size-4" /> Admin
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <section className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Reserve sua quadra em poucos toques
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha a quadra, veja os horários livres e confirme. Também dá para marcar horário
            fixo toda semana.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Escolha a quadra
          </h2>
          {carregandoQuadras ? (
            <p className="text-sm text-muted-foreground">Carregando quadras…</p>
          ) : quadras.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma quadra disponível no momento.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quadras.map((q) => {
                const ativa = quadraAtual?.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setQuadraId(q.id)}
                    className={`overflow-hidden rounded-2xl border text-left transition ${
                      ativa
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border hover:border-primary/50"
                    } bg-card`}
                    style={ativa ? { boxShadow: "var(--shadow-soft)" } : undefined}
                  >
                    <img
                      src={fotoDaQuadra(q)}
                      alt={`${q.nome} - ${q.tipo_esporte}`}
                      loading="lazy"
                      width={1024}
                      height={640}
                      className="h-28 w-full object-cover"
                    />
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold">{q.nome}</p>
                      <p className="text-xs capitalize text-muted-foreground">{q.tipo_esporte}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {quadraAtual && (
          <>
            <section className="mb-8 rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="size-4 text-primary" /> Agenda — {quadraAtual.nome}
                </h2>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Semana anterior"
                    onClick={() => setInicioSemana((d) => addDays(d, -7))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Próxima semana"
                    onClick={() => setInicioSemana((d) => addDays(d, 7))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {dias.map((d) => {
                  const data = fromISODate(d);
                  const ativo = d === diaAtivo;
                  return (
                    <button
                      key={d}
                      onClick={() => setDia(d)}
                      className={`min-w-16 shrink-0 rounded-xl border px-3 py-2 text-center transition ${
                        ativo
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      <span className="block text-[11px] uppercase">
                        {DIAS_SEMANA[data.getDay()]!.slice(0, 3)}
                      </span>
                      <span className="block text-lg font-semibold leading-tight">
                        {data.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mb-3 mt-2 text-xs capitalize text-muted-foreground">
                {formatarDataLonga(diaAtivo)}
              </p>

              <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <Legenda cor="bg-success" texto="Disponível" />
                <Legenda cor="bg-muted-foreground/40" texto="Ocupado" />
                <Legenda cor="bg-warning" texto="Bloqueado" />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {slots.map((s) => {
                  const status = statusDoSlot(diaAtivo, s.inicio);
                  const livre = status === "livre";
                  return (
                    <button
                      key={s.inicio}
                      disabled={!livre}
                      onClick={() => setSlotSelecionado({ inicio: s.inicio, fim: s.fim })}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        livre
                          ? "border-success/40 bg-success/10 hover:border-success"
                          : status === "bloqueado"
                            ? "border-warning/40 bg-warning/10 opacity-80"
                            : "border-border bg-muted opacity-70"
                      }`}
                    >
                      <span className="block text-sm font-semibold">
                        {s.inicio} – {s.fim}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {status === "livre"
                          ? moeda(precoDoSlot(s.inicio))
                          : status === "bloqueado"
                            ? "Bloqueado"
                            : status === "passado"
                              ? "Encerrado"
                              : "Ocupado"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mb-8 rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">Tabela de valores</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[380px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2">Quadra</th>
                      {(["manha", "tarde", "noite"] as Turno[]).map((t) => (
                        <th key={t} className="py-2">
                          {TURNO_LABEL[t]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quadras.map((q) => (
                      <tr key={q.id} className="border-t border-border">
                        <td className="py-2 font-medium">{q.nome}</td>
                        {(["manha", "tarde", "noite"] as Turno[]).map((t) => (
                          <td key={t} className="py-2">
                            {moeda(
                              precos.find((p) => p.quadra_id === q.id && p.turno === t)?.valor,
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Valores por hora. Manhã até 12h, tarde até 18h, noite a partir das 18h.
              </p>
            </section>
          </>
        )}
      </main>

      {quadraAtual && slotSelecionado && (
        <FormularioReserva
          quadra={quadraAtual}
          data={diaAtivo}
          inicio={slotSelecionado.inicio}
          fim={slotSelecionado.fim}
          valor={precoDoSlot(slotSelecionado.inicio)}
          onClose={() => setSlotSelecionado(null)}
          onSaved={() => {
            setSlotSelecionado(null);
            queryClient.invalidateQueries({ queryKey: ["disponibilidade"] });
          }}
        />
      )}
    </div>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-full ${cor}`} />
      {texto}
    </span>
  );
}

function FormularioReserva({
  quadra,
  data,
  inicio,
  fim,
  valor,
  onClose,
  onSaved,
}: {
  quadra: Quadra;
  data: string;
  inicio: string;
  fim: string;
  valor: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const diaSemana = fromISODate(data).getDay();

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || telefone.replace(/\D/g, "").length < 10) {
      toast.error("Informe seu nome e um telefone válido com DDD.");
      return;
    }
    setSalvando(true);
    const serieId = recorrente ? crypto.randomUUID() : null;
    const total = recorrente ? SEMANAS_RECORRENCIA : 1;
    const linhas = Array.from({ length: total }, (_, i) => ({
      quadra_id: quadra.id,
      data: toISODate(addDays(fromISODate(data), i * 7)),
      horario_inicio: inicio,
      horario_fim: fim,
      nome_cliente: nome.trim(),
      telefone: telefone.trim(),
      status: "pendente" as const,
      recorrente,
      dia_semana_recorrencia: recorrente ? diaSemana : null,
      serie_id: serieId,
    }));

    const { error } = await supabase.from("reservas").insert(linhas);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível registrar a reserva. Tente novamente.");
      return;
    }
    toast.success(
      recorrente
        ? "Horário fixo solicitado! Vamos confirmar pelo WhatsApp."
        : "Reserva solicitada! Vamos confirmar pelo WhatsApp.",
    );
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reservar horário</DialogTitle>
          <DialogDescription className="capitalize">
            {quadra.nome} · {formatarDataLonga(data)} · {inicio} às {fim}
            {valor != null && ` · ${moeda(valor)}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Seu nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tel">WhatsApp / telefone</Label>
            <Input
              id="tel"
              inputMode="tel"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-3">
            <Checkbox
              checked={recorrente}
              onCheckedChange={(v) => setRecorrente(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Repeat className="size-3.5" /> Horário fixo semanal
              </span>
              <span className="text-xs text-muted-foreground">
                Reserva toda {DIAS_SEMANA[diaSemana]!.toLowerCase()} às {inicio} pelas próximas{" "}
                {SEMANAS_RECORRENCIA} semanas.
              </span>
            </span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Enviando…" : "Confirmar reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
