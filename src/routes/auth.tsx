import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso do administrador — RGM Academy" },
      {
        name: "description",
        content: "Área restrita para gerenciar reservas, quadras e valores da RGM Academy.",
      },
      { property: "og:title", content: "Acesso do administrador — RGM Academy" },
      {
        property: "og:description",
        content: "Entre para gerenciar a agenda das quadras da RGM Academy.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    if (modo === "criar") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setCarregando(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        toast.success("Conta criada! Confirme pelo link enviado no seu e-mail.");
        return;
      }
      await supabase.rpc("claim_admin");
      navigate({ to: "/admin" });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setCarregando(false);
      toast.error("E-mail ou senha inválidos.");
      return;
    }
    await supabase.rpc("claim_admin");
    setCarregando(false);
    navigate({ to: "/admin" });
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--gradient-sky)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
            RGM
          </div>
          <h1 className="text-lg font-semibold">Painel RGM Academy</h1>
          <p className="text-sm text-muted-foreground">
            {modo === "entrar" ? "Entre para gerenciar a agenda" : "Crie o acesso do administrador"}
          </p>
        </div>
        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar acesso"}
          </Button>
        </form>
        <button
          className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
        >
          {modo === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
        </button>
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}
