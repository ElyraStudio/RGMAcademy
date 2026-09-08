
create type public.app_role as enum ('admin');
create type public.turno as enum ('manha','tarde','noite');
create type public.reserva_status as enum ('pendente','confirmada','cancelada');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.claim_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.user_roles where role = 'admin') then
    return public.has_role(auth.uid(), 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin')
  on conflict do nothing;
  return true;
end; $$;
grant execute on function public.claim_admin() to authenticated;

create table public.quadras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_esporte text not null default 'futsal',
  foto_url text,
  ativa boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.quadras to anon;
grant select, insert, update, delete on public.quadras to authenticated;
grant all on public.quadras to service_role;
alter table public.quadras enable row level security;
create policy "quadras ativas publicas" on public.quadras for select to anon using (ativa);
create policy "quadras leitura autenticada" on public.quadras for select to authenticated using (true);
create policy "quadras admin" on public.quadras for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.precos (
  id uuid primary key default gen_random_uuid(),
  quadra_id uuid not null references public.quadras(id) on delete cascade,
  turno public.turno not null,
  valor numeric(10,2) not null default 0,
  unique (quadra_id, turno)
);
grant select on public.precos to anon;
grant select, insert, update, delete on public.precos to authenticated;
grant all on public.precos to service_role;
alter table public.precos enable row level security;
create policy "precos publicos" on public.precos for select to anon using (true);
create policy "precos leitura autenticada" on public.precos for select to authenticated using (true);
create policy "precos admin" on public.precos for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  quadra_id uuid not null references public.quadras(id) on delete cascade,
  data date not null,
  horario_inicio time not null,
  horario_fim time not null,
  nome_cliente text not null,
  telefone text not null,
  status public.reserva_status not null default 'pendente',
  recorrente boolean not null default false,
  dia_semana_recorrencia int,
  serie_id uuid,
  serie_ativa boolean not null default true,
  observacao text,
  created_at timestamptz not null default now()
);
create index reservas_quadra_data_idx on public.reservas (quadra_id, data);
grant insert on public.reservas to anon;
grant select, insert, update, delete on public.reservas to authenticated;
grant all on public.reservas to service_role;
alter table public.reservas enable row level security;
create policy "reservas pedido publico" on public.reservas for insert to anon
  with check (status = 'pendente');
create policy "reservas admin" on public.reservas for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.bloqueios (
  id uuid primary key default gen_random_uuid(),
  quadra_id uuid not null references public.quadras(id) on delete cascade,
  data date not null,
  horario_inicio time not null,
  horario_fim time not null,
  motivo text,
  created_at timestamptz not null default now()
);
create index bloqueios_quadra_data_idx on public.bloqueios (quadra_id, data);
grant select, insert, update, delete on public.bloqueios to authenticated;
grant all on public.bloqueios to service_role;
alter table public.bloqueios enable row level security;
create policy "bloqueios admin" on public.bloqueios for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.disponibilidade(_quadra_id uuid, _de date, _ate date)
returns table (data date, horario_inicio time, horario_fim time, tipo text)
language sql stable security definer set search_path = public as $$
  select r.data, r.horario_inicio, r.horario_fim, 'ocupado'::text
  from public.reservas r
  where r.quadra_id = _quadra_id and r.data between _de and _ate and r.status <> 'cancelada'
  union all
  select b.data, b.horario_inicio, b.horario_fim, 'bloqueado'::text
  from public.bloqueios b
  where b.quadra_id = _quadra_id and b.data between _de and _ate
$$;
grant execute on function public.disponibilidade(uuid, date, date) to anon, authenticated;
