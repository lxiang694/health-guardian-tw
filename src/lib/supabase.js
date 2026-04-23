import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yzdmabpclwpmumlejdvz.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZG1hYnBjbHdwbXVtbGVqZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDk3ODksImV4cCI6MjA5MTk4NTc4OX0.B3iHtNZeGx4MmAhp3f7NCB44GVqabGCUEO5P3jZY7lM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Auth helpers ───────────────────────────────────────────
// Simple phone+password auth (no Supabase Auth — custom table)

function hashPassword(pw) {
  // Simple deterministic hash for demo; in prod use bcrypt via Edge Function
  let h = 0
  for (let i = 0; i < pw.length; i++) {
    h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0
  }
  return 'h_' + Math.abs(h).toString(36) + '_' + pw.length
}

export async function registerUser({ nickname, phone, password }) {
  const existing = await supabase.from('app_users').select('id').eq('phone', phone).maybeSingle()
  if (existing.data) return { error: '此手機號碼已被注冊，請直接登入' }

  const { data, error } = await supabase.from('app_users').insert({
    phone,
    nickname,
    password_hash: hashPassword(password),
    points: 200,
    join_date: new Date().toISOString().slice(0, 10),
    last_login: new Date().toISOString().slice(0, 10),
    coupon_active: true,
  }).select().single()

  if (error) return { error: error.message }

  // 寫積分記錄
  await supabase.from('points_log').insert({ user_id: data.id, points: 200, reason: '注冊禮' })

  return { user: data }
}

export async function loginUser({ phone, password }) {
  const { data, error } = await supabase
    .from('app_users').select('*').eq('phone', phone).maybeSingle()

  if (error || !data) return { error: '手機號碼不存在，請先注冊' }
  if (data.password_hash !== hashPassword(password)) return { error: '密碼錯誤，請重新輸入' }

  // 每日登入積分
  const today = new Date().toISOString().slice(0, 10)
  let pointsToAdd = 0
  if (data.last_login !== today) {
    pointsToAdd = 10
    await supabase.from('app_users').update({
      last_login: today,
      points: data.points + 10,
    }).eq('id', data.id)
    await supabase.from('points_log').insert({ user_id: data.id, points: 10, reason: '每日登入' })
    data.points += 10
  }

  return { user: { ...data, pointsAdded: pointsToAdd } }
}

// ─── Diary helpers ──────────────────────────────────────────
export async function getDiaryEntries(userId) {
  const { data } = await supabase.from('diary_entries')
    .select('*').eq('user_id', userId).order('entry_date', { ascending: false })
  return data || []
}

export async function saveDiaryEntry(userId, entry) {
  const row = { user_id: userId, entry_date: entry.date, mood: entry.mood,
    energy: entry.energy, symptoms: entry.symptoms, bp: entry.bp,
    glucose: entry.glucose, water: entry.water, food: entry.food, note: entry.note }
  if (entry.id && entry.id.startsWith('db_')) {
    return supabase.from('diary_entries').update(row).eq('id', entry.id.slice(3))
  }
  return supabase.from('diary_entries').insert(row)
}

export async function deleteDiaryEntry(entryId) {
  return supabase.from('diary_entries').delete().eq('id', entryId)
}

// ─── Family helpers ─────────────────────────────────────────
export async function getFamilyMembers(userId) {
  const { data } = await supabase.from('family_members')
    .select('*').eq('user_id', userId).order('created_at')
  return (data || []).map(m => ({
    ...m, id: 'db_' + m.id, name: m.member_name,
    conditions: m.conditions || [], alerts: m.alerts || []
  }))
}

export async function saveFamilyMember(userId, member) {
  const row = { user_id: userId, member_name: member.name, relation: member.relation,
    age: member.age, gender: member.gender, avatar: member.avatar,
    conditions: member.conditions, meds: member.meds, note: member.note,
    health_score: member.score || 85, last_check: member.lastCheck || new Date().toISOString().slice(0,10),
    alerts: member.alerts || [] }
  if (member.id && member.id.startsWith('db_')) {
    return supabase.from('family_members').update(row).eq('id', member.id.slice(3))
  }
  return supabase.from('family_members').insert(row)
}

export async function deleteFamilyMember(memberId) {
  const id = memberId.startsWith('db_') ? memberId.slice(3) : memberId
  return supabase.from('family_members').delete().eq('id', id)
}

// ─── Order helpers ──────────────────────────────────────────
export async function saveOrder(userId, orderData) {
  const orderNo = 'HC' + Date.now().toString().slice(-8)
  const { data, error } = await supabase.from('orders').insert({
    user_id: userId || null,
    order_no: orderNo,
    customer_name: orderData.name,
    phone: orderData.phone,
    store_id: orderData.storeId,
    store_name: orderData.storeName,
    store_address: orderData.storeAddress,
    order_status: 'pending',
    items_count: orderData.itemCount,
    total_amount: orderData.total,
    items_json: orderData.items,
  }).select().single()
  if (error) return { error: error.message }

  // 首單積分
  if (userId) {
    const { data: u } = await supabase.from('app_users').select('orders_count, points').eq('id', userId).single()
    if (u && u.orders_count === 0) {
      await supabase.from('app_users').update({ orders_count: 1, points: u.points + 150 }).eq('id', userId)
      await supabase.from('points_log').insert({ user_id: userId, points: 150, reason: '首次下單' })
    } else if (u) {
      await supabase.from('app_users').update({ orders_count: (u.orders_count || 0) + 1 }).eq('id', userId)
    }
  }
  return { orderNo }
}

export async function addPoints(userId, pts, reason) {
  const { data: u } = await supabase.from('app_users').select('points').eq('id', userId).single()
  if (!u) return
  await supabase.from('app_users').update({ points: u.points + pts }).eq('id', userId)
  await supabase.from('points_log').insert({ user_id: userId, points: pts, reason })
  return u.points + pts
}
