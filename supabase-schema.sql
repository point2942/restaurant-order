-- ============================================
-- 餐廳點餐系統 - Supabase 資料庫結構
-- 請在 Supabase 專案的 SQL Editor 中執行此檔案
-- ============================================

-- 餐點分類
create table if not exists categories (
  id bigint generated always as identity primary key,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 餐點品項
create table if not exists menu_items (
  id bigint generated always as identity primary key,
  category_id bigint references categories(id) on delete set null,
  name text not null,
  price numeric(10,2) not null default 0,
  description text,
  image_url text,
  is_available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 內用桌位
create table if not exists dining_tables (
  id bigint generated always as identity primary key,
  table_number text not null unique,
  qr_token text not null unique,
  seats int default 4,
  status text default 'available', -- available / occupied / needs_cleaning
  created_at timestamptz default now()
);

-- 訂單
create table if not exists orders (
  id bigint generated always as identity primary key,
  order_no text not null unique,
  order_type text not null, -- dine_in / takeout / delivery
  source text not null,     -- customer_qr / staff / online
  table_id bigint references dining_tables(id),
  customer_name text,
  customer_phone text,
  customer_address text,
  status text not null default 'pending', -- pending / confirmed / preparing / ready / completed / cancelled
  total_amount numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 訂單明細
create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  menu_item_id bigint references menu_items(id),
  item_name text not null,
  item_price numeric(10,2) not null,
  quantity int not null default 1,
  subtotal numeric(10,2) not null,
  notes text,
  status text default 'pending', -- pending / preparing / ready
  created_at timestamptz default now()
);

-- 索引
create index if not exists idx_menu_items_category on menu_items(category_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at);
create index if not exists idx_order_items_order on order_items(order_id);

-- 開啟 Realtime（供廚房出單畫面即時更新）
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;

-- ============================================
-- 範例資料（可依需求修改或刪除）
-- ============================================
insert into categories (name, sort_order) values
  ('前菜', 1),
  ('主餐', 2),
  ('飲料', 3),
  ('甜點', 4)
on conflict do nothing;

insert into dining_tables (table_number, qr_token, seats) values
  ('A1', 'tbl-a1-' || substr(md5(random()::text), 1, 8), 4),
  ('A2', 'tbl-a2-' || substr(md5(random()::text), 1, 8), 4),
  ('A3', 'tbl-a3-' || substr(md5(random()::text), 1, 8), 6)
on conflict do nothing;
