-- VX Exchange Supabase schema
-- 运行位置：Supabase Dashboard → SQL Editor → New query → 粘贴全部执行
-- 说明：这是虚拟交易平台，不处理真实资金、真实证券或真实股权。

create extension if not exists pgcrypto;

-- ========== TABLES ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text not null,
  role text not null default 'user' check (role in ('user','admin')),
  xp integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cash numeric(18,2) not null default 100000 check (cash >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references public.profiles(id) on delete set null,
  name text not null,
  ticker text not null unique,
  sector text not null,
  description text not null,
  total_shares numeric(18,0) not null check (total_shares > 0),
  ipo_shares numeric(18,0) not null check (ipo_shares > 0),
  ipo_price numeric(18,2) not null check (ipo_price > 0),
  price numeric(18,2) not null check (price > 0),
  prev_price numeric(18,2) not null check (prev_price > 0),
  status text not null default 'pending' check (status in ('pending','ipo','listed','rejected','suspended','delisted')),
  logo_emoji text default '🏢',
  color text default '#59a6ff',
  volume numeric(18,0) not null default 0,
  created_at timestamptz not null default now(),
  listed_at timestamptz
);

create table if not exists public.ipos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  ipo_price numeric(18,2) not null check (ipo_price > 0),
  ipo_shares numeric(18,0) not null check (ipo_shares > 0),
  subscribed_shares numeric(18,0) not null default 0 check (subscribed_shares >= 0),
  start_at timestamptz not null default now(),
  end_at timestamptz not null default (now() + interval '3 days'),
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.ipo_subscriptions (
  id uuid primary key default gen_random_uuid(),
  ipo_id uuid not null references public.ipos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_shares numeric(18,0) not null check (requested_shares > 0),
  allocated_shares numeric(18,0) not null check (allocated_shares >= 0),
  amount_paid numeric(18,2) not null check (amount_paid >= 0),
  status text not null default 'allocated' check (status in ('requested','allocated','rejected','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.holdings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  quantity numeric(18,0) not null default 0 check (quantity >= 0),
  avg_cost numeric(18,2) not null default 0 check (avg_cost >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  side text not null check (side in ('buy','sell','ipo')),
  quantity numeric(18,0) not null check (quantity > 0),
  price numeric(18,2) not null check (price > 0),
  fee numeric(18,2) not null default 0,
  total_value numeric(18,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  amount numeric(18,2) not null,
  balance_after numeric(18,2) not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ========== HELPERS ==========
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wallets_touch_updated_at on public.wallets;
create trigger wallets_touch_updated_at before update on public.wallets
for each row execute function public.touch_updated_at();

drop trigger if exists holdings_touch_updated_at on public.holdings;
create trigger holdings_touch_updated_at before update on public.holdings
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'New User'),
    'user'
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id, cash)
  values (new.id, 100000)
  on conflict (user_id) do nothing;

  insert into public.wallet_transactions (user_id, type, amount, balance_after, reference_type)
  values (new.id, 'initial_bonus', 100000, 100000, 'system')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ========== SECURITY ==========
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.companies enable row level security;
alter table public.ipos enable row level security;
alter table public.ipo_subscriptions enable row level security;
alter table public.holdings enable row level security;
alter table public.trades enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- wallets
create policy "wallets_select_own_or_admin" on public.wallets for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- companies: public market data is visible to anon and authenticated users
create policy "companies_public_select" on public.companies for select to anon, authenticated using (true);
create policy "companies_insert_own" on public.companies for insert to authenticated with check (founder_id = auth.uid() and status = 'pending');
create policy "companies_update_own_pending" on public.companies for update to authenticated using (founder_id = auth.uid() and status = 'pending') with check (founder_id = auth.uid() and status = 'pending');
create policy "companies_admin_update" on public.companies for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ipos
create policy "ipos_public_select" on public.ipos for select to anon, authenticated using (true);
create policy "ipos_admin_all" on public.ipos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- subscriptions / holdings / trades / wallet transactions
create policy "ipo_subscriptions_select_own_or_admin" on public.ipo_subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "holdings_select_own_or_admin" on public.holdings for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "trades_select_own_or_admin" on public.trades for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "wallet_tx_select_own_or_admin" on public.wallet_transactions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "audit_admin_select" on public.audit_logs for select to authenticated using (public.is_admin());

-- ========== RPC FUNCTIONS ==========
create or replace function public.approve_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company public.companies%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select * into v_company from public.companies where id = p_company_id for update;
  if not found then raise exception 'company not found'; end if;
  if v_company.status not in ('pending','rejected') then raise exception 'company cannot be approved from current status'; end if;

  update public.companies set status = 'ipo' where id = p_company_id;

  insert into public.ipos (company_id, ipo_price, ipo_shares, subscribed_shares, start_at, end_at, status)
  values (p_company_id, v_company.ipo_price, v_company.ipo_shares, 0, now(), now() + interval '3 days', 'open')
  on conflict (company_id) do update set status = 'open', start_at = now(), end_at = now() + interval '3 days';

  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'approve_company', 'company', p_company_id);
end;
$$;

create or replace function public.reject_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  update public.companies set status = 'rejected' where id = p_company_id and status in ('pending','ipo');
  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'reject_company', 'company', p_company_id);
end;
$$;

create or replace function public.subscribe_ipo(p_ipo_id uuid, p_quantity numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ipo public.ipos%rowtype;
  v_company public.companies%rowtype;
  v_wallet public.wallets%rowtype;
  v_existing public.holdings%rowtype;
  v_total numeric(18,2);
  v_remaining numeric(18,0);
begin
  if v_uid is null then raise exception 'login required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'invalid quantity'; end if;

  select * into v_ipo from public.ipos where id = p_ipo_id and status = 'open' for update;
  if not found then raise exception 'ipo not found or closed'; end if;

  select * into v_company from public.companies where id = v_ipo.company_id for update;
  v_remaining := v_ipo.ipo_shares - v_ipo.subscribed_shares;
  if p_quantity > v_remaining then raise exception 'not enough ipo shares remaining'; end if;

  select * into v_wallet from public.wallets where user_id = v_uid for update;
  if not found then raise exception 'wallet not found'; end if;

  v_total := v_ipo.ipo_price * p_quantity;
  if v_wallet.cash < v_total then raise exception 'insufficient cash'; end if;

  update public.wallets set cash = cash - v_total where user_id = v_uid;
  insert into public.wallet_transactions (user_id, type, amount, balance_after, reference_type, reference_id)
  values (v_uid, 'ipo_subscription', -v_total, v_wallet.cash - v_total, 'ipo', p_ipo_id);

  select * into v_existing from public.holdings where user_id = v_uid and company_id = v_company.id for update;
  if found then
    update public.holdings
    set avg_cost = case when quantity + p_quantity = 0 then 0 else ((avg_cost * quantity) + v_total) / (quantity + p_quantity) end,
        quantity = quantity + p_quantity
    where user_id = v_uid and company_id = v_company.id;
  else
    insert into public.holdings (user_id, company_id, quantity, avg_cost)
    values (v_uid, v_company.id, p_quantity, v_ipo.ipo_price);
  end if;

  update public.ipos set subscribed_shares = subscribed_shares + p_quantity where id = p_ipo_id;
  insert into public.ipo_subscriptions (ipo_id, user_id, requested_shares, allocated_shares, amount_paid)
  values (p_ipo_id, v_uid, p_quantity, p_quantity, v_total);
  insert into public.trades (company_id, user_id, side, quantity, price, fee, total_value)
  values (v_company.id, v_uid, 'ipo', p_quantity, v_ipo.ipo_price, 0, v_total);

  if v_ipo.subscribed_shares + p_quantity >= v_ipo.ipo_shares then
    update public.ipos set status = 'closed' where id = p_ipo_id;
    update public.companies set status = 'listed', listed_at = now() where id = v_company.id;
  end if;
end;
$$;

create or replace function public.trade_stock(p_company_id uuid, p_side text, p_quantity numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_company public.companies%rowtype;
  v_wallet public.wallets%rowtype;
  v_holding public.holdings%rowtype;
  v_price numeric(18,2);
  v_fee numeric(18,2);
  v_gross numeric(18,2);
  v_net numeric(18,2);
  v_impact numeric;
  v_float numeric;
begin
  if v_uid is null then raise exception 'login required'; end if;
  if p_side not in ('buy','sell') then raise exception 'invalid side'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'invalid quantity'; end if;

  select * into v_company from public.companies where id = p_company_id and status = 'listed' for update;
  if not found then raise exception 'company is not listed'; end if;

  select * into v_wallet from public.wallets where user_id = v_uid for update;
  if not found then raise exception 'wallet not found'; end if;

  v_price := v_company.price;
  v_gross := v_price * p_quantity;
  v_fee := round(v_gross * 0.001, 2);

  if p_side = 'buy' then
    v_net := v_gross + v_fee;
    if v_wallet.cash < v_net then raise exception 'insufficient cash'; end if;
    update public.wallets set cash = cash - v_net where user_id = v_uid;
    insert into public.wallet_transactions (user_id, type, amount, balance_after, reference_type, reference_id)
    values (v_uid, 'buy_stock', -v_net, v_wallet.cash - v_net, 'company', p_company_id);

    select * into v_holding from public.holdings where user_id = v_uid and company_id = p_company_id for update;
    if found then
      update public.holdings
      set avg_cost = ((avg_cost * quantity) + v_gross) / (quantity + p_quantity),
          quantity = quantity + p_quantity
      where user_id = v_uid and company_id = p_company_id;
    else
      insert into public.holdings (user_id, company_id, quantity, avg_cost)
      values (v_uid, p_company_id, p_quantity, v_price);
    end if;
  else
    select * into v_holding from public.holdings where user_id = v_uid and company_id = p_company_id for update;
    if not found or v_holding.quantity < p_quantity then raise exception 'insufficient holdings'; end if;
    v_net := v_gross - v_fee;
    update public.wallets set cash = cash + v_net where user_id = v_uid;
    insert into public.wallet_transactions (user_id, type, amount, balance_after, reference_type, reference_id)
    values (v_uid, 'sell_stock', v_net, v_wallet.cash + v_net, 'company', p_company_id);
    update public.holdings set quantity = quantity - p_quantity where user_id = v_uid and company_id = p_company_id;
    delete from public.holdings where user_id = v_uid and company_id = p_company_id and quantity <= 0;
  end if;

  v_float := greatest(v_company.ipo_shares, 1);
  v_impact := least(0.03, (p_quantity / v_float) * 0.5);
  update public.companies
  set prev_price = price,
      price = greatest(0.01, round(case when p_side = 'buy' then price * (1 + v_impact) else price * (1 - v_impact) end, 2)),
      volume = volume + p_quantity
  where id = p_company_id;

  insert into public.trades (company_id, user_id, side, quantity, price, fee, total_value)
  values (p_company_id, v_uid, p_side, p_quantity, v_price, v_fee, v_net);
end;
$$;

grant execute on function public.approve_company(uuid) to authenticated;
grant execute on function public.reject_company(uuid) to authenticated;
grant execute on function public.subscribe_ipo(uuid, numeric) to authenticated;
grant execute on function public.trade_stock(uuid, text, numeric) to authenticated;

-- ========== LEADERBOARD VIEW ==========
create or replace view public.leaderboard as
select
  p.id as user_id,
  p.username,
  p.role,
  coalesce(w.cash, 0) + coalesce(sum(h.quantity * c.price), 0) as total_assets,
  count(h.company_id) filter (where h.quantity > 0) as holding_count
from public.profiles p
left join public.wallets w on w.user_id = p.id
left join public.holdings h on h.user_id = p.id
left join public.companies c on c.id = h.company_id
group by p.id, p.username, p.role, w.cash;

grant select on public.leaderboard to anon, authenticated;

-- ========== SEED MARKET DATA ==========
insert into public.companies (id, founder_id, name, ticker, sector, description, total_shares, ipo_shares, ipo_price, price, prev_price, status, logo_emoji, color, volume, listed_at)
values
('00000000-0000-0000-0000-000000000101', null, '星际科技', 'XJKJ', 'tech', '专注于人工智能、量子计算和虚拟交易基础设施的前沿科技公司。', 2000000, 400000, 30, 45.80, 43.20, 'listed', '🚀', '#59a6ff', 12400, now()),
('00000000-0000-0000-0000-000000000102', null, '绿能集团', 'LNJT', 'energy', '清洁能源、储能和可再生能源解决方案提供商。', 5000000, 1000000, 20, 22.30, 23.50, 'listed', '🌱', '#00d084', 8900, now()),
('00000000-0000-0000-0000-000000000103', null, '数字金融', 'SZJR', 'finance', '面向虚拟经济的数字金融、风控和资产管理平台。', 1000000, 200000, 60, 88.50, 85.30, 'listed', '💰', '#ffba3a', 5600, now()),
('00000000-0000-0000-0000-000000000104', null, '云端医疗', 'YDYL', 'health', '利用 AI 辅助诊疗和数据平台提供远程医疗服务。', 800000, 160000, 100, 156.20, 161.00, 'listed', '🏥', '#a78bfa', 3200, now()),
('00000000-0000-0000-0000-000000000105', null, '元宇宙娱乐', 'YYLY', 'tech', '下一代虚拟现实内容、游戏和社交娱乐公司。', 3000000, 600000, 25, 33.60, 31.80, 'listed', '🎮', '#59a6ff', 19800, now()),
('00000000-0000-0000-0000-000000000106', null, '碳中和科技', 'TZHK', 'energy', '碳捕获、碳核算和碳交易数字化平台。', 2000000, 400000, 30, 41.20, 39.80, 'listed', '🌍', '#00d084', 9400, now()),
('00000000-0000-0000-0000-000000000201', null, '脑机接口科技', 'NJJK', 'health', '非侵入式脑机接口设备研发与商业化应用公司。', 1000000, 200000, 50, 50, 50, 'ipo', '🧠', '#a78bfa', 0, null),
('00000000-0000-0000-0000-000000000202', null, '超导储能', 'CDCN', 'energy', '面向电网和数据中心的新型超导储能系统。', 2000000, 400000, 35, 35, 35, 'ipo', '⚡', '#00d084', 0, null)
on conflict (ticker) do nothing;

insert into public.ipos (id, company_id, ipo_price, ipo_shares, subscribed_shares, start_at, end_at, status)
values
('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 50, 200000, 78000, now(), now() + interval '3 days', 'open'),
('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202', 35, 400000, 225000, now(), now() + interval '2 days', 'open')
on conflict (company_id) do nothing;

-- ========== MAKE YOURSELF ADMIN ==========
-- 注册第一个账户后，把下面邮箱改成你的邮箱再单独执行一遍：
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';
