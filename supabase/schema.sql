-- Kettlefold storefront schema. Run once in the Supabase SQL editor (safe to re-run).
-- Tables are prefixed "shop_" so they sit alongside other projects in the same Supabase project.
--
-- Access model:
--   * Visitors (publishable key) can only READ active products.
--   * Orders, stock changes and product edits happen on the server with the
--     secret key, after Stripe confirms payment or an admin is verified.

create extension if not exists vector;

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (char_length(name) between 2 and 60),
  origin text not null,            -- country or "Blend"
  region text not null default '',
  process text not null check (process in ('washed', 'natural', 'honey', 'decaf', 'blend')),
  roast text not null check (roast in ('light', 'medium', 'dark')),
  notes text[] not null default '{}',
  description text not null default '' check (char_length(description) <= 1200),
  price_cents integer not null check (price_cents between 100 and 100000),  -- 250 g bag
  stock integer not null default 0 check (stock >= 0),
  palette text not null default 'forest' check (palette in ('forest', 'clay', 'sky', 'plum', 'sand', 'night', 'rose', 'sage')),
  pattern text not null default 'hills' check (pattern in ('hills', 'sun', 'waves', 'leaf', 'grid', 'dots')),
  featured boolean not null default false,
  active boolean not null default true,
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  email text,
  customer_name text,
  amount_total integer not null,
  currency text not null default 'usd',
  shipping jsonb,
  status text not null default 'paid' check (status in ('paid', 'fulfilled', 'refunded')),
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.shop_orders (id) on delete cascade,
  product_id uuid references public.shop_products (id) on delete set null,
  product_name text not null,
  size text not null,
  grind text not null,
  quantity integer not null check (quantity > 0),
  unit_amount integer not null
);
create index if not exists shop_items_order_idx on public.shop_order_items (order_id);

alter table public.shop_products enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;

drop policy if exists "shop: anyone reads active products" on public.shop_products;
create policy "shop: anyone reads active products" on public.shop_products for select to anon, authenticated
  using (active);
-- No public policies on orders: server only.

