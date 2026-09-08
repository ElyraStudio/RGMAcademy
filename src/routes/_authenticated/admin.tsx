import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Visão geral", exact: true },
  { to: "/admin/reservas", label: "Reservas" },
  { to: "/admin/bloqueios", label: "Bloqueios" },
  { to: "/admin/quadras", label: "Quadras" },
  { to: "/admin/precos", label: "Valores" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: ehAdmin, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      await supabase.rpc("claim_admin");
      const { data } = await supabase.auth.getUser();
      if (!data.user) return false;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      return (roles ?? []).some((r) => r.role === "admin");
    },
  });

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              RGM
            </div>
            <span className="text-sm font-semibold">Painel administrativo</span>
          </div>
          <Button variant="ghost" size="sm" onClick={sair}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: "exact" in item }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : ehAdmin === false ? (
          <p className="text-sm text-muted-foreground">
            Sua conta ainda não tem permissão de administrador. Peça para o responsável liberar o
            acesso.
          </p>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
