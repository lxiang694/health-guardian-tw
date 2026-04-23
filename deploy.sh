#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 健康守護 - 一鍵部署腳本
# 使用前請確認：已安裝 git, gh (GitHub CLI), node
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

REPO_NAME="health-guardian-tw"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 健康守護平台 - 開始部署${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 安裝依賴
echo -e "${YELLOW}📦 安裝依賴...${NC}"
npm install

# 2. 建置測試
echo -e "${YELLOW}🔨 建置測試...${NC}"
npm run build
echo -e "${GREEN}✅ 建置成功${NC}"

# 3. 建立 GitHub 倉庫並推送
echo -e "${YELLOW}📂 建立 GitHub 倉庫: $REPO_NAME${NC}"
gh repo create "$REPO_NAME" --public --description "台灣健康管理平台 - AI體檢解讀、健康記錄、保健品商城" --push --source=. || {
  echo "倉庫可能已存在，嘗試推送..."
  git remote add origin "https://github.com/$(gh api user --jq .login)/$REPO_NAME.git" 2>/dev/null || true
  git push -u origin main 2>/dev/null || git push -u origin master
}
echo -e "${GREEN}✅ GitHub 倉庫建立完成${NC}"

# 4. 取得 GitHub repo URL
GITHUB_URL=$(gh repo view "$REPO_NAME" --json url -q .url 2>/dev/null || echo "")
echo -e "${GREEN}🔗 GitHub: $GITHUB_URL${NC}"

# 5. 部署到 Vercel
echo -e "${YELLOW}🌐 部署到 Vercel...${NC}"
if ! command -v vercel &> /dev/null; then
  echo "安裝 Vercel CLI..."
  npm install -g vercel
fi

vercel --prod \
  --build-env VITE_SUPABASE_URL="https://yzdmabpclwpmumlejdvz.supabase.co" \
  --build-env VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZG1hYnBjbHdwbXVtbGVqZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDk3ODksImV4cCI6MjA5MTk4NTc4OX0.B3iHtNZeGx4MmAhp3f7NCB44GVqabGCUEO5P3jZY7lM" \
  --yes

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "📌 接下來在 Vercel 後台設定環境變數："
echo "   VITE_ANTHROPIC_API_KEY = 您的 Claude API Key"
echo ""
echo "   前往：https://vercel.com/ziyi1/$REPO_NAME/settings/environment-variables"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