-- Keep embeddings private (they're large and only used server-side). A column-level
-- REVOKE doesn't override a table-level grant, so grant an explicit column list instead.
revoke select on public.shop_products from anon, authenticated;
grant select (id, slug, name, origin, region, process, roast, notes, description, price_cents, stock,
              palette, pattern, featured, active, created_at, updated_at)
  on public.shop_products to anon, authenticated;

-- ───────── Record a paid order exactly once, and take the stock ─────────
-- Called by the server after Stripe confirms payment (success page or webhook).
-- Idempotent on the Stripe session id: retries and duplicate webhooks are no-ops.
create or replace function public.shop_record_order(
  p_session_id text,
  p_email text,
  p_name text,
  p_amount integer,
  p_currency text,
  p_shipping jsonb,
  p_items jsonb  -- [{product_id, product_name, size, grind, quantity, unit_amount}]
) returns table (order_id uuid, created boolean)
language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
  item jsonb;
  grams integer;
begin
  insert into public.shop_orders (stripe_session_id, email, customer_name, amount_total, currency, shipping)
  values (p_session_id, p_email, p_name, p_amount, p_currency, p_shipping)
  on conflict (stripe_session_id) do nothing
  returning id into new_id;

  if new_id is null then
    return query select o.id, false from public.shop_orders o where o.stripe_session_id = p_session_id;
    return;
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    insert into public.shop_order_items (order_id, product_id, product_name, size, grind, quantity, unit_amount)
    values (
      new_id,
      nullif(item ->> 'product_id', '')::uuid,
      item ->> 'product_name',
      item ->> 'size',
      item ->> 'grind',
      (item ->> 'quantity')::int,
      (item ->> 'unit_amount')::int
    );
    -- Stock is counted in 250 g bags; a 1 kg bag uses four.
    grams := case when item ->> 'size' = '1kg' then 4 else 1 end;
    update public.shop_products
      set stock = greatest(0, stock - grams * (item ->> 'quantity')::int), updated_at = now()
      where id = nullif(item ->> 'product_id', '')::uuid;
  end loop;

  return query select new_id, true;
end $$;

revoke execute on function public.shop_record_order(text, text, text, integer, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.shop_record_order(text, text, text, integer, text, jsonb, jsonb) to service_role;

-- ───────── Semantic search ("something cozy for winter") ─────────
create or replace function public.shop_match_products(query_embedding vector(768), match_count int default 6)
returns table (id uuid, slug text, similarity float)
language sql stable security definer set search_path = public as $$
  select p.id, p.slug, 1 - (p.embedding <=> query_embedding) as similarity
  from public.shop_products p
  where p.active and p.embedding is not null
  order by p.embedding <=> query_embedding
  limit least(match_count, 12)
$$;
revoke execute on function public.shop_match_products(vector, int) from public, anon, authenticated;
grant execute on function public.shop_match_products(vector, int) to service_role;

-- ───────── Seed: nine coffees (fictional roaster, real origins) ─────────
insert into public.shop_products (slug, name, origin, region, process, roast, notes, description, price_cents, stock, palette, pattern, featured)
values
  ('morning-fold', 'Morning Fold', 'Blend', 'Brazil & Colombia', 'blend', 'medium', '{milk chocolate,hazelnut,caramel}',
   'Our everyday cup. Round and sweet, with a soft chocolate finish that works as well in a moka pot as it does with milk.', 1600, 48, 'clay', 'sun', true),
  ('yirga-sun', 'Yirga Sun', 'Ethiopia', 'Yirgacheffe', 'washed', 'light', '{jasmine,bergamot,white peach}',
   'Floral and tea-like, with a bright citrus lift. Best as a pour-over, when you want a cup to sit and think with.', 2100, 32, 'sky', 'sun', true),
  ('huila-hills', 'Huila Hills', 'Colombia', 'Huila', 'washed', 'medium', '{red apple,panela,cocoa}',
   'Crisp and balanced, like a good red apple dipped in brown sugar. A crowd-pleaser for drip machines and French press.', 1900, 40, 'forest', 'hills', false),
  ('kintamani-night', 'Kintamani Night', 'Indonesia', 'Bali', 'natural', 'dark', '{dark chocolate,clove,dried fig}',
   'Deep, heavy and gently spiced. The cup for cold evenings, long books and second slices of cake.', 2000, 26, 'night', 'leaf', true),
  ('nyeri-bright', 'Nyeri Bright', 'Kenya', 'Nyeri', 'washed', 'light', '{blackcurrant,grapefruit,cane sugar}',
   'Juicy and vivid, with the blackcurrant snap Kenyan coffee is loved for. A wake-up call in the best way.', 2300, 3, 'plum', 'dots', false),
  ('tarrazu-honey', 'Tarrazú Honey', 'Costa Rica', 'Tarrazú', 'honey', 'medium', '{honey,apricot,toasted almond}',
   'Silky and sweet thanks to the honey process, with stone fruit and a nutty finish. Lovely iced.', 2000, 30, 'sand', 'waves', false),
  ('ember-espresso', 'Ember Espresso', 'Blend', 'Brazil, Guatemala & Ethiopia', 'blend', 'dark', '{molasses,black cherry,cocoa nib}',
   'Built for espresso: syrupy body, low acidity and a long cocoa finish that cuts through milk.', 1700, 44, 'rose', 'grid', false),
  ('quiet-hours-decaf', 'Quiet Hours Decaf', 'Mexico', 'Chiapas', 'decaf', 'medium', '{milk chocolate,toffee,orange zest}',
   'Swiss Water decaf that still tastes like coffee. Chocolatey and comforting for afternoons and late nights.', 1800, 36, 'sage', 'waves', false),
  ('kivu-shore', 'Kivu Shore', 'Rwanda', 'Lake Kivu', 'washed', 'light', '{red berries,black tea,lime}',
   'Clean and tea-like, with red berry sweetness and a bright finish. Grown on the hills above Lake Kivu.', 2100, 0, 'sky', 'waves', false)
on conflict (slug) do nothing;
