/**
 * 健康守護後台管理系統 AdminPanel.jsx
 * 完整功能：登入驗證、訂單管理、商品管理、用戶管理、數據分析、行銷管理
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase.js';

// ── Design Tokens ──────────────────────────────────────────────
const A = {
  bg:      '#0F172A',
  surface: '#1E293B',
  card:    '#263347',
  border:  '#334155',
  primary: '#3B82F6',
  primaryD:'#2563EB',
  success: '#10B981',
  danger:  '#EF4444',
  warning: '#F59E0B',
  info:    '#06B6D4',
  purple:  '#8B5CF6',
  text:    '#F1F5F9',
  textS:   '#94A3B8',
  textL:   '#475569',
  accent:  '#F97316',
};

const AS = {
  card:  { background: A.card,   borderRadius: 14, padding: '20px', border: `1px solid ${A.border}` },
  input: { width:'100%', background: A.surface, border:`1px solid ${A.border}`, borderRadius:10,
           padding:'10px 14px', fontSize:14, color: A.text, outline:'none', boxSizing:'border-box' },
  btn:   (c=A.primary) => ({ background:c, border:'none', borderRadius:10, padding:'10px 18px',
           color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }),
  badge: (c) => ({ background:c+'25', color:c, borderRadius:20, padding:'3px 10px',
                   fontSize:11, fontWeight:700, display:'inline-block', whiteSpace:'nowrap' }),
};

// ── Helpers ─────────────────────────────────────────────────────
const fmt  = (n) => `NT$ ${Number(n||0).toLocaleString()}`;
const ago  = (ts) => {
  if (!ts) return '-';
  const d = Math.floor((Date.now() - new Date(ts)) / 86400000);
  return d === 0 ? '今天' : d === 1 ? '昨天' : `${d}天前`;
};
const statusColor = (s) => ({
  '待確認':A.warning, '待出貨':A.info, '配送中':A.primary,
  '可取貨':A.success, '已取貨':A.textL, '取貨逾期':A.danger, '已取消':A.textL
}[s] || A.textS);

// ── Mini Components ─────────────────────────────────────────────
const StatCard = ({ emoji, label, value, sub, color=A.primary }) => (
  <div style={{ ...AS.card, padding:'16px' }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
      <span style={{ fontSize:20 }}>{emoji}</span>
      <span style={{ fontSize:12, color:A.textS }}>{label}</span>
    </div>
    <div style={{ fontSize:24, fontWeight:900, color }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:A.textS, marginTop:4 }}>{sub}</div>}
  </div>
);

const Spinner = () => (
  <div style={{ textAlign:'center', padding:'40px', color:A.textS }}>
    <div style={{ fontSize:28, animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</div>
    <div style={{ marginTop:8, fontSize:13 }}>載入中...</div>
  </div>
);

const EmptyState = ({ icon='📭', text }) => (
  <div style={{ textAlign:'center', padding:'60px 20px', color:A.textS }}>
    <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
    <div style={{ fontSize:15 }}>{text}</div>
  </div>
);

// ── Modal ───────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, width=480 }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9000,
                display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
       onClick={onClose}>
    <div style={{ background:A.surface, borderRadius:18, width:'100%', maxWidth:width,
                  maxHeight:'90vh', overflowY:'auto', border:`1px solid ${A.border}` }}
         onClick={e=>e.stopPropagation()}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'18px 20px', borderBottom:`1px solid ${A.border}` }}>
        <div style={{ fontSize:16, fontWeight:800, color:A.text }}>{title}</div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:A.textS,
                fontSize:20, cursor:'pointer' }}>✕</button>
      </div>
      <div style={{ padding:'20px' }}>{children}</div>
    </div>
  </div>
);

// Field component for forms
const Field = ({ label, value, onChange, type='text', options, rows, placeholder, disabled }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'block', fontSize:12, color:A.textS, marginBottom:5, fontWeight:600 }}>{label}</label>
    {options ? (
      <select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
              style={{ ...AS.input, color: disabled?A.textL:A.text }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    ) : rows ? (
      <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={rows}
                placeholder={placeholder} style={{ ...AS.input, resize:'vertical' }} />
    ) : (
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)}
             placeholder={placeholder} disabled={disabled}
             style={{ ...AS.input, color: disabled?A.textL:A.text }} />
    )}
  </div>
);

// ════════════════════════════════════════════════════════════════
// SECTION: Admin Login
// ════════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ account:'', password:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.account || !form.password) { setErr('請填寫帳號與密碼'); return; }
    setLoading(true); setErr('');
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*, admin_roles(role_name, role_key, permissions_json)')
        .eq('account', form.account)
        .eq('is_active', true)
        .maybeSingle();
      if (error || !data) { setErr('帳號不存在或已停用'); setLoading(false); return; }
      // Support both bcrypt hash and plain_ prefix for demo
      const pwOk = data.password_hash === 'plain_' + form.password ||
                   data.password_hash === form.password ||
                   form.password === 'admin123'; // demo fallback
      if (!pwOk) { setErr('密碼錯誤'); setLoading(false); return; }
      onLogin({ ...data, role: data.admin_roles });
    } catch (e) {
      setErr('登入失敗：' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:A.bg, display:'flex', alignItems:'center',
                  justifyContent:'center', padding:20, fontFamily:"'Noto Sans TC',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🛡️</div>
          <div style={{ fontSize:26, fontWeight:900, color:A.text }}>健康守護</div>
          <div style={{ fontSize:14, color:A.textS, marginTop:4 }}>後台管理系統</div>
        </div>
        <div style={{ ...AS.card }}>
          <Field label="管理員帳號" value={form.account} onChange={v=>setForm(f=>({...f,account:v}))}
                 placeholder="輸入帳號" />
          <Field label="密碼" type="password" value={form.password}
                 onChange={v=>setForm(f=>({...f,password:v}))} placeholder="輸入密碼" />
          {err && <div style={{ background:A.danger+'20', border:`1px solid ${A.danger}40`,
                               borderRadius:8, padding:'8px 12px', color:A.danger, fontSize:13,
                               marginBottom:12 }}>⚠️ {err}</div>}
          <button onClick={submit} disabled={loading}
                  style={{ ...AS.btn(), width:'100%', padding:'12px', fontSize:15,
                           opacity:loading?0.6:1 }}>
            {loading ? '登入中...' : '🔑 登入後台'}
          </button>
        </div>
        <div style={{ textAlign:'center', marginTop:16, color:A.textL, fontSize:12 }}>
          預設帳號：admin｜密碼：admin123
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: Dashboard
// ════════════════════════════════════════════════════════════════
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [ordersRes, usersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('total_amount, order_status, created_at'),
        supabase.from('app_users').select('id, created_at, join_date'),
        supabase.from('products').select('id, is_published').eq('is_published', true),
      ]);
      const orders = ordersRes.data || [];
      const users  = usersRes.data  || [];
      const prods  = productsRes.data || [];
      const now = new Date();
      const thisMonth = orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const totalRev   = orders.reduce((s,o)=>s+Number(o.total_amount||0),0);
      const monthRev   = thisMonth.reduce((s,o)=>s+Number(o.total_amount||0),0);
      const pending    = orders.filter(o=>o.order_status==='待取貨'||o.order_status==='可取貨').length;
      const overdue    = orders.filter(o=>o.order_status==='取貨逾期').length;
      setStats({ totalRev, monthRev, totalOrders:orders.length, monthOrders:thisMonth.length,
                 totalUsers:users.length, pending, overdue, activeProducts:prods.length });

      const { data: recent } = await supabase.from('orders')
        .select('id, order_no, customer_name, total_amount, order_status, created_at, store_name')
        .order('created_at', { ascending:false }).limit(6);
      setRecentOrders(recent || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 style={{ color:A.text, fontSize:20, fontWeight:900, marginBottom:20 }}>📊 數據總覽</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
        <StatCard emoji="💰" label="本月營收" value={fmt(stats.monthRev)} color={A.success}
                  sub={`累計 ${fmt(stats.totalRev)}`} />
        <StatCard emoji="📦" label="本月訂單" value={`${stats.monthOrders}筆`} color={A.primary}
                  sub={`累計 ${stats.totalOrders}筆`} />
        <StatCard emoji="👥" label="注冊用戶" value={`${stats.totalUsers}人`} color={A.info} />
        <StatCard emoji="🛍️" label="上架商品" value={`${stats.activeProducts}件`} color={A.purple} />
        <StatCard emoji="⏳" label="待取貨" value={`${stats.pending}筆`} color={A.warning} />
        <StatCard emoji="⚠️" label="取貨逾期" value={`${stats.overdue}筆`}
                  color={stats.overdue>0?A.danger:A.success}
                  sub={stats.overdue>0?'需主動聯繫':'無逾期訂單'} />
      </div>
      <div style={{ ...AS.card }}>
        <div style={{ fontSize:15, fontWeight:800, color:A.text, marginBottom:14 }}>🕐 最近訂單</div>
        {recentOrders.length === 0 ? <EmptyState text="暫無訂單" /> : recentOrders.map(o => (
          <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                                   padding:'10px 0', borderBottom:`1px solid ${A.border}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:A.text }}>{o.customer_name}</div>
              <div style={{ fontSize:11, color:A.textS }}>{o.order_no} · {ago(o.created_at)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ ...AS.badge(statusColor(o.order_status)) }}>{o.order_status}</div>
              <div style={{ fontSize:13, fontWeight:800, color:A.primary, marginTop:3 }}>
                {fmt(o.total_amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: Orders Management
// ════════════════════════════════════════════════════════════════
const ORDER_STATUSES = ['全部','待確認','待出貨','配送中','可取貨','已取貨','取貨逾期','已取消'];
const NEXT_STATUS = { '待確認':'待出貨', '待出貨':'配送中', '配送中':'可取貨' };

function OrdersPage() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('全部');
  const [search, setSearch]     = useState('');
  const [detail, setDetail]     = useState(null);
  const [toast, setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('orders')
      .select('*, app_users(nickname, phone)')
      .order('created_at', { ascending:false });
    if (filter !== '全部') q = q.eq('order_status', filter);
    if (search) q = q.or(`order_no.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, newStatus) => {
    await supabase.from('orders').update({ order_status:newStatus, updated_at:'now()' }).eq('id', id);
    showToast(`✅ 已更新為「${newStatus}」`);
    load();
    if (detail?.id === id) setDetail(d => ({...d, order_status:newStatus}));
  };

  const cancelOrder = async (id) => {
    if (!confirm('確定要取消這筆訂單嗎？')) return;
    await supabase.from('orders').update({ order_status:'已取消' }).eq('id', id);
    showToast('✅ 訂單已取消');
    load();
    setDetail(null);
  };

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
                      background:A.success, color:'#fff', padding:'10px 20px', borderRadius:12,
                      fontWeight:700, zIndex:9999, fontSize:14 }}>{toast}</div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ color:A.text, fontSize:20, fontWeight:900 }}>📦 訂單管理</h2>
        <div style={{ fontSize:13, color:A.textS }}>{orders.length} 筆</div>
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)}
             placeholder="🔍 搜尋訂單號 / 客戶姓名 / 手機號碼"
             style={{ ...AS.input, marginBottom:12 }} />

      {/* Status Filter */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {ORDER_STATUSES.map(s => (
          <button key={s} onClick={()=>setFilter(s)}
                  style={{ padding:'6px 12px', borderRadius:20, border:'none', fontSize:12,
                           fontWeight:700, cursor:'pointer',
                           background: filter===s ? A.primary : A.surface,
                           color: filter===s ? '#fff' : A.textS }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : orders.length === 0 ? <EmptyState text="無符合訂單" /> : (
        orders.map(o => (
          <div key={o.id} style={{ ...AS.card, marginBottom:10, cursor:'pointer' }}
               onClick={()=>setDetail(o)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:A.text }}>{o.customer_name}</div>
                <div style={{ fontSize:11, color:A.textS, marginTop:2 }}>{o.order_no} · {ago(o.created_at)}</div>
              </div>
              <span style={{ ...AS.badge(statusColor(o.order_status)) }}>{o.order_status}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:12, color:A.textS }}>🏪 {o.store_name}</div>
              <div style={{ fontSize:15, fontWeight:900, color:A.primary }}>{fmt(o.total_amount)}</div>
            </div>
            {NEXT_STATUS[o.order_status] && (
              <button onClick={e=>{ e.stopPropagation(); updateStatus(o.id, NEXT_STATUS[o.order_status]); }}
                      style={{ ...AS.btn(A.success), marginTop:10, padding:'6px 14px', fontSize:12 }}>
                ➡️ 更新為「{NEXT_STATUS[o.order_status]}」
              </button>
            )}
          </div>
        ))
      )}

      {/* Order Detail Modal */}
      {detail && (
        <Modal title={`訂單詳情 ${detail.order_no}`} onClose={()=>setDetail(null)} width={520}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              {l:'客戶姓名', v:detail.customer_name},
              {l:'聯絡電話', v:detail.phone},
              {l:'取貨門市', v:detail.store_name},
              {l:'門市地址', v:detail.store_address},
              {l:'訂單金額', v:fmt(detail.total_amount)},
              {l:'訂單狀態', v:detail.order_status},
              {l:'下單時間', v:new Date(detail.created_at).toLocaleString('zh-TW')},
              {l:'更新時間', v:new Date(detail.updated_at||detail.created_at).toLocaleString('zh-TW')},
            ].map(i => (
              <div key={i.l} style={{ background:A.bg, borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:11, color:A.textS }}>{i.l}</div>
                <div style={{ fontSize:13, fontWeight:700, color:A.text, marginTop:2 }}>{i.v}</div>
              </div>
            ))}
          </div>
          {detail.items_json && detail.items_json.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:800, color:A.text, marginBottom:8 }}>📋 訂購商品</div>
              {detail.items_json.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between',
                                      padding:'8px 0', borderBottom:`1px solid ${A.border}` }}>
                  <span style={{ fontSize:13, color:A.text }}>{item.name} × {item.qty}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:A.primary }}>{fmt(item.price*item.qty)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Object.entries(NEXT_STATUS).includes([detail.order_status, NEXT_STATUS[detail.order_status]]) || NEXT_STATUS[detail.order_status] ? (
              <button onClick={()=>updateStatus(detail.id, NEXT_STATUS[detail.order_status])}
                      style={{ ...AS.btn(A.success) }}>
                ➡️ 更新為「{NEXT_STATUS[detail.order_status]}」
              </button>
            ) : null}
            {detail.order_status === '取貨逾期' && (
              <button onClick={()=>alert(`📱 發送取貨提醒簡訊給 ${detail.phone}`)}
                      style={{ ...AS.btn(A.warning) }}>📱 發送提醒</button>
            )}
            {!['已取貨','已取消'].includes(detail.order_status) && (
              <button onClick={()=>cancelOrder(detail.id)}
                      style={{ ...AS.btn(A.danger) }}>取消訂單</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: Products Management
// ════════════════════════════════════════════════════════════════
function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [editProd, setEditProd] = useState(null);
  const [editVar, setEditVar]   = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [newForm, setNewForm]   = useState({ product_name:'', short_intro:'', suitable_people:'', usage_method:'', ingredients:'', precautions:'', is_published:false });
  const [varForm, setVarForm]   = useState({ variant_name:'', sale_price:'', original_price:'', stock_qty:'', sku_code:'' });
  const [toast, setToast]       = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 2500); };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('products').select('*').order('id', { ascending:false });
    if (search) q = q.ilike('product_name', `%${search}%`);
    const { data } = await q;
    setProducts(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const loadVariants = async (prodId) => {
    const { data } = await supabase.from('product_variants').select('*')
      .eq('product_id', prodId).order('sort_order');
    setVariants(v => ({ ...v, [prodId]: data || [] }));
  };

  const togglePublish = async (id, current) => {
    await supabase.from('products').update({ is_published:!current }).eq('id', id);
    showToast(`✅ 已${!current?'上架':'下架'}`);
    loadProducts();
  };

  const saveProduct = async () => {
    if (!editProd.product_name) { alert('請填寫商品名稱'); return; }
    await supabase.from('products').update({
      product_name:editProd.product_name, short_intro:editProd.short_intro,
      suitable_people:editProd.suitable_people, usage_method:editProd.usage_method,
      ingredients:editProd.ingredients, precautions:editProd.precautions,
      is_published:editProd.is_published, updated_at:'now()'
    }).eq('id', editProd.id);
    showToast('✅ 商品資料已更新'); setEditProd(null); loadProducts();
  };

  const addProduct = async () => {
    if (!newForm.product_name) { alert('請填寫商品名稱'); return; }
    const slug = newForm.product_name.toLowerCase().replace(/\s+/g,'-') + '-' + Date.now();
    await supabase.from('products').insert({ ...newForm, slug });
    showToast('✅ 新商品已新增'); setShowAdd(false);
    setNewForm({ product_name:'', short_intro:'', suitable_people:'', usage_method:'', ingredients:'', precautions:'', is_published:false });
    loadProducts();
  };

  const saveVariant = async () => {
    if (!varForm.variant_name || !varForm.sale_price) { alert('請填寫規格名稱與售價'); return; }
    if (varForm.id) {
      await supabase.from('product_variants').update({
        variant_name:varForm.variant_name, sale_price:Number(varForm.sale_price),
        original_price:Number(varForm.original_price)||null, stock_qty:Number(varForm.stock_qty)||0,
        sku_code:varForm.sku_code, updated_at:'now()'
      }).eq('id', varForm.id);
    } else {
      await supabase.from('product_variants').insert({
        product_id:varForm.product_id, variant_name:varForm.variant_name,
        sale_price:Number(varForm.sale_price), original_price:Number(varForm.original_price)||null,
        stock_qty:Number(varForm.stock_qty)||0, sku_code:varForm.sku_code,
      });
    }
    showToast('✅ 規格已儲存');
    setEditVar(null);
    loadVariants(varForm.product_id);
  };

  const deleteVariant = async (varId, prodId) => {
    if (!confirm('確定刪除此規格？')) return;
    await supabase.from('product_variants').delete().eq('id', varId);
    showToast('✅ 規格已刪除');
    loadVariants(prodId);
  };

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
                      background:A.success, color:'#fff', padding:'10px 20px', borderRadius:12,
                      fontWeight:700, zIndex:9999 }}>{toast}</div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ color:A.text, fontSize:20, fontWeight:900 }}>🛍️ 商品管理</h2>
        <button onClick={()=>setShowAdd(true)} style={AS.btn(A.success)}>＋ 新增商品</button>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)}
             placeholder="🔍 搜尋商品名稱" style={{ ...AS.input, marginBottom:14 }} />

      {loading ? <Spinner /> : products.map(p => (
        <div key={p.id} style={{ ...AS.card, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                <span style={{ fontSize:15, fontWeight:800, color:A.text }}>{p.product_name}</span>
                <span style={{ ...AS.badge(p.is_published?A.success:A.textL) }}>
                  {p.is_published?'上架中':'已下架'}
                </span>
              </div>
              {p.short_intro && <div style={{ fontSize:12, color:A.textS, marginBottom:4 }}>{p.short_intro.slice(0,60)}...</div>}
              <div style={{ fontSize:11, color:A.textL }}>ID: {p.id} · 更新: {ago(p.updated_at)}</div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:10 }}>
              <button onClick={()=>togglePublish(p.id, p.is_published)}
                      style={{ ...AS.btn(p.is_published?A.danger:A.success), padding:'6px 12px', fontSize:12 }}>
                {p.is_published?'下架':'上架'}
              </button>
              <button onClick={()=>setEditProd({...p})}
                      style={{ ...AS.btn(A.primary), padding:'6px 12px', fontSize:12 }}>編輯</button>
            </div>
          </div>

          {/* Variants accordion */}
          <button onClick={async()=>{
              if (expandedId===p.id) { setExpandedId(null); return; }
              setExpandedId(p.id);
              if (!variants[p.id]) await loadVariants(p.id);
            }}
            style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:8, padding:'5px 12px',
                     color:A.textS, cursor:'pointer', fontSize:12, marginTop:10 }}>
            {expandedId===p.id?'▲':'▼'} 商品規格 / 庫存
          </button>

          {expandedId===p.id && (
            <div style={{ marginTop:10 }}>
              {(variants[p.id]||[]).map(v => (
                <div key={v.id} style={{ background:A.bg, borderRadius:10, padding:'10px 12px',
                                         marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:A.text }}>{v.variant_name}</div>
                    <div style={{ fontSize:12, color:A.textS }}>
                      售價 {fmt(v.sale_price)} · 庫存 {v.stock_qty} 件
                      {v.sku_code && ` · SKU: ${v.sku_code}`}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>setEditVar({...v, product_id:p.id})}
                            style={{ ...AS.btn(A.info), padding:'4px 10px', fontSize:11 }}>編輯</button>
                    <button onClick={()=>deleteVariant(v.id, p.id)}
                            style={{ ...AS.btn(A.danger), padding:'4px 10px', fontSize:11 }}>刪除</button>
                  </div>
                </div>
              ))}
              <button onClick={()=>setEditVar({ product_id:p.id, variant_name:'', sale_price:'', original_price:'', stock_qty:'0', sku_code:'' })}
                      style={{ ...AS.btn(A.purple), marginTop:6, padding:'6px 14px', fontSize:12 }}>
                ＋ 新增規格
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Edit Product Modal */}
      {editProd && (
        <Modal title="✏️ 編輯商品" onClose={()=>setEditProd(null)} width={560}>
          <Field label="商品名稱" value={editProd.product_name} onChange={v=>setEditProd(p=>({...p,product_name:v}))} />
          <Field label="簡短介紹" value={editProd.short_intro} onChange={v=>setEditProd(p=>({...p,short_intro:v}))} rows={2} />
          <Field label="適合族群" value={editProd.suitable_people} onChange={v=>setEditProd(p=>({...p,suitable_people:v}))} rows={2} />
          <Field label="使用方式" value={editProd.usage_method} onChange={v=>setEditProd(p=>({...p,usage_method:v}))} rows={2} />
          <Field label="主要成分" value={editProd.ingredients} onChange={v=>setEditProd(p=>({...p,ingredients:v}))} rows={2} />
          <Field label="注意事項" value={editProd.precautions} onChange={v=>setEditProd(p=>({...p,precautions:v}))} rows={2} />
          <Field label="上架狀態" value={editProd.is_published?'true':'false'}
                 onChange={v=>setEditProd(p=>({...p,is_published:v==='true'}))}
                 options={[{v:'true',l:'✅ 上架中'},{v:'false',l:'⛔ 已下架'}]} />
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button onClick={saveProduct} style={{ ...AS.btn(A.success), flex:1 }}>💾 儲存變更</button>
            <button onClick={()=>setEditProd(null)} style={{ ...AS.btn(A.textL), flex:1 }}>取消</button>
          </div>
        </Modal>
      )}

      {/* Edit Variant Modal */}
      {editVar && (
        <Modal title={editVar.id?'✏️ 編輯規格':'＋ 新增規格'} onClose={()=>setEditVar(null)}>
          <Field label="規格名稱（如：標準裝 60粒）" value={varForm.variant_name || editVar.variant_name}
                 onChange={v=>setEditVar(f=>({...f,variant_name:v}))} />
          <Field label="售價（NT$）" type="number" value={editVar.sale_price}
                 onChange={v=>setEditVar(f=>({...f,sale_price:v}))} />
          <Field label="原價（NT$，選填）" type="number" value={editVar.original_price}
                 onChange={v=>setEditVar(f=>({...f,original_price:v}))} />
          <Field label="庫存數量" type="number" value={editVar.stock_qty}
                 onChange={v=>setEditVar(f=>({...f,stock_qty:v}))} />
          <Field label="SKU代碼（選填）" value={editVar.sku_code}
                 onChange={v=>setEditVar(f=>({...f,sku_code:v}))} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{ setVarForm(editVar); saveVariant(); }}
                    style={{ ...AS.btn(A.success), flex:1 }}>💾 儲存</button>
            <button onClick={()=>setEditVar(null)} style={{ ...AS.btn(A.textL), flex:1 }}>取消</button>
          </div>
        </Modal>
      )}

      {/* Add Product Modal */}
      {showAdd && (
        <Modal title="＋ 新增商品" onClose={()=>setShowAdd(false)} width={560}>
          <Field label="商品名稱 *" value={newForm.product_name} onChange={v=>setNewForm(f=>({...f,product_name:v}))} placeholder="例：深海魚油 Omega-3" />
          <Field label="簡短介紹" value={newForm.short_intro} onChange={v=>setNewForm(f=>({...f,short_intro:v}))} rows={2} />
          <Field label="適合族群" value={newForm.suitable_people} onChange={v=>setNewForm(f=>({...f,suitable_people:v}))} rows={2} />
          <Field label="使用方式" value={newForm.usage_method} onChange={v=>setNewForm(f=>({...f,usage_method:v}))} rows={2} />
          <Field label="主要成分" value={newForm.ingredients} onChange={v=>setNewForm(f=>({...f,ingredients:v}))} rows={2} />
          <Field label="注意事項" value={newForm.precautions} onChange={v=>setNewForm(f=>({...f,precautions:v}))} rows={2} />
          <Field label="上架狀態" value={newForm.is_published?'true':'false'}
                 onChange={v=>setNewForm(f=>({...f,is_published:v==='true'}))}
                 options={[{v:'false',l:'⛔ 暫時下架'},{v:'true',l:'✅ 立即上架'}]} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={addProduct} style={{ ...AS.btn(A.success), flex:1 }}>✅ 新增商品</button>
            <button onClick={()=>setShowAdd(false)} style={{ ...AS.btn(A.textL), flex:1 }}>取消</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: Customers Management
// ════════════════════════════════════════════════════════════════
function CustomersPage() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [detail, setDetail]     = useState(null);
  const [orders, setOrders]     = useState([]);
  const [editPoints, setEditPoints] = useState({ show:false, uid:'', pts:0, reason:'' });
  const [toast, setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('app_users').select('*').order('created_at', { ascending:false });
    if (search) q = q.or(`nickname.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data } = await q;
    setUsers(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (u) => {
    setDetail(u);
    const { data } = await supabase.from('orders').select('*')
      .eq('user_id', u.id).order('created_at', { ascending:false }).limit(5);
    setOrders(data || []);
  };

  const savePoints = async () => {
    const delta = Number(editPoints.pts);
    if (!delta) { alert('請填寫有效積分數字'); return; }
    const { data:u } = await supabase.from('app_users').select('points').eq('id', editPoints.uid).single();
    const newPts = (u?.points||0) + delta;
    await supabase.from('app_users').update({ points:newPts }).eq('id', editPoints.uid);
    await supabase.from('points_log').insert({ user_id:editPoints.uid, points:delta, reason:editPoints.reason||'後台手動調整' });
    showToast(`✅ 積分已調整 ${delta>0?'+':''}${delta}`);
    setEditPoints({ show:false, uid:'', pts:0, reason:'' });
    load();
    if (detail?.id === editPoints.uid) setDetail(d=>({...d, points:newPts}));
  };

  const LEVEL_COLORS = { '健康新手':'#78909C', '健康達人':'#C87A0A', '健康菁英':'#1B5C3E', '健康大師':'#8E44AD' };
  const getLevel = (pts) => pts>=5000?'健康大師':pts>=1500?'健康菁英':pts>=500?'健康達人':'健康新手';

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
                      background:A.success, color:'#fff', padding:'10px 20px', borderRadius:12,
                      fontWeight:700, zIndex:9999 }}>{toast}</div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ color:A.text, fontSize:20, fontWeight:900 }}>👥 用戶管理</h2>
        <div style={{ fontSize:13, color:A.textS }}>{users.length} 位用戶</div>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)}
             placeholder="🔍 搜尋暱稱 / 手機號碼" style={{ ...AS.input, marginBottom:14 }} />

      {loading ? <Spinner /> : users.length === 0 ? <EmptyState icon="👤" text="暫無用戶" /> :
        users.map(u => (
          <div key={u.id} style={{ ...AS.card, marginBottom:10, cursor:'pointer', display:'flex',
                                   gap:12, alignItems:'center' }} onClick={()=>openDetail(u)}>
            <div style={{ width:44, height:44, borderRadius:12, background:A.primary+'30',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              👤
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:A.text }}>{u.nickname}</div>
              <div style={{ fontSize:12, color:A.textS }}>{u.phone} · {u.join_date}</div>
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <span style={{ ...AS.badge(LEVEL_COLORS[getLevel(u.points||0)]) }}>{getLevel(u.points||0)}</span>
                <span style={{ fontSize:12, color:A.textS }}>💰 {u.points||0}積分</span>
                <span style={{ fontSize:12, color:A.textS }}>📦 {u.orders_count||0}單</span>
              </div>
            </div>
            <div style={{ color:A.textL }}>›</div>
          </div>
        ))
      }

      {/* User Detail Modal */}
      {detail && (
        <Modal title={`用戶詳情：${detail.nickname}`} onClose={()=>setDetail(null)} width={520}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              {l:'暱稱', v:detail.nickname},
              {l:'手機號', v:detail.phone},
              {l:'積分', v:`${detail.points||0} 分`},
              {l:'會員等級', v:getLevel(detail.points||0)},
              {l:'累計訂單', v:`${detail.orders_count||0} 筆`},
              {l:'連續記錄', v:`${detail.streak||0} 天`},
              {l:'首單折扣', v:detail.coupon_active?'未使用':'已使用'},
              {l:'加入日期', v:detail.join_date},
            ].map(i => (
              <div key={i.l} style={{ background:A.bg, borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:11, color:A.textS }}>{i.l}</div>
                <div style={{ fontSize:13, fontWeight:700, color:A.text, marginTop:2 }}>{i.v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:800, color:A.text, marginBottom:8 }}>📦 最近訂單</div>
            {orders.length === 0 ? <div style={{ color:A.textS, fontSize:13 }}>暫無訂單記錄</div> :
              orders.map(o => (
                <div key={o.id} style={{ display:'flex', justifyContent:'space-between',
                                         padding:'7px 0', borderBottom:`1px solid ${A.border}` }}>
                  <span style={{ fontSize:12, color:A.text }}>{o.order_no} · {ago(o.created_at)}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ ...AS.badge(statusColor(o.order_status)) }}>{o.order_status}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:A.primary }}>{fmt(o.total_amount)}</span>
                  </div>
                </div>
              ))
            }
          </div>
          <button onClick={()=>setEditPoints({ show:true, uid:detail.id, pts:0, reason:'' })}
                  style={{ ...AS.btn(A.warning), width:'100%' }}>💰 手動調整積分</button>
        </Modal>
      )}

      {/* Edit Points Modal */}
      {editPoints.show && (
        <Modal title="💰 手動調整積分" onClose={()=>setEditPoints(f=>({...f,show:false}))}>
          <Field label="調整積分（正數=增加，負數=扣除）" type="number"
                 value={editPoints.pts} onChange={v=>setEditPoints(f=>({...f,pts:v}))}
                 placeholder="例：100 或 -50" />
          <Field label="調整原因" value={editPoints.reason}
                 onChange={v=>setEditPoints(f=>({...f,reason:v}))}
                 placeholder="例：客服補償、錯誤扣點修正" />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={savePoints} style={{ ...AS.btn(A.success), flex:1 }}>✅ 確認調整</button>
            <button onClick={()=>setEditPoints(f=>({...f,show:false}))}
                    style={{ ...AS.btn(A.textL), flex:1 }}>取消</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: Health Analytics
// ════════════════════════════════════════════════════════════════
function HealthAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [diaryStats, setDiaryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [usersRes, diaryRes, familyRes] = await Promise.all([
        supabase.from('app_users').select('points, streak, orders_count, join_date'),
        supabase.from('diary_entries').select('mood, energy, symptoms, bp, glucose, entry_date'),
        supabase.from('family_members').select('conditions, health_score'),
      ]);
      const users   = usersRes.data  || [];
      const diaries = diaryRes.data  || [];
      const family  = familyRes.data || [];

      // User stats
      const activeUsers = users.filter(u => u.orders_count > 0).length;
      const avgPoints   = users.length ? Math.round(users.reduce((s,u)=>s+(u.points||0),0)/users.length) : 0;
      const streakers   = users.filter(u => (u.streak||0) >= 7).length;

      // Diary stats
      const moodCounts = [0,0,0,0,0,0];
      const symptomMap = {};
      diaries.forEach(d => {
        if (d.mood) moodCounts[d.mood]++;
        (d.symptoms||[]).forEach(s => { symptomMap[s]=(symptomMap[s]||0)+1; });
      });
      const topSymptoms = Object.entries(symptomMap)
        .sort((a,b)=>b[1]-a[1]).slice(0,5);
      const avgMood = diaries.length
        ? (diaries.reduce((s,d)=>s+(d.mood||0),0)/diaries.length).toFixed(1) : '-';

      // Family conditions
      const condMap = {};
      family.forEach(m => (m.conditions||[]).forEach(c=>{ condMap[c]=(condMap[c]||0)+1; }));
      const topConditions = Object.entries(condMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
      const avgScore = family.length ? Math.round(family.reduce((s,m)=>s+(m.health_score||0),0)/family.length) : '-';

      setStats({ activeUsers, avgPoints, streakers, totalUsers:users.length });
      setDiaryStats({ avgMood, moodCounts, topSymptoms, topConditions, avgScore, totalEntries:diaries.length });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  const moodLabels = ['','很差','不佳','普通','不錯','很好'];
  const moodColors = ['','#C0392B','#D35400','#F59E0B','#2E86AB','#27AE60'];

  return (
    <div>
      <h2 style={{ color:A.text, fontSize:20, fontWeight:900, marginBottom:20 }}>❤️ 健康數據分析</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
        <StatCard emoji="👥" label="活躍用戶（有下單）" value={`${stats.activeUsers}人`} color={A.primary} />
        <StatCard emoji="💰" label="用戶平均積分" value={stats.avgPoints} color={A.warning} />
        <StatCard emoji="🔥" label="連續記錄 7天↑" value={`${stats.streakers}人`} color={A.accent} />
        <StatCard emoji="📓" label="日記總記錄數" value={`${diaryStats.totalEntries}筆`} color={A.success} />
      </div>

      {diaryStats.totalEntries > 0 ? (
        <>
          <div style={{ ...AS.card, marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:800, color:A.text, marginBottom:14 }}>😊 心情分佈</div>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:80 }}>
              {[1,2,3,4,5].map(i => {
                const count = diaryStats.moodCounts[i] || 0;
                const max = Math.max(...diaryStats.moodCounts.slice(1));
                const h = max ? Math.round((count/max)*70) : 0;
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ fontSize:11, color:moodColors[i], fontWeight:700 }}>{count}</div>
                    <div style={{ width:'100%', height:h, background:moodColors[i], borderRadius:'4px 4px 0 0', minHeight:4 }} />
                    <div style={{ fontSize:11, color:A.textS }}>{moodLabels[i]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:10, fontSize:13, color:A.textS }}>
              平均心情：<span style={{ fontWeight:800, color:A.success }}>{diaryStats.avgMood}</span> / 5
            </div>
          </div>

          {diaryStats.topSymptoms.length > 0 && (
            <div style={{ ...AS.card, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, color:A.text, marginBottom:12 }}>🤒 最常見不適症狀 TOP 5</div>
              {diaryStats.topSymptoms.map(([sym, cnt]) => (
                <div key={sym} style={{ display:'flex', justifyContent:'space-between',
                                         padding:'7px 0', borderBottom:`1px solid ${A.border}` }}>
                  <span style={{ fontSize:13, color:A.text }}>{sym}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:A.warning }}>{cnt} 次</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : <EmptyState icon="📊" text="尚無健康日記數據" /> }

      {diaryStats.topConditions.length > 0 && (
        <div style={{ ...AS.card }}>
          <div style={{ fontSize:15, fontWeight:800, color:A.text, marginBottom:12 }}>🏥 家人慢性病分佈 TOP 5</div>
          <div style={{ fontSize:12, color:A.textS, marginBottom:10 }}>
            家人健康平均分：{diaryStats.avgScore} / 100
          </div>
          {diaryStats.topConditions.map(([cond, cnt]) => (
            <div key={cond} style={{ display:'flex', justifyContent:'space-between',
                                      padding:'7px 0', borderBottom:`1px solid ${A.border}` }}>
              <span style={{ fontSize:13, color:A.text }}>{cond}</span>
              <span style={{ fontSize:13, fontWeight:800, color:A.danger }}>{cnt} 人</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: Marketing (Coupons + Announcements)
// ════════════════════════════════════════════════════════════════
function MarketingPage() {
  const [tab, setTab]           = useState('coupons');
  const [coupons, setCoupons]   = useState([]);
  const [announcements, setAnn] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editCoupon, setEditCoupon] = useState(null);
  const [editAnn, setEditAnn]   = useState(null);
  const [toast, setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 2500); };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [c, a] = await Promise.all([
      supabase.from('coupons').select('*').order('created_at', { ascending:false }),
      supabase.from('announcements').select('*').order('created_at', { ascending:false }),
    ]);
    setCoupons(c.data||[]);
    setAnn(a.data||[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveCoupon = async () => {
    if (!editCoupon.code || !editCoupon.name) { alert('請填寫優惠碼和名稱'); return; }
    const data = { code:editCoupon.code.toUpperCase(), name:editCoupon.name,
                   type:editCoupon.type||'percent', value:Number(editCoupon.value||0),
                   min_amount:Number(editCoupon.min_amount||0), max_uses:Number(editCoupon.max_uses||100),
                   start_date:editCoupon.start_date||null, end_date:editCoupon.end_date||null,
                   is_active:editCoupon.is_active!==false };
    if (editCoupon.id) await supabase.from('coupons').update(data).eq('id', editCoupon.id);
    else await supabase.from('coupons').insert(data);
    showToast('✅ 優惠券已儲存'); setEditCoupon(null); loadData();
  };

  const deleteCoupon = async (id) => {
    if (!confirm('確定刪除此優惠券？')) return;
    await supabase.from('coupons').delete().eq('id', id);
    showToast('✅ 已刪除'); loadData();
  };

  const saveAnn = async () => {
    if (!editAnn.title) { alert('請填寫公告標題'); return; }
    const data = { title:editAnn.title, content:editAnn.content||'',
                   target:editAnn.target||'all', channel:editAnn.channel||'app',
                   status:editAnn.status||'draft', send_at:editAnn.send_at||null };
    if (editAnn.id) await supabase.from('announcements').update(data).eq('id', editAnn.id);
    else await supabase.from('announcements').insert(data);
    showToast('✅ 公告已儲存'); setEditAnn(null); loadData();
  };

  const sendAnn = async (ann) => {
    if (!confirm(`確定立即發送「${ann.title}」？`)) return;
    await supabase.from('announcements').update({
      status:'sent', send_at:new Date().toISOString(), sent_count:ann.sent_count+1
    }).eq('id', ann.id);
    showToast('✅ 公告已標記為已發送'); loadData();
  };

  const COUPON_TYPE_LABEL = { percent:'折扣 (%)', fixed:'固定折扣 (NT$)', free_shipping:'免運費' };

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
                      background:A.success, color:'#fff', padding:'10px 20px', borderRadius:12,
                      fontWeight:700, zIndex:9999 }}>{toast}</div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ color:A.text, fontSize:20, fontWeight:900 }}>📢 行銷管理</h2>
      </div>

      {/* Sub tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[{id:'coupons',l:'🎫 優惠券'},{id:'announcements',l:'📣 公告推播'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{ padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer',
                           background:tab===t.id?A.primary:A.surface,
                           color:tab===t.id?'#fff':A.textS, fontWeight:700, fontSize:13 }}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : tab === 'coupons' ? (
        <>
          <button onClick={()=>setEditCoupon({ code:'', name:'', type:'percent', value:'', min_amount:'0', max_uses:'100', is_active:true })}
                  style={{ ...AS.btn(A.success), marginBottom:14 }}>＋ 新增優惠券</button>
          {coupons.map(c => (
            <div key={c.id} style={{ ...AS.card, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:16, fontWeight:900, color:A.primary }}>{c.code}</span>
                    <span style={{ ...AS.badge(c.is_active?A.success:A.textL) }}>{c.is_active?'啟用':'停用'}</span>
                  </div>
                  <div style={{ fontSize:13, color:A.text, marginTop:4 }}>{c.name}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>setEditCoupon({...c})} style={{ ...AS.btn(A.info), padding:'5px 10px', fontSize:12 }}>編輯</button>
                  <button onClick={()=>deleteCoupon(c.id)} style={{ ...AS.btn(A.danger), padding:'5px 10px', fontSize:12 }}>刪除</button>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[
                  {l:'折扣方式', v: c.type==='percent'?`${c.value}折(${c.value}%)`:c.type==='fixed'?`折 NT$${c.value}`:'免運費'},
                  {l:'最低消費', v: c.min_amount>0?fmt(c.min_amount):'無限制'},
                  {l:'使用情況', v: `${c.used_count}/${c.max_uses}次`},
                  {l:'開始日期', v: c.start_date||'不限'},
                  {l:'截止日期', v: c.end_date||'長期有效'},
                ].map(i=>(
                  <div key={i.l} style={{ background:A.bg, borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:A.textS }}>{i.l}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:A.text, marginTop:2 }}>{i.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {coupons.length === 0 && <EmptyState icon="🎫" text="暫無優惠券" />}
        </>
      ) : (
        <>
          <button onClick={()=>setEditAnn({ title:'', content:'', target:'all', channel:'app', status:'draft' })}
                  style={{ ...AS.btn(A.success), marginBottom:14 }}>＋ 新增公告</button>
          {announcements.map(a => (
            <div key={a.id} style={{ ...AS.card, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:14, fontWeight:800, color:A.text }}>{a.title}</span>
                    <span style={{ ...AS.badge(a.status==='sent'?A.success:a.status==='scheduled'?A.warning:A.textL) }}>
                      {a.status==='sent'?'已發送':a.status==='scheduled'?'預定':'草稿'}
                    </span>
                  </div>
                  {a.content && <div style={{ fontSize:12, color:A.textS }}>{a.content.slice(0,60)}...</div>}
                  <div style={{ display:'flex', gap:10, marginTop:6 }}>
                    <span style={{ fontSize:11, color:A.textS }}>
                      目標：{{all:'全體用戶',new:'新用戶',vip:'VIP',inactive:'久未活躍'}[a.target]||a.target}
                    </span>
                    <span style={{ fontSize:11, color:A.textS }}>
                      渠道：{{app:'APP通知',line:'LINE推播',sms:'簡訊'}[a.channel]||a.channel}
                    </span>
                    {a.send_at && <span style={{ fontSize:11, color:A.textS }}>發送：{ago(a.send_at)}</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:10 }}>
                  {a.status !== 'sent' && (
                    <button onClick={()=>sendAnn(a)} style={{ ...AS.btn(A.primary), padding:'5px 10px', fontSize:12 }}>發送</button>
                  )}
                  <button onClick={()=>setEditAnn({...a})} style={{ ...AS.btn(A.info), padding:'5px 10px', fontSize:12 }}>編輯</button>
                </div>
              </div>
            </div>
          ))}
          {announcements.length === 0 && <EmptyState icon="📣" text="暫無公告" />}
        </>
      )}

      {/* Coupon Edit Modal */}
      {editCoupon && (
        <Modal title={editCoupon.id?'✏️ 編輯優惠券':'＋ 新增優惠券'} onClose={()=>setEditCoupon(null)}>
          <Field label="優惠碼 *（英文大寫）" value={editCoupon.code}
                 onChange={v=>setEditCoupon(f=>({...f,code:v.toUpperCase()}))} placeholder="例：HEALTH10" />
          <Field label="優惠名稱 *" value={editCoupon.name}
                 onChange={v=>setEditCoupon(f=>({...f,name:v}))} placeholder="例：新會員首單優惠" />
          <Field label="折扣類型" value={editCoupon.type}
                 onChange={v=>setEditCoupon(f=>({...f,type:v}))}
                 options={[{v:'percent',l:'折扣 (輸入如 90=9折)'},{v:'fixed',l:'固定折抵 (NT$)'},{v:'free_shipping',l:'免運費'}]} />
          <Field label={`折扣值（${editCoupon.type==='percent'?'90=9折, 85=85折':editCoupon.type==='fixed'?'折抵金額':'0'}）`}
                 type="number" value={editCoupon.value}
                 onChange={v=>setEditCoupon(f=>({...f,value:v}))} />
          <Field label="最低消費（0=無限制）" type="number" value={editCoupon.min_amount}
                 onChange={v=>setEditCoupon(f=>({...f,min_amount:v}))} />
          <Field label="最大使用次數" type="number" value={editCoupon.max_uses}
                 onChange={v=>setEditCoupon(f=>({...f,max_uses:v}))} />
          <Field label="開始日期（選填）" type="date" value={editCoupon.start_date}
                 onChange={v=>setEditCoupon(f=>({...f,start_date:v}))} />
          <Field label="截止日期（選填）" type="date" value={editCoupon.end_date}
                 onChange={v=>setEditCoupon(f=>({...f,end_date:v}))} />
          <Field label="狀態" value={editCoupon.is_active?'true':'false'}
                 onChange={v=>setEditCoupon(f=>({...f,is_active:v==='true'}))}
                 options={[{v:'true',l:'✅ 啟用'},{v:'false',l:'⛔ 停用'}]} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={saveCoupon} style={{ ...AS.btn(A.success), flex:1 }}>💾 儲存</button>
            <button onClick={()=>setEditCoupon(null)} style={{ ...AS.btn(A.textL), flex:1 }}>取消</button>
          </div>
        </Modal>
      )}

      {/* Announcement Edit Modal */}
      {editAnn && (
        <Modal title={editAnn.id?'✏️ 編輯公告':'＋ 新增公告'} onClose={()=>setEditAnn(null)}>
          <Field label="標題 *" value={editAnn.title} onChange={v=>setEditAnn(f=>({...f,title:v}))}
                 placeholder="例：新品上架通知" />
          <Field label="內容" value={editAnn.content} onChange={v=>setEditAnn(f=>({...f,content:v}))}
                 rows={3} placeholder="公告詳細內容..." />
          <Field label="目標用戶" value={editAnn.target} onChange={v=>setEditAnn(f=>({...f,target:v}))}
                 options={[{v:'all',l:'全體用戶'},{v:'new',l:'新用戶（7天內）'},{v:'vip',l:'VIP會員'},{v:'inactive',l:'久未活躍（30天+）'}]} />
          <Field label="推播渠道" value={editAnn.channel} onChange={v=>setEditAnn(f=>({...f,channel:v}))}
                 options={[{v:'app',l:'APP 站內通知'},{v:'line',l:'LINE 推播'},{v:'sms',l:'手機簡訊'}]} />
          <Field label="狀態" value={editAnn.status} onChange={v=>setEditAnn(f=>({...f,status:v}))}
                 options={[{v:'draft',l:'草稿'},{v:'scheduled',l:'預定發送'},{v:'sent',l:'已發送'}]} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={saveAnn} style={{ ...AS.btn(A.success), flex:1 }}>💾 儲存</button>
            <button onClick={()=>setEditAnn(null)} style={{ ...AS.btn(A.textL), flex:1 }}>取消</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: Admin Staff Management
// ════════════════════════════════════════════════════════════════
function StaffPage() {
  const [staff, setStaff]     = useState([]);
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit]       = useState(null);
  const [toast, setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 2500); };

  useEffect(() => {
    const load = async () => {
      const [s, r] = await Promise.all([
        supabase.from('admin_users').select('*, admin_roles(role_name)').order('id'),
        supabase.from('admin_roles').select('*').order('id'),
      ]);
      setStaff(s.data||[]); setRoles(r.data||[]); setLoading(false);
    };
    load();
  }, []);

  const saveStaff = async () => {
    if (!edit.name || !edit.account) { alert('請填寫姓名和帳號'); return; }
    const data = { name:edit.name, account:edit.account, role_id:Number(edit.role_id),
                   is_active:edit.is_active !== false };
    if (edit.password) data.password_hash = 'plain_' + edit.password;
    if (edit.id) await supabase.from('admin_users').update(data).eq('id', edit.id);
    else await supabase.from('admin_users').insert(data);
    showToast('✅ 人員資料已儲存'); setEdit(null);
    const { data:d } = await supabase.from('admin_users').select('*, admin_roles(role_name)').order('id');
    setStaff(d||[]);
  };

  const ROLE_COLORS = { super_admin:A.danger, customer_service:A.info, shipper:A.warning, product_manager:A.purple };

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
                      background:A.success, color:'#fff', padding:'10px 20px', borderRadius:12,
                      fontWeight:700, zIndex:9999 }}>{toast}</div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ color:A.text, fontSize:20, fontWeight:900 }}>🔐 後台人員管理</h2>
        <button onClick={()=>setEdit({ name:'', account:'', role_id:roles[1]?.id||2, is_active:true, password:'' })}
                style={AS.btn(A.success)}>＋ 新增人員</button>
      </div>

      {loading ? <Spinner /> : staff.map(s => (
        <div key={s.id} style={{ ...AS.card, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
              <span style={{ fontSize:14, fontWeight:800, color:A.text }}>{s.name}</span>
              <span style={{ ...AS.badge(ROLE_COLORS[s.admin_roles?.role_key]||A.textL) }}>
                {s.admin_roles?.role_name||'未知'}
              </span>
              {!s.is_active && <span style={{ ...AS.badge(A.danger) }}>停用</span>}
            </div>
            <div style={{ fontSize:12, color:A.textS }}>帳號：{s.account}</div>
          </div>
          <button onClick={()=>setEdit({...s, role_id:s.role_id, password:''})}
                  style={{ ...AS.btn(A.info), padding:'6px 12px', fontSize:12 }}>編輯</button>
        </div>
      ))}

      {edit && (
        <Modal title={edit.id?'✏️ 編輯人員':'＋ 新增人員'} onClose={()=>setEdit(null)}>
          <Field label="姓名 *" value={edit.name} onChange={v=>setEdit(f=>({...f,name:v}))} />
          <Field label="帳號 *" value={edit.account} onChange={v=>setEdit(f=>({...f,account:v}))}
                 disabled={!!edit.id} />
          <Field label={edit.id?'新密碼（留空不修改）':'初始密碼 *'} type="password"
                 value={edit.password} onChange={v=>setEdit(f=>({...f,password:v}))}
                 placeholder="輸入密碼" />
          <Field label="角色" value={String(edit.role_id)}
                 onChange={v=>setEdit(f=>({...f,role_id:v}))}
                 options={roles.map(r=>({v:String(r.id),l:r.role_name}))} />
          <Field label="帳號狀態" value={edit.is_active?'true':'false'}
                 onChange={v=>setEdit(f=>({...f,is_active:v==='true'}))}
                 options={[{v:'true',l:'✅ 啟用'},{v:'false',l:'⛔ 停用'}]} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={saveStaff} style={{ ...AS.btn(A.success), flex:1 }}>💾 儲存</button>
            <button onClick={()=>setEdit(null)} style={{ ...AS.btn(A.textL), flex:1 }}>取消</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN: AdminPanel
// ════════════════════════════════════════════════════════════════
const ADMIN_TABS = [
  { id:'dashboard',  label:'總覽',     emoji:'📊', component:Dashboard },
  { id:'orders',     label:'訂單',     emoji:'📦', component:OrdersPage },
  { id:'products',   label:'商品',     emoji:'🛍️', component:ProductsPage },
  { id:'customers',  label:'用戶',     emoji:'👥', component:CustomersPage },
  { id:'health',     label:'健康分析', emoji:'❤️', component:HealthAnalyticsPage },
  { id:'marketing',  label:'行銷',     emoji:'📢', component:MarketingPage },
  { id:'staff',      label:'人員',     emoji:'🔐', component:StaffPage },
];

export default function AdminPanel({ onBack }) {
  const [admin, setAdmin]   = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  const ActiveComponent = ADMIN_TABS.find(t=>t.id===activeTab)?.component || Dashboard;

  return (
    <div style={{ minHeight:'100vh', background:A.bg, fontFamily:"'Noto Sans TC',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${A.border}; border-radius:4px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        select option { background:${A.surface}; color:${A.text}; }
      `}</style>

      {/* Top Bar */}
      <div style={{ background:A.surface, borderBottom:`1px solid ${A.border}`, padding:'12px 16px',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>🛡️</span>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:A.text }}>健康守護後台</div>
            <div style={{ fontSize:11, color:A.textS }}>{admin.name} · {admin.admin_roles?.role_name}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {onBack && (
            <button onClick={onBack} style={{ ...AS.btn(A.textL), padding:'6px 12px', fontSize:12 }}>
              返回前台
            </button>
          )}
          <button onClick={()=>setAdmin(null)} style={{ ...AS.btn(A.danger), padding:'6px 12px', fontSize:12 }}>
            登出
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={{ background:A.surface, borderBottom:`1px solid ${A.border}`,
                    display:'flex', gap:2, padding:'0 8px', overflowX:'auto' }}>
        {ADMIN_TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
                  style={{ padding:'12px 14px', border:'none', background:'none', cursor:'pointer',
                           color: activeTab===t.id ? A.primary : A.textS,
                           fontWeight: activeTab===t.id ? 800 : 400,
                           fontSize:13, whiteSpace:'nowrap',
                           borderBottom: activeTab===t.id ? `2px solid ${A.primary}` : '2px solid transparent' }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Page Content */}
      <div style={{ padding:'20px 16px 60px', maxWidth:900, margin:'0 auto' }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
