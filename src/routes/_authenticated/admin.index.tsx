import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, Percent } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  HORA_ABERTURA,
  HORA_FECHAMENTO,
  Quadra,
  Reserva,
  addDays,
  formatarDataCurta,
  hhmm,
  toISODate,
} from "@/lib/agenda";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const hoje = toISODate(new Date());
  const fimSemana = toISODate(addDays(new Date(), 7));

  const { data: quadras = [] } = useQuery({
    queryKey: ["admin-quadras"],
    queryFn: async (): Promise<Quadra[]> => {
      const { data, error } = await supabase.from("quadras").select("*").order("ordem");
      if (error) throw error;
      return (data ?? []) as Quadra[];
    },
  });

  const { data: reservas = [] } = useQuery({
    queryKey: ["admin-reservas-semana", hoje],
    queryFn: async (): Promise<Reserva[]> => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .gte("data", hoje)
        .lte("data", fimSemana)
        .neq("status", "cancelada")
        .order("data")
        .order("horario_inicio");
      if (error) throw error;
      return (data ?? []) as Reserva[];
    },
  });

  const doDia = reservas.filter((r) => r.data === hoje);
  const slotsPorDia = HORA_FECHAMENTO - HORA_ABERTURA;
  const capacidadeSemana = slotsPorDia * 8;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Visão geral</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card titulo="Reservas hoje" valor={String(doDia.length)} icone={<CalendarCheck className="size-4" />} />
        <Card
          titulo="Próximos 7 dias"
          valor={String(reservas.length)}
          icone={<CalendarDays className="size-4" />}
        />
        <Card
          titulo="Ocupação média"
          valor={`${Math.round(
            (reservas.length / Math.max(1, capacidadeSemana * Math.max(1, quadras.length))) * 100,
          )}%`}
          icone={<Percent className="size-4" />}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Ocupação por quadra (7 dias)</h2>
        <div className="space-y-3">
          {quadras.map((q) => {
            const total = reservas.filter((r) => r.quadra_id === q.id).length;
            const pct = Math.min(100, Math.round((total / capacidadeSemana) * 100));
            return (
              <div key={q.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{q.nome}</span>
                  <span className="text-muted-foreground">
                    {total} reservas · {pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {quadras.length === 0 && (
            <p className="text-sm text-muted-foreground">Cadastre uma quadra para começar.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Agenda de hoje</h2>
        {doDia.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma reserva para hoje.</p>
        ) : (
          <ul className="divide-y divide-border">
            {doDia.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span className="font-medium">
                  {hhmm(r.horario_inicio)}–{hhmm(r.horario_fim)} ·{" "}
                  {quadras.find((q) => q.id === r.quadra_id)?.nome ?? "Quadra"}
                </span>
                <span className="text-muted-foreground">
                  {r.nome_cliente} · {r.telefone} · {r.status}
                  {r.recorrente ? " · fixo" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Próximos dias</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => toISODate(addDays(new Date(), i))).map((d) => (
            <div key={d} className="rounded-xl border border-border p-3 text-sm">
              <p className="font-medium">{formatarDataCurta(d)}</p>
              <p className="text-muted-foreground">
                {reservas.filter((r) => r.data === d).length} reservas
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
        {icone} {titulo}
      </div>
      <p className="mt-2 text-2xl font-semibold">{valor}</p>
    </div>
  );
}
