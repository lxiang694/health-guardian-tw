# 健康守護 Health Guardian TW

> 台灣 40-70 歲用戶的 AI 健康管理平台

## 技術棧

- **前端**: React 18 + Vite + Recharts
- **後端**: Supabase (PostgreSQL + REST API)
- **部署**: Vercel
- **AI**: Anthropic Claude API（體檢報告解讀）

## 功能

- 🩺 健康風險自測（6大類）
- 📊 健康記錄追蹤（血壓/血糖/體重/睡眠）
- 📋 體檢報告 AI 白話解讀（上傳圖片/PDF）
- 🤖 智能保健品推薦
- 🛍️ 保健品商城 + 7-11 取貨付款
- 📓 健康日記
- 👨‍👩‍👧 家人健康管理
- 👤 用戶注冊/登入 + 積分系統

## 環境變數

```
VITE_SUPABASE_URL=https://yzdmabpclwpmumlejdvz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ANTHROPIC_API_KEY=your_claude_api_key
```

## 本地開發

```bash
npm install
npm run dev
```

## 部署

推送到 GitHub 後 Vercel 自動部署。
