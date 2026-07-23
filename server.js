require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 提供給前端使用的公開設定（僅 anon key，不含 service key）
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  });
});

function genOrderNo(orderType) {
  const prefixMap = { dine_in: 'D', takeout: 'T', delivery: 'O' };
  const prefix = prefixMap[orderType] || 'X';
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${y}${m}${d}-${rand}`;
}

// ---------- 菜單 ----------
app.get('/api/menu', async (req, res) => {
  try {
    const { data: categories, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (catErr) throw catErr;

    const { data: items, error: itemErr } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (itemErr) throw itemErr;

    const menu = categories.map(cat => ({
      ...cat,
      items: items.filter(i => i.category_id === cat.id)
    }));
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu/categories', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').insert(req.body).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/menu/categories/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').update(req.body).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/menu/categories/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/menu/items', async (req, res) => {
  try {
    const { data, error } = await supabase.from('menu_items').insert(req.body).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/menu/items/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('menu_items').update(req.body).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/menu/items/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('menu_items').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- 桌位 ----------
app.get('/api/tables', async (req, res) => {
  try {
    const { data, error } = await supabase.from('dining_tables').select('*').order('table_number');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tables/by-token/:token', async (req, res) => {
  try {
    const { data, error } = await supabase.from('dining_tables').select('*').eq('qr_token', req.params.token).single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(404).json({ error: '找不到此桌位' }); }
});

app.post('/api/tables', async (req, res) => {
  try {
    const token = `tbl-${req.body.table_number}-${Math.random().toString(36).slice(2, 10)}`;
    const { data, error } = await supabase.from('dining_tables')
      .insert({ ...req.body, qr_token: token }).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tables/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('dining_tables').update(req.body).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tables/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('dining_tables').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- 訂單 ----------
// 建立訂單: { order_type, source, table_id, customer_name, customer_phone, customer_address, notes, items: [{menu_item_id, item_name, item_price, quantity, notes}] }
app.post('/api/orders', async (req, res) => {
  try {
    const { order_type, source, table_id, customer_name, customer_phone, customer_address, notes, items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: '訂單必須包含至少一項餐點' });
    }
    const total_amount = items.reduce((sum, i) => sum + i.item_price * i.quantity, 0);
    const order_no = genOrderNo(order_type);

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      order_no, order_type, source, table_id: table_id || null,
      customer_name, customer_phone, customer_address, notes, total_amount,
      status: 'pending'
    }).select().single();
    if (orderErr) throw orderErr;

    const orderItems = items.map(i => ({
      order_id: order.id,
      menu_item_id: i.menu_item_id,
      item_name: i.item_name,
      item_price: i.item_price,
      quantity: i.quantity,
      subtotal: i.item_price * i.quantity,
      notes: i.notes || null,
      status: 'pending'
    }));
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    if (table_id) {
      await supabase.from('dining_tables').update({ status: 'occupied' }).eq('id', table_id);
    }

    res.json({ ...order, items: orderItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查詢訂單列表（可用 ?status=pending,preparing 篩選、?order_type=dine_in 篩選）
app.get('/api/orders', async (req, res) => {
  try {
    let query = supabase.from('orders').select('*, order_items(*), dining_tables(table_number)').order('created_at', { ascending: true });
    if (req.query.status) {
      query = query.in('status', req.query.status.split(','));
    }
    if (req.query.order_type) {
      query = query.in('order_type', req.query.order_type.split(','));
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').select('*, order_items(*), dining_tables(table_number)').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(404).json({ error: '找不到此訂單' }); }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase.from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select();
    if (error) throw error;

    if (status === 'completed' || status === 'cancelled') {
      const order = data[0];
      if (order.table_id) {
        // 若同桌沒有其他未完成訂單，桌位轉為空閒
        const { data: openOrders } = await supabase.from('orders')
          .select('id').eq('table_id', order.table_id).not('status', 'in', '(completed,cancelled)');
        if (!openOrders || openOrders.length === 0) {
          await supabase.from('dining_tables').update({ status: 'needs_cleaning' }).eq('id', order.table_id);
        }
      }
    }
    res.json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/order-items/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase.from('order_items').update({ status }).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`餐廳點餐系統伺服器已啟動，port ${PORT}`);
});
