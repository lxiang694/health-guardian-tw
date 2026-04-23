
import { useState, useCallback, useMemo, useEffect } from "react";
import { registerUser, loginUser, getDiaryEntries, saveDiaryEntry, deleteDiaryEntry, getFamilyMembers, saveFamilyMember, deleteFamilyMember, saveOrder, addPoints as dbAddPoints } from './lib/supabase.js';
import AdminPanel from './AdminPanel.jsx';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell
} from "recharts";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 設計系統 Design System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const C = {
  bg: '#F5EFE2', surface: '#FFFFFF', primary: '#1B5C3E',
  primaryL: '#2A7D55', primaryD: '#0F3522', accent: '#C87A0A',
  accentL: '#E8960F', danger: '#C0392B', dangerL: '#E74C3C',
  warning: '#D35400', success: '#27AE60', info: '#2471A3',
  text: '#1A2028', textS: '#5A6272', textL: '#9AA3B0',
  border: '#E2D8C5', borderL: '#EDE6D8', gold: '#D4A010',
};
const sh = { sm: '0 2px 8px rgba(0,0,0,0.07)', md: '0 4px 20px rgba(0,0,0,0.09)', lg: '0 8px 32px rgba(0,0,0,0.12)' };

const S = {
  app: { minHeight: '100vh', background: C.bg, fontFamily: "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif", maxWidth: 480, margin: '0 auto', position: 'relative' },
  card: { background: C.surface, borderRadius: 16, padding: '20px', boxShadow: sh.sm, border: `1px solid ${C.borderL}` },
  btn: (v='primary') => ({
    background: v==='primary' ? `linear-gradient(135deg,${C.primary},${C.primaryL})` : v==='accent' ? `linear-gradient(135deg,${C.accent},${C.accentL})` : v==='outline' ? 'transparent' : C.borderL,
    color: v==='outline' ? C.primary : '#fff', border: v==='outline' ? `2px solid ${C.primary}` : 'none',
    borderRadius: 12, padding: '13px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%',
    letterSpacing: '0.5px', transition: 'all 0.2s',
  }),
  tag: (color=C.primary) => ({ background: color+'22', color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 產品資料 Products Data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PRODUCTS = [
  { id:1, name:'深海魚油 Omega-3', cat:'心血管', price:890, orig:1280, emoji:'🐟', brand:'Nordic Health Pro', desc:'高純度EPA 1000mg+DHA 500mg，TG型態吸收率高3倍，支持心血管與大腦健康', benefits:['降低三酸甘油脂','改善血液循環','支持心臟健康','降低發炎反應'], targets:['cardiovascular','cholesterol','inflammation','brain'], rating:4.8, reviews:312, stock:48, hot:true, recommend:false },
  { id:2, name:'輔酶Q10 CoQ10 200mg', cat:'心血管', price:1280, orig:1680, emoji:'⚡', brand:'CardioMax', desc:'泛醇(Ubiquinol)型態，生物利用率提升8倍，強化心肌細胞能量，抗氧化保護', benefits:['強化心肌功能','提升細胞能量','抗氧化防護','改善疲勞感'], targets:['cardiovascular','fatigue','antioxidant'], rating:4.9, reviews:189, stock:32, hot:true, recommend:false },
  { id:3, name:'納豆激酶 Nattokinase', cat:'心血管', price:960, orig:1380, emoji:'🫘', brand:'Japan Natto Plus', desc:'精製納豆激酶 2000FU，天然溶栓酵素，維護血管暢通，降低血液黏稠度', benefits:['溶解血栓','降低血壓','改善血液黏度','維護血管彈性'], targets:['cardiovascular','bloodPressure','thrombosis'], rating:4.7, reviews:245, stock:55, hot:false, recommend:false },
  { id:4, name:'紅麴 Red Yeast Rice Plus', cat:'心血管', price:780, orig:1080, emoji:'🌾', brand:'CholestGuard', desc:'有機紅麴米萃取，Monacolin K天然成分，輔以輔酶Q10護心，天然調節血脂', benefits:['調節膽固醇','降低LDL壞膽固醇','保護心血管','抗動脈硬化'], targets:['cardiovascular','cholesterol'], rating:4.6, reviews:178, stock:40, hot:false, recommend:false },
  { id:5, name:'鈣鎂鋅骨骼配方', cat:'骨骼關節', price:720, orig:980, emoji:'🦴', brand:'BoneShield Pro', desc:'鈣1200mg+鎂400mg+鋅15mg+維D3 2000IU，最佳黃金比例，高吸收胺基酸螯合型', benefits:['強化骨密度','預防骨質疏鬆','改善肌肉痙攣','支持神經功能'], targets:['bone','osteoporosis','muscle'], rating:4.7, reviews:267, stock:62, hot:true, recommend:false },
  { id:6, name:'維生素D3+K2 高單位', cat:'骨骼關節', price:580, orig:780, emoji:'☀️', brand:'SunVita D', desc:'維D3 5000IU+K2 MK-7 200mcg，K2引導鈣質到達骨骼，防止動脈鈣化，免疫調節', benefits:['骨質強化','免疫力提升','預防動脈鈣化','協助鈣質吸收'], targets:['bone','immunity','cardiovascular'], rating:4.8, reviews:334, stock:78, hot:true, recommend:false },
  { id:7, name:'葡萄糖胺+軟骨素', cat:'骨骼關節', price:880, orig:1180, emoji:'🦵', brand:'JointFlex Plus', desc:'葡萄糖胺1500mg+軟骨素1200mg+MSM800mg，修復關節軟骨，改善行動靈活度', benefits:['修復關節軟骨','減輕關節疼痛','改善靈活度','潤滑關節液'], targets:['joint','osteoarthritis','pain'], rating:4.6, reviews:198, stock:45, hot:false, recommend:false },
  { id:8, name:'薑黃素 Curcumin 高效版', cat:'抗炎', price:780, orig:1050, emoji:'🌿', brand:'TurmerMax 95', desc:'95%薑黃素萃取，搭配胡椒鹼提升2000%吸收，多效抗炎，護肝護腸', benefits:['強效消炎','保護肝臟','抗氧化','改善關節不適'], targets:['inflammation','liver','joint','antioxidant'], rating:4.9, reviews:423, stock:55, hot:true, recommend:false },
  { id:9, name:'苦瓜胜肽 血糖管理', cat:'血糖管理', price:960, orig:1280, emoji:'🥒', brand:'GlucoBalance', desc:'專利苦瓜胜肽萃取，類胰島素效果，協助維持血糖穩定，改善胰島素阻抗', benefits:['穩定血糖波動','改善胰島素敏感性','減少飯後血糖飆升','輔助體重控制'], targets:['bloodSugar','diabetes','weight'], rating:4.7, reviews:156, stock:38, hot:false, recommend:false },
  { id:10, name:'肉桂+鉻配方 血糖維護', cat:'血糖管理', price:680, orig:920, emoji:'🍂', brand:'CinnaChrome Plus', desc:'錫蘭肉桂萃取500mg+有機鉻200mcg，協同提升胰島素功效，降低空腹血糖', benefits:['提升胰島素效率','穩定空腹血糖','改善碳水代謝','抗氧化效果'], targets:['bloodSugar','diabetes','insulin'], rating:4.5, reviews:134, stock:52, hot:false, recommend:false },
  { id:11, name:'奶薊草肝臟保健', cat:'肝臟保健', price:720, orig:980, emoji:'🌺', brand:'LiverGuard Pro', desc:'水飛薊素 Silymarin 280mg，強效護肝，修復肝細胞，促進肝臟排毒功能', benefits:['修復肝細胞損傷','增強肝臟解毒','降低肝指數','抗肝臟氧化'], targets:['liver','detox','antioxidant'], rating:4.8, reviews:289, stock:60, hot:true, recommend:false },
  { id:12, name:'朝鮮薊+薑黃護肝配方', cat:'肝臟保健', price:840, orig:1180, emoji:'💚', brand:'HepaPure', desc:'朝鮮薊葉萃取500mg+薑黃素200mg，雙效護肝，同時調節膽固醇，促進膽汁分泌', benefits:['護肝降脂','促進膽汁分泌','改善消化','降低ALT/AST'], targets:['liver','cholesterol','digestion'], rating:4.6, reviews:167, stock:44, hot:false, recommend:false },
  { id:13, name:'益生菌 300億活菌', cat:'腸胃健康', price:980, orig:1380, emoji:'🦠', brand:'ProbiLife 30B', desc:'12種菌株300億CFU，耐胃酸包埋技術，活菌到達腸道，全面調節腸道菌相', benefits:['改善便秘腹瀉','增強免疫力','改善腸道菌相','減少腸道發炎'], targets:['digestive','immunity','constipation'], rating:4.8, reviews:456, stock:70, hot:true, recommend:false },
  { id:14, name:'酵素+益生元複合配方', cat:'腸胃健康', price:680, orig:900, emoji:'🍃', brand:'DigestEase Plus', desc:'8種消化酵素+菊苣纖維益生元，分解三大營養素，改善消化吸收，減少脹氣', benefits:['改善消化不良','減少脹氣腹脹','促進營養吸收','餵養益生菌'], targets:['digestive','bloating','absorption'], rating:4.5, reviews:198, stock:58, hot:false, recommend:false },
  { id:15, name:'銀杏葉+磷脂絲胺酸 腦力增強', cat:'腦部認知', price:1080, orig:1480, emoji:'🧠', brand:'BrainBoost Pro', desc:'銀杏葉EGb761®120mg+磷脂絲胺酸200mg，改善腦部血循，強化記憶與專注力', benefits:['改善記憶力','增強專注力','促進腦部循環','預防認知退化'], targets:['brain','memory','circulation'], rating:4.7, reviews:223, stock:35, hot:false, recommend:false },
  { id:16, name:'NMN 菸醯胺單核苷酸 500mg', cat:'抗老化', price:2880, orig:3680, emoji:'✨', brand:'NMN Elite Pro', desc:'高純度β-NMN 500mg，直接補充NAD+前驅物，逆轉細胞老化，恢復年輕活力', benefits:['提升NAD+濃度','逆轉細胞老化','增強體力精力','改善代謝功能'], targets:['antiaging','energy','metabolism'], rating:4.9, reviews:189, stock:25, hot:true, recommend:false },
  { id:17, name:'蝦青素+葉黃素 眼睛護理', cat:'眼睛保健', price:780, orig:1050, emoji:'👁️', brand:'VisionClear Pro', desc:'蝦青素6mg+葉黃素20mg+玉米黃素4mg，全面保護視網膜，減緩眼睛疲勞', benefits:['保護視網膜黃斑','減輕眼睛疲勞','預防白內障','抗藍光損傷'], targets:['eye','vision','antioxidant'], rating:4.8, reviews:278, stock:48, hot:true, recommend:false },
  { id:18, name:'鎂甘胺酸鹽 睡眠配方', cat:'睡眠舒壓', price:680, orig:920, emoji:'🌙', brand:'SleepMag Plus', desc:'高吸收鎂甘胺酸鹽400mg，平衡神經系統，改善入睡困難，深度提升睡眠品質', benefits:['縮短入睡時間','改善睡眠品質','緩解壓力焦慮','放鬆肌肉神經'], targets:['sleep','stress','anxiety','muscle'], rating:4.8, reviews:367, stock:65, hot:true, recommend:false },
  { id:19, name:'維生素B群 高效能量', cat:'活力能量', price:480, orig:680, emoji:'💊', brand:'EnergyB Complex', desc:'8種B群維生素全配方，活化能量代謝，強化神經系統，改善疲勞提振精神', benefits:['提升精力體力','改善慢性疲勞','強化神經系統','促進細胞代謝'], targets:['energy','fatigue','nerve','metabolism'], rating:4.6, reviews:345, stock:80, hot:false, recommend:false },
  { id:20, name:'白藜蘆醇+葡萄籽 抗氧化', cat:'抗老化', price:920, orig:1280, emoji:'🍇', brand:'ResVeraShield', desc:'白藜蘆醇250mg+前花青素OPC 300mg，強效抗氧化，保護血管，延緩老化', benefits:['超強抗氧化','保護心血管','抗衰老細胞保護','改善皮膚彈性'], targets:['antioxidant','antiaging','cardiovascular','skin'], rating:4.7, reviews:234, stock:42, hot:false, recommend:false },
  { id:21, name:'維生素C 1000mg 緩釋型', cat:'免疫提升', price:420, orig:580, emoji:'🍊', brand:'VitaC Sustained', desc:'緩釋型維生素C 1000mg，持續12小時釋放，增強免疫力，膠原蛋白合成', benefits:['強化免疫系統','促進膠原蛋白','抗氧化保護','加速傷口癒合'], targets:['immunity','antioxidant','skin','collagen'], rating:4.7, reviews:412, stock:90, hot:false, recommend:false },
  { id:22, name:'鋅+硒+維C 免疫三劍客', cat:'免疫提升', price:560, orig:780, emoji:'🛡️', brand:'ImmuneShield Max', desc:'有機鋅30mg+硒200mcg+維C500mg，三效合一免疫強化，抗病毒，抗氧化', benefits:['增強免疫功能','抗病毒感染','支持甲狀腺健康','改善傷口癒合'], targets:['immunity','thyroid','antioxidant'], rating:4.6, reviews:234, stock:55, hot:false, recommend:false },
  { id:23, name:'褪黑激素 3mg 舒眠', cat:'睡眠舒壓', price:380, orig:520, emoji:'😴', brand:'SleepWell Melatonin', desc:'生理節律褪黑激素3mg，幫助調整時差與睡眠週期，自然入眠，不造成依賴', benefits:['幫助自然入睡','調整睡眠週期','減少夜間醒來','溫和無依賴性'], targets:['sleep','circadian'], rating:4.5, reviews:289, stock:75, hot:false, recommend:false },
  { id:24, name:'膠原蛋白肽 海洋萃取', cat:'美容養顏', price:780, orig:1050, emoji:'🌊', brand:'Marine Collagen Pro', desc:'低分子海洋膠原蛋白肽5000mg，搭配維C+玻尿酸，由內而外美肌，強化骨關節', benefits:['改善皮膚彈性','減少皺紋細紋','強化關節韌帶','促進骨骼健康'], targets:['skin','joint','bone','antiaging'], rating:4.8, reviews:356, stock:50, hot:true, recommend:false },
  { id:25, name:'α-硫辛酸 抗糖化', cat:'血糖管理', price:820, orig:1120, emoji:'🔬', brand:'AlphaLipoMax', desc:'α-硫辛酸 600mg，脂水兩溶性抗氧化劑，抗糖化，保護神經，改善胰島素阻抗', benefits:['抗糖化保護','改善神經病變','降低血糖','強效抗氧化'], targets:['bloodSugar','antiaging','nerve','antioxidant'], rating:4.7, reviews:145, stock:38, hot:false, recommend:false },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 健康自測資料 Assessment Data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ASSESSMENTS = {
  cardiovascular: {
    id:'cardiovascular', title:'心血管健康', emoji:'❤️', color:'#E74C3C',
    desc:'評估您的心臟與血管健康狀態',
    questions:[
      { q:'您的血壓情況如何？', opts:['正常（120/80以下）','偏高（120-139/80-89）','高血壓（140/90以上）','不確定'], scores:[0,3,6,2] },
      { q:'您的血脂（膽固醇）狀況？', opts:['正常','偏高','已有高血脂診斷','不確定'], scores:[0,3,6,2] },
      { q:'您是否有吸菸習慣？', opts:['從未吸菸','已戒菸5年以上','已戒菸5年以內','目前仍在吸菸'], scores:[0,1,2,6] },
      { q:'您每週進行有氧運動的頻率？', opts:['每週3次以上（30分鐘）','每週1-2次','偶爾運動','幾乎不運動'], scores:[0,2,4,6] },
      { q:'您是否有以下症狀？（選最符合）', opts:['無症狀','偶爾胸悶心悸','常感覺心跳不規則','曾有胸痛或呼吸困難'], scores:[0,3,5,8] },
      { q:'您的體重狀況（BMI）？', opts:['正常（18.5-24）','略為過重（24-27）','肥胖（27以上）','過輕（18.5以下）'], scores:[0,2,4,1] },
      { q:'您每天坐著不動的時間？', opts:['少於4小時','4-8小時','8-12小時','超過12小時'], scores:[0,2,4,6] },
      { q:'您是否有糖尿病或血糖偏高？', opts:['沒有','血糖前期','已診斷糖尿病','不確定'], scores:[0,3,6,2] },
      { q:'您的家族中是否有心臟病史？', opts:['沒有','祖父母輩有','父母輩有','父母中有人在60歲前心臟病'], scores:[0,1,3,6] },
      { q:'您平均每天壓力程度？', opts:['壓力很小，心情愉快','偶爾有壓力','長期中度壓力','長期高壓或焦慮'], scores:[0,1,3,5] },
    ],
    riskLevels:[
      { max:15, level:'低風險', color:C.success, icon:'✅', msg:'您的心血管健康狀況良好，繼續保持健康生活方式' },
      { max:30, level:'中風險', color:C.warning, icon:'⚠️', msg:'有若干風險因子需要注意，建議調整生活習慣並補充保健品' },
      { max:60, level:'高風險', color:C.danger, icon:'🚨', msg:'存在多項高風險因子，強烈建議就醫檢查並積極改善' },
    ],
    symptoms:['胸悶、胸痛','心悸、心跳不規則','呼吸短促','手腳冰冷麻木','頭暈、頭痛','容易疲勞','下肢水腫'],
    suggestions:['每天30分鐘以上有氧運動','減少飽和脂肪與鈉攝取','戒菸限酒','每週監測血壓','保持健康體重（BMI 18.5-24）','規律睡眠7-8小時','學習壓力管理技巧'],
    productTargets:['cardiovascular','cholesterol','inflammation','antioxidant'],
  },
  bloodSugar: {
    id:'bloodSugar', title:'血糖代謝評估', emoji:'🩸', color:'#E67E22',
    desc:'評估您的血糖調節與糖尿病風險',
    questions:[
      { q:'您的空腹血糖值？', opts:['正常（70-100）','邊界值（100-126）','糖尿病（126以上）','不知道'], scores:[0,4,8,2] },
      { q:'飯後您是否常感到特別疲倦想睡？', opts:['不會','偶爾會','幾乎每次飯後都會','有時還會頭暈'], scores:[0,2,4,5] },
      { q:'您是否常感到口渴、頻尿？', opts:['不會','偶爾','常常','口渴頻尿+視力模糊'], scores:[0,2,5,8] },
      { q:'您腰圍多少？（男性/女性）', opts:['男<90/女<80（正常）','男90-100/女80-90','男>100/女>90','不確定'], scores:[0,3,6,2] },
      { q:'您的家族有糖尿病史？', opts:['沒有','祖父母輩','父母其中一位','父母雙方都有'], scores:[0,2,4,6] },
      { q:'您的飲食習慣？', opts:['均衡飲食少糖少精製','偶爾吃甜食精製澱粉','常吃甜食含糖飲料','幾乎每天大量含糖食物'], scores:[0,2,4,6] },
      { q:'您是否常感到手腳麻木或刺痛？', opts:['從來不會','偶爾','時常','嚴重影響日常'], scores:[0,2,4,7] },
      { q:'傷口癒合速度？', opts:['正常快速癒合','稍微慢一點','明顯較慢','傷口不易癒合甚至感染'], scores:[0,1,3,6] },
    ],
    riskLevels:[
      { max:12, level:'低風險', color:C.success, icon:'✅', msg:'血糖代謝功能良好，注意維持健康飲食習慣' },
      { max:25, level:'中風險', color:C.warning, icon:'⚠️', msg:'血糖偏高或有多項風險因子，建議調整飲食並定期監測' },
      { max:55, level:'高風險', color:C.danger, icon:'🚨', msg:'血糖異常風險高，強烈建議就醫抽血檢查確認' },
    ],
    symptoms:['頻尿、多尿','異常口渴','莫名體重減輕','持續疲勞感','視力模糊','傷口不易癒合','手腳麻木刺痛'],
    suggestions:['減少精製糖與白米白麵攝取','每餐控制澱粉份量','飯後15-30分鐘步行10-15分鐘','定期監測空腹血糖','維持健康腰圍（男<90cm/女<80cm）','多攝取膳食纖維'],
    productTargets:['bloodSugar','diabetes','insulin','antioxidant'],
  },
  bone: {
    id:'bone', title:'骨骼關節評估', emoji:'🦴', color:'#8E44AD',
    desc:'評估骨質密度與關節健康狀態',
    questions:[
      { q:'您的年齡與性別？', opts:['男性50歲以下/女性45歲以下','男性50-65歲/停經前女性','停經後女性（任何年齡）','男性65歲以上/女性65歲以上'], scores:[0,2,4,5] },
      { q:'您是否有以下症狀？', opts:['無任何症狀','偶爾關節痠痛','常常關節疼痛僵硬','嚴重影響行動甚至變形'], scores:[0,2,4,7] },
      { q:'您的身高是否有縮水？', opts:['沒有','比年輕時矮不到1cm','矮了1-3cm','矮了3cm以上'], scores:[0,1,3,5] },
      { q:'您每天喝牛奶/補鈣嗎？', opts:['每天補充足夠鈣','偶爾補充','很少','從不且飲食少鈣'], scores:[0,1,3,5] },
      { q:'您曬太陽的習慣？', opts:['每天戶外活動20分鐘以上','偶爾','很少曬到太陽','幾乎都在室內'], scores:[0,1,3,5] },
      { q:'您是否有骨折病史？', opts:['從未骨折','30歲前有骨折','40歲後輕微骨折','骨質疏鬆性骨折'], scores:[0,1,3,7] },
      { q:'您有類固醇藥物長期使用史？', opts:['沒有','偶爾短期使用','使用超過3個月','長期使用中'], scores:[0,1,4,6] },
    ],
    riskLevels:[
      { max:10, level:'低風險', color:C.success, icon:'✅', msg:'骨骼健康狀況不錯，持續補鈣與規律運動維持' },
      { max:20, level:'中風險', color:C.warning, icon:'⚠️', msg:'有骨質流失風險，建議積極補鈣鎂維D，負重運動' },
      { max:40, level:'高風險', color:C.danger, icon:'🚨', msg:'骨質疏鬆風險高，建議儘速進行骨密度檢查' },
    ],
    symptoms:['背部或腰部持續疼痛','身高逐漸縮短','關節腫脹僵硬','早晨起床關節僵硬','爬樓梯膝蓋疼痛','輕微外力就骨折'],
    suggestions:['每天鈣攝取1200mg（50歲以上）','補充維生素D3 2000-4000IU','每週3次負重運動（快走、跳舞）','避免高鈉高磷食物','減少咖啡因攝取','戒菸限酒'],
    productTargets:['bone','osteoporosis','joint','muscle'],
  },
  liver: {
    id:'liver', title:'肝臟健康評估', emoji:'🫀', color:'#27AE60',
    desc:'評估您的肝臟功能與健康狀態',
    questions:[
      { q:'您是否常感到疲勞乏力？', opts:['精力充沛','偶爾疲倦','常常疲倦','長期疲勞無力'], scores:[0,1,3,5] },
      { q:'您的飲酒習慣？', opts:['不喝酒','偶爾應酬','每週3-4次','每天喝酒'], scores:[0,1,4,7] },
      { q:'您的體重？', opts:['正常BMI','輕微過重','明顯肥胖','腹部肥胖明顯'], scores:[0,2,4,5] },
      { q:'您最近體檢肝指數（GOT/GPT）？', opts:['正常範圍','輕微偏高','明顯偏高','超過正常3倍以上'], scores:[0,2,5,8] },
      { q:'您是否有B肝或C肝帶原？', opts:['沒有','已篩檢陰性','帶原但定期追蹤','帶原且未追蹤'], scores:[0,0,5,8] },
      { q:'您是否常吃油炸、加工食物？', opts:['很少','偶爾','常常','幾乎每天'], scores:[0,1,3,5] },
      { q:'您是否曾出現黃疸、眼白發黃？', opts:['從來沒有','曾經短暫出現','偶爾會有','目前有此情況'], scores:[0,2,5,8] },
    ],
    riskLevels:[
      { max:10, level:'低風險', color:C.success, icon:'✅', msg:'肝臟功能良好，保持健康生活不喝酒' },
      { max:22, level:'中風險', color:C.warning, icon:'⚠️', msg:'有肝臟負擔，建議護肝飲食與保健品' },
      { max:46, level:'高風險', color:C.danger, icon:'🚨', msg:'肝臟健康警訊，立即就醫進行肝功能檢查' },
    ],
    symptoms:['右上腹隱痛或不適','持續性疲勞感','皮膚眼白泛黃','尿液變深色','噁心、食慾不振','腹部脹大水腫','皮膚搔癢'],
    suggestions:['完全戒酒或嚴格限酒','多攝取新鮮蔬果','避免不必要的藥物','接種A肝B肝疫苗','維持健康體重','定期做腹部超音波'],
    productTargets:['liver','detox','antioxidant','inflammation'],
  },
  sleep: {
    id:'sleep', title:'睡眠品質評估', emoji:'😴', color:'#2471A3',
    desc:'評估您的睡眠品質與失眠風險',
    questions:[
      { q:'您平均入睡需要多長時間？', opts:['10分鐘內','10-30分鐘','30-60分鐘','超過1小時'], scores:[0,1,4,7] },
      { q:'您每晚睡眠總時數？', opts:['7-9小時','6-7小時','少於6小時','超過9小時'], scores:[0,1,4,2] },
      { q:'您夜間醒來的頻率？', opts:['幾乎不會','1-2次','3次以上','幾乎整夜斷斷續續'], scores:[0,1,4,7] },
      { q:'早晨起床感覺？', opts:['精神飽滿','稍微疲倦','相當疲倦','非常疲倦無法提神'], scores:[0,1,3,6] },
      { q:'您睡前的習慣？', opts:['不使用手機或電腦','偶爾使用1小時','使用1-2小時','超過2小時甚至睡前滑手機'], scores:[0,1,3,5] },
      { q:'您是否有焦慮或憂鬱傾向？', opts:['心情愉快穩定','偶爾情緒起伏','常常焦慮緊張','有就醫或服藥'], scores:[0,1,4,6] },
    ],
    riskLevels:[
      { max:8, level:'低風險', color:C.success, icon:'✅', msg:'睡眠品質良好，繼續保持規律睡眠習慣' },
      { max:18, level:'中風險', color:C.warning, icon:'⚠️', msg:'睡眠品質不佳，建議調整睡前習慣與補充助眠保健品' },
      { max:38, level:'高風險', color:C.danger, icon:'🚨', msg:'嚴重睡眠障礙，建議諮詢醫師評估' },
    ],
    symptoms:['入睡困難焦慮','夜間頻繁醒來','早上過早清醒','日間精神不濟','情緒煩躁易怒','注意力難以集中'],
    suggestions:['固定就寢與起床時間','睡前1小時避免藍光螢幕','建立睡前放鬆儀式','睡房保持涼爽黑暗','下午後避免咖啡因','規律有氧運動（但非睡前）'],
    productTargets:['sleep','stress','anxiety','muscle'],
  },
  immunity: {
    id:'immunity', title:'免疫力評估', emoji:'🛡️', color:'#1B5C3E',
    desc:'評估您的免疫系統防禦能力',
    questions:[
      { q:'您每年感冒發生幾次？', opts:['0-1次','2-3次','4-5次','5次以上'], scores:[0,1,4,7] },
      { q:'感冒後恢復時間？', opts:['3-5天快速恢復','1週','超過2週','常常反覆發作'], scores:[0,1,3,5] },
      { q:'您的壓力與作息狀況？', opts:['生活規律壓力小','偶有壓力','長期慢性壓力','壓力極大睡眠不足'], scores:[0,1,3,6] },
      { q:'您的飲食習慣？', opts:['均衡多蔬果','蔬果攝取不足','以加工食品為主','幾乎不吃新鮮食物'], scores:[0,2,4,6] },
      { q:'您是否常有口腔潰瘍或帶狀皰疹？', opts:['幾乎沒有','每年1-2次','每年超過3次','幾乎每月都有'], scores:[0,1,4,7] },
      { q:'您的運動習慣？', opts:['規律每週3次以上','偶爾運動','很少運動','幾乎不運動'], scores:[0,1,3,5] },
    ],
    riskLevels:[
      { max:8, level:'低風險', color:C.success, icon:'✅', msg:'免疫力良好，繼續保持健康生活方式' },
      { max:18, level:'中風險', color:C.warning, icon:'⚠️', msg:'免疫功能偏弱，建議補充免疫保健品並改善生活習慣' },
      { max:36, level:'高風險', color:C.danger, icon:'🚨', msg:'免疫功能低下，建議就醫進一步評估' },
    ],
    symptoms:['頻繁感冒發燒','感冒難以康復','口腔潰瘍反覆發作','帶狀皰疹（皮蛇）','傷口感染不易癒合','長期疲倦無精打采'],
    suggestions:['每天7小時以上優質睡眠','均衡飲食多蔬果','規律有氧運動','避免長期過度壓力','補充維C鋅等免疫營養素','保持正向心態'],
    productTargets:['immunity','antioxidant','vitamin','energy'],
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 健康記錄模擬資料
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const bpData = [
  {date:'1/15',sys:145,dia:92},{date:'1/22',sys:142,dia:90},{date:'2/1',sys:138,dia:88},
  {date:'2/10',sys:140,dia:89},{date:'2/20',sys:135,dia:86},{date:'3/1',sys:132,dia:84},
  {date:'3/10',sys:128,dia:82},{date:'3/20',sys:125,dia:80},{date:'4/1',sys:122,dia:78},
  {date:'4/10',sys:120,dia:78},{date:'4/15',sys:118,dia:76},
];
const bsData = [
  {date:'1/15',value:112},{date:'2/1',value:108},{date:'2/15',value:110},
  {date:'3/1',value:105},{date:'3/15',value:103},{date:'4/1',value:100},{date:'4/15',value:98},
];
const weightData = [
  {date:'1/1',value:78.5},{date:'1/15',value:78.2},{date:'2/1',value:77.8},{date:'2/15',value:77.5},
  {date:'3/1',value:77.0},{date:'3/15',value:76.5},{date:'4/1',value:76.2},{date:'4/15',value:75.8},
];
const sleepData = [
  {date:'週一',value:5.5},{date:'週二',value:6.0},{date:'週三',value:7.0},{date:'週四',value:6.5},
  {date:'週五',value:5.5},{date:'週六',value:7.5},{date:'週日',value:8.0},
];

// 體檢報告參數
const EXAM_PARAMS = {
  bloodLipids: [
    { id:'tc', label:'總膽固醇', unit:'mg/dL', low:0, normalLow:0, normalHigh:200, high:240, warn:'總膽固醇偏高', detail:'增加心血管健康風險，建議減少飽和脂肪攝取' },
    { id:'ldl', label:'LDL 壞膽固醇', unit:'mg/dL', low:0, normalLow:0, normalHigh:100, high:160, warn:'LDL偏高', detail:'增加動脈硬化風險，建議補充魚油、紅麴' },
    { id:'hdl', label:'HDL 好膽固醇', unit:'mg/dL', low:40, normalLow:60, normalHigh:999, high:999, warn:'HDL偏低', detail:'心臟保護力不足，建議有氧運動並補充Omega-3' },
    { id:'tg', label:'三酸甘油脂', unit:'mg/dL', low:0, normalLow:0, normalHigh:150, high:200, warn:'三酸甘油脂偏高', detail:'代謝症候群警訊，建議減糖減酒，補充魚油' },
  ],
  liverFunction: [
    { id:'got', label:'GOT (AST)', unit:'U/L', low:0, normalLow:0, normalHigh:40, high:80, warn:'GOT偏高', detail:'肝細胞損傷指標，建議戒酒護肝，補充奶薊草' },
    { id:'gpt', label:'GPT (ALT)', unit:'U/L', low:0, normalLow:0, normalHigh:40, high:80, warn:'GPT偏高', detail:'肝臟發炎指標，需進一步追蹤，補充薑黃素護肝' },
    { id:'ggt', label:'γ-GT', unit:'U/L', low:0, normalLow:0, normalHigh:50, high:100, warn:'γ-GT偏高', detail:'常見於飲酒或膽管問題，建議立即戒酒' },
  ],
  kidneyFunction: [
    { id:'cre', label:'肌酸酐 Creatinine', unit:'mg/dL', low:0, normalLow:0.6, normalHigh:1.2, high:2.0, warn:'肌酸酐偏高', detail:'腎功能下降，建議就醫追蹤，多喝水' },
    { id:'bun', label:'血尿素氮 BUN', unit:'mg/dL', low:0, normalLow:7, normalHigh:20, high:30, warn:'BUN偏高', detail:'可能蛋白質攝取過多或腎功能下降' },
    { id:'ua', label:'尿酸 Uric Acid', unit:'mg/dL', low:0, normalLow:0, normalHigh:7.0, high:9.0, warn:'尿酸偏高（高尿酸血症）', detail:'痛風風險高，建議少吃海鮮內臟，多喝水' },
  ],
  bloodSugar: [
    { id:'fbg', label:'空腹血糖', unit:'mg/dL', low:70, normalLow:70, normalHigh:100, high:126, warn:'血糖偏高', detail:'糖尿病前期或糖尿病，建議控制飲食，補充苦瓜胜肽' },
    { id:'hba1c', label:'糖化血色素 HbA1c', unit:'%', low:0, normalLow:0, normalHigh:5.7, high:6.5, warn:'HbA1c偏高', detail:'近3個月血糖控制不佳，建議諮詢醫師評估' },
  ],
  thyroid: [
    { id:'tsh', label:'甲促素 TSH', unit:'μIU/mL', low:0.4, normalLow:0.4, normalHigh:4.0, high:10, warn:'TSH異常', detail:'甲狀腺功能異常，建議就醫進一步評估' },
  ],
  inflammation: [
    { id:'crp', label:'C反應蛋白 CRP', unit:'mg/L', low:0, normalLow:0, normalHigh:1.0, high:3.0, warn:'發炎指數偏高', detail:'體內慢性發炎，心血管風險指標，補充魚油薑黃素' },
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 推薦引擎
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildRecommendations(assessResults, examValues, healthRecords) {
  const targetSet = new Set();
  const reasons = {};

  // 從自測結果
  Object.entries(assessResults).forEach(([key, r]) => {
    if (r && r.score >= 15) {
      const a = ASSESSMENTS[key];
      a.productTargets.forEach(t => {
        targetSet.add(t);
        reasons[t] = reasons[t] || [];
        reasons[t].push(`${a.title}：${r.level}`);
      });
    }
  });

  // 從體檢數值
  Object.entries(examValues).forEach(([paramId, val]) => {
    if (!val) return;
    const numVal = parseFloat(val);
    const allParams = Object.values(EXAM_PARAMS).flat();
    const param = allParams.find(p => p.id === paramId);
    if (!param) return;
    if (numVal > param.normalHigh) {
      if (['tc','ldl','tg'].includes(paramId)) { targetSet.add('cholesterol'); targetSet.add('cardiovascular'); reasons['cholesterol'] = reasons['cholesterol']||[]; reasons['cholesterol'].push(`${param.label}偏高（${numVal}）`); }
      if (['got','gpt','ggt'].includes(paramId)) { targetSet.add('liver'); targetSet.add('detox'); reasons['liver'] = reasons['liver']||[]; reasons['liver'].push(`${param.label}偏高（${numVal}）`); }
      if (['fbg','hba1c'].includes(paramId)) { targetSet.add('bloodSugar'); reasons['bloodSugar'] = reasons['bloodSugar']||[]; reasons['bloodSugar'].push(`${param.label}偏高（${numVal}）`); }
      if (paramId==='ua') { targetSet.add('kidney'); reasons['kidney'] = reasons['kidney']||[]; reasons['kidney'].push(`尿酸偏高（${numVal}）`); }
      if (paramId==='crp') { targetSet.add('inflammation'); targetSet.add('antioxidant'); reasons['inflammation'] = reasons['inflammation']||[]; reasons['inflammation'].push(`發炎指數偏高（${numVal}）`); }
    }
    if (paramId==='hdl' && numVal < param.normalLow) { targetSet.add('cardiovascular'); reasons['cardiovascular'] = reasons['cardiovascular']||[]; reasons['cardiovascular'].push(`好膽固醇HDL偏低（${numVal}）`); }
  });

  // 從健康記錄
  const lastBP = healthRecords?.bp;
  if (lastBP && lastBP.sys > 130) { targetSet.add('bloodPressure'); targetSet.add('cardiovascular'); }

  // 計算產品分數
  return PRODUCTS.map(p => {
    const matchScore = p.targets.filter(t => targetSet.has(t)).length;
    const matchedTargets = p.targets.filter(t => targetSet.has(t));
    const reasonList = matchedTargets.flatMap(t => reasons[t]||[]);
    return { ...p, matchScore, recommend: matchScore > 0, reasons: [...new Set(reasonList)] };
  }).sort((a,b) => b.matchScore - a.matchScore);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UI 基礎組件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Badge = ({ children, color=C.primary, size='sm' }) => (
  <span style={{ background:color+'20', color, fontSize:size==='sm'?11:13, fontWeight:700, padding:'3px 9px', borderRadius:20, display:'inline-block', letterSpacing:'0.3px' }}>
    {children}
  </span>
);

const RiskBar = ({ score, max=100 }) => {
  const pct = Math.min((score/max)*100, 100);
  const color = pct<30 ? C.success : pct<60 ? C.warning : C.danger;
  return (
    <div style={{ background:'#eee', borderRadius:6, height:10, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:6, transition:'width 0.8s ease' }} />
    </div>
  );
};

const StarRating = ({ rating }) => (
  <span style={{ color:'#F5A623', fontSize:13 }}>
    {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5-Math.floor(rating))} <span style={{ color:C.textS, fontSize:12 }}>{rating}</span>
  </span>
);

const Divider = () => <div style={{ height:1, background:C.borderL, margin:'12px 0' }} />;

const SectionHeader = ({ title, sub, action, onAction }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:16 }}>
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.text, letterSpacing:'-0.3px' }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:C.textS, marginTop:3 }}>{sub}</div>}
    </div>
    {action && <button onClick={onAction} style={{ background:'none', border:'none', color:C.primary, fontSize:14, fontWeight:600, cursor:'pointer' }}>{action} ›</button>}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 認證系統 Auth System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 需要登入才能使用的頁面
const GATED_PAGES = ['records','report','analysis','diary','family'];
// 需要登入才能使用的操作
const GATED_ACTIONS = ['checkout','addDiary','uploadReport','aiAnalysis','orderTracking'];

// 積分系統常數
const POINTS = {
  register: 200,
  firstLogin: 50,
  dailyLogin: 10,
  recordStreak7: 100,
  recordStreak30: 500,
  uploadReport: 80,
  completeSurvey: 50,
  firstOrder: 150,
};

// 會員等級
const MEMBER_LEVELS = [
  { min:0,    max:499,   label:'健康新手', color:'#78909C', badge:'🌱' },
  { min:500,  max:1499,  label:'健康達人', color:'#C87A0A', badge:'⭐' },
  { min:1500, max:4999,  label:'健康菁英', color:'#1B5C3E', badge:'💎' },
  { min:5000, max:99999, label:'健康大師', color:'#8E44AD', badge:'👑' },
];

const getMemberLevel = (pts) => MEMBER_LEVELS.find(l=>pts>=l.min&&pts<=l.max)||MEMBER_LEVELS[0];

// 軟性登入牆組件 — 頁面內容半透明覆蓋
function LoginGate({ pageName, onLogin, children }) {
  const pageNames = { records:'健康記錄', report:'體檢報告', analysis:'AI健康分析', diary:'健康日記', family:'家人健康管理' };
  const pagePerks = {
    records:  ['記錄血壓血糖趨勢', '圖表分析30天變化', '健康目標追蹤'],
    report:   ['AI白話解讀報告', '指標異常智能提醒', '就醫方向指引'],
    analysis: ['整合數據個人化推薦', 'AI智能保健品匹配', '多維度健康評分'],
    diary:    ['記錄每日身心狀態', '情緒與症狀追蹤', '飲食記錄管理'],
    family:   ['管理最多5位家人', '家人慢性病監控', 'AI健康建議通知'],
  };
  const perks = pagePerks[pageName] || ['個人化健康分析','AI智能推薦','完整功能解鎖'];

  return (
    <div style={{position:'relative',minHeight:'100vh'}}>
      {/* 背景模糊預覽 */}
      <div style={{filter:'blur(3px)',opacity:0.35,pointerEvents:'none',userSelect:'none'}}>
        {children}
      </div>
      {/* 覆蓋層 */}
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px',background:'linear-gradient(180deg,rgba(245,239,226,0.5) 0%,rgba(245,239,226,0.97) 30%)'}}>
        <div style={{background:'#fff',borderRadius:24,padding:'28px 22px',width:'100%',maxWidth:360,boxShadow:'0 16px 48px rgba(0,0,0,0.14)',border:`2px solid ${C.primary}20`}}>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:52,marginBottom:8}}>🔐</div>
            <div style={{fontSize:20,fontWeight:900,color:C.text}}>登入後即可使用</div>
            <div style={{fontSize:15,color:C.primary,fontWeight:700,marginTop:4}}>{pageNames[pageName]||'此功能'}</div>
          </div>
          {/* 功能亮點 */}
          <div style={{background:`${C.primary}08`,borderRadius:14,padding:'14px 16px',marginBottom:18}}>
            {perks.map((p,i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'5px 0'}}>
                <span style={{color:C.success,fontSize:16}}>✓</span>
                <span style={{fontSize:13,color:C.text}}>{p}</span>
              </div>
            ))}
          </div>
          {/* 免費福利 */}
          <div style={{background:'linear-gradient(135deg,#C87A0A18,#E8960F10)',borderRadius:14,padding:'12px 16px',marginBottom:20,display:'flex',gap:10,alignItems:'center'}}>
            <span style={{fontSize:28}}>🎁</span>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:C.accent}}>立即免費注冊</div>
              <div style={{fontSize:12,color:C.textS}}>送 200 積分 + 首單 9 折優惠券</div>
            </div>
          </div>
          <button onClick={()=>onLogin('register')} style={{...S.btn('primary'),marginBottom:10,fontSize:17}}>立即免費注冊</button>
          <button onClick={()=>onLogin('login')} style={{...S.btn('outline')}}>已有帳號？登入</button>
        </div>
      </div>
    </div>
  );
}

// ── 模塊級表單組件（必須在組件外定義，避免每次重渲染時重建導致失焦）──
function AuthFormField({ k, label, placeholder, type='text', right=null, form, setForm, errors, setErrors }) {
  return (
    <div style={{marginBottom:16}}>
      <label style={{fontSize:13,fontWeight:700,color:C.textS,display:'block',marginBottom:6}}>{label}</label>
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        <input
          type={type}
          value={form[k]||''}
          onChange={e=>{ setForm(f=>({...f,[k]:e.target.value})); if(setErrors) setErrors(er=>({...er,[k]:''})); }}
          placeholder={placeholder}
          style={{width:'100%',border:`2px solid ${errors&&errors[k]?C.danger:C.border}`,borderRadius:12,padding:'13px 16px',fontSize:16,outline:'none',color:C.text,background:C.bg,boxSizing:'border-box',paddingRight:right?'48px':'16px'}}
        />
        {right}
      </div>
      {errors&&errors[k] && <div style={{fontSize:12,color:C.danger,marginTop:4}}>⚠ {errors[k]}</div>}
    </div>
  );
}

// 登入/注冊 Modal
function AuthModal({ mode: initMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initMode||'login'); // login | register | forgot
  const [step, setStep] = useState(1); // register: 1=基本資料, 2=驗證碼
  const [form, setForm] = useState({ nickname:'', phone:'', password:'', password2:'', code:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  // 倒計時
  const startTimer = () => {
    setCodeTimer(60);
    const t = setInterval(()=>setCodeTimer(v=>{ if(v<=1){ clearInterval(t); return 0; } return v-1; }),1000);
  };

  const validate = () => {
    const e = {};
    if (mode==='register') {
      if (!form.nickname.trim()) e.nickname='請輸入名字或暱稱';
      else if (form.nickname.trim().length < 2) e.nickname='名稱至少2個字';
      if (!form.phone.match(/^09\d{8}$/)) e.phone='請輸入正確的手機號碼（09xxxxxxxx）';
      if (form.password.length < 6) e.password='密碼至少6位數';
      if (form.password !== form.password2) e.password2='兩次密碼不一致';
    }
    if (mode==='login') {
      if (!form.phone.match(/^09\d{8}$/)) e.phone='請輸入正確的手機號碼';
      if (!form.password) e.password='請輸入密碼';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendCode = () => {
    if (!form.phone.match(/^09\d{8}$/)) { setErrors({phone:'請先輸入正確的手機號碼'}); return; }
    setCodeSent(true);
    startTimer();
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      let result;
      if (mode === 'register') {
        result = await registerUser({ nickname: form.nickname, phone: form.phone, password: form.password });
      } else {
        result = await loginUser({ phone: form.phone, password: form.password });
      }
      if (result.error) {
        setErrors({ submit: result.error });
        setLoading(false);
        return;
      }
      const u = result.user;
      onSuccess({
        id: u.id,
        nickname: u.nickname,
        phone: u.phone,
        points: u.points || 200,
        joinDate: u.join_date,
        isNew: mode === 'register',
        streak: u.streak || 0,
        orders: u.orders_count || 0,
        coupon: u.coupon_active,
        pointsAdded: u.pointsAdded || 0,
      });
    } catch (e) {
      setErrors({ submit: '網絡錯誤，請稍後再試' });
    }
    setLoading(false);
  };

  // F is defined at module level to prevent remount on every keystroke

  const eyeBtn = (field, show, setShow) => (
    <button type="button" onClick={()=>setShow(!show)} style={{position:'absolute',right:14,background:'none',border:'none',cursor:'pointer',fontSize:18,color:C.textL,padding:0}}>
      {show?'🙈':'👁️'}
    </button>
  );

  return (
    <div style={{position:'fixed',inset:0,zIndex:2000,display:'flex',alignItems:'flex-end',background:'rgba(0,0,0,0.5)'}} onClick={onClose}>
      <div style={{width:'100%',maxWidth:480,margin:'0 auto',background:'#fff',borderRadius:'24px 24px 0 0',padding:'24px 20px 40px',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        {/* Handle bar */}
        <div style={{width:40,height:4,background:C.borderL,borderRadius:4,margin:'0 auto 20px'}}/>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>{mode==='register'?'🌱':'👋'}</div>
          <div style={{fontSize:22,fontWeight:900,color:C.text}}>
            {mode==='register'?'免費注冊':'歡迎回來'}
          </div>
          <div style={{fontSize:14,color:C.textS,marginTop:4}}>
            {mode==='register'?'注冊成功立即獲得 200 積分 🎁':'登入您的健康守護帳號'}
          </div>
        </div>

        {/* 注冊福利橫幅 */}
        {mode==='register' && (
          <div style={{background:'linear-gradient(135deg,#1B5C3E,#2A7D55)',borderRadius:16,padding:'14px 16px',marginBottom:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{emoji:'🎁',val:'200積分',sub:'注冊即送'},{emoji:'🏷️',val:'首單9折',sub:'專屬優惠券'},{emoji:'🤖',val:'AI解讀',sub:'體檢報告'},{emoji:'👨‍👩‍👧',val:'家人管理',sub:'全功能解鎖'}].map(b=>(
              <div key={b.sub} style={{background:'rgba(255,255,255,0.12)',borderRadius:10,padding:'8px 10px',display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:20}}>{b.emoji}</span>
                <div><div style={{fontSize:13,fontWeight:800,color:'#fff'}}>{b.val}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.7)'}}>{b.sub}</div></div>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        {mode==='register' && (
          <AuthFormField k="nickname" label="您的名字或暱稱" placeholder="例：阿玲、王媽媽、Peter" form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
        )}
        <AuthFormField k="phone" label="手機號碼" placeholder="09xxxxxxxx" type="tel" form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
        <AuthFormField k="password" label="密碼（至少6位）" placeholder="請設定密碼" type={showPwd?'text':'password'} right={eyeBtn('password',showPwd,setShowPwd)} form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
        {mode==='register' && (
          <AuthFormField k="password2" label="再次確認密碼" placeholder="再輸入一次密碼" type={showPwd2?'text':'password'} right={eyeBtn('password2',showPwd2,setShowPwd2)} form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
        )}

        {/* 條款 */}
        {mode==='register' && (
          <div style={{fontSize:12,color:C.textS,marginBottom:20,lineHeight:1.7,textAlign:'center'}}>
            注冊即同意<span style={{color:C.primary,fontWeight:700}}>服務條款</span>與<span style={{color:C.primary,fontWeight:700}}>隱私政策</span><br/>
            我們承諾：您的健康數據不會對外分享
          </div>
        )}

        {/* Submit error */}
        {errors.submit && <div style={{background:C.danger+'12',border:`1px solid ${C.danger}40`,borderRadius:12,padding:'10px 14px',color:C.danger,fontSize:13,fontWeight:600,marginBottom:12}}>⚠️ {errors.submit}</div>}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{...S.btn('primary'),fontSize:17,marginBottom:14,opacity:loading?0.7:1}}>
          {loading ? '處理中...' : (mode==='register' ? '✅ 立即免費注冊' : '🔑 登入帳號')}
        </button>

        {/* Switch mode */}
        <div style={{textAlign:'center',fontSize:14,color:C.textS}}>
          {mode==='register'
            ? <span>已有帳號？<button onClick={()=>{setMode('login');setErrors({});}} style={{background:'none',border:'none',color:C.primary,fontWeight:800,fontSize:14,cursor:'pointer'}}>立即登入</button></span>
            : <span>還沒有帳號？<button onClick={()=>{setMode('register');setErrors({});}} style={{background:'none',border:'none',color:C.primary,fontWeight:800,fontSize:14,cursor:'pointer'}}>免費注冊</button></span>
          }
        </div>
        {mode==='login' && (
          <div style={{textAlign:'center',marginTop:12,fontSize:13,color:C.textS}}>
            忘記密碼？請聯絡客服 LINE：<span style={{color:C.primary,fontWeight:700}}>@healthguard</span>，提供手機號碼即可重置
          </div>
        )}
      </div>
    </div>
  );
}

// 注冊成功 / 歡迎回來 彈窗
function WelcomePopup({ user, onClose }) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:2100,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(0,0,0,0.5)'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:24,padding:'32px 24px',width:'100%',maxWidth:340,textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:64,marginBottom:12}}>{user.isNew?'🎉':'✨'}</div>
        <div style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:6}}>
          {user.isNew?'注冊成功！':'歡迎回來！'}
        </div>
        <div style={{fontSize:16,color:C.primary,fontWeight:700,marginBottom:20}}>{user.nickname}</div>
        {user.isNew && (
          <div style={{background:`linear-gradient(135deg,${C.primary}15,${C.accent}10)`,borderRadius:16,padding:'16px',marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>🎁 歡迎禮已入帳</div>
            {[{emoji:'💰',text:`${POINTS.register} 積分 已入帳`},{emoji:'🏷️',text:'首單9折優惠券 已領取'}].map((g,i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'6px 0',borderBottom:i===0?`1px solid ${C.borderL}`:'none'}}>
                <span style={{fontSize:20}}>{g.emoji}</span>
                <span style={{fontSize:14,color:C.text}}>{g.text}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} style={S.btn('primary')}>開始使用 →</button>
      </div>
    </div>
  );
}

// 首頁 HomePage
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function HomePage({ state, setState, user, requireLogin }) {
  const { assessResults, examValues, cart } = state;
  const completedAssessments = Object.values(assessResults).filter(Boolean).length;
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const healthScore = completedAssessments > 0
    ? Math.max(20, 100 - Object.values(assessResults).filter(Boolean).reduce((s,r)=>s+(r.score||0),0)/completedAssessments*1.5)
    : null;

  const radarData = [
    { subject:'心血管', value: assessResults.cardiovascular ? Math.max(10,100-assessResults.cardiovascular.score*2.5) : 80 },
    { subject:'血糖代謝', value: assessResults.bloodSugar ? Math.max(10,100-assessResults.bloodSugar.score*3) : 75 },
    { subject:'骨骼關節', value: assessResults.bone ? Math.max(10,100-assessResults.bone.score*4) : 70 },
    { subject:'肝臟健康', value: assessResults.liver ? Math.max(10,100-assessResults.liver.score*3.5) : 78 },
    { subject:'睡眠品質', value: assessResults.sleep ? Math.max(10,100-assessResults.sleep.score*3) : 65 },
    { subject:'免疫力', value: assessResults.immunity ? Math.max(10,100-assessResults.immunity.score*3) : 72 },
  ];

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(145deg,${C.primary},${C.primaryL})`, padding:'24px 20px 32px', borderRadius:'0 0 28px 28px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginBottom:4 }}>健康守護 · 您的專屬管家</div>
            <div style={{ color:'#fff', fontSize:22, fontWeight:800 }}>👋 {user ? `您好，${user.nickname}` : '您好，訪客'}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:4 }}>{user ? `💰 積分：${user.points||0}` : '登入後享完整功能'}</div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setState(s=>({...s,page:'mall',subpage:'cart'}))} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:12, padding:'10px 14px', cursor:'pointer', position:'relative' }}>
              <span style={{ fontSize:20 }}>🛒</span>
              {cartCount > 0 && <span style={{ position:'absolute', top:4, right:4, background:C.accent, color:'#fff', fontSize:10, fontWeight:800, borderRadius:99, width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</span>}
            </button>
            <button onClick={()=>setState(s=>({...s,page:'profile'}))} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:12, padding:'10px 14px', cursor:'pointer' }}>
              <span style={{ fontSize:20 }}>🔔</span>
            </button>
          </div>
        </div>

        {/* Health Score Card */}
        <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:20, padding:'16px 20px', backdropFilter:'blur(10px)' }}>
          {!user ? (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <div style={{ color:'rgba(255,255,255,0.95)', fontSize:16, fontWeight:700, marginBottom:6 }}>🌱 免費注冊，開始健康管理</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, marginBottom:14 }}>AI體檢解讀 · 健康記錄 · 個人化保健推薦</div>
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                <button onClick={()=>requireLogin('register')} style={{ background:`linear-gradient(135deg,${C.accent},${C.accentL})`, border:'none', borderRadius:12, padding:'10px 20px', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' }}>免費注冊</button>
                <button onClick={()=>requireLogin('login')} style={{ background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.5)', borderRadius:12, padding:'10px 20px', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>登入</button>
              </div>
            </div>
          ) : healthScore ? (
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:48, fontWeight:900, color:'#fff', lineHeight:1 }}>{Math.round(healthScore)}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:4 }}>健康評分</div>
              </div>
              <div style={{ flex:1 }}>
                <ResponsiveContainer width="100%" height={90}>
                  <RadarChart data={radarData} margin={{top:5,right:5,bottom:5,left:5}}>
                    <PolarGrid stroke="rgba(255,255,255,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill:'rgba(255,255,255,0.7)', fontSize:12 }} />
                    <Radar dataKey="value" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🌟</div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>完成健康自測，獲取您的健康評分</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:4 }}>已完成 {completedAssessments}/6 項評估</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding:'0 16px', marginTop:-8 }}>
        {/* Quick Actions */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.textS, marginBottom:14 }}>快速入口</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {[
              { label:'健康自測', emoji:'🩺', page:'assessment', color:'#E74C3C' },
              { label:'健康記錄', emoji:'📊', page:'records', color:'#2471A3' },
              { label:'報告解讀', emoji:'🔬', page:'report', color:'#8E44AD' },
              { label:'保健商城', emoji:'🛍️', page:'mall', color:'#C87A0A' },
              { label:'智能推薦', emoji:'🤖', page:'analysis', color:'#1B5C3E' },
              { label:'健康日記', emoji:'📓', page:'diary', color:'#16A085' },
              { label:'家人健康', emoji:'👨‍👩‍👧', page:'family', color:'#884EA0' },
              { label:'個人中心', emoji:'👤', page:'profile', color:'#5D6D7E' },
            ].map(a=>(
              <button key={a.page} onClick={()=>setState(s=>({...s,page:a.page}))} style={{ background:`${a.color}12`, border:`1px solid ${a.color}30`, borderRadius:14, padding:'12px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer' }}>
                <span style={{ fontSize:24 }}>{a.emoji}</span>
                <span style={{ fontSize:11, fontWeight:600, color:a.color }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Status */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <SectionHeader title="今日健康數據" sub={user ? '最近記錄' : '登入後顯示您的數據'} action="查看更多" onAction={()=>setState(s=>({...s,page: user?'records':'records'}))} />
          {user ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {[
                { label:'血壓', val: state.newRecord?.sys ? `${state.newRecord.sys}/${state.newRecord.dia}` : '---', unit:'mmHg', emoji:'💓', color:C.success },
                { label:'空腹血糖', val: state.newRecord?.bs || '---', unit:'mg/dL', emoji:'🩸', color:C.success },
                { label:'體重', val: state.newRecord?.weight || '---', unit:'kg', emoji:'⚖️', color:C.info },
                { label:'睡眠時數', val: state.newRecord?.sleep || '---', unit:'小時', emoji:'😴', color:C.warning },
              ].map(m=>(
                <div key={m.label} style={{ background:`${m.color}10`, border:`1px solid ${m.color}30`, borderRadius:12, padding:'12px 14px' }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{m.emoji}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:C.text }}>{m.val}<span style={{ fontSize:11, color:C.textS, marginLeft:3 }}>{m.unit}</span></div>
                  <div style={{ fontSize:12, color:C.textS }}>{m.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'20px', color:C.textS }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📊</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>完成記錄後，這裡將顯示您的健康數據</div>
              <button onClick={()=>setState(s=>({...s,page:'records'}))} style={{ ...S.btn('outline'), marginTop:12, width:'auto', padding:'8px 20px', fontSize:13 }}>立即記錄</button>
            </div>
          )}
        </div>

        {/* Notifications/Tips — dynamic based on user state */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <SectionHeader title="健康小提醒" />
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              ...(completedAssessments > 0 ? [{ type:'warn', icon:'✅', text:`您已完成 ${completedAssessments} 項健康自測，點此查看 AI 推薦`, action:()=>setState(s=>({...s,page:'analysis'})) }] : [{ type:'tip', icon:'🩺', text:'完成健康自測，獲得專屬保健品推薦', action:()=>setState(s=>({...s,page:'assessment'})) }]),
              { type:'info', icon:'📋', text:'保健食品非藥品，服用前請諮詢醫師或藥師', action:null },
              { type:'tip', icon:'🏃', text:'每天30分鐘有氧運動，有助維持心血管健康', action:null },
            ].map((n,i)=>(
              <div key={i} onClick={n.action||undefined} style={{ display:'flex', gap:12, padding:'10px 12px', background:n.type==='warn'?'#FFF3CD':n.type==='info'?'#D6EAF8':'#D5F5E3', borderRadius:12, alignItems:'flex-start', cursor:n.action?'pointer':'default' }}>
                <span style={{ fontSize:18 }}>{n.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{n.text}</div>
                </div>
                {n.action && <span style={{ color:C.primary, fontSize:16 }}>›</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Products Preview */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <SectionHeader title="為您推薦" sub="根據您的健康狀況" action="全部商品" onAction={()=>setState(s=>({...s,page:'mall'}))} />
          <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8 }}>
            {PRODUCTS.slice(0,5).map(p=>(
              <div key={p.id} onClick={()=>setState(s=>({...s,page:'mall',subpage:'detail',selectedProduct:p}))} style={{ minWidth:130, background:C.bg, borderRadius:14, padding:12, cursor:'pointer', border:`1px solid ${C.borderL}` }}>
                <div style={{ fontSize:36, textAlign:'center', marginBottom:8 }}>{p.emoji}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:4, lineHeight:1.4 }}>{p.name}</div>
                <div style={{ fontSize:14, fontWeight:800, color:C.primary }}>NT$ {p.price.toLocaleString()}</div>
                <div style={{ fontSize:11, color:C.textS, textDecoration:'line-through' }}>原 {p.orig.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Article */}
        <div style={{ ...S.card, marginBottom:16, background:`linear-gradient(135deg,${C.primary}15,${C.primaryL}10)`, border:`1px solid ${C.primary}30` }}>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ fontSize:48 }}>📖</div>
            <div>
              <Badge color={C.primary}>本週健康知識</Badge>
              <div style={{ fontSize:16, fontWeight:700, color:C.text, marginTop:6, lineHeight:1.4 }}>50歲後必做的5項健康檢查</div>
              <div style={{ fontSize:12, color:C.textS, marginTop:4 }}>心臟超音波、骨密度、大腸鏡…</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background:'#F8F4E8', border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 14px', marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.textL, lineHeight:1.7 }}>
            ⚕️ 本平台資訊僅供健康參考，不取代專業醫療診斷。保健食品非藥品，不以預防或治療疾病為目的。如有疾病症狀請就醫。
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 健康自測頁 Assessment Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AssessmentPage({ state, setState }) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  if (showResult && selected) {
    const a = ASSESSMENTS[selected];
    const score = answers.reduce((s, ans, i) => s + (a.questions[i]?.scores[ans] || 0), 0);
    const maxScore = a.riskLevels[a.riskLevels.length-1].max;
    const risk = a.riskLevels.find(r => score <= r.max) || a.riskLevels[a.riskLevels.length-1];
    const recs = buildRecommendations({ [selected]: { score, level: risk.level } }, {}, {});
    const topRecs = recs.filter(p => p.matchScore > 0).slice(0,3);

    return (
      <div style={{ padding:'0 16px 90px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 0 16px' }}>
          <button onClick={()=>{setShowResult(false);setSelected(null);setStep(0);setAnswers([]);}} style={{ background:C.borderL, border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
          <div style={{ fontSize:18, fontWeight:800, color:C.text }}>評測結果</div>
        </div>

        {/* Score Card */}
        <div style={{ background:`linear-gradient(135deg,${risk.color},${risk.color}CC)`, borderRadius:24, padding:'24px 20px', marginBottom:16, color:'#fff' }}>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:48 }}>{risk.icon}</div>
            <div style={{ fontSize:14, opacity:0.8, marginBottom:4 }}>{a.title}</div>
            <div style={{ fontSize:32, fontWeight:900 }}>{risk.level}</div>
            <div style={{ fontSize:13, opacity:0.85, marginTop:8, lineHeight:1.6 }}>{risk.msg}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:12, padding:'12px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:13, opacity:0.8 }}>風險評分</span>
              <span style={{ fontWeight:800 }}>{score} / {maxScore} 分</span>
            </div>
            <div style={{ background:'rgba(255,255,255,0.3)', borderRadius:6, height:10 }}>
              <div style={{ width:`${Math.min((score/maxScore)*100,100)}%`, height:'100%', background:'#fff', borderRadius:6 }} />
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:12 }}>🔍 可能出現的症狀</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {a.symptoms.map((s,i) => <Badge key={i} color={risk.color}>{s}</Badge>)}
          </div>
        </div>

        {/* Suggestions */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:12 }}>💡 改善建議</div>
          {a.suggestions.map((s,i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:i<a.suggestions.length-1?`1px solid ${C.borderL}`:'none' }}>
              <span style={{ color:C.primary, fontWeight:700, minWidth:20 }}>{i+1}.</span>
              <span style={{ fontSize:14, color:C.text, lineHeight:1.5 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Recommended Products */}
        {topRecs.length > 0 && (
          <div style={{ ...S.card, marginBottom:16, border:`2px solid ${C.accent}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <span style={{ fontSize:20 }}>🤖</span>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:C.text }}>AI 推薦保健品</div>
                <div style={{ fontSize:12, color:C.textS }}>根據您的評測結果個人化推薦</div>
              </div>
            </div>
            {topRecs.map(p => (
              <div key={p.id} style={{ border:`1px solid ${C.borderL}`, borderRadius:14, padding:'14px', marginBottom:10 }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ fontSize:36 }}>{p.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:C.text }}>{p.name}</div>
                    <div style={{ fontSize:12, color:C.textS, margin:'4px 0' }}>{p.brand}</div>
                    {p.reasons.slice(0,1).map((r,i) => (
                      <div key={i} style={{ background:`${C.accent}15`, borderRadius:8, padding:'4px 8px', fontSize:12, color:C.accent, fontWeight:600, marginBottom:6 }}>
                        ✓ 推薦原因：{r}
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:16, fontWeight:800, color:C.primary }}>NT$ {p.price.toLocaleString()}</span>
                      <button onClick={()=>{
                        setState(s=>({...s, cart:[...s.cart.filter(c=>c.id!==p.id), {id:p.id,name:p.name,price:p.price,emoji:p.emoji,qty:(s.cart.find(c=>c.id===p.id)?.qty||0)+1}]}));
                        alert(`${p.name} 已加入購物車！`);
                      }} style={{ ...S.btn('accent'), width:'auto', padding:'8px 16px', fontSize:13 }}>加入購物車</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={()=>{
          setState(s=>({...s, assessResults:{...s.assessResults,[selected]:{score,level:risk.level,color:risk.color}}}));
          setShowResult(false); setSelected(null); setStep(0); setAnswers([]);
        }} style={S.btn('primary')}>儲存結果並返回</button>
      </div>
    );
  }

  if (selected) {
    const a = ASSESSMENTS[selected];
    const q = a.questions[step];
    const progress = ((step) / a.questions.length) * 100;

    return (
      <div style={{ padding:'0 16px 90px' }}>
        <div style={{ padding:'20px 0 16px', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>{ if(step===0){setSelected(null);}else{setStep(s=>s-1);setAnswers(a=>a.slice(0,-1));} }} style={{ background:C.borderL, border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>{a.emoji} {a.title}</div>
            <div style={{ fontSize:12, color:C.textS }}>問題 {step+1} / {a.questions.length}</div>
          </div>
        </div>

        <div style={{ background:C.borderL, borderRadius:6, height:6, marginBottom:24 }}>
          <div style={{ width:`${progress}%`, height:'100%', background:`linear-gradient(90deg,${C.primary},${C.primaryL})`, borderRadius:6, transition:'width 0.3s' }} />
        </div>

        <div style={{ ...S.card, marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:700, color:C.text, lineHeight:1.6, marginBottom:20 }}>
            Q{step+1}. {q.q}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {q.opts.map((opt,i) => (
              <button key={i} onClick={()=>{
                const newAns = [...answers, i];
                setAnswers(newAns);
                if (step + 1 < a.questions.length) { setStep(s=>s+1); }
                else { setShowResult(true); }
              }} style={{ background:C.bg, border:`2px solid ${C.border}`, borderRadius:14, padding:'14px 16px', textAlign:'left', fontSize:14, fontWeight:500, cursor:'pointer', color:C.text, transition:'all 0.2s' }}>
                <span style={{ marginRight:10, color:C.primaryL }}>◯</span>{opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:'0 16px 90px' }}>
      <div style={{ padding:'20px 0 16px' }}>
        <SectionHeader title="健康風險自測" sub="6大面向全方位評估您的健康" />
      </div>

      <div style={{ ...S.card, background:`linear-gradient(135deg,${C.primary}12,${C.primaryL}08)`, border:`1px solid ${C.primary}25`, marginBottom:16 }}>
        <div style={{ fontSize:13, color:C.textS, lineHeight:1.8 }}>
          🩺 本評測採用國際健康風險指標，結合台灣常見慢性病評估標準。所有問題均為自我評估，結果僅供健康參考，不代表醫療診斷。
        </div>
      </div>

      {Object.values(ASSESSMENTS).map(a => {
        const result = state.assessResults[a.id];
        return (
          <div key={a.id} onClick={()=>{setSelected(a.id);setStep(0);setAnswers([]);setShowResult(false);}} style={{ ...S.card, marginBottom:12, cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, background:`${a.color}15`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{a.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{a.title}</div>
              <div style={{ fontSize:12, color:C.textS, marginTop:2 }}>{a.desc}</div>
              {result && (
                <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ ...S.tag(result.color), fontSize:11 }}>{result.level}</span>
                  <span style={{ fontSize:11, color:C.textS }}>已完成評估</span>
                </div>
              )}
            </div>
            <div style={{ fontSize:20, color:result ? a.color : C.textL }}>{result ? '✅' : '›'}</div>
          </div>
        );
      })}

      {/* Comprehensive Analysis Button */}
      {Object.values(state.assessResults).filter(Boolean).length >= 2 && (
        <button onClick={()=>setState(s=>({...s,page:'analysis'}))} style={{ ...S.btn('accent'), marginTop:8 }}>
          🤖 查看智能綜合分析與推薦
        </button>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 健康記錄頁 Health Records Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function RecordsPage({ state, setState }) {
  const [activeTab, setActiveTab] = useState('bp');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ sys:'', dia:'', bs:'', weight:'', sleep:'', steps:'' });

  const tabs = [
    { id:'bp', label:'血壓', emoji:'💓' },
    { id:'bs', label:'血糖', emoji:'🩸' },
    { id:'weight', label:'體重', emoji:'⚖️' },
    { id:'sleep', label:'睡眠', emoji:'😴' },
  ];

  return (
    <div style={{ padding:'0 16px 90px' }}>
      <div style={{ padding:'20px 0 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <SectionHeader title="健康記錄" sub="追蹤您的健康趨勢" />
        <button onClick={()=>setShowAdd(true)} style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryL})`, border:'none', borderRadius:12, padding:'10px 16px', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋ 記錄</button>
      </div>

      {/* Add Record Modal */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', zIndex:100 }} onClick={()=>setShowAdd(false)}>
          <div style={{ background:C.surface, borderRadius:'24px 24px 0 0', padding:'24px 20px', width:'100%', maxWidth:480, margin:'0 auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:20, textAlign:'center' }}>📝 新增今日記錄</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[
                { key:'sys', label:'收縮壓', unit:'mmHg', placeholder:'如：120' },
                { key:'dia', label:'舒張壓', unit:'mmHg', placeholder:'如：80' },
                { key:'bs', label:'空腹血糖', unit:'mg/dL', placeholder:'如：95' },
                { key:'weight', label:'體重', unit:'kg', placeholder:'如：70.5' },
                { key:'sleep', label:'睡眠時數', unit:'小時', placeholder:'如：7' },
                { key:'steps', label:'步數', unit:'步', placeholder:'如：8000' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:12, color:C.textS, fontWeight:600 }}>{f.label}</label>
                  <div style={{ display:'flex', alignItems:'center', border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 12px', marginTop:4, background:C.bg }}>
                    <input value={form[f.key]} onChange={e=>setForm(v=>({...v,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ flex:1, background:'none', border:'none', fontSize:15, fontWeight:700, outline:'none', color:C.text, width:0 }} />
                    <span style={{ fontSize:11, color:C.textS }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>{ setShowAdd(false); setState(s=>({...s, newRecord:Date.now()})); }} style={S.btn('primary')}>儲存記錄</button>
            <button onClick={()=>setShowAdd(false)} style={{ ...S.btn('outline'), marginTop:8 }}>取消</button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'連續記錄', val:'23', unit:'天', emoji:'🔥', color:C.warning },
          { label:'本月記錄數', val:'47', unit:'筆', emoji:'📊', color:C.primary },
          { label:'血壓趨勢', val:'▼ 改善', unit:'', emoji:'❤️', color:C.success },
          { label:'體重減少', val:'-2.7', unit:'kg', emoji:'⚖️', color:C.info },
        ].map(m=>(
          <div key={m.label} style={{ ...S.card, padding:'14px' }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
              <span style={{ fontSize:18 }}>{m.emoji}</span>
              <span style={{ fontSize:12, color:C.textS }}>{m.label}</span>
            </div>
            <div style={{ fontSize:24, fontWeight:900, color:m.color }}>{m.val}<span style={{ fontSize:12, color:C.textS }}>{m.unit}</span></div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{ display:'flex', gap:6, marginBottom:16, background:C.borderL, borderRadius:14, padding:4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ flex:1, padding:'8px 4px', borderRadius:10, border:'none', background:activeTab===t.id ? C.surface : 'transparent', boxShadow:activeTab===t.id ? sh.sm : 'none', fontSize:12, fontWeight:700, color:activeTab===t.id ? C.primary : C.textS, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span>{t.emoji}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Charts */}
      {activeTab === 'bp' && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>血壓趨勢 💓</div>
          <div style={{ fontSize:12, color:C.textS, marginBottom:16 }}>最近11週記錄（mmHg）</div>
          <div style={{ display:'flex', gap:16, marginBottom:12 }}>
            {[{label:'最新收縮壓',val:'118',color:C.success,note:'正常'},{label:'最新舒張壓',val:'76',color:C.success,note:'正常'},{label:'趨勢',val:'持續改善',color:C.info,note:''}].map(m=>(
              <div key={m.label} style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:900, color:m.color }}>{m.val}</div>
                <div style={{ fontSize:11, color:C.textS }}>{m.label}</div>
                {m.note&&<Badge color={m.color} size="xs">{m.note}</Badge>}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={bpData} margin={{top:5,right:5,bottom:5,left:-20}}>
              <defs>
                <linearGradient id="sysGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.danger} stopOpacity={0.3}/><stop offset="95%" stopColor={C.danger} stopOpacity={0}/></linearGradient>
                <linearGradient id="diaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.info} stopOpacity={0.3}/><stop offset="95%" stopColor={C.info} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderL} />
              <XAxis dataKey="date" tick={{ fontSize:12 }} />
              <YAxis domain={[100,160]} tick={{ fontSize:12 }} />
              <Tooltip formatter={(v,n)=>[v, n==='sys'?'收縮壓':'舒張壓']} />
              <Area type="monotone" dataKey="sys" stroke={C.danger} fill="url(#sysGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="dia" stroke={C.info} fill="url(#diaGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ background:`${C.success}15`, borderRadius:10, padding:'10px 14px', marginTop:8 }}>
            <div style={{ fontSize:13, color:C.success, fontWeight:700 }}>✅ 血壓持續改善！</div>
            <div style={{ fontSize:12, color:C.textS, marginTop:2 }}>3個月下降約27/16 mmHg，持續補充納豆激酶效果顯著</div>
          </div>
        </div>
      )}

      {activeTab === 'bs' && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>血糖記錄 🩸</div>
          <div style={{ fontSize:12, color:C.textS, marginBottom:16 }}>空腹血糖趨勢（mg/dL）</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bsData} margin={{top:5,right:5,bottom:5,left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderL} />
              <XAxis dataKey="date" tick={{ fontSize:12 }} />
              <YAxis domain={[80,130]} tick={{ fontSize:12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={C.warning} strokeWidth={2.5} dot={{ fill:C.warning, r:4 }} name="空腹血糖" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ background:`${C.warning}15`, borderRadius:10, padding:'10px 14px', marginTop:8 }}>
            <div style={{ fontSize:13, color:C.warning, fontWeight:700 }}>⚠️ 血糖趨於正常範圍</div>
            <div style={{ fontSize:12, color:C.textS, marginTop:2 }}>從112降至98，已接近正常值，建議繼續控制精製糖攝取</div>
          </div>
        </div>
      )}

      {activeTab === 'weight' && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>體重記錄 ⚖️</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weightData} margin={{top:5,right:5,bottom:5,left:-20}}>
              <defs><linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3}/><stop offset="95%" stopColor={C.primary} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderL} />
              <XAxis dataKey="date" tick={{ fontSize:12 }} />
              <YAxis domain={[73,80]} tick={{ fontSize:12 }} />
              <Tooltip formatter={v=>[`${v} kg`,'體重']} />
              <Area type="monotone" dataKey="value" stroke={C.primary} fill="url(#wGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'sleep' && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>睡眠品質 😴</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sleepData} margin={{top:5,right:5,bottom:5,left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderL} />
              <XAxis dataKey="date" tick={{ fontSize:12 }} />
              <YAxis domain={[0,9]} tick={{ fontSize:12 }} />
              <Tooltip formatter={v=>[`${v} 小時`,'睡眠']} />
              <Bar dataKey="value" fill={C.info} radius={[4,4,0,0]} name="睡眠時數">
                {sleepData.map((entry,i)=><Cell key={i} fill={entry.value>=7?C.success:entry.value>=6?C.warning:C.danger} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            {[{color:C.success,label:'達標（7h+）'},{color:C.warning,label:'不足（6-7h）'},{color:C.danger,label:'嚴重不足（＜6h）'}].map(l=>(
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:l.color }} />
                <span style={{ fontSize:11, color:C.textS }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Goals */}
      <div style={{ ...S.card, marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>🎯 我的健康目標</div>
        {[
          { label:'體重管理目標', progress: state.newRecord?.weight ? 50 : 0, current: state.newRecord?.weight || '未記錄', target:'設定中', unit:'kg' },
          { label:'血壓降至120/80', progress:85, current:'118/76', target:'120/80', unit:'' },
          { label:'每日步行8000步', progress:75, current:'6000', target:'8000', unit:'步' },
        ].map((g,i) => (
          <div key={i} style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:14, fontWeight:600 }}>{g.label}</span>
              <span style={{ fontSize:12, color:C.primary, fontWeight:700 }}>{g.progress}%</span>
            </div>
            <div style={{ background:C.borderL, borderRadius:6, height:8 }}>
              <div style={{ width:`${g.progress}%`, height:'100%', background:`linear-gradient(90deg,${C.primary},${C.primaryL})`, borderRadius:6 }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <span style={{ fontSize:11, color:C.textS }}>目前：{g.current}{g.unit}</span>
              <span style={{ fontSize:11, color:C.textS }}>目標：{g.target}{g.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 體檢報告解讀頁 Report Interpretation Page (AI 上傳版)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ReportPage({ state, setState }) {
  const [uploadState, setUploadState] = useState('idle'); // idle | preview | loading | done | error
  const [uploadedFile, setUploadedFile] = useState(null); // { name, type, base64, previewUrl }
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = { current: null };

  const TABS = [
    { id:'overview',    label:'總覽',   emoji:'📊' },
    { id:'indicators',  label:'指標',   emoji:'🔬' },
    { id:'management',  label:'健康管理', emoji:'🌿' },
    { id:'guidance',    label:'就醫指引', emoji:'🏥' },
  ];

  const handleFile = async (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg','image/jpg','image/png','image/heic','image/webp','application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|heic|webp|pdf)$/i)) {
      setErrorMsg('請上傳圖片（JPG/PNG/HEIC）或 PDF 檔案');
      setUploadState('error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('檔案大小請勿超過 20MB');
      setUploadState('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Full = e.target.result;
      const base64 = base64Full.split(',')[1];
      const previewUrl = file.type.startsWith('image/') ? base64Full : null;
      setUploadedFile({ name: file.name, type: file.type, base64, previewUrl });
      setUploadState('preview');
      setAnalysisResult(null);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const analyzeReport = async () => {
    if (!uploadedFile) return;
    setUploadState('loading');
    setErrorMsg('');

    const isPDF = uploadedFile.type === 'application/pdf' || uploadedFile.name.toLowerCase().endsWith('.pdf');
    const mediaType = isPDF ? 'application/pdf' : (uploadedFile.type || 'image/jpeg');

    const systemPrompt = `你是一位專業的台灣醫療健康顧問，專門幫助40-70歲的民眾用白話文理解體檢報告。
請仔細分析上傳的體檢報告圖片或PDF，提取所有可見的健康指標數值，並以最淺顯易懂的中文解釋。
請務必只回傳純 JSON，不要有任何前言後語、markdown記號或反引號。

回傳的 JSON 結構如下：
{
  "overview": {
    "score": 數字（0-100，代表整體健康分數）,
    "grade": "優良/良好/注意/警示",
    "gradeColor": "green/orange/red",
    "summary": "用2-3句白話文，像醫生對家人說話一樣，解釋這份報告的整體狀況",
    "reportDate": "報告日期（如有顯示）或 null",
    "abnormalCount": 異常指標數量,
    "normalCount": 正常指標數量,
    "keyFindings": ["最重要的3個發現，每條一句話"]
  },
  "indicators": [
    {
      "category": "分類（如：血脂肪/肝功能/腎功能/血糖/血壓/血液常規/甲狀腺/其他）",
      "name": "指標名稱（中文全名）",
      "abbr": "縮寫（如 LDL、GOT）",
      "value": "數值（字串）",
      "unit": "單位",
      "referenceRange": "正常參考範圍",
      "status": "正常/偏高/偏低/明顯偏高/明顯偏低",
      "statusLevel": 0-3（0=正常,1=輕度異常,2=中度異常,3=重度異常）,
      "plainExplanation": "用最白話的方式解釋這個指標是什麼，像在跟不懂醫學的長輩解釋",
      "whatItMeans": "這個數值代表什麼意思（針對此人的數值給出解釋）",
      "tip": "一句具體可行的生活建議"
    }
  ],
  "management": {
    "dietAdvice": [
      { "priority": "high/medium/low", "icon": "emoji", "title": "飲食建議標題", "detail": "詳細說明（2-3句）" }
    ],
    "exerciseAdvice": [
      { "priority": "high/medium/low", "icon": "emoji", "title": "運動建議標題", "detail": "詳細說明" }
    ],
    "lifestyleAdvice": [
      { "priority": "high/medium/low", "icon": "emoji", "title": "生活習慣標題", "detail": "詳細說明" }
    ],
    "supplementHints": ["根據此報告，可能有益的保健方向（不是廣告，是通用建議）"]
  },
  "guidance": {
    "urgency": "立即/一個月內/三個月內/半年追蹤/維持現狀",
    "urgencyLevel": 0-3（0=維持,1=半年追蹤,2=一個月內,3=立即）,
    "mainConcerns": [
      {
        "condition": "關注項目名稱",
        "explanation": "白話解釋為什麼需要注意",
        "suggestedAction": "建議做什麼（例如：複診/進一步檢查/追蹤等）",
        "specialist": "建議看哪科（如：家醫科/心臟科/腎臟科）",
        "timeframe": "建議時間"
      }
    ],
    "nextCheckup": "建議下次完整健康檢查的時間",
    "disclaimer": "本報告解讀由AI提供，僅供健康參考，不取代專業醫師診斷，如有任何疑問請諮詢您的家庭醫師。"
  }
}`;

    try {
      const userContent = isPDF
        ? [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: uploadedFile.base64 } },
            { type: 'text', text: '請分析這份體檢報告，提取所有健康指標並用白話文解釋，按照系統指定的JSON格式回傳。' }
          ]
        : [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: uploadedFile.base64 } },
            { type: 'text', text: '請分析這張體檢報告圖片，提取所有健康指標並用白話文解釋，按照系統指定的JSON格式回傳。' }
          ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }]
        })
      });

      if (!response.ok) throw new Error('API請求失敗，請稍後再試');
      const data = await response.json();
      const text = data.content?.find(b => b.type === 'text')?.text || '';
      const cleaned = text.replace(/^[`\s]*json\n?|[`\s]*$/gi, '').trim();
      const result = JSON.parse(cleaned);
      setAnalysisResult(result);
      setUploadState('done');
      setActiveTab('overview');
      setState(s => ({ ...s, aiReportResult: result }));
    } catch (err) {
      console.error(err);
      setErrorMsg('AI解讀失敗：' + (err.message || '請重試'));
      setUploadState('error');
    }
  };

  const reset = () => {
    setUploadState('idle');
    setUploadedFile(null);
    setAnalysisResult(null);
    setErrorMsg('');
  };

  // STATUS color map
  const statusColor = (level) => [C.success, C.warning, C.accent, C.danger][level] || C.textS;
  const statusBg = (level) => [C.success, C.warning, C.accent, C.danger][level]+'18' || '#f0f0f0';

  // ── Upload Screen ──
  if (uploadState === 'idle' || uploadState === 'error') return (
    <div style={{ padding:'0 16px 90px' }}>
      <div style={{ padding:'20px 0 8px' }}>
        <SectionHeader title="體檢報告解讀" sub="上傳報告 · AI白話解析 · 四維分析" />
      </div>

      <div style={{ ...S.card, background:'linear-gradient(135deg,#1B5C3E10,#C87A0A10)', border:`1px solid \${C.primary}30`, marginBottom:16 }}>
        <div style={{ fontSize:13, color:C.textS, lineHeight:1.9 }}>
          📋 支援拍照上傳、圖片檔（JPG/PNG）或 PDF 體檢報告<br/>
          🤖 AI 將自動識別所有指標，用最白話的方式解釋給您聽<br/>
          🔒 您的資料不會被儲存，分析完成後自動清除
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }}
        onDragLeave={()=>setDragOver(false)}
        onDrop={handleDrop}
        style={{ border:`2.5px dashed \${dragOver ? C.primary : C.border}`, borderRadius:20, padding:'36px 20px', textAlign:'center', background: dragOver ? `\${C.primary}08` : C.surface, cursor:'pointer', transition:'all 0.2s', marginBottom:16 }}
        onClick={()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*,.pdf,application/pdf'; inp.capture='environment'; inp.onchange=e=>handleFile(e.target.files[0]); inp.click(); }}
      >
        <div style={{ fontSize:56, marginBottom:12 }}>📂</div>
        <div style={{ fontSize:18, fontWeight:800, color:C.primary, marginBottom:8 }}>點擊上傳或拍照</div>
        <div style={{ fontSize:13, color:C.textS, lineHeight:1.7 }}>支援 JPG / PNG / HEIC / PDF<br/>最大 20MB</div>
      </div>

      {/* Quick action buttons */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        {[
          { emoji:'📷', label:'拍照上傳', capture:'environment' },
          { emoji:'🖼️', label:'從相簿選擇', capture:undefined },
        ].map(btn => (
          <button key={btn.label} onClick={()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; if(btn.capture) inp.setAttribute('capture',btn.capture); inp.onchange=e=>handleFile(e.target.files[0]); inp.click(); }}
            style={{ ...S.card, border:`2px solid \${C.border}`, borderRadius:16, padding:'20px 12px', cursor:'pointer', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:32 }}>{btn.emoji}</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{btn.label}</div>
          </button>
        ))}
      </div>
      <button onClick={()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='.pdf,application/pdf'; inp.onchange=e=>handleFile(e.target.files[0]); inp.click(); }}
        style={{ ...S.card, border:`2px solid \${C.border}`, borderRadius:16, padding:'16px', cursor:'pointer', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:12, width:'100%', marginBottom:16 }}>
        <div style={{ fontSize:28 }}>📄</div>
        <div style={{ fontSize:14, fontWeight:700, color:C.text }}>上傳 PDF 報告檔</div>
      </button>

      {uploadState === 'error' && (
        <div style={{ background:`\${C.danger}12`, border:`1px solid \${C.danger}40`, borderRadius:12, padding:'12px 16px', color:C.danger, fontSize:14, fontWeight:600 }}>
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );

  // ── Preview Screen ──
  if (uploadState === 'preview') return (
    <div style={{ padding:'0 16px 90px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 0 16px' }}>
        <button onClick={reset} style={{ background:C.borderL, border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
        <div style={{ fontSize:18, fontWeight:800 }}>確認上傳內容</div>
      </div>

      <div style={{ ...S.card, marginBottom:16 }}>
        {uploadedFile.previewUrl ? (
          <img src={uploadedFile.previewUrl} alt="體檢報告" style={{ width:'100%', borderRadius:12, maxHeight:400, objectFit:'contain', background:'#f5f5f5' }} />
        ) : (
          <div style={{ background:`\${C.primary}10`, borderRadius:12, padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontSize:56 }}>📄</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.primary, marginTop:8 }}>PDF 已就緒</div>
          </div>
        )}
        <div style={{ marginTop:12, padding:'10px 14px', background:C.bg, borderRadius:10 }}>
          <div style={{ fontSize:13, color:C.textS }}>檔案：{uploadedFile.name}</div>
        </div>
      </div>

      <div style={{ ...S.card, background:'linear-gradient(135deg,#1B5C3E08,#2A7D5508)', border:`1px solid \${C.primary}30`, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:6 }}>🤖 AI 將為您做什麼？</div>
        {['識別報告中所有健康指標數值','用白話文解釋每個數字的意義','分析哪些指標需要特別注意','提供個人化生活調整建議','指引您下一步就醫方向'].map((t,i)=>(
          <div key={i} style={{ fontSize:13, color:C.textS, padding:'4px 0', display:'flex', gap:8 }}>
            <span style={{ color:C.success }}>✓</span>{t}
          </div>
        ))}
      </div>

      <button onClick={analyzeReport} style={{ ...S.btn('primary'), marginBottom:12, fontSize:17 }}>
        🔬 開始 AI 解讀
      </button>
      <button onClick={reset} style={S.btn('outline')}>重新上傳</button>
    </div>
  );

  // ── Loading Screen ──
  if (uploadState === 'loading') return (
    <div style={{ padding:'40px 16px 90px', textAlign:'center' }}>
      <div style={{ fontSize:72, marginBottom:20, animation:'pulse 1.5s infinite' }}>🔬</div>
      <div style={{ fontSize:22, fontWeight:900, color:C.primary, marginBottom:8 }}>AI 正在解讀中...</div>
      <div style={{ fontSize:14, color:C.textS, marginBottom:32, lineHeight:1.8 }}>正在識別指標數值<br/>轉換成白話說明中</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:280, margin:'0 auto' }}>
        {['📋 讀取報告內容...','🔢 識別各項數值...','📖 翻譯成白話文...','💡 生成健康建議...'].map((step,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:C.surface, borderRadius:12, boxShadow:sh.sm }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:C.primaryL, animation:`pulse \${1+i*0.3}s infinite` }} />
            <div style={{ fontSize:13, color:C.textS }}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Error Screen ──
  if (uploadState === 'error') return (
    <div style={{ padding:'40px 16px 90px', textAlign:'center' }}>
      <div style={{ fontSize:60, marginBottom:16 }}>😔</div>
      <div style={{ fontSize:18, fontWeight:800, color:C.danger, marginBottom:8 }}>解讀失敗</div>
      <div style={{ fontSize:14, color:C.textS, marginBottom:24 }}>{errorMsg}</div>
      <button onClick={reset} style={S.btn('primary')}>重新上傳</button>
    </div>
  );

  // ── Results Screen ──
  const r = analysisResult;
  if (!r) return null;

  const gradeColors = { green:C.success, orange:C.warning, red:C.danger };
  const urgencyColors = [C.success, C.info, C.warning, C.danger];
  const urgencyBg = [C.success+'15', C.info+'15', C.warning+'15', C.danger+'15'];

  return (
    <div style={{ padding:'0 16px 90px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 0 12px' }}>
        <button onClick={reset} style={{ background:C.borderL, border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
        <div>
          <div style={{ fontSize:18, fontWeight:800 }}>體檢報告解讀結果</div>
          {r.overview.reportDate && <div style={{ fontSize:12, color:C.textS }}>報告日期：{r.overview.reportDate}</div>}
        </div>
      </div>

      {/* Score Card */}
      <div style={{ ...S.card, background:`linear-gradient(135deg,\${gradeColors[r.overview.gradeColor] || C.primary}20,\${gradeColors[r.overview.gradeColor] || C.primary}08)`, border:`2px solid \${gradeColors[r.overview.gradeColor] || C.primary}40`, marginBottom:16, display:'flex', gap:16, alignItems:'center' }}>
        <div style={{ textAlign:'center', minWidth:80 }}>
          <div style={{ fontSize:48, fontWeight:900, color:gradeColors[r.overview.gradeColor] || C.primary, lineHeight:1 }}>{r.overview.score}</div>
          <div style={{ fontSize:11, color:C.textS, marginTop:2 }}>健康分數</div>
          <div style={{ background:gradeColors[r.overview.gradeColor]||C.primary, color:'#fff', borderRadius:8, padding:'3px 10px', fontSize:13, fontWeight:800, marginTop:6 }}>{r.overview.grade}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, color:C.text, lineHeight:1.8 }}>{r.overview.summary}</div>
          <div style={{ display:'flex', gap:12, marginTop:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:'50%', background:C.success, display:'inline-block' }} /><span style={{ fontSize:12, color:C.textS }}>正常 {r.overview.normalCount} 項</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:'50%', background:C.danger, display:'inline-block' }} /><span style={{ fontSize:12, color:C.textS }}>異常 {r.overview.abnormalCount} 項</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16, background:C.surface, borderRadius:16, padding:6, boxShadow:sh.sm }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ flex:1, background: activeTab===tab.id ? `linear-gradient(135deg,\${C.primary},\${C.primaryL})` : 'transparent', color: activeTab===tab.id ? '#fff' : C.textS, border:'none', borderRadius:12, padding:'10px 4px', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.2s', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:16 }}>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: 總覽 ── */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:12, color:C.text }}>📋 重點發現</div>
          {(r.overview.keyFindings||[]).map((f,i) => (
            <div key={i} style={{ ...S.card, marginBottom:10, display:'flex', gap:12, alignItems:'flex-start' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:`\${C.primary}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:900, color:C.primary, fontSize:14 }}>{i+1}</div>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.7, paddingTop:4 }}>{f}</div>
            </div>
          ))}

          {/* Abnormal indicators quick view */}
          {(r.indicators||[]).filter(ind=>ind.statusLevel>0).length > 0 && (
            <>
              <div style={{ fontWeight:800, fontSize:16, margin:'20px 0 12px', color:C.text }}>⚠️ 需要注意的指標</div>
              {r.indicators.filter(ind=>ind.statusLevel>0).map((ind,i)=>(
                <div key={i} style={{ ...S.card, marginBottom:10, borderLeft:`4px solid \${statusColor(ind.statusLevel)}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <div style={{ fontSize:15, fontWeight:800 }}>{ind.name} <span style={{ fontSize:12, color:C.textS, fontWeight:400 }}>({ind.abbr})</span></div>
                    <span style={{ background:statusBg(ind.statusLevel), color:statusColor(ind.statusLevel), fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{ind.status}</span>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:statusColor(ind.statusLevel) }}>{ind.value} <span style={{ fontSize:12, color:C.textS, fontWeight:400 }}>{ind.unit}</span></div>
                  <div style={{ fontSize:13, color:C.textS, marginTop:4, lineHeight:1.6 }}>{ind.whatItMeans}</div>
                </div>
              ))}
            </>
          )}

          <button onClick={()=>setState(s=>({...s,page:'analysis'}))} style={{ ...S.btn('accent'), marginTop:12 }}>
            🤖 查看個人化保健品推薦
          </button>
        </div>
      )}

      {/* ── Tab: 指標 ── */}
      {activeTab === 'indicators' && (
        <div>
          {/* Group by category */}
          {(() => {
            const cats = {};
            (r.indicators||[]).forEach(ind => {
              if (!cats[ind.category]) cats[ind.category] = [];
              cats[ind.category].push(ind);
            });
            return Object.entries(cats).map(([cat, inds]) => (
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.primary, marginBottom:10, paddingBottom:6, borderBottom:`2px solid \${C.primary}20` }}>{cat}</div>
                {inds.map((ind, i) => (
                  <div key={i} style={{ ...S.card, marginBottom:10, border:`1px solid \${statusColor(ind.statusLevel)}40` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <span style={{ fontSize:16, fontWeight:800 }}>{ind.name}</span>
                        <span style={{ fontSize:12, color:C.textS, marginLeft:6 }}>({ind.abbr})</span>
                      </div>
                      <span style={{ background:statusBg(ind.statusLevel), color:statusColor(ind.statusLevel), fontSize:13, fontWeight:700, padding:'4px 12px', borderRadius:20, flexShrink:0, marginLeft:8 }}>{ind.status}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:10 }}>
                      <span style={{ fontSize:28, fontWeight:900, color:statusColor(ind.statusLevel) }}>{ind.value}</span>
                      <span style={{ fontSize:13, color:C.textS }}>{ind.unit}</span>
                      <span style={{ fontSize:12, color:C.textL, marginLeft:4 }}>（正常：{ind.referenceRange}）</span>
                    </div>
                    <div style={{ background:`\${C.primary}08`, borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.primary, marginBottom:4 }}>💬 白話解釋</div>
                      <div style={{ fontSize:13, color:C.text, lineHeight:1.7 }}>{ind.plainExplanation}</div>
                    </div>
                    <div style={{ fontSize:13, color:C.textS, lineHeight:1.6, marginBottom:6 }}>{ind.whatItMeans}</div>
                    {ind.tip && <div style={{ background:`\${C.success}12`, borderRadius:8, padding:'8px 12px', fontSize:12, color:C.success, fontWeight:600 }}>💡 {ind.tip}</div>}
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Tab: 健康管理 ── */}
      {activeTab === 'management' && (
        <div>
          {[
            { key:'dietAdvice', title:'🥗 飲食建議', color:C.success },
            { key:'exerciseAdvice', title:'🏃 運動建議', color:C.info },
            { key:'lifestyleAdvice', title:'😴 生活習慣', color:C.accent },
          ].map(section => (
            <div key={section.key} style={{ marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:800, color:section.color, marginBottom:12 }}>{section.title}</div>
              {(r.management[section.key]||[]).map((item,i)=>(
                <div key={i} style={{ ...S.card, marginBottom:10, display:'flex', gap:12, alignItems:'flex-start', borderLeft:`4px solid \${item.priority==='high'?C.danger:item.priority==='medium'?C.warning:C.success}` }}>
                  <div style={{ fontSize:26, flexShrink:0, marginTop:2 }}>{item.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{item.title}</div>
                    <div style={{ fontSize:13, color:C.textS, lineHeight:1.7 }}>{item.detail}</div>
                    {item.priority==='high' && <span style={{ ...S.tag(C.danger), marginTop:8 }}>重要</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {(r.management.supplementHints||[]).length > 0 && (
            <div style={{ ...S.card, background:`\${C.accent}10`, border:`1px solid \${C.accent}30`, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.accent, marginBottom:10 }}>💊 保健方向參考</div>
              {r.management.supplementHints.map((hint,i)=>(
                <div key={i} style={{ fontSize:13, color:C.textS, padding:'5px 0', borderBottom:i<r.management.supplementHints.length-1?'1px solid '+C.borderL:'none' }}>• {hint}</div>
              ))}
              <button onClick={()=>setState(s=>({...s,page:'analysis'}))} style={{ ...S.btn('accent'), marginTop:12 }}>查看推薦保健品</button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: 就醫指引 ── */}
      {activeTab === 'guidance' && (
        <div>
          {/* Urgency Banner */}
          <div style={{ background:urgencyBg[r.guidance.urgencyLevel||0], border:`2px solid \${urgencyColors[r.guidance.urgencyLevel||0]}50`, borderRadius:16, padding:'16px 18px', marginBottom:16, display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ fontSize:36 }}>{['✅','📅','⚠️','🚨'][r.guidance.urgencyLevel||0]}</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:urgencyColors[r.guidance.urgencyLevel||0] }}>建議就醫時程</div>
              <div style={{ fontSize:20, fontWeight:900, color:urgencyColors[r.guidance.urgencyLevel||0] }}>{r.guidance.urgency}</div>
            </div>
          </div>

          {(r.guidance.mainConcerns||[]).length > 0 && (
            <>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:12 }}>🏥 就醫建議</div>
              {r.guidance.mainConcerns.map((concern,i)=>(
                <div key={i} style={{ ...S.card, marginBottom:12, border:`1px solid \${C.primary}25` }}>
                  <div style={{ fontSize:15, fontWeight:800, color:C.primary, marginBottom:8 }}>{concern.condition}</div>
                  <div style={{ fontSize:13, color:C.textS, lineHeight:1.7, marginBottom:10 }}>{concern.explanation}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { label:'建議科別', val:concern.specialist, emoji:'🩺' },
                      { label:'建議時程', val:concern.timeframe, emoji:'📅' },
                    ].map(item=>(
                      <div key={item.label} style={{ background:C.bg, borderRadius:10, padding:'10px 12px' }}>
                        <div style={{ fontSize:11, color:C.textL }}>{item.emoji} {item.label}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginTop:2 }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:`\${C.info}10`, borderRadius:10, padding:'10px 12px', marginTop:10 }}>
                    <div style={{ fontSize:13, color:C.info }}>{concern.suggestedAction}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{ ...S.card, border:`1px solid \${C.info}30`, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.info, marginBottom:6 }}>📆 下次健康檢查</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{r.guidance.nextCheckup}</div>
          </div>

          <div style={{ background:'#FFF3CD', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#856404', lineHeight:1.7 }}>⚕️ {r.guidance.disclaimer}</div>
          </div>

          <button onClick={reset} style={S.btn('outline')}>上傳新的報告</button>
        </div>
      )}
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 健康日記頁 Diary Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MOODS = [
  { emoji:'😄', label:'很好', color:'#27AE60', val:5 },
  { emoji:'🙂', label:'不錯', color:'#2E86AB', val:4 },
  { emoji:'😐', label:'普通', color:'#F59E0B', val:3 },
  { emoji:'😔', label:'不佳', color:'#D35400', val:2 },
  { emoji:'😰', label:'很差', color:'#C0392B', val:1 },
];
const SYMPTOMS = ['頭痛','疲勞','胸悶','腰痠背痛','關節痛','失眠','食慾差','消化不良','頭暈','呼吸不順','水腫','手腳麻'];
const DEMO_ENTRIES = [
  { id:'d1', date:'2026-04-21', mood:4, energy:4, symptoms:['疲勞'], bp:'118/76', glucose:'98', water:6, note:'今天散步了30分鐘，晚上睡得不錯，血壓很穩定。', food:'早餐燕麥粥、午餐水煮雞肉沙拉、晚餐清蒸魚' },
  { id:'d2', date:'2026-04-19', mood:3, energy:3, symptoms:['頭痛','疲勞'], bp:'132/84', glucose:'', water:4, note:'工作壓力大，頭有點痛，下午休息了一下好多了。', food:'三餐正常，喝水不夠' },
  { id:'d3', date:'2026-04-17', mood:5, energy:5, symptoms:[], bp:'116/74', glucose:'95', water:8, note:'假日去公園走了1小時，心情很好！精神充沛。', food:'外食，盡量選清淡的' },
];

function DiaryPage({ state, setState, user, addPoints }) {
  const entries = state.diaryEntries || DEMO_ENTRIES;
  const [view, setView] = useState('list'); // list | add | detail
  const [selected, setSelected] = useState(null);
  const [filterMood, setFilterMood] = useState(0);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), mood:4, energy:3, symptoms:[], bp:'', glucose:'', water:6, note:'', food:'' });
  const [symptomInput, setSymptomInput] = useState('');

  const saveEntry = async () => {
    const tmpEntry = { ...form, id: 'tmp_'+Date.now() };
    const updated = [tmpEntry, ...entries].sort((a,b)=>b.date.localeCompare(a.date));
    setState(s=>({...s, diaryEntries: updated}));
    setView('list');
    setForm({ date: new Date().toISOString().slice(0,10), mood:4, energy:3, symptoms:[], bp:'', glucose:'', water:6, note:'', food:'' });
    if (user?.id) {
      await saveDiaryEntry(user.id, form);
      if (addPoints) addPoints(5, '健康日記記錄');
    }
  };

  const deleteEntry = (id) => {
    setState(s=>({...s, diaryEntries: entries.filter(e=>e.id!==id)}));
    setView('list');
    if (id.startsWith('db_') && user?.id) deleteDiaryEntry(id.slice(3));
  };

  const filtered = filterMood ? entries.filter(e=>e.mood===filterMood) : entries;
  const avgMood = entries.length ? (entries.reduce((s,e)=>s+e.mood,0)/entries.length).toFixed(1) : '-';
  const allSymptoms = entries.flatMap(e=>e.symptoms);
  const topSymptom = allSymptoms.length ? [...allSymptoms.reduce((m,s)=>m.set(s,(m.get(s)||0)+1),new Map())].sort((a,b)=>b[1]-a[1])[0]?.[0] : '無';
  const moodEmoji = (val) => MOODS.find(m=>m.val===val)?.emoji || '😐';
  const moodColor = (val) => MOODS.find(m=>m.val===val)?.color || C.textS;

  // ── Add Entry ──
  if (view === 'add') return (
    <div style={{padding:'0 16px 100px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'20px 0 16px'}}>
        <button onClick={()=>setView('list')} style={{background:C.borderL,border:'none',borderRadius:10,padding:'8px 12px',cursor:'pointer',fontSize:16}}>‹</button>
        <div style={{fontSize:18,fontWeight:800}}>📝 新增日記</div>
      </div>

      {/* Date */}
      <div style={{...S.card,marginBottom:12}}>
        <label style={{fontSize:13,fontWeight:700,color:C.textS,display:'block',marginBottom:6}}>📅 日期</label>
        <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{width:'100%',border:`2px solid ${C.border}`,borderRadius:12,padding:'11px 14px',fontSize:16,outline:'none',color:C.text,background:C.bg,boxSizing:'border-box'}}/>
      </div>

      {/* Mood */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:10}}>😊 今天心情</div>
        <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
          {MOODS.map(m=>(
            <button key={m.val} onClick={()=>setForm(f=>({...f,mood:m.val}))} style={{flex:1,padding:'12px 4px',border:`2px solid ${form.mood===m.val?m.color:C.borderL}`,borderRadius:14,background:form.mood===m.val?m.color+'18':'transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'all 0.2s'}}>
              <span style={{fontSize:24}}>{m.emoji}</span>
              <span style={{fontSize:11,fontWeight:700,color:form.mood===m.val?m.color:C.textS}}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:10}}>⚡ 今日精力（{form.energy}/5）</div>
        <div style={{display:'flex',gap:8}}>
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>setForm(f=>({...f,energy:n}))} style={{flex:1,padding:'12px 4px',border:'none',borderRadius:12,background:n<=form.energy?C.accent+'22':'#f0f0f0',cursor:'pointer',fontSize:22,transition:'all 0.15s'}}>
              {n<=form.energy?'⚡':'○'}
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:10}}>🤒 身體不適（可多選）</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
          {SYMPTOMS.map(s=>{
            const on=form.symptoms.includes(s);
            return <button key={s} onClick={()=>setForm(f=>({...f,symptoms:on?f.symptoms.filter(x=>x!==s):[...f.symptoms,s]}))} style={{padding:'8px 14px',borderRadius:20,border:`2px solid ${on?C.danger:C.border}`,background:on?C.danger+'18':'transparent',fontSize:13,fontWeight:on?700:400,color:on?C.danger:C.textS,cursor:'pointer'}}>
              {on?'✕ ':''}{s}
            </button>;
          })}
        </div>
        {form.symptoms.length===0 && <div style={{fontSize:12,color:C.textL}}>未選擇（今日無不適）</div>}
      </div>

      {/* BP & Glucose */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:10}}>📊 今日數值（選填）</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            {key:'bp',label:'血壓',placeholder:'例：120/80',emoji:'💓'},
            {key:'glucose',label:'血糖 mg/dL',placeholder:'例：98',emoji:'🩸'},
          ].map(f=>(
            <div key={f.key}>
              <label style={{fontSize:12,color:C.textS,display:'block',marginBottom:4}}>{f.emoji} {f.label}</label>
              <input value={form[f.key]} onChange={e=>setForm(v=>({...v,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:10,padding:'10px 12px',fontSize:14,outline:'none',color:C.text,background:C.bg,boxSizing:'border-box'}}/>
            </div>
          ))}
        </div>
        <div style={{marginTop:10}}>
          <label style={{fontSize:12,color:C.textS,display:'block',marginBottom:4}}>💧 今日喝水（杯）</label>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <button onClick={()=>setForm(f=>({...f,water:Math.max(0,f.water-1)}))} style={{width:36,height:36,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.bg,fontSize:18,cursor:'pointer'}}>−</button>
            <div style={{flex:1,textAlign:'center',fontSize:18,fontWeight:800,color:C.info}}>{form.water} 杯</div>
            <button onClick={()=>setForm(f=>({...f,water:f.water+1}))} style={{width:36,height:36,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.bg,fontSize:18,cursor:'pointer'}}>+</button>
          </div>
        </div>
      </div>

      {/* Food */}
      <div style={{...S.card,marginBottom:12}}>
        <label style={{fontSize:13,fontWeight:700,color:C.textS,display:'block',marginBottom:8}}>🍽️ 今日飲食記錄（選填）</label>
        <textarea value={form.food} onChange={e=>setForm(f=>({...f,food:e.target.value}))} placeholder="記錄早中晚三餐內容..." rows={2} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:12,padding:'10px 14px',fontSize:14,outline:'none',color:C.text,background:C.bg,resize:'none',boxSizing:'border-box'}}/>
      </div>

      {/* Note */}
      <div style={{...S.card,marginBottom:16}}>
        <label style={{fontSize:13,fontWeight:700,color:C.textS,display:'block',marginBottom:8}}>📝 今日備忘 / 心得</label>
        <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="記錄今天的身體感受、用藥情況、醫生交代事項..." rows={3} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:12,padding:'12px 14px',fontSize:14,outline:'none',color:C.text,background:C.bg,resize:'none',boxSizing:'border-box'}}/>
      </div>

      <button onClick={saveEntry} style={S.btn('primary')}>💾 儲存日記</button>
    </div>
  );

  // ── Detail View ──
  if (view === 'detail' && selected) {
    const e = selected;
    const mood = MOODS.find(m=>m.val===e.mood)||MOODS[2];
    return (
      <div style={{padding:'0 16px 90px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'20px 0 16px'}}>
          <button onClick={()=>setView('list')} style={{background:C.borderL,border:'none',borderRadius:10,padding:'8px 12px',cursor:'pointer',fontSize:16}}>‹</button>
          <div style={{flex:1,fontSize:18,fontWeight:800}}>📓 日記詳情</div>
          <button onClick={()=>deleteEntry(e.id)} style={{background:'#fee',border:`1px solid ${C.danger}30`,borderRadius:10,padding:'8px 12px',cursor:'pointer',color:C.danger,fontSize:13,fontWeight:700}}>刪除</button>
        </div>
        <div style={{...S.card,background:`linear-gradient(135deg,${mood.color}15,${mood.color}05)`,border:`2px solid ${mood.color}40`,marginBottom:12}}>
          <div style={{fontSize:13,color:C.textS,marginBottom:4}}>📅 {e.date}</div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:48}}>{mood.emoji}</span>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:mood.color}}>{mood.label}</div>
              <div style={{display:'flex',gap:4,marginTop:4}}>{Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:16}}>{i<e.energy?'⚡':'○'}</span>)}</div>
            </div>
          </div>
        </div>
        {e.symptoms.length>0 && (
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:C.danger,marginBottom:8}}>🤒 身體不適</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{e.symptoms.map(s=><span key={s} style={{...S.tag(C.danger)}}>{s}</span>)}</div>
          </div>
        )}
        {(e.bp||e.glucose||e.water) && (
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:10}}>📊 數值紀錄</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {e.bp && <div style={{background:C.bg,borderRadius:10,padding:'10px',textAlign:'center'}}><div style={{fontSize:11,color:C.textL}}>💓血壓</div><div style={{fontSize:14,fontWeight:700,color:C.text,marginTop:2}}>{e.bp}</div></div>}
              {e.glucose && <div style={{background:C.bg,borderRadius:10,padding:'10px',textAlign:'center'}}><div style={{fontSize:11,color:C.textL}}>🩸血糖</div><div style={{fontSize:14,fontWeight:700,color:C.text,marginTop:2}}>{e.glucose}</div></div>}
              {e.water && <div style={{background:C.bg,borderRadius:10,padding:'10px',textAlign:'center'}}><div style={{fontSize:11,color:C.textL}}>💧喝水</div><div style={{fontSize:14,fontWeight:700,color:C.info,marginTop:2}}>{e.water}杯</div></div>}
            </div>
          </div>
        )}
        {e.food && <div style={{...S.card,marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:6}}>🍽️ 飲食記錄</div><div style={{fontSize:14,color:C.text,lineHeight:1.7}}>{e.food}</div></div>}
        {e.note && <div style={{...S.card,marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:6}}>📝 備忘</div><div style={{fontSize:14,color:C.text,lineHeight:1.7}}>{e.note}</div></div>}
      </div>
    );
  }

  // ── List View ──
  return (
    <div style={{padding:'0 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 0 12px'}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,color:C.text}}>📓 健康日記</div>
          <div style={{fontSize:12,color:C.textS}}>記錄每日身心狀態</div>
        </div>
        <button onClick={()=>setView('add')} style={{background:`linear-gradient(135deg,${C.primary},${C.primaryL})`,color:'#fff',border:'none',borderRadius:14,padding:'10px 16px',fontSize:14,fontWeight:800,cursor:'pointer'}}>+ 新增</button>
      </div>

      {/* Stats Row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
        {[
          {label:'平均心情',val:avgMood,emoji:'😊',color:C.success},
          {label:'本月記錄',val:entries.length+'篇',emoji:'📓',color:C.primary},
          {label:'最常不適',val:topSymptom,emoji:'🤒',color:C.warning},
        ].map(item=>(
          <div key={item.label} style={{...S.card,padding:'12px 10px',textAlign:'center'}}>
            <div style={{fontSize:22,marginBottom:4}}>{item.emoji}</div>
            <div style={{fontSize:16,fontWeight:900,color:item.color}}>{item.val}</div>
            <div style={{fontSize:11,color:C.textL,marginTop:2}}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Mood Filter */}
      <div style={{display:'flex',gap:6,marginBottom:14,overflowX:'auto',paddingBottom:4}}>
        <button onClick={()=>setFilterMood(0)} style={{padding:'6px 14px',borderRadius:20,border:`2px solid ${filterMood===0?C.primary:C.border}`,background:filterMood===0?C.primary+'18':'transparent',fontSize:12,fontWeight:700,color:filterMood===0?C.primary:C.textS,cursor:'pointer',whiteSpace:'nowrap'}}>全部</button>
        {MOODS.map(m=>(
          <button key={m.val} onClick={()=>setFilterMood(filterMood===m.val?0:m.val)} style={{padding:'6px 12px',borderRadius:20,border:`2px solid ${filterMood===m.val?m.color:C.border}`,background:filterMood===m.val?m.color+'18':'transparent',fontSize:12,fontWeight:700,color:filterMood===m.val?m.color:C.textS,cursor:'pointer',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4}}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {/* Entry List */}
      {filtered.length === 0 ? (
        <div style={{...S.card,textAlign:'center',padding:'40px 20px'}}>
          <div style={{fontSize:40,marginBottom:12}}>📓</div>
          <div style={{fontSize:15,fontWeight:700,color:C.textS}}>還沒有日記紀錄</div>
          <div style={{fontSize:13,color:C.textL,marginTop:4}}>點擊右上角「+新增」開始記錄</div>
        </div>
      ) : filtered.map(e=>{
        const mood = MOODS.find(m=>m.val===e.mood)||MOODS[2];
        return (
          <div key={e.id} onClick={()=>{setSelected(e);setView('detail');}} style={{...S.card,marginBottom:12,cursor:'pointer',borderLeft:`4px solid ${mood.color}`,display:'flex',gap:14,alignItems:'flex-start'}}>
            <div style={{textAlign:'center',minWidth:48}}>
              <div style={{fontSize:32}}>{mood.emoji}</div>
              <div style={{fontSize:11,fontWeight:700,color:mood.color,marginTop:2}}>{mood.label}</div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <div style={{fontSize:14,fontWeight:800,color:C.text}}>{e.date}</div>
                <div style={{display:'flex',gap:2}}>{Array.from({length:e.energy}).map((_,i)=><span key={i} style={{fontSize:11,color:C.accent}}>⚡</span>)}</div>
              </div>
              {e.symptoms.length>0 && <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:6}}>{e.symptoms.slice(0,3).map(s=><span key={s} style={{...S.tag(C.danger),fontSize:10,padding:'2px 7px'}}>{s}</span>)}{e.symptoms.length>3&&<span style={{fontSize:11,color:C.textL}}>+{e.symptoms.length-3}</span>}</div>}
              {e.note && <div style={{fontSize:12,color:C.textS,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.note}</div>}
              <div style={{display:'flex',gap:10,marginTop:6}}>
                {e.bp&&<span style={{fontSize:11,color:C.textL}}>💓{e.bp}</span>}
                {e.glucose&&<span style={{fontSize:11,color:C.textL}}>🩸{e.glucose}</span>}
                {e.water&&<span style={{fontSize:11,color:C.info}}>💧{e.water}杯</span>}
              </div>
            </div>
            <div style={{color:C.textL,fontSize:18}}>›</div>
          </div>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 家人健康管理頁 Family Health Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RELATIONS = ['父親','母親','配偶','兒子','女兒','兄弟','姊妹','其他'];
const CHRONIC_CONDITIONS = ['高血壓','糖尿病','高血脂','心臟病','腎臟病','骨質疏鬆','甲狀腺問題','痛風','肝病','氣喘'];
const MEMBER_AVATARS = ['👴','👵','👨','👩','🧑','👦','👧','🧓'];

const DEMO_MEMBERS = [
  { id:'m1', name:'爸爸', relation:'父親', age:72, gender:'男', avatar:'👴', conditions:['高血壓','糖尿病'], meds:'降血壓藥、二甲雙胍', score:68, lastCheck:'2026-03-15', note:'需定期測血壓，飲食少鹽少糖', alerts:['血壓偏高，請留意'] },
  { id:'m2', name:'媽媽', relation:'母親', age:68, gender:'女', avatar:'👵', conditions:['骨質疏鬆'], meds:'鈣片、維生素D', score:82, lastCheck:'2026-02-20', note:'定期補充鈣質，避免跌倒', alerts:[] },
];

function FamilyPage({ state, setState, user }) {
  const members = state.familyMembers || DEMO_MEMBERS;
  const [view, setView] = useState('list'); // list | detail | add | edit
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name:'', relation:'配偶', age:'', gender:'男', avatar:'👨', conditions:[], meds:'', note:'' });
  const [editId, setEditId] = useState(null);

  const openAdd = () => { setForm({ name:'', relation:'配偶', age:'', gender:'男', avatar:'👨', conditions:[], meds:'', note:'' }); setEditId(null); setView('add'); };
  const openEdit = (m) => { setForm({...m}); setEditId(m.id); setView('add'); };
  
  const saveMember = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      setState(s=>({...s, familyMembers: members.map(m=>m.id===editId?{...m,...form,score:m.score,lastCheck:m.lastCheck,alerts:m.alerts}:m)}));
      if (user?.id) await saveFamilyMember(user.id, {...form, id: editId, score:85, alerts:[]});
    } else {
      const nm = {...form, id:'m'+Date.now(), score:85, lastCheck: new Date().toISOString().slice(0,10), alerts:[]};
      setState(s=>({...s, familyMembers:[...members, nm]}));
      if (user?.id) await saveFamilyMember(user.id, nm);
    }
    setView('list');
  };

  const deleteMember = async (id) => {
    setState(s=>({...s, familyMembers:members.filter(m=>m.id!==id)}));
    setView('list');
    if (user?.id) await deleteFamilyMember(id);
  };

  const scoreColor = (s) => s>=80?C.success:s>=60?C.warning:C.danger;
  const scoreLabel = (s) => s>=80?'健康':s>=60?'注意':'警示';

  // ── Add/Edit Form ──
  if (view === 'add') return (
    <div style={{padding:'0 16px 100px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'20px 0 16px'}}>
        <button onClick={()=>setView('list')} style={{background:C.borderL,border:'none',borderRadius:10,padding:'8px 12px',cursor:'pointer',fontSize:16}}>‹</button>
        <div style={{fontSize:18,fontWeight:800}}>{editId?'✏️ 編輯家人資料':'👤 新增家人'}</div>
      </div>

      {/* Avatar Picker */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:10}}>頭像</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {MEMBER_AVATARS.map(a=>(
            <button key={a} onClick={()=>setForm(f=>({...f,avatar:a}))} style={{width:52,height:52,borderRadius:14,border:`3px solid ${form.avatar===a?C.primary:C.borderL}`,background:form.avatar===a?C.primary+'18':'transparent',fontSize:28,cursor:'pointer',transition:'all 0.15s'}}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Info */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:10}}>基本資料</div>
        {[
          {key:'name',label:'姓名/暱稱',placeholder:'例：爸爸、老公'},
          {key:'age',label:'年齡',placeholder:'例：65',type:'number'},
        ].map(f=>(
          <div key={f.key} style={{marginBottom:12}}>
            <label style={{fontSize:13,color:C.textS,display:'block',marginBottom:5}}>{f.label}</label>
            <input type={f.type||'text'} value={form[f.key]} onChange={e=>setForm(v=>({...v,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:10,padding:'11px 14px',fontSize:15,outline:'none',color:C.text,background:C.bg,boxSizing:'border-box'}}/>
          </div>
        ))}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div>
            <label style={{fontSize:13,color:C.textS,display:'block',marginBottom:5}}>關係</label>
            <select value={form.relation} onChange={e=>setForm(f=>({...f,relation:e.target.value}))} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:10,padding:'11px 14px',fontSize:15,outline:'none',color:C.text,background:C.bg}}>
              {RELATIONS.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:13,color:C.textS,display:'block',marginBottom:5}}>性別</label>
            <select value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:10,padding:'11px 14px',fontSize:15,outline:'none',color:C.text,background:C.bg}}>
              {['男','女','其他'].map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Chronic Conditions */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:C.textS,marginBottom:10}}>🏥 慢性病史（可多選）</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {CHRONIC_CONDITIONS.map(c=>{
            const on=form.conditions.includes(c);
            return <button key={c} onClick={()=>setForm(f=>({...f,conditions:on?f.conditions.filter(x=>x!==c):[...f.conditions,c]}))} style={{padding:'8px 14px',borderRadius:20,border:`2px solid ${on?C.warning:C.border}`,background:on?C.warning+'18':'transparent',fontSize:13,fontWeight:on?700:400,color:on?C.warning:C.textS,cursor:'pointer'}}>
              {on?'✓ ':''}{c}
            </button>;
          })}
        </div>
      </div>

      {/* Medications */}
      <div style={{...S.card,marginBottom:12}}>
        <label style={{fontSize:13,fontWeight:700,color:C.textS,display:'block',marginBottom:8}}>💊 目前用藥（選填）</label>
        <textarea value={form.meds} onChange={e=>setForm(f=>({...f,meds:e.target.value}))} placeholder="例：降血壓藥阿斯匹靈、血糖藥二甲雙胍..." rows={2} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:12,padding:'10px 14px',fontSize:14,outline:'none',color:C.text,background:C.bg,resize:'none',boxSizing:'border-box'}}/>
      </div>

      {/* Notes */}
      <div style={{...S.card,marginBottom:16}}>
        <label style={{fontSize:13,fontWeight:700,color:C.textS,display:'block',marginBottom:8}}>📝 健康備忘</label>
        <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="例：每週一三五量血壓、需注意飲食少鹽..." rows={2} style={{width:'100%',border:`1.5px solid ${C.border}`,borderRadius:12,padding:'10px 14px',fontSize:14,outline:'none',color:C.text,background:C.bg,resize:'none',boxSizing:'border-box'}}/>
      </div>

      <button onClick={saveMember} style={{...S.btn('primary'),marginBottom:12}}>💾 {editId?'更新資料':'新增家人'}</button>
      {editId && <button onClick={()=>deleteMember(editId)} style={{...S.btn('outline'),border:`2px solid ${C.danger}`,color:C.danger}}>🗑️ 刪除此家人</button>}
    </div>
  );

  // ── Detail View ──
  if (view === 'detail' && selected) {
    const m = members.find(x=>x.id===selected.id) || selected;
    return (
      <div style={{padding:'0 16px 90px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'20px 0 12px'}}>
          <button onClick={()=>setView('list')} style={{background:C.borderL,border:'none',borderRadius:10,padding:'8px 12px',cursor:'pointer',fontSize:16}}>‹</button>
          <div style={{flex:1,fontSize:18,fontWeight:800}}>{m.name} 的健康檔案</div>
          <button onClick={()=>openEdit(m)} style={{background:C.primary+'18',border:`1px solid ${C.primary}30`,borderRadius:10,padding:'8px 12px',cursor:'pointer',color:C.primary,fontSize:13,fontWeight:700}}>編輯</button>
        </div>

        {/* Profile Card */}
        <div style={{...S.card,background:`linear-gradient(135deg,${scoreColor(m.score)}18,${scoreColor(m.score)}05)`,border:`2px solid ${scoreColor(m.score)}40`,marginBottom:12,display:'flex',gap:16,alignItems:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:56}}>{m.avatar}</div>
            <div style={{fontSize:12,color:C.textS,marginTop:4}}>{m.relation} · {m.age}歲 · {m.gender}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:4}}>{m.name}</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <div style={{fontSize:32,fontWeight:900,color:scoreColor(m.score)}}>{m.score}</div>
              <div>
                <div style={{fontSize:12,color:C.textS}}>健康分數</div>
                <div style={{background:scoreColor(m.score),color:'#fff',borderRadius:8,padding:'2px 10px',fontSize:12,fontWeight:800}}>{scoreLabel(m.score)}</div>
              </div>
            </div>
            <div style={{fontSize:12,color:C.textL}}>最後更新：{m.lastCheck}</div>
          </div>
        </div>

        {/* Alerts */}
        {m.alerts && m.alerts.length>0 && (
          <div style={{...S.card,background:C.danger+'10',border:`1px solid ${C.danger}30`,marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700,color:C.danger,marginBottom:8}}>⚠️ 健康提醒</div>
            {m.alerts.map((a,i)=><div key={i} style={{fontSize:13,color:C.textS,padding:'4px 0'}}>{a}</div>)}
          </div>
        )}

        {/* Conditions */}
        {m.conditions.length>0 && (
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700,color:C.textS,marginBottom:10}}>🏥 慢性病史</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{m.conditions.map(c=><span key={c} style={{...S.tag(C.warning)}}>{c}</span>)}</div>
          </div>
        )}

        {/* Meds */}
        {m.meds && (
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700,color:C.textS,marginBottom:6}}>💊 目前用藥</div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.7}}>{m.meds}</div>
          </div>
        )}

        {/* Note */}
        {m.note && (
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700,color:C.textS,marginBottom:6}}>📝 健康備忘</div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.7}}>{m.note}</div>
          </div>
        )}

        {/* AI Tips */}
        <div style={{...S.card,background:`linear-gradient(135deg,${C.primary}10,${C.primaryL}05)`,border:`1px solid ${C.primary}25`,marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:800,color:C.primary,marginBottom:10}}>🤖 AI 健康建議</div>
          {m.conditions.includes('高血壓') && <div style={{fontSize:13,color:C.textS,padding:'6px 0',borderBottom:`1px solid ${C.borderL}`}}>💓 高血壓患者建議每日量血壓，控制鹽份攝取（每日不超過6g），避免情緒激動。</div>}
          {m.conditions.includes('糖尿病') && <div style={{fontSize:13,color:C.textS,padding:'6px 0',borderBottom:`1px solid ${C.borderL}`}}>🩸 糖尿病患者建議飯後30分鐘量血糖，選擇低GI食物，規律運動有助血糖控制。</div>}
          {m.conditions.includes('骨質疏鬆') && <div style={{fontSize:13,color:C.textS,padding:'6px 0',borderBottom:`1px solid ${C.borderL}`}}>🦴 骨質疏鬆患者需補充鈣質與維生素D，避免跌倒，多做負重運動如散步。</div>}
          {m.conditions.length===0 && <div style={{fontSize:13,color:C.textS}}>保持良好作息、均衡飲食、規律運動，定期回診追蹤健康狀況。</div>}
        </div>

        <button onClick={()=>setState(s=>({...s,page:'report'}))} style={{...S.btn('outline'),marginBottom:8}}>📋 上傳{m.name}的體檢報告</button>
      </div>
    );
  }

  // ── List View ──
  const canAdd = members.length < 5;
  return (
    <div style={{padding:'0 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 0 12px'}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,color:C.text}}>👨‍👩‍👧 家人健康管理</div>
          <div style={{fontSize:12,color:C.textS}}>最多管理 5 位家人</div>
        </div>
        {canAdd && <button onClick={openAdd} style={{background:`linear-gradient(135deg,${C.primary},${C.primaryL})`,color:'#fff',border:'none',borderRadius:14,padding:'10px 16px',fontSize:14,fontWeight:800,cursor:'pointer'}}>+ 新增</button>}
      </div>

      {/* Stats */}
      <div style={{...S.card,background:`linear-gradient(135deg,${C.primary}12,${C.primaryL}05)`,border:`1px solid ${C.primary}20`,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-around',textAlign:'center'}}>
          <div><div style={{fontSize:24,fontWeight:900,color:C.primary}}>{members.length}</div><div style={{fontSize:12,color:C.textS}}>家人</div></div>
          <div><div style={{fontSize:24,fontWeight:900,color:C.success}}>{members.filter(m=>m.score>=80).length}</div><div style={{fontSize:12,color:C.textS}}>健康</div></div>
          <div><div style={{fontSize:24,fontWeight:900,color:C.warning}}>{members.filter(m=>m.score>=60&&m.score<80).length}</div><div style={{fontSize:12,color:C.textS}}>需注意</div></div>
          <div><div style={{fontSize:24,fontWeight:900,color:C.danger}}>{members.flatMap(m=>m.alerts||[]).length}</div><div style={{fontSize:12,color:C.textS}}>提醒事項</div></div>
        </div>
      </div>

      {/* Member Cards */}
      {members.map(m=>(
        <div key={m.id} onClick={()=>{setSelected(m);setView('detail');}} style={{...S.card,marginBottom:12,cursor:'pointer',display:'flex',gap:14,alignItems:'center',border:`1px solid ${scoreColor(m.score)}30`}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:60,height:60,borderRadius:18,background:`${scoreColor(m.score)}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:36}}>{m.avatar}</div>
            {m.alerts&&m.alerts.length>0&&<div style={{position:'absolute',top:-4,right:-4,width:18,height:18,borderRadius:'50%',background:C.danger,color:'#fff',fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>{m.alerts.length}</div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <div style={{fontSize:17,fontWeight:800,color:C.text}}>{m.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{fontSize:18,fontWeight:900,color:scoreColor(m.score)}}>{m.score}</div>
                <span style={{background:scoreColor(m.score)+'22',color:scoreColor(m.score),fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10}}>{scoreLabel(m.score)}</span>
              </div>
            </div>
            <div style={{fontSize:12,color:C.textS,marginBottom:6}}>{m.relation} · {m.age}歲 · {m.gender}</div>
            {m.conditions.length>0 && <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{m.conditions.slice(0,3).map(c=><span key={c} style={{...S.tag(C.warning),fontSize:10,padding:'2px 7px'}}>{c}</span>)}</div>}
          </div>
          <div style={{color:C.textL,fontSize:18}}>›</div>
        </div>
      ))}

      {/* Empty State */}
      {members.length===0 && (
        <div style={{...S.card,textAlign:'center',padding:'40px 20px'}}>
          <div style={{fontSize:48,marginBottom:12}}>👨‍👩‍👧</div>
          <div style={{fontSize:15,fontWeight:700,color:C.textS}}>還沒有家人健康檔案</div>
          <div style={{fontSize:13,color:C.textL,marginTop:4}}>點擊右上角「+新增」加入家人</div>
        </div>
      )}

      {/* Limit reminder */}
      {members.length>=5 && (
        <div style={{...S.card,background:C.warning+'12',border:`1px solid ${C.warning}30`,textAlign:'center',padding:'16px'}}>
          <div style={{fontSize:13,color:C.warning,fontWeight:700}}>已達5位上限，如需新增請先刪除一位</div>
        </div>
      )}
    </div>
  );
}

// 智能分析頁 Analysis / Recommendation Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AnalysisPage({ state, setState }) {
  const { assessResults, examValues } = state;
  const recs = useMemo(() => buildRecommendations(assessResults, examValues, { bp:{ sys:bpData[bpData.length-1].sys } }), [assessResults, examValues]);
  const topRecs = recs.filter(p=>p.matchScore>0).slice(0,8);
  const completedAssessments = Object.values(assessResults).filter(Boolean).length;
  const hasExamData = Object.values(examValues).some(Boolean);

  const healthDimensions = Object.entries(assessResults).filter(([,v])=>v).map(([key,r])=>({
    name: ASSESSMENTS[key]?.title || key,
    score: Math.max(10, 100 - r.score * 2.5),
    level: r.level,
    color: r.color,
  }));

  return (
    <div style={{ padding:'0 16px 90px' }}>
      <div style={{ padding:'20px 0 16px' }}>
        <SectionHeader title="智能健康分析" sub="整合自測、記錄、報告 · 全方位推薦" />
      </div>

      {completedAssessments === 0 && !hasExamData ? (
        <div style={{ ...S.card, textAlign:'center', padding:'40px 20px' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🤖</div>
          <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>資料不足，無法分析</div>
          <div style={{ fontSize:13, color:C.textS, marginBottom:20, lineHeight:1.8 }}>請先完成至少1項健康自測，或輸入體檢報告數值，系統才能為您提供個人化推薦</div>
          <button onClick={()=>setState(s=>({...s,page:'assessment'}))} style={S.btn('primary')}>前往健康自測</button>
        </div>
      ) : (
        <>
          {/* Data Sources */}
          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>📊 分析資料來源</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {completedAssessments > 0 && <Badge color={C.primary}>{completedAssessments} 項健康自測 ✓</Badge>}
              {hasExamData && <Badge color={C.info}>體檢報告數值 ✓</Badge>}
              <Badge color={C.success}>健康記錄趨勢 ✓</Badge>
            </div>
          </div>

          {/* Health Profile Radar */}
          {healthDimensions.length > 0 && (
            <div style={{ ...S.card, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>🎯 健康面向評分</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={healthDimensions.map(d=>({ subject:d.name, score:d.score }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:11 }} />
                  <Radar dataKey="score" stroke={C.primary} fill={C.primary} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {healthDimensions.map(d=>(
                  <div key={d.name} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:d.color }} />
                    <span style={{ fontSize:12, color:C.textS }}>{d.name}：{d.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div style={{ ...S.card, border:`2px solid ${C.accent}20`, background:`linear-gradient(135deg,${C.accent}08,transparent)`, marginBottom:16 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
              <div style={{ width:42, height:42, background:`linear-gradient(135deg,${C.accent},${C.accentL})`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🤖</div>
              <div>
                <div style={{ fontSize:16, fontWeight:800 }}>AI 個人化推薦方案</div>
                <div style={{ fontSize:12, color:C.textS }}>根據您的完整健康資料分析</div>
              </div>
            </div>

            {topRecs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:C.textS }}>目前健康指標良好，暫無特別需要補充的保健品</div>
            ) : topRecs.map((p, idx) => (
              <div key={p.id} style={{ border:`1px solid ${C.borderL}`, borderRadius:16, padding:'14px', marginBottom:12, background:C.surface }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ width:54, height:54, background:`${C.primary}12`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>{p.emoji}</div>
                    {idx < 3 && <div style={{ position:'absolute', top:-6, right:-6, width:20, height:20, background:`linear-gradient(135deg,${C.accent},${C.accentL})`, borderRadius:99, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>#{idx+1}</div>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:800 }}>{p.name}</div>
                    <div style={{ fontSize:11, color:C.textS, margin:'2px 0 8px' }}>{p.brand}</div>
                    {p.reasons.slice(0,2).map((r,i)=>(
                      <div key={i} style={{ display:'flex', gap:6, alignItems:'flex-start', marginBottom:4 }}>
                        <span style={{ color:C.accent, fontSize:12, fontWeight:800 }}>★</span>
                        <span style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{r}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                      <div>
                        <span style={{ fontSize:17, fontWeight:900, color:C.primary }}>NT$ {p.price.toLocaleString()}</span>
                        <span style={{ fontSize:11, color:C.textL, textDecoration:'line-through', marginLeft:8 }}>{p.orig.toLocaleString()}</span>
                      </div>
                      <button onClick={()=>{
                        setState(s=>({...s, cart:[...s.cart.filter(c=>c.id!==p.id), {id:p.id,name:p.name,price:p.price,emoji:p.emoji,qty:(s.cart.find(c=>c.id===p.id)?.qty||0)+1}]}));
                      }} style={{ ...S.btn('accent'), width:'auto', padding:'8px 16px', fontSize:13 }}>加入購物車</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={()=>setState(s=>({...s,page:'mall'}))} style={S.btn('outline')}>
            🛍️ 查看全部保健品
          </button>
        </>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 保健商城頁 Mall Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MallPage({ state, setState, user, requireLogin }) {
  const { subpage, selectedProduct } = state;
  const [catFilter, setCatFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('推薦');

  const cats = ['全部',...[...new Set(PRODUCTS.map(p=>p.cat))]];
  const recs = useMemo(()=>buildRecommendations(state.assessResults, state.examValues, {}), [state.assessResults, state.examValues]);
  const recIds = new Set(recs.filter(p=>p.matchScore>0).slice(0,8).map(p=>p.id));

  const filtered = PRODUCTS.filter(p=>(catFilter==='全部'||p.cat===catFilter)&&(search===''||p.name.includes(search)||p.brand.includes(search)));
  const sorted = [...filtered].sort((a,b)=>{
    if (sortBy==='推薦') return (recIds.has(b.id)?1:0)-(recIds.has(a.id)?1:0);
    if (sortBy==='價格低') return a.price-b.price;
    if (sortBy==='評分') return b.rating-a.rating;
    if (sortBy==='熱銷') return (b.hot?1:0)-(a.hot?1:0);
    return 0;
  });

  // Product Detail Page
  if (subpage === 'detail' && selectedProduct) {
    const p = selectedProduct;
    const isRec = recIds.has(p.id);
    const inCart = state.cart.find(c=>c.id===p.id);
    const recData = recs.find(r=>r.id===p.id);
    return (
      <div style={{ paddingBottom:90 }}>
        <div style={{ background:`linear-gradient(145deg,${C.primary},${C.primaryL})`, padding:'24px 20px 32px', borderRadius:'0 0 28px 28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <button onClick={()=>setState(s=>({...s,subpage:null,selectedProduct:null}))} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', color:'#fff', fontSize:16 }}>‹</button>
            <div style={{ color:'#fff', fontSize:16, fontWeight:700 }}>商品詳情</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:80 }}>{p.emoji}</div>
            {isRec && <div style={{ background:'rgba(200,122,10,0.9)', display:'inline-block', borderRadius:10, padding:'4px 14px', fontSize:12, fontWeight:700, color:'#fff', margin:'8px 0' }}>🤖 為您專屬推薦</div>}
            <div style={{ color:'#fff', fontSize:20, fontWeight:900, marginTop:8 }}>{p.name}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>{p.brand}</div>
          </div>
        </div>

        <div style={{ padding:'0 16px', marginTop:-8 }}>
          <div style={{ ...S.card, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <span style={{ fontSize:28, fontWeight:900, color:C.primary }}>NT$ {p.price.toLocaleString()}</span>
                <span style={{ fontSize:14, color:C.textL, textDecoration:'line-through', marginLeft:10 }}>原價 {p.orig.toLocaleString()}</span>
                <Badge color={C.danger} size="sm"> 省 {p.orig-p.price} 元</Badge>
              </div>
              <StarRating rating={p.rating} />
            </div>
            <div style={{ fontSize:13, color:C.textS }}>{p.reviews} 則評價 · 庫存 {p.stock} 件</div>
          </div>

          {isRec && recData?.reasons?.length > 0 && (
            <div style={{ ...S.card, border:`2px solid ${C.accent}`, background:`${C.accent}08`, marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.accent, marginBottom:10 }}>⭐ AI推薦理由（根據您的健康資料）</div>
              {recData.reasons.map((r,i)=>(
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <span style={{ color:C.accent, fontWeight:800 }}>✓</span>
                  <span style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ ...S.card, marginBottom:12 }}>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:10 }}>產品說明</div>
            <div style={{ fontSize:14, color:C.textS, lineHeight:1.8 }}>{p.desc}</div>
          </div>

          <div style={{ ...S.card, marginBottom:12 }}>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:10 }}>主要功效</div>
            {p.benefits.map((b,i)=>(
              <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:i<p.benefits.length-1?`1px solid ${C.borderL}`:'none' }}>
                <span style={{ color:C.success, fontWeight:800 }}>✓</span>
                <span style={{ fontSize:14, color:C.text }}>{b}</span>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:10 }}>📦 物流說明</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { emoji:'🏪', text:'全台7-11超商取貨付款' },
                { emoji:'⏱️', text:'訂購後3-5個工作天到店' },
                { emoji:'💰', text:'取貨時付款，不需先付款' },
                { emoji:'📱', text:'到貨簡訊通知' },
              ].map(i=>(
                <div key={i.text} style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontSize:20 }}>{i.emoji}</span>
                  <span style={{ fontSize:14, color:C.textS }}>{i.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{
              setState(s=>({...s, cart:[...s.cart.filter(c=>c.id!==p.id), {id:p.id,name:p.name,price:p.price,emoji:p.emoji,qty:(s.cart.find(c=>c.id===p.id)?.qty||0)+1}]}));
            }} style={{ ...S.btn('primary'), flex:2 }}>{inCart ? `重複加入（已有${inCart.qty}件）` : '🛒 加入購物車'}</button>
            <button onClick={()=>setState(s=>({...s, page:'mall', subpage:'cart'}))} style={{ ...S.btn('outline'), flex:1 }}>前往結帳</button>
          </div>

          <div style={{ background:'#FFF9EC', border:`1px solid #F5D985`, borderRadius:12, padding:'12px 14px', marginTop:12 }}>
            <div style={{ fontSize:12, color:'#976B00', lineHeight:1.7 }}>⚠️ 本產品為保健食品，非藥品，不能替代藥物治療。食用前請諮詢醫師或藥師，尤其是孕婦、哺乳婦女、正在服藥者。</div>
          </div>
        </div>
      </div>
    );
  }

  // Cart Page
  if (subpage === 'cart') {
    return <CartPage state={state} setState={setState} />;
  }

  // Mall Listing Page
  return (
    <div style={{ paddingBottom:90 }}>
      {/* Mall Header */}
      <div style={{ background:`linear-gradient(145deg,${C.accent},${C.accentL})`, padding:'20px 16px 28px', borderRadius:'0 0 24px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ color:'#fff', fontSize:20, fontWeight:900 }}>🛍️ 保健品商城</div>
          <button onClick={()=>setState(s=>({...s,subpage:'cart'}))} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:12, padding:'8px 14px', color:'#fff', cursor:'pointer', position:'relative', fontSize:14, fontWeight:700 }}>
            購物車 {state.cart.reduce((s,i)=>s+i.qty,0) > 0 && `(${state.cart.reduce((s,i)=>s+i.qty,0)})`}
          </button>
        </div>
        <div style={{ background:'rgba(255,255,255,0.9)', borderRadius:14, display:'flex', alignItems:'center', padding:'0 14px' }}>
          <span style={{ fontSize:16, color:C.textS }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋保健品..." style={{ flex:1, background:'none', border:'none', padding:'12px 10px', fontSize:15, outline:'none', color:C.text }} />
          {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16 }}>✕</button>}
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>
        {/* AI Recommendation Banner */}
        {recIds.size > 0 && (
          <div onClick={()=>setState(s=>({...s,page:'analysis'}))} style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryL})`, borderRadius:16, padding:'14px 18px', margin:'12px 0', cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:36 }}>🤖</div>
            <div>
              <div style={{ color:'#fff', fontSize:14, fontWeight:800 }}>AI 已為您分析 {recIds.size} 款推薦保健品</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>根據您的健康數據量身推薦 ›</div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'8px 0', marginBottom:8 }}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)} style={{ whiteSpace:'nowrap', padding:'8px 16px', borderRadius:20, border:`2px solid ${catFilter===c?C.primary:C.border}`, background:catFilter===c?C.primary:'#fff', color:catFilter===c?'#fff':C.textS, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto' }}>
          {['推薦','熱銷','評分','價格低'].map(s=>(
            <button key={s} onClick={()=>setSortBy(s)} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:sortBy===s?`${C.accent}20`:C.borderL, color:sortBy===s?C.accent:C.textS, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }}>
          {sorted.map(p => {
            const isRec = recIds.has(p.id);
            return (
              <div key={p.id} onClick={()=>setState(s=>({...s,subpage:'detail',selectedProduct:p}))} style={{ background:C.surface, borderRadius:16, overflow:'hidden', cursor:'pointer', border:`2px solid ${isRec?C.accent:C.borderL}`, boxShadow: isRec ? `0 4px 16px ${C.accent}30` : sh.sm, position:'relative' }}>
                {isRec && <div style={{ position:'absolute', top:8, left:8, background:`linear-gradient(135deg,${C.accent},${C.accentL})`, borderRadius:8, padding:'3px 8px', fontSize:10, fontWeight:800, color:'#fff', zIndex:1 }}>AI推薦</div>}
                {p.hot && !isRec && <div style={{ position:'absolute', top:8, right:8, background:C.danger, borderRadius:8, padding:'3px 8px', fontSize:10, fontWeight:800, color:'#fff' }}>熱銷</div>}
                <div style={{ background:`${C.primary}08`, padding:'20px 16px', textAlign:'center' }}>
                  <div style={{ fontSize:52 }}>{p.emoji}</div>
                </div>
                <div style={{ padding:'12px' }}>
                  <div style={{ fontSize:12, color:C.textS, marginBottom:4 }}>{p.brand}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:6, lineHeight:1.4 }}>{p.name}</div>
                  <StarRating rating={p.rating} />
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:16, fontWeight:900, color:C.primary }}>NT$ {p.price.toLocaleString()}</div>
                    <div style={{ fontSize:11, color:C.textL, textDecoration:'line-through' }}>原 {p.orig.toLocaleString()}</div>
                  </div>
                  <button onClick={e=>{ e.stopPropagation(); setState(s=>({...s, cart:[...s.cart.filter(c=>c.id!==p.id), {id:p.id,name:p.name,price:p.price,emoji:p.emoji,qty:(s.cart.find(c=>c.id===p.id)?.qty||0)+1}]})); }} style={{ ...S.btn('primary'), padding:'8px 12px', fontSize:12, marginTop:8 }}>
                    加入購物車
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 購物車與結帳 Cart & Checkout Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CartPage({ state, setState }) {
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [orderForm, setOrderForm] = useState({ name:'', phone:'', city:'', store:'', storeId:'', storeName:'', storeAddress:'' });
  useEffect(() => {
    if (user) setOrderForm(f => ({ ...f, name: f.name || user.nickname || '', phone: f.phone || user.phone || '' }));
  }, [user]);
  const [orderDone, setOrderDone] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeCity, setStoreCity] = useState('');

  const total = state.cart.reduce((s,i)=>s+i.price*i.qty, 0);
  const itemCount = state.cart.reduce((s,i)=>s+i.qty, 0);

  const CITIES = ['台北市','新北市','桃園市','台中市','台南市','高雄市','基隆市','新竹市','新竹縣','苗栗縣','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','屏東縣','宜蘭縣','花蓮縣','台東縣','澎湖縣'];
  const CITY_RE = /^(台北市|新北市|桃園市|台中市|台南市|高雄市|基隆市|新竹市|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義市|嘉義縣|屏東縣|宜蘭縣|花蓮縣|台東縣|澎湖縣)/;
  const STORES_RAW = [
['110035','一勝','台中市大肚區福山村沙田路一段432-1號'],
['110080','千禧','桃園市龜山區光峰路千禧新城15號1樓'],
['110172','樂東','台中市東區東英路331號'],
['110208','集寶','南投縣集集鎮八張街75號'],
['110253','僑德','屏東縣枋寮鄉安樂村中山路143號145號147號1樓'],
['110275','家的','屏東縣恆春鎮城南里中正路67號1樓'],
['110286','鴻成','新北市土城區學府路一段28號1樓'],
['110297','油車','雲林縣二崙鄉油車村文化路9號1樓'],
['110301','耀心','新北市板橋區中山路一段50巷22號1樓'],
['110312','林田山','花蓮縣鳳林鎮長橋里長橋路108號1樓'],
['110367','儒林','彰化縣二林鎮北平里仁愛路11鄰425號'],
['110390','福冠','桃園市中壢區福州一街242號1樓及2樓'],
['110415','豐濱','花蓮縣豐濱鄉三民村三民路61號65號1樓'],
['110426','資砡','嘉義市西區港坪里玉山路422號'],
['110507','雙建','新北市新店區二十張路64號64之1號1樓'],
['110530','廣大','屏東縣屏東市仁愛里廣東路561號1樓'],
['110552','蘆荻','新北市蘆洲區永康街1巷35號1樓'],
['110600','冬念','雲林縣虎尾鎮埒內里林森路一段9鄰39號'],
['110611','富來','雲林縣西螺鎮新豐里13鄰新社320-8號'],
['110677','池上','台東縣池上鄉大埔村中山路64號1樓'],
['110699','耕新','新竹縣湖口鄉成功路276號'],
['110769','信賢','高雄市新興區南港里七賢一路432號1樓'],
['110817','千翔','台北市中正區許昌街17號1樓'],
['110839','虎威','雲林縣虎尾鎮光復路122號1樓及成和街2號1樓'],
['110884','桂冠','台中市西屯區四川路120號1樓'],
['110895','公華','屏東縣屏東市龍華里龍華路152號156號1樓'],
['110909','翁武','桃園市大溪區文化路108號1樓'],
['110987','淡溝','台中市北區淡溝里民權路361號1樓'],
['110998','百豐','新北市新店區安康路一段168號1樓'],
['111005','前山','南投縣竹山鎮集山路三段1089號'],
['111142','漢溪','台中市東區十甲東路575號1樓'],
['111153','大埕','台南市七股區大珵里272號1樓'],
['111201','徠一','宜蘭縣羅東鎮培英路98號100號'],
['111212','軍福','台中市北屯區軍功路一段500號'],
['111278','前港','台北市士林區後港街98之1號2號1樓'],
['111289','台達電','桃園市龜山區山鶯路252號B1樓'],
['111371','俊安','新北市樹林區俊英街156號'],
['111382','圓興','高雄市旗山區旗甲路二段373號1樓'],
['111418','中同','桃園市中壢區大同路141號143號1樓'],
['111485','熱陽','台中市北屯區熱河路二段217號'],
['111522','文城','桃園市桃園區龍壽街273巷1號1樓'],
['111544','向日葵','南投縣草屯鎮芬草路三段219-1號'],
['111614','凱華','桃園市龜山區文化二路183號1樓'],
['111739','勵志','高雄市岡山區筧橋路12號16號1樓'],
['111795','亞文','桃園市中壢區龍川街108號110號112號1樓'],
['111809','榮譽','台南市東區榮譽街86號86-1號1樓'],
['111821','新國','台南市新營區民治東路1號1樓'],
['111832','新後昌','高雄市楠梓區錦屏里後昌路115號1樓'],
['111854','布洛瓦','苗栗縣竹南鎮科東三路12號'],
['111865','東泰','台中市東勢區東蘭路41-5號'],
['111876','倍沅','台中市神岡區中山路473號'],
['111913','天下','新北市三峽區中正路一段110號112號1樓'],
['111946','城雅','新北市樹林區學成路519號1樓'],
['111979','喬城','台中市大里區大智路567號'],
['112053','神農','高雄市林園區廣應里王公路341號343號'],
['112075','財神','台南市東區中華東路二段171-177號'],
['112134','后興','台中市后里區甲后路一段1202號1樓'],
['112145','中興嶺','台中市新社區中興嶺170之2號1樓'],
['112189','瑞芳','新北市瑞芳區明燈路三段52號54號'],
['112190','寶慶','台中市西屯區逢甲里西屯路二段256巷8、10號1樓'],
['112204','興城','台中市大里區塗城路765號'],
['112215','員林','彰化縣員林市忠孝里4鄰員東路二段417號'],
['112237','詠權','台中市南區五權南路527號'],
['112293','龍昌','桃園市龍潭區大昌路二段139之1號'],
['112307','社上','屏東縣萬丹鄉社中村社皮路三段246號248號1樓'],
['112329','海湖','桃園市蘆竹區濱海路一段40號42號'],
['112341','健神','宜蘭縣宜蘭市神農路二段8號10號1樓'],
['112385','大陽','彰化縣彰化市延平里大埔路405號'],
['112400','金崙','新北市淡水區沙崙路24號1樓'],
['112466','聖華','新竹市北區西濱路一段399號'],
['112503','嘉雅','嘉義市東區大雅路二段421號1樓'],
['112525','新北中','台南市佳里區延平路195號'],
['112558','夏恩','雲林縣虎尾鎮立仁里復興路137號'],
['112570','環雅','台中市大雅區雅環路二段320號一樓'],
['112617','得寶','桃園市桃園區春日路1344號1346號1樓'],
['112787','滿州','屏東縣滿州鄉滿州村中山路56號1樓'],
['112824','馬太鞍','花蓮縣光復鄉中山路一段125號'],
['112857','永和山','苗栗縣頭份市水源路206號1樓'],
['112938','圓達','宜蘭縣礁溪鄉礁溪路七段65號69號'],
['112949','頂番','彰化縣鹿港鎮頂草路一段61號'],
['113001','港強','台中市西屯區福科路295號一樓'],
['113056','蓮慶','花蓮縣花蓮市林森路160號1樓'],
['113078','濱海','桃園市大園區竹圍里五鄰竹圍街45-3號'],
['113090','統崙','高雄市鳳山區中民里中崙四路6號8號1樓'],
['113126','山上','台南市山上區南洲337-3號'],
['113137','珊湖','苗栗縣頭份市中正三路271號1樓及親民路1號3號1樓'],
['113160','指南','台北市文山區指南路一段34號36號1樓'],
['113218','華鑫','新竹市香山區五福路二段725、727、729號1樓'],
['113252','后里廠','台中市后里區馬場路1號'],
['113285','民欣','新北市蘆洲區光榮路63號65號67號'],
['113296','東宇','雲林縣斗六市文化路538號540號1樓'],
['113344','大和園','桃園市大園區中山南路272號及272-1號1樓'],
['113377','飛龍','新北市蘆洲區永安南路二段356號環堤大道2號6號'],
['113388','華安','新北市蘆洲區長安街107號'],
['113399','伍富','宜蘭縣宜蘭市女中路三段26-6號26-7號26-8號'],
['113403','王功','彰化縣芳苑鄉王功村3鄰芳漢路王功段544號1樓'],
['113425','富仁','台中市東區富榮街2號1樓'],
['113458','莒光','新北市中和區莒光路138號1樓'],
['113506','揚光','澎湖縣馬公市陽明里中華路175號1樓'],
['113539','虹諭','新北市三重區中正北路193巷21弄43號'],
['113573','果林','桃園市大園區?林里?林路97號1樓'],
['113595','神洲','台中市神岡區國豐路一段88號1樓'],
['113665','蓮慈','花蓮縣花蓮市中山路一段7號9號1樓'],
['113687','六合','南投縣水里鄉民生路175號1樓'],
['113702','高城','桃園市八德區高城八街58巷5號1樓'],
['113735','亞都','桃園市大溪區僑愛一街72巷15號'],
['113779','春秋','新北市板橋區莒光路40巷16號'],
['113816','金福興','彰化縣福興鄉員鹿路二段196號198號1樓'],
['113883','東衛','澎湖縣馬公市東衛里19鄰9之2號'],
['113894','凱園','新北市樹林區國凱街55號1樓'],
['113919','觀群','桃園市大園區大工路106號1樓'],
['113986','至富','新北市林口區中湖里14鄰中湖40號之9'],
['114130','恆春','屏東縣恆春鎮網紗里省北路45號47號49號1樓'],
['114152','鄉林夏都','台中市西區忠明南路117號1樓'],
['114196','鼓波','高雄市鼓山區臨海二路45-1號1樓鼓波街43號1樓'],
['114222','南都','台南市南區金華路一段27號1樓'],
['114233','上芸','高雄市林園區西溪路133-30號1樓'],
['114288','崇德盈','花蓮縣秀林鄉崇德村崇德95-6號1樓'],
['114369','天佑','台中市西屯區中工二路196號198號1樓'],
['114532','白河','台南市白河區永安里17鄰國泰路101號'],
['114587','太保','嘉義縣太保市後潭里後潭408-7號408-8號一樓'],
['114602','港后','高雄市小港區平和路156號'],
['114657','聖武','新北市中和區新生街48號50號1樓'],
['114680','恆吉','南投縣埔里鎮南興街172號'],
['114691','環太','台中市大雅區雅環路一段330號'],
['114705','鹽生','台南市鹽水區南門路1號'],
['114808','晟安','雲林縣莿桐鄉饒平村饒平路2之2號'],
['115823','雅盛','新北市板橋區漢生東路181號183號1樓'],
['115867','鑫正發','苗栗縣苗栗市正發路196號'],
['115878','新台西','雲林縣台西鄉海南村民族路16-7號1樓'],
['115889','武漢','高雄市苓雅區武漢街72號'],
['115904','元隆','高雄市三民區正興里建元路58號1樓'],
['115915','新楓港','屏東縣枋山鄉楓港村舊庄路51之2號3號4號'],
['115960','臨廣','高雄市前鎮區新生路248-45號'],
['116044','明福','桃園市八德區大明街105號107號'],
['116055','青埔','桃園市中壢區青昇路223號1樓'],
['116169','竹南和興','苗栗縣竹南鎮大埔里和興路191-1號'],
['116181','灣中','台南市永康區大灣路62號'],
['116262','精城','嘉義市東區圳頭里林森東路720號'],
['116413','興玉','花蓮縣玉里鎮興國路二段23號'],
['116479','榮興','桃園市八德區榮興路1139號'],
['116480','豪麥','苗栗縣卓蘭鎮中山路48號之4'],
['116505','弘光','台中市沙鹿區晉江里台灣大道六段1018號B2樓'],
['116608','觀亭','高雄市內門區觀亭里南屏路78號'],
['116620','歡雅','台南市鹽水區歡雅里26號'],
['116697','御昇','新北市樹林區佳園路二段34號1樓'],
['116734','鄭子寮','台南市北區成德里38鄰北成路442號'],
['116745','義發','高雄市大寮區義發路7號8號1樓'],
['116756','新甲后','台中市外埔區甲后路三段1025號'],
['116767','口庄','彰化縣花壇鄉中山路二段649號651號'],
['116789','鎮海','屏東縣東港鎮鎮海路1-100號1-26號1樓'],
['116790','甜心','台中市豐原區圓環東路168、172號1樓'],
['116826','太子宮','台南市新營區太北里太子宮142-34號'],
['117151','廣瀨','桃園市龜山區忠義路二段13號'],
['117896','深澳坑','基隆市信義區深澳坑路2-6號2-7號'],
['118028','苗鑫','苗栗縣苗栗市國華路1092號'],
['118338','豐生','台南市歸仁區看東里中山路一段301號'],
['118408','重運','新北市三重區三和路四段111-1及111-2號1樓'],
['118419','聖心','基隆市中山區西定路38號40號'],
['118420','鑫重寧','台北市中正區寧波西街86號1樓'],
['118475','俊興','新北市樹林區三俊街172號1樓'],
['118497','中川','台中市西屯區台灣大道二段938號940號'],
['118512','建茗','新北市板橋區四川路一段104號'],
['118545','興學','台中市南區積善里學府路2號'],
['118660','東城','台南市東區中華東路二段293號'],
['118741','新漢北','高雄市小港區漢民路132號134號1樓'],
['118785','忠信','新北市永和區中興街97號99號101號'],
['118822','新安可','彰化縣溪湖鎮西環路373號'],
['118899','掬華','台北市中正區中華路二段405號407號'],
['118903','峰里','桃園市大溪區復興路二段782號'],
['118936','凱達','桃園市龜山區精忠里長壽路153號155號157號'],
['118970','松山','台北市信義區忠孝東路五段386號'],
['119010','過嶺','桃園市中壢區民族路五段451號453號1樓'],
['119021','新矽谷','新北市新店區北新路三段205-1號'],
['119032','幸亞','新北市三重區溪尾街29號'],
['119087','信陽','桃園市龜山區公西里12鄰復興一路86號'],
['119098','源益','彰化縣二林鎮斗苑路四段720號'],
['119146','漢寧','台北市萬華區西寧南路85號'],
['119179','中南','新北市三重區中正南路248-1號248-2號'],
['119238','學林','新北市樹林區大雅路341號343號1樓'],
['119331','隆德','屏東縣潮州鎮永春里興隆路157-2號'],
['119364','后福','新北市新莊區後港一路29號'],
['119397','館東','新北市板橋區館前東路15、15之1、17號1樓'],
['119478','醫學','台北市信義區吳興街257號259號'],
['119489','興岩','台北市文山區興隆路二段244巷20號'],
['119571','香賓','新北市林口區忠孝路382號1樓'],
['119582','新格蘭','台北市中正區衡陽路27號'],
['119652','中醫','台中市北區育德路13號1樓'],
['119685','丹榮','屏東縣萬丹鄉萬全村丹榮路625號'],
['119711','文山','台北市文山區永安街22巷23號25號1樓'],
['119755','正南','新北市三重區正義南路67號69號1樓'],
['119803','豐鑫','台中市豐原區向陽路276號'],
['119825','新巨蛋','新北市板橋區長江路一段419號421號423號'],
['120010','冠盈','新竹市北區西濱路一段286號'],
['120146','瑞聯','台中市西屯區福科路890號1樓'],
['120168','尚仁','台中市西屯區上仁街139號'],
['120179','港中','台中市梧棲區中央路一段666之28號'],
['120308','蒜頭','嘉義縣六腳鄉蒜頭村1鄰蒜頭1-18號'],
['120319','伸濱','彰化縣伸港鄉新港路425號'],
['120320','彰泰','彰化縣彰化市安平街58號1樓'],
['120397','佳龍','台南市佳里區建南里勝利路216號1樓'],
['120445','水頭','嘉義縣水上鄉水上村中正路171號173號'],
['120467','文澳','澎湖縣馬公市文山路53號1樓'],
['120478','員農','彰化縣員林市萬年里員水路二段19鄰433號'],
['120490','彰馬','彰化縣彰化市彰馬路246號之5'],
['120515','喬治','台北市信義區基隆路二段155號1樓'],
['120526','圓泉','台北市大同區酒泉街25號27號1樓'],
['120537','弘運','苗栗縣竹南鎮守法街3-2號3-3號3-5號1樓'],
['120582','潭榮','台中市潭子區榮興街19號1樓21巷1號21巷3號1樓'],
['120674','夢時代一','高雄市前鎮區中華五路789號B2樓'],
['120685','東太陽','台東縣台東市中華路二段753號1樓'],
['120700','分子尾','新北市三重區仁愛街479號479之1號'],
['120722','泰陽','新北市泰山區新北大道六段468號470號'],
['120744','金座','新北市新莊區長青街5號7號'],
['120755','傑出','新北市新莊區昌平街61號63號1樓'],
['120917','頂湖','桃園市龜山區新興街240號242號244號1樓'],
['120939','忠權','台中市北區忠明路426號1樓'],
['120951','布袋','嘉義縣布袋鎮興中里14鄰上海路177號'],
['120962','耀明','新竹市東區南大路521號1樓'],
['120973','欣佳和','屏東縣萬巒鄉佳和村佳興路38之9號'],
['121046','開南','桃園市蘆竹區新興街136號1樓'],
['121057','吉野','花蓮縣花蓮市中正路65號1樓2樓'],
['121068','新秀','台北市文山區秀明路二段8號10號'],
['121080','龍宸','苗栗縣竹南鎮營盤里博愛街367號1樓'],
['121091','愛蘭','南投縣埔里鎮鐵山路36號1樓'],
['121127','承河','台北市士林區基河路132號1樓'],
['121150','宏欣','新竹市東區金山街152號156號1樓'],
['121172','新工','台南市柳營區東昇里中山西路一段2號1樓'],
['121219','芳苑','彰化縣芳苑鄉後寮村斗苑路頂後段7號'],
['121253','世川','嘉義縣水上鄉內溪村中義路992號1樓'],
['121275','樂隆','台北市大安區敦化南路二段331巷14號'],
['121286','科邦','台中市大雅區科雅一路8號5樓'],
['121301','廣洽','台中市龍井區西濱路三段247號'],
['121345','鈦譜','台中市龍井區龍門路48之15號'],
['121367','貞豪','苗栗縣頭份市永貞路一段128號1樓'],
['121415','交大','新竹市東區大學路1001號(第二餐廳)'],
['121448','富中','桃園市觀音區中山路二段925號'],
['121460','冠華','新竹縣新豐鄉忠孝村員山148之2號1樓'],
['121471','彰工','彰化縣彰化市復興里進德路11號13號1樓'],
['121552','新華','苗栗縣頭份市中華路755號及民生街2號'],
['121611','朴天','嘉義縣朴子市中正里開元路18鄰161號165號'],
['121622','玉德','台北市南港區玉成街150號1樓'],
['121655','福權','台北市中山區民權東路二段96號98號1樓'],
['121688','西勢','台南市永康區西勢里富強路一段304號306巷8號1樓'],
['121725','有寶','桃園市桃園區寶山街209號1樓'],
['121736','草鞋鐓','南投縣草屯鎮中正路344之30號'],
['121817','文漢','桃園市大溪區文化路188號'],
['121828','晟泰','雲林縣虎尾鎮光復路521號'],
['121873','中都','高雄市三民區力行路248號'],
['121965','客宭','高雄市鹽埕區建國四路312號'],
['122038','宇軒','新竹縣竹北市勝利二路85號1樓'],
['122119','榮安','桃園市中壢區榮安十三街297號1樓及榮安十四街2號1樓'],
['122120','騰豪','宜蘭縣宜蘭市大坡路二段215號217號1樓'],
['122131','佳文','台南市佳里區佳西路215號1樓'],
['122142','高屋','桃園市中壢區民族路二段150號152號'],
['122153','福環','彰化縣福興鄉員鹿路一段439號'],
['122175','和峰','彰化縣和美鎮山犁里道周路6鄰279號1樓'],
['122212','崇德','台北市信義區崇德街104號106號1樓'],
['122256','立征','新北市淡水區大義街16號1樓'],
['122278','社集','彰化縣社頭鄉員集路一段臨351號'],
['122304','湳港','彰化縣永靖鄉港西村中山路一段842號'],
['122326','福記','桃園市中壢區林森路166號168號'],
['122360','三芝','新北市三芝區中正路一段61號63號1樓'],
['122441','水社','南投縣魚池鄉中興路32之3號1樓'],
['122500','昜昇','台南市安平區安北路12-1號1樓'],
['122588','新蓮鄉','台南市白河區永安里大德街150號1樓'],
['122603','首璽','新竹縣竹北市自強六街13號1樓'],
['122625','仁富','高雄市岡山區大仁路138號'],
['122647','樂高','桃園市龜山區文化七路85號1樓'],
['122658','田野','苗栗縣南庄鄉員林村下員林2鄰68-10號'],
['122692','龍德','桃園市龍潭區中興路460號462號'],
['122706','厚稼','新竹市北區鐵道路二段280號'],
['122773','重智','新北市三重區大智街195號'],
['122795','東遊季','台東縣卑南鄉溫泉路388號'],
['122809','豐村','台中市豐原區南村里豐東路412號416號1樓'],
['122810','三多利','屏東縣九如鄉大坵村九如路三段56號1樓'],
['122821','平東','桃園市平鎮區平東路225號227號229號1樓'],
['122865','杰明','新北市中和區泰和街25號1樓'],
['122913','通山','台中市大雅區永和路11號18號'],
['122935','豐川','花蓮縣花蓮市富強路214號216號1樓'],
['122957','關山','台東縣關山鎮和平路4號4之1號1樓'],
['122979','明瑚','新竹市東區明湖路410號1樓'],
['123008','噶瑪蘭','宜蘭縣頭城鎮復興路58號'],
['123086','龍田','台中市龍井區田中里臨港東路一段75號'],
['123134','祥和','嘉義縣太保市太保里太保46-1號'],
['123156','水仙宮','台南市中西區水仙里民權路三段87號1樓'],
['123189','嘉豐','新竹縣竹北市嘉豐北路76號78號'],
['123190','寶豐','新竹市東區高峰路536巷58號之1'],
['123248','樹廣','台中市太平區樹德路98-9號'],
['123271','日日春','屏東縣恆春鎮城北里中正路193號'],
['123282','秀才','桃園市楊梅區秀才路313號315號1樓'],
['123293','新社','台中市新社區興社街四段27之1號'],
['123363','湖口','新竹縣湖口鄉中正路一段34號、36號'],
['123374','六龜','高雄市六龜區義寶里光復路94號、96號、98號'],
['123385','實大','高雄市內門區內南里大學路200號'],
['123396','新梗枋','宜蘭縣頭城鎮濱海路三段323號325號327號1樓'],
['123422','中群','苗栗縣頭份市中正路317、319號1樓'],
['123477','歌德','新北市鶯歌區德昌二街77號之1'],
['123525','滿福','基隆市信義區深澳坑路166之30號1樓'],
['123569','尚晉','台中市太平區新平路三段1號1樓'],
['124562','暘民','嘉義縣水上鄉寬士村崎子頭159-15號1樓'],
['124573','頂六','嘉義縣中埔鄉金蘭村頂山門41-2號1樓'],
['124610','得富','高雄市仁武區八卦里八德西路246號'],
['124621','雅新','新竹市北區湳雅街154號1樓'],
['124676','崇原','台南市東山區東原里24鄰前大埔191號1樓'],
['124687','飛凰','新竹縣芎林鄉富林路二段729號'],
['125613','新翠華','新北市板橋區三民路一段31巷14號16號'],
['125967','龍廣','台北市萬華區廣州街148號'],
['126269','崇蘭','屏東縣屏東市廣東路1588、1590、1592號1樓'],
['126306','一江橋','台中市太平區東平路1號'],
['126317','蘆海','桃園市蘆竹區坑口里海山路一段76號一樓'],
['126328','永安港','桃園市新屋區中山西路三段1148號'],
['126339','新鹿野','台東縣鹿野鄉鹿野村中華路一段430號'],
['126351','鑫永安','南投縣草屯鎮御史里登輝路558號'],
['126362','七老爺','高雄市鳳山區正義里鳳甲路491號493號'],
['126395','新潭','屏東縣長治鄉新潭村長興路326號1樓'],
['126432','岩昇','新北市三峽區溪東路300號'],
['126454','海利','桃園市平鎮區長沙街1號1樓上海路115號1樓'],
['126524','香江','新竹市香山區中華路六段428.430號'],
['126535','員埔','彰化縣埔心鄉員鹿路二段248.250號1樓'],
['126616','立行','新北市三重區力行路二段158號160號'],
['126661','八悅','花蓮縣壽豐鄉平和村中華路二段215號'],
['126720','天仁','台中市沙鹿區斗抵里沙田路17之19號'],
['126731','員東','彰化縣員林市三和里大同路一段8鄰238號'],
['126742','新桃源','彰化縣彰化市卦山里公園路一段335號'],
['126764','祖祠','南投縣南投市祖祠路16-4號'],
['126775','水源','新北市中和區中山路二段62號'],
['126823','新紫城','新北市土城區福安街38號40號'],
['126890','瑞新','新北市板橋區瑞安街75號'],
['126959','三爪坑','新北市瑞芳區三爪子坑路15號17號'],
['127033','東博','台東縣台東市民權里中正路414號418號'],
['127066','玉豐','台中市大里區東榮路483號'],
['127228','喜城','新北市八里區中華路二段562號、560巷1號1樓'],
['127376','八卦寮','高雄市仁武區大灣里八德南路497號499號1樓'],
['127413','和輝','彰化縣和美鎮鎮平里彰草路二段臨448號'],
['127505','福湖','台北市內湖區內湖路一段411巷17號19弄1號'],
['127538','國泰','南投縣草屯鎮中正路636號1樓及和興街93號1樓'],
['127583','興大','台中市南區國光路301號'],
['127620','建安','台北市大安區敦化南路一段187巷29號'],
['127642','明志','新北市泰山區工專路68號70號1樓'],
['127712','欣重文','高雄市左營區重愛路308號310號1樓文天路128號1樓'],
['128025','鑫越','台北市中山區南京西路12巷9號1樓'],
['128047','興板','新北市板橋區德興街20、22、24號'],
['128058','技安','台北市大安區和平東路三段97號97之1號1樓'],
['128069','歡唱','台北市中山區林森北路310巷10號中山北路二段59巷55.55-1~4.57.59'],
['128106','集翔','宜蘭縣羅東鎮集翔里中正路147號'],
['128221','新陽光','新北市泰山區泰林路二段366號368號370號'],
['128254','欣怡','雲林縣斗南鎮南昌里中山路79號'],
['128302','丹陽','台北市中正區杭州南路一段83號'],
['128335','統勝','台北市北投區自強街82號'],
['128494','稻埕','台北市大同區南京西路436號1F'],
['128553','甘肅','台中市西屯區甘肅路二段22號'],
['128634','真嘉','雲林縣斗南鎮南昌西路1號'],
['128689','五工','新北市新莊區五工二路89號及91號1樓'],
['128690','逢廣','台中市西屯區文華路170號172號1樓'],
['128737','富鄰','新北市汐止區宜興街6號8號1樓'],
['128807','德行','台北市士林區忠誠路二段7號1樓'],
['128863','三安','新北市三重區正義北路235號'],
['128874','中陽','台北市北投區中央北路三段55號57號1樓'],
['128999','永大','屏東縣屏東市大武路122號124號'],
['129040','德祥','高雄市楠梓區翠屏里德賢路246號'],
['129062','航興','桃園市蘆竹區中福里大興路233號1樓'],
['129095','寶昌','台北市萬華區寶興街184號186號'],
['129213','南醫','台南市中西區民族路二段76號之13'],
['129246','青海','台中市西屯區青海路一段1號'],
['129350','黎元','台北市大安區辛亥路三段157巷32號1樓臥龍街188巷1號1樓'],
['129372','天美','台北市士林區天母東路8巷96號98號'],
['130006','楊展','桃園市楊梅區校前路312號316號1樓'],
['130017','慈德','桃園市桃園區慈德街53號55號57號'],
['130095','湖西','澎湖縣湖西鄉湖西村湖西140之1號'],
['130110','林鳳營','台南市六甲區中社里林鳳營111-8號1樓'],
['130121','鑫龍','苗栗縣後龍鎮中山路53號'],
['130132','敦厚','台北市信義區永吉路30巷168弄1號1樓'],
['130154','東嘉院','嘉義市東區忠孝路642號(嘉義基督教醫院門診大樓內)'],
['130176','原大','桃園市中壢區實踐路46號1樓'],
['130202','永昌','雲林縣斗六市中山路269號'],
['130235','興生','台中市大里區大里路97號1樓'],
['130268','昌聖','新北市樹林區文化街21號23號1樓'],
['130279','雄站','高雄市三民區港東里建國二路269號271號'],
['130280','和善','台南市中西區藥王里民族路三段6鄰277號1樓'],
['130291','永盛','屏東縣鹽埔鄉鹽中村勝利路81之3號'],
['130316','新馬','宜蘭縣蘇澳鎮海山西路489號1樓'],
['130327','民仁','新北市蘆洲區仁愛街58號60號1樓'],
['130394','吉林','台北市中山區吉林路209號1樓2樓'],
['130408','潭陽','台中市潭子區圓通南路2號1樓'],
['130475','關西','新竹縣關西鎮正義路286-1號1樓'],
['130486','港藝','台中市清水區中社路19號'],
['130512','龍日','苗栗縣後龍鎮溪洲里七鄰勝利路60之1號'],
['130523','嘉埔','嘉義縣大埔鄉大埔村大埔276號之6壹樓'],
['130534','中山二','新北市土城區中山路3號B1樓'],
['130545','青雅','高雄市苓雅區青年一路6之8及6之9號'],
['130615','慶嶸','新北市樹林區保安街一段323號323-1號1樓'],
['130626','社頂','台南市新市區大社里大社710號1樓'],
['130648','學央','桃園市平鎮區中央路187號'],
['130659','金帝寶','桃園市新屋區中山東路一段106號'],
['130707','菄族','新竹縣竹東鎮民族路66號1樓'],
['130729','韻翔','桃園市平鎮區文化街71號1樓'],
['130730','壯五','宜蘭縣宜蘭市東港路一段213號1樓'],
['130741','崴正','桃園市桃園區中正五街137號139號1樓'],
['130811','台火','台中市南區高工路355號1樓'],
['130833','泰一','新竹市東區中華路二段668號'],
['130877','員慶','彰化縣員林市山腳路一段386號'],
['130899','文中','桃園市桃園區文中路65號1樓'],
['130925','岦湖','新竹市香山區內湖路138號1樓'],
['130958','興德','苗栗縣頭份市文化街172號八德二路292號 1樓'],
['130992','知母義','台南市新化區知義里知母義15號之20一樓'],
['131009','二竹','嘉義縣義竹鄉仁里村義竹423號1樓'],
['131021','潭北','台中市潭子區福潭路645.647.649號'],
['131032','潭勝','台中市潭子區勝利路101號103號'],
['131076','新梅','桃園市楊梅區新農街469-8號469-9號1樓'],
['131087','國光','台中市大里區國光路二段257號1樓'],
['131102','桂安','高雄市小港區孔鳳路557號'],
['131113','東橋','台南市永康區東橋一路28號'],
['131168','民大','桃園市桃園區大興路221號1樓'],
['131179','新市鎮','新北市淡水區新市一路三段18號1樓'],
['131227','湖貴','彰化縣溪湖鎮西寮里員鹿路四段7號1樓'],
['131238','社皮','屏東縣萬丹鄉大昌路552號556號'],
['131250','龍合','台中市龍井區中華路一段36號'],
['131272','寶雅','新竹縣寶山鄉大崎村大雅路二段103巷15號'],
['131308','東侑','台中市北屯區東山路一段396號1樓東山路一段384巷5號7號'],
['131319','大坪頂','高雄市小港區坪頂里大平路192號196號1樓'],
['131320','羅結','宜蘭縣五結鄉五結路三段493號'],
['131353','新和苑','苗栗縣苑裡鎮苑南里為公路4鄰16之1號1樓'],
['131386','建盛','新竹市東區建中一路52號1樓'],
['131397','瀋陽','台中市北屯區瀋陽路一段104號1樓'],
['131423','土定富','台南市南區田寮里大成路二段86號88號'],
['131456','竹崙','新竹縣竹北市中華路153號1樓'],
['131478','惠民','高雄市楠梓區翠屏里惠民路88號1樓'],
['131489','中民','高雄市燕巢區中民路712號714號1樓'],
['131582','仁樂','高雄市仁武區仁武里仁和街36號'],
['131607','體育大','桃園市龜山區文化一路250號'],
['131630','永科','台南市永康區新樹里3鄰中山北路634巷7號'],
['131711','惠文','台中市南屯區河南路四段226號228號1樓'],
['131733','日新','彰化縣福興鄉番婆村彰鹿路六段547號1樓'],
['131766','五里林','高雄市橋頭區東林里里林東路20號'],
['131777','鳳祥','新北市新莊區中正路708-2號'],
['131825','日月潭','南投縣魚池鄉水社村中山路118號'],
['131836','蓮圓','花蓮縣花蓮市中山路891號893號1樓'],
['131858','宇宸','雲林縣虎尾鎮清雲路770號'],
['131906','富崗','桃園市楊梅區新明街450號'],
['131951','四德','台中市霧峰區四德里四德路525之2號'],
['131984','三樂','台北市士林區劍潭路21號1樓'],
['132068','親旺','台中市大肚區沙田路一段929號'],
['132079','百壽','新北市板橋區文化路一段305號1樓'],
['132091','豐收','嘉義縣民雄鄉豐收村大學路二段291號'],
['132105','新和','新北市新店區新和街70號72號1樓'],
['132138','鼎貴','高雄市三民區鼎貴路146號1樓'],
['132161','竹寶','南投縣竹山鎮延正里延正路45之30號1樓'],
['132231','和美','彰化縣和美鎮和頭路189號1樓'],
['132253','樂豐','台南市南區新都路460號'],
['132297','空軍','新竹市北區中正路385號387號1樓'],
['132323','速達','桃園市中壢區新生路二段378之2號'],
['132356','埔義','新竹縣新埔鎮下寮里義民路三段317號1樓'],
['132378','長榮航','桃園市蘆竹區新南路一段376號'],
['132415','正光','基隆市七堵區自治街9號11號'],
['132459','豐三民','台中市豐原區三民路38號1樓'],
['132482','七甲','台南市六甲區六甲里中正路321之1號'],
['132574','新士林','台北市士林區大東路123號125號1樓'],
['132596','將軍','台南市將軍區長榮里長榮29之2號1樓'],
['132600','彭城','屏東縣潮州鎮潮州路512-3號1樓'],
['132633','添祥','新北市新莊區天祥街22號24號1樓'],
['132688','奇美實','台南市仁德區中正路一段398號1樓'],
['132758','中投','台中市霧峰區中投西路二段388號'],
['132806','正東','台東縣台東市中華路一段372號'],
['132817','孝威','宜蘭縣五結鄉傳藝路一段369號1樓'],
['132862','菁寮','台南市後壁區墨林里346號'],
['132895','滿冠','宜蘭縣宜蘭市新興路68號1樓'],
['132909','太學','台北市士林區華岡路45之1號1樓'],
['132910','成醫','台南市北區小東路35號(成大醫院門診一樓)'],
['132921','健興','台中市北區健行路354號'],
['135078','凱松','台北市南港區八德路四段778號780號'],
['135104','碧綠','台北市內湖區內湖路三段61號63號樓59巷1號1樓'],
['135241','永信','台北市信義區永吉路30巷103號'],
['135296','仁金','台北市中正區仁愛路二段39號39-1號'],
['135388','正泰','新北市板橋區三民路二段202之20、202之21號1樓'],
['135425','松捷','台北市信義區忠孝東路五段1之6號'],
['135540','紅樹林','新北市淡水區中正東路二段81號1樓'],
['135562','麟運','台北市信義區和平東路三段461號461之1號1樓'],
['135610','福源','台北市松山區新東街60巷16號18號1樓'],
['135676','信億','屏東縣麟洛鄉麟蹄村中山路166號166-1號166-2號1樓'],
['135713','勝壢','桃園市中壢區中央西路一段一號一樓'],
['135746','新保泰','高雄市鳳山區鎮南里龍成路242-1號'],
['135768','汐科','新北市汐止區大同路二段167-1號1樓'],
['136015','正新','台南市永康區甲頂里大武街33號'],
['136037','金園','新北市板橋區金門街175號'],
['136130','大時代','台中市南區工學路55號57號'],
['136152','宏光','新竹市北區光華一街29號1樓'],
['136163','建陽','新北市汐止區福德一路452號1樓'],
['136174','錦新','台中市北區錦新街70-2號70-3號及一中街136-2號136-6號'],
['136222','金湖','台北市內湖區文湖街83號85號1樓'],
['136266','旗海','高雄市旗津區中洲三路579號'],
['136406','六福','台北市萬華區漢口街二段73號1樓'],
['136495','立國','桃園市桃園區中山東路51號1樓'],
['136598','南門城','台南市中西區南門路229號1樓'],
['136657','美澄','高雄市鳳山區文山里八德路二段116號'],
['136831','雙連','台北市大同區民生西路176號'],
['136842','長新','台北市中山區長安東路一段75號1樓'],
['136864','祥鋐','桃園市平鎮區金陵路三段74號76號'],
['136934','蘆權','新北市蘆洲區民權路136號138號1樓'],
['137030','新竹民','新竹市東區民族路114號116號1樓'],
['137052','延年','台北市大同區延平北路三段61-5號'],
['137524','冠宇','新竹縣新豐鄉忠孝路1號'],
['137535','埔田','新竹縣新埔鎮中正路5號7號1樓'],
['137557','國豪','苗栗縣竹南鎮延平路170號'],
['137591','嘉添','新北市三峽區嘉添路109-2號'],
['137605','安泰','屏東縣東港鎮興東里中正路一段206號1樓'],
['137616','新鼎吉','高雄市三民區明誠一路381號383號1樓'],
['137627','愛買','屏東縣屏東市清溪里清寧街2號'],
['137661','新屋山','桃園市新屋區新屋里中山路288號'],
['137694','智邦','新竹市東區科學工業園區研新三路1號'],
['137731','溪口','嘉義縣溪口鄉坪頂村中正東路1號1樓'],
['137753','泉發','宜蘭縣礁溪鄉礁溪路三段302號306號'],
['137764','真善美','新北市淡水區新市一路三段141號141之1號1樓'],
['137797','新嘉醫','嘉義市西區福全里北港路309號'],
['137823','長崗','南投縣南投市南崗二路581號'],
['137845','義和','台中市大甲區中山路一段492號'],
['137867','紅蕃茄','桃園市桃園區復興路83號85號重慶街15號1樓'],
['137889','彰辭','彰化縣彰化市忠孝里辭修路292號'],
['137948','美壢','桃園市中壢區中美路二段72號'],
['137959','椰城','新北市中和區安平路61號'],
['138011','信義鄉','南投縣信義鄉明德村玉山路82-2號'],
['138022','南科大','台南市永康區中正路529號'],
['138077','東輝','台東縣台東市正氣北路389號'],
['138088','光興','台中市太平區興隆里12鄰光興路1632號'],
['138181','保健','新北市中和區保健路2巷1號1樓'],
['138192','蘆工','桃園市蘆竹區中興路97號1樓'],
['138251','淵中','台南市安南區安中路三段435號437號1樓'],
['138273','千雄','桃園市蘆竹區南崁路二段96號'],
['138468','彰強','彰化縣彰化市五權里自強南路80-11號1樓'],
['138516','新苑','苗栗縣苑裡鎮苑北里為公路70號'],
['138538','三光','桃園市中壢區中央西路二段259號259-1號1樓'],
['138549','二橋','新北市鶯歌區中正三路93號'],
['138561','瑞蓁','高雄市湖內區海埔里信義路4號'],
['138642','山興','桃園市龜山區明興街223號225號1樓'],
['138675','後營','台南市西港區營西里1號'],
['138686','巨航','彰化縣伸港鄉新港村中興路一段355號'],
['138697','新福樂','基隆市信義區深溪路43號45號1樓'],
['138815','聯成','台北市南港區聯成里昆陽街150-1號150-3號'],
['138848','大竹','彰化縣彰化市大竹里彰南路二段181號'],
['138871','彌進','高雄市彌陀區彌陀里進學路33號'],
['138941','精舍','花蓮縣新城鄉康樂村康樂路286號288號'],
['138963','新中北','桃園市中壢區新中北路1018-1號1樓'],
['138985','辰興','桃園市桃園區大興西路一段178號1樓新埔五街83號85號1樓'],
['138996','伸東','彰化縣伸港鄉七嘉村中華路519號'],
['139070','水里','南投縣水里鄉中山路一段63號'],
['139209','五結','宜蘭縣五結鄉五結路二段393號395號397號1樓'],
['139287','翁京','桃園市平鎮區中豐路南勢二段118號'],
['139298','新文化','台中市西區中美街283號'],
['139313','新武嶺','基隆市安樂區基金一路168之26號'],
['139335','大五','台南市中西區法華里大同路一段218號220號'],
['140210','中坡','台北市南港區中坡南路47號1樓'],
['140416','新承德','台北市士林區承德路四段30號'],
['140597','和平島','基隆市中正區和一路125號127號1樓'],
['141154','大大','苗栗縣公館鄉大同路160號162號1樓'],
['141165','梓聖','高雄市楠梓區瑞屏路80之5號之6號之7號1樓'],
['141187','楊功','桃園市楊梅區瑞溪路二段162號1樓'],
['141316','豐王','台中市豐原區三豐路二段496號1樓'],
['141338','福聚','基隆市七堵區實踐路286號福二街229號1樓'],
['141420','漁人','嘉義縣東石鄉猿樹村東石205-1號'],
['141453','聖央','桃園市中壢區中央西路一段78號1樓'],
['141512','北社尾','嘉義市西區北湖里北社尾路165號附1'],
['141578','高大','台南市新市區銘傳街87號89號1樓'],
['141626','雙捷','新北市蘆洲區信義路162號166號168號1樓'],
['141659','石光','新竹縣關西鎮石光里石岡子252號1樓'],
['141660','忠敬','桃園市中壢區精忠一街1號1樓'],
['141718','豐鼎','新竹縣湖口鄉光復東路8號1樓'],
['141800','大忠','台南市南區大忠里中華南路一段178號'],
['141914','蔦松','台南市永康區中正北路431號433號'],
['141969','新亞洲','新北市土城區亞洲路110號112號1樓'],
['142124','世傳','桃園市八德區和平路122號126號1樓'],
['142157','新桃林','桃園市桃園區延平路4號6號1樓'],
['142168','鑫福','新北市新莊區幸福路727號1樓'],
['142180','長春','屏東縣東港鎮興東里長春一路95號'],
['142227','義竹','嘉義縣義竹鄉六桂村2鄰義竹156之1號'],
['142272','高尚','桃園市楊梅區梅高路二段136巷5號'],
['142308','康永','台南市永康區永康里永平街120號'],
['142319','鼓山','高雄市鼓山區鼓山二路125之1號127號127之1號1樓'],
['142320','大秀','台中市清水區五權路328號'],
['142353','觀富','桃園市觀音區新富路701號1樓'],
['142397','頭興','苗栗縣頭份市中央路228號230號1樓'],
['142537','新圓','台南市新營區忠政里中正路2鄰121號'],
['142559','博明','新竹縣竹北市博愛街235號237號1樓'],
['142582','智勝','桃園市桃園區桃智路1號3號1樓'],
['142674','彰寶','彰化縣彰化市介壽北路82號'],
['142711','好鄰居','高雄市內門區內門里內門99之19號'],
['142722','斗金','彰化縣北斗鎮中正路57號1樓'],
['142766','東關','台中市東勢區東關路七段191號、新盛街2號1樓'],
['142803','秀發','彰化縣秀水鄉番花路臨558之7號'],
['142825','東馳','台東縣池上鄉中東三路46號1樓'],
['142870','華技','台北市南港區研究院路三段72號74號1樓'],
['142892','蘭嶼','台東縣蘭嶼鄉椰油村椰油296之12號'],
['142917','鑫貿','台北市南港區經貿二路168號4樓'],
['142928','華科','新竹縣橫山鄉橫山村9鄰中豐路一段100號1樓'],
['142973','玉門','台中市西屯區西屯路三段166之92號1樓'],
['143079','瀚宇','台南市新市區南科二路35號1樓'],
['143138','豐昌','彰化縣員林市永昌街86號1樓'],
['143183','新展','新北市板橋區大觀路二段185號1樓'],
['143231','新樹人','台南市善化區光文里中山路143-2號'],
['143253','頂好','台北市大安區仁愛路四段79號1號'],
['143301','金甲后','台中市大甲區甲后路五段360號'],
['143312','永龍','台南市永康區埔園里中山路398號'],
['143356','漢豐','桃園市桃園區漢中路146號1樓'],
['143389','期建','台南市安平區文平里建平路277號'],
['143529','高義','桃園市平鎮區復旦路二段211巷10號1樓'],
['143600','新衙','高雄市前鎮區草衙一路41號43號'],
['143677','長峰','台北市大同區長安西路45之2號47號1樓'],
['143688','統客','新北市新店區寶興路49號'],
['143699','崁頂','基隆市仁愛區仁四路60號62號1樓'],
['143781','龍潭','桃園市龍潭區東龍路257號259號1樓'],
['143828','新豪康','新竹市香山區元培街371號1樓'],
['143851','子龍','台南市佳里區子龍里麻佳路三段316號1樓'],
['143862','南龍','台南市佳里區建南里安南路22鄰256號'],
['143884','臻鈺','台南市永康區勝利里18鄰勝學路226號'],
['143895','東大','台東縣台東市大學路二段369號'],
['143965','延民','台北市大同區民族西路246號248號1樓'],
['144038','醫德','台中市北區大德街87號1樓'],
['144072','鈺朋','桃園市桃園區莊敬路二段105號1樓'],
['144197','安興','台南市永康區北灣里20鄰北興路51號'],
['144212','龍揚','南投縣埔里鎮樹人路221之2號'],
['144223','龍園','桃園市大溪區石園路615號(營登-桃園市龍潭區中正路佳安段481號)'],
['144326','港泰','台北市南港區忠孝東路七段359號1樓'],
['144359','平溪','新北市平溪區靜安路二段338號340號'],
['144555','星河','台中市沙鹿區鹿峰里中山路646號'],
['144588','斗苑','彰化縣埤頭鄉斗苑東路588號'],
['144717','環冠','新北市中和區中山路三段118之6之7之8號'],
['144728','精材','桃園市中壢區吉林路23號B1樓'],
['144751','鑫帝標','桃園市桃園區龍泉二街65號龍城五街66.68號1樓'],
['144773','森壢','桃園市中壢區新興里2鄰林森路30號1樓'],
['144795','中貿','台北市南港區經貿二路186號2樓'],
['144979','東澓','台南市東區富農街一段167號1樓'],
['146252','南瀛','台南市永康區鹽行里中正路299號'],
['146540','長業','桃園市中壢區長春路23號'],
['146850','建錦','台北市中山區建國北路二段127號1樓B1樓'],
['146997','朝科大','台中市霧峰區吉峰東路168號宿舍大樓'],
['147141','敦信','台北市大安區仁愛路四段122巷50號1樓'],
['147299','松義','台北市信義區松德路271號'],
['147440','重華','新北市三重區五華街181號185號1樓'],
['147945','理想','台中市龍井區國際街155號157號159號1樓'],
['147967','上華','桃園市龍潭區中正路上華段6號'],
['147989','新兆圓','新北市板橋區實踐路34號34-1號1樓'],
['148052','青園','台北市萬華區青年路18號1樓'],
['148063','春陽','高雄市三民區寶珠里正忠路246號'],
['148100','向揚','台北市南港區向陽路166號1樓'],
['148133','鑫安江','台北市中山區長安東路二段178號178-1號1樓'],
['148269','冠桃園','桃園市桃園區中泰里國際路一段1179號'],
['148351','篤行','台中市北區篤行路120號122號'],
['148524','丹樺','台北市士林區文林路530號'],
['148568','藝高','新北市新莊區中平路357號'],
['148683','萬隆站','台北市文山區羅斯福路五段249號1樓'],
['148719','碧興','新北市新店區北宜路一段120號122號1樓'],
['148753','社后','新北市汐止區中興里中興路190號'],
['148915','墩業','台中市南屯區大墩路717-5號'],
['148948','板權','新北市板橋區民權路198、200號'],
['148960','恩主','新北市三峽區鳶山里21鄰復興路447號'],
['149033','德毅','台中市北區尊賢街9號'],
['149114','逢大一','台中市西屯區文華路100號1樓'],
['149136','本元','高雄市三民區建工路317號319號'],
['149170','民富','新竹市北區新民里西大路642號'],
['149181','海天','新竹市香山區海埔路136號'],
['149239','佳福','新北市土城區青雲路152號'],
['149284','重新','新北市三重區重新路四段45號'],
['149295','航福','桃園市蘆竹區南福街97號99號'],
['149310','文樂','新竹縣湖口鄉文化路55號'],
['149321','新起','台北市萬華區長沙街二段87號1樓'],
['149538','福強','新北市新店區三民路147之1號149號1樓'],
['149675','園舺','台北市萬華區西園路二段140巷52號52號之1號'],
['149723','藝寶','新北市新莊區立信三街8號'],
['149815','蘆永','新北市蘆洲區永安南路二段18號'],
['150701','辰皓','高雄市路竹區國昌路312號'],
['150745','聚懋','台中市南屯區大墩路287號289號一樓'],
['150767','佳香','新竹市香山區中華路六段六十之一、六十之二號1樓'],
['150790','松竹','台中市北屯區昌平路二段11-1號'],
['150848','鹽金','台南市鹽水區義稠里8鄰義稠110之19號'],
['150859','民德','新北市中和區民德路47號47-1號'],
['150860','鑫鑫','新北市淡水區水源街二段76號、76-1號'],
['150882','全興','台南市南區新樂路72號'],
['150941','永靖','彰化縣永靖鄉永坡路2號'],
['150985','茄拔','台南市善化區嘉北里13鄰352號'],
['151003','大智通','新北市樹林區佳園路二段70-1號'],
['151025','樂購','桃園市蘆竹區五福一路39號41號1樓'],
['151058','雙橡園','桃園市大溪區僑愛里介壽路210號'],
['151092','延城','新北市土城區延和路203號1樓'],
['151128','健倫','新北市蘆洲區保新里4鄰三民路230號'],
['151232','利嘉','台東縣台東市新園里中興路六段667號1樓'],
['151243','安傑','台南市安南區頂安里北安路二段480號1樓'],
['151254','鳳專','嘉義縣民雄鄉建國路二段99號97-7號'],
['151276','蓮恆','花蓮縣吉安鄉北昌村建國路一段49號51號'],
['151302','興悅','台中市北區金華里進德北路160號162號'],
['151335','仁和','台北市信義區正和里光復南路419巷41號'],
['151380','觀泰','新北市板橋區大觀路二段174巷166弄2號4號'],
['151391','鎖港','澎湖縣馬公市鎖港里鎖管港段1439號'],
['151405','大運通','台中市潭子區復興路一段16號18號'],
['151416','葫蘆','台北市士林區延平北路五段134號'],
['151494','臻品','台南市永康區三合里中山東路117號119號1樓'],
['151508','亞和','台中市大雅區中山北路410號'],
['151597','長益','台南市仁德區土庫里太子路233號'],
['151645','龍辰','南投縣南投市中學西路61號'],
['151689','楊昌','桃園市楊梅區楊新北路23號'],
['151690','大連','台中市北屯區大連路一段40號1樓'],
['151737','蓮陽','花蓮縣吉安鄉吉安村中山路三段2號'],
['151759','北埔','花蓮縣新城鄉北埔路282號'],
['151771','楊山','桃園市楊梅區中山南路98號100號1樓'],
['151782','健業','桃園市桃園區健行路88號'],
['151829','華輝','高雄市燕巢區橫山里橫山路59號'],
['151830','大武嶺','基隆市安樂區大武嶺里基金一路135巷21弄2-1號'],
['151841','新建興','新北市瑞芳區大埔路138號'],
['151852','東科大','新北市汐止區新台五路一段96號'],
['151900','柏魁','桃園市龜山區振興路1021之1號'],
['151922','環球','高雄市路竹區環球路201之27號'],
['151977','大營','台南市新市區大營里136-1號'],
['152006','漳和','新北市中和區中山路二段131-6號'],
['152028','昌陽','台中市北屯區昌平路一段264號'],
['152062','元坊','新北市永和區保安路134號136號'],
['152109','航宏','桃園市蘆竹區蘆竹里蘆竹街256號一樓'],
['152132','寶福','新北市新店區寶橋路78巷3號1F'],
['153261','華齡','台北市士林區華齡街17巷2號4號1樓'],
['153331','溫泉','新北市萬里區大鵬里萬里加投15鄰197號1樓'],
['153375','玉里','花蓮縣玉里鎮中山路二段90號1樓'],
['153401','富旺','新北市新莊區自立街176號178號1樓'],
['153423','台藝大','新北市板橋區大觀路一段59號'],
['153478','陸光','桃園市龜山區陸光路83號85號1樓'],
['153537','強利','新竹縣竹北市自強北路111號'],
['153593','元勛','桃園市中壢區晉元路195號1樓'],
['153607','新雪霸','苗栗縣大湖鄉富興村1鄰水尾39號'],
['153722','新里','台中市大里區中興路二段480號'],
['153733','神木','嘉義縣阿里山鄉中正村3號2樓'],
['153744','學甲','台南市學甲區仁得里華宗路321號'],
['153766','保庄','雲林縣斗六市明德北路三段285號'],
['153777','永玉','台南市永康區龍潭里永明街175號'],
['153858','京明','高雄市前鎮區瑞北路54號1樓及B1'],
['153881','石潭','高雄市岡山區石潭路258號'],
['153892','澎文','澎湖縣馬公市東文里文山路282號'],
['153906','尚賀','高雄市仁武區赤山里仁雄路87號1樓'],
['153928','大武','台東縣大武鄉復興路124號126號128號1樓'],
['153939','宜翔','台南市柳營區中埕里中山西路二段10鄰61號'],
['153951','大埤','雲林縣大埤鄉南和村6鄰民生路32號'],
['153973','修齊','台南市北區成功路54號'],
['153995','京利','桃園市平鎮區南京路206號'],
['154046','大阪','高雄市三民區建國三路28號30號1樓'],
['154116','大崙','桃園市中壢區中正路四段35號'],
['154297','葫東','台北市士林區延平北路五段228號1樓230號1樓2樓'],
['154493','新禾','台中市神岡區和睦路一段363號'],
['154530','鴻寶','南投縣草屯鎮民權西路221號'],
['154541','金玉','宜蘭縣南澳鄉蘇花路二段165號1樓'],
['154574','日明','高雄市楠梓區楠梓加工出口區第二園區研發路66號3樓'],
['154633','管院','台中市西屯區臺灣大道四段1727號'],
['154792','榮總一','高雄市左營區大中一路386號'],
['154806','港埠','台中市梧棲區港埠路一段989號'],
['154839','誠穩','嘉義縣大林鎮中坑里南華路一段55號B1F'],
['154840','武訓','基隆市安樂區武訓街102號1樓'],
['154943','欣樂','新竹縣新豐鄉康樂路一段358號'],
['154987','新復興','宜蘭縣宜蘭市復興路二段49號1樓'],
['155005','東喜','台東縣台東市興安路一段197號1樓'],
['155038','鑫權勝','台中市南屯區五權西路二段882號'],
['155049','新忠貞','台中市沙鹿區東大路二段1587號'],
['155083','鑫復','台北市大安區信義路三段178號1樓'],
['155131','富首','新竹市東區慈濟路230號1樓'],
['155153','吉得堡','台中市梧棲區中興路121號'],
['155164','復康','台南市永康區二王里忠孝路429巷15弄6號'],
['155197','風城','新竹市東區民權路181號1樓'],
['155223','蘭雅','台北市士林區德行東路6之2號1樓'],
['155234','總頭寮','台南市安南區長溪路二段416號'],
['155289','鑫潭','南投縣埔里鎮中山路四段97之1.97之2號'],
['155304','朝陽大學','台中市霧峰區吉峰東路74號'],
['155315','正合','苗栗縣頭份市中正一路58號1F'],
['155337','中天','桃園市中壢區石頭里中和路184號1樓'],
['155393','雙華','新北市蘆洲區中華街39號、中華街35巷6號1樓'],
['155407','鳳來','高雄市鳳山區鳳甲路2號'],
['155429','東融','新竹縣竹東鎮中興路二段148號1樓'],
['155430','大有','桃園市桃園區大有路547號1樓'],
['155485','樹科','高雄市燕巢區橫山路90之1號'],
['155511','鳳悅','花蓮縣鳳林鎮信義路216號1樓'],
['155533','東館','苗栗縣公館鄉五谷村12鄰71之1號1樓'],
['155566','新順安','新北市新店區順安街51號53號1樓'],
['155603','粵西','台中市東勢區東坑路62號1樓'],
['155625','極上','基隆市仁愛區仁三路66號愛二路54巷10號1樓'],
['155647','千甲','新竹市東區千甲路235號'],
['158288','吉龍','台中市西區吉龍里忠明南路410號1樓及五權七街200、202號1樓'],
['158347','國慶','新北市板橋區國慶路153號'],
['158484','進學','高雄市左營區左營大路491-1號491-2號491-3號'],
['158521','新積穗','新北市中和區民安街27號29號1樓'],
['158543','寶麗','桃園市平鎮區湧安里自由街57號59號61號63號'],
['158565','富營','新北市新莊區富國路20號1樓'],
['158602','英海','新北市板橋區雨農路50號1樓、英士路51巷1號1樓'],
['158624','大進','台中市南屯區五權西路二段185號'],
['158646','立金','新北市土城區立德路70號72號'],
['158657','鑫輝煌','台北市內湖區東湖路119巷49弄2號1樓'],
['158691','瑞林','新北市板橋區龍翠里大同街52號'],
['158808','歐風','台中市西屯區惠民路199號'],
['158842','錦花','台中市中區光復路127號'],
['158853','龍山','台北市萬華區康定路203號205號1樓'],
['158897','美珍','高雄市鼓山區明誠四路23號'],
['158901','高鳳','高雄市鳳山區忠義里中山西路396號398號400號'],
['158945','美慈','新北市三重區慈愛街52號'],
['158956','泰利','台北市大安區仁愛路四段266巷15弄22號'],
['158990','福營','新北市新莊區福營里建國一路50號52號'],
['159041','金權','桃園市中壢區光明里中央西路二段49號'],
['159063','健行','桃園市中壢區健行路230號1樓'],
['159074','長興','高雄市前金區瑞源路68號70號72號'],
['159328','安成','新北市新店區安成街35號29號'],
['159339','安城','新北市新店區安康路一段283號'],
['159465','三好','新北市三重區自強路四段102號104號1樓'],
['160030','彰陽','彰化縣彰化市中正路一段75號1樓'],
['160052','加吉吉','台南市安南區新順里培安路155號'],
['160122','佳林','新北市林口區林口路197號'],
['160144','集利','南投縣集集鎮吳厝里民生路65-1號'],
['160166','鷺江','新北市蘆洲區長榮路679號1樓'],
['160188','仁毅','台東縣台東市馬蘭里新生路680號682號684號1樓'],
['160199','久豐','台中市后里區三光路36號'],
['160203','頤和','苗栗縣苗栗市中正路55號1樓'],
['160247','大永','台北市中山區明水路581巷15號1樓'],
['160258','東昇','台東縣台東市鐵花里中華路一段542號1樓'],
['160328','金宏','高雄市小港區順苓里宏平路501號'],
['160351','康平','台南市安平區健康三街81號'],
['161125','園區','新竹縣寶山鄉園區三路1號1樓'],
['161549','福陽','台北市士林區延平北路五段269號271號1樓'],
['161608','寶民','高雄市三民區寶民里正義路337號'],
['162014','新康華','台南市永康區大橋二街38號'],
['162162','忠柯','新北市林口區忠孝路642號'],
['162667','長生','高雄市前金區五福三路54號'],
['162977','萬大','台北市萬華區萬大路245號247號1樓'],
['163512','六工','基隆市七堵區工建路1之22號1之23號1樓'],
['163523','新市政','台中市西屯區臺灣大道三段99號1樓'],
['163567','泉翔','嘉義縣朴子市大葛里嘉朴路西段121號'],
['163590','楊興','桃園市楊梅區楊新路三段331號333號'],
['163660','成皇','桃園市桃園區復興路80號'],
['163707','芝玉','台北市士林區忠義街121號'],
['163730','戰國','新北市板橋區永豐街173號175號'],
['163785','和緯','台南市北區成功里和緯路二段252號'],
['163796','金倫','台東縣太麻里鄉金崙村金崙路262號262-1號'],
['163800','建德','新北市汐止區福德一路399號1樓'],
['163822','瑞湖','台北市內湖區江南街128號'],
['163877','連通','新北市中和區圓通路293號'],
['163903','福祥','新北市土城區中央路一段320號322號'],
['163947','鳳福','新北市鶯歌區鶯桃路二段48號1樓50號1樓'],
['163958','初鹿','台東縣卑南鄉明峰村忠孝路164號166號168號1樓'],
['163970','壢都','桃園市中壢區長沙路131號成都路72號'],
['163981','新淡專','新北市淡水區新民街180巷18號20號1樓'],
['163992','潭安','新北市永和區中正路167號'],
['164009','界和','新北市永和區中和路339號1樓'],
['164065','新財發','基隆市中正區新豐街303巷11弄1號3號1樓'],
['164180','登頂','新北市三重區光復路二段2號'],
['164191','龍泰','南投縣草屯鎮碧興路一段798-1號'],
['164205','芬草','彰化縣芬園鄉茄荖村芬草路一段607號'],
['164216','凱悅','台北市信義區基隆路一段398號1樓'],
['164238','正孝','新北市三重區中正北路151號153號'],
['164249','龍安','新北市新莊區龍安路256號'],
['164283','福山','彰化縣彰化市彰南路一段466號、福東街2號'],
['164320','學府','新北市淡水區學府路39號41號1樓'],
['164331','栗華','苗栗縣苗栗市中華路78號'],
['164375','忠華','新北市土城區中華路一段185號187號1樓'],
['164386','大東圓','新北市樹林區柑園街一段67號67-1號67-2號1樓'],
['164423','德昌','高雄市左營區菜公里文自路236號238號'],
['164456','福仁','新北市汐止區仁愛路143號1樓福安街51號1樓'],
['164490','吳興','台北市信義區吳興街284巷18弄2號'],
['164515','三灣','苗栗縣三灣鄉中正路255號與文化街13號'],
['164526','鳳埤','高雄市鳳山區過埤里過埤路170號'],
['164548','明道站','彰化縣溪州鄉中山路四段627號'],
['164571','富麗','台中市東區十甲里十甲路397號'],
['164582','新振興','台中市東區十甲東路217號'],
['164685','凡賽絲','新北市新店區安民街290號292號1樓'],
['164696','興光','新北市三重區大同南路220號'],
['164700','信雄','台南市永康區南台街1號'],
['164733','瓏馬','台北市內湖區康樂街213號'],
['164766','忠勇','台南市永康區成功里小東路4鄰637號1樓'],
['164777','春龍','台北市中山區長春路257號'],
['164803','東鑫','台北市松山區民生東路四段55巷10號'],
['164858','春吉','新北市中和區建一路148號1樓'],
['164881','元龍','新北市中和區板南路655號1樓'],
['164892','未來','新北市林口區文化二路一段571號1樓2樓'],
['164917','新樹工','新北市樹林區保安街二段6號'],
['164962','清大','新竹市東區光復路二段101號'],
['164984','羅東','宜蘭縣羅東鎮公正路197號1樓'],
['164995','峰資','台中市霧峰區樹仁路26號1樓'],
['165002','富正','新竹縣竹東鎮東寧路一段261號1樓'],
['165024','福瑞','桃園市中壢區信義里福州路201號'],
['165035','新永大','台中市大里區大明路340號1樓'],
['165057','科博館','台中市北區淡溝里博館路92號1樓'],
['165079','西港','台南市西港區西港里中山路366-1號'],
['165080','大林蒲','高雄市小港區鳳林路181號'],
['165127','怡平','台南市安平區文平路462號1樓'],
['165149','小北','台南市北區西門路四段455號'],
['165161','媽祖','台中市大甲區光明路1號'],
['165172','勝權','台北市中山區民權東路二段26號'],
['165183','直安','台北市中山區北安路649號'],
['165194','新興陽','台中市北屯區平田里興安路一段289號1樓'],
['165242','苗谷','苗栗縣公館鄉五谷村200號'],
['165275','開封','高雄市大寮區大寮路688號'],
['165345','昱成','宜蘭縣五結鄉中正路一段174號176號'],
['165390','西雅圖','新北市八里區中山路二段151號153號1樓'],
['165437','礁溪','宜蘭縣礁溪鄉礁溪路四段85號87號'],
['165459','芬園','彰化縣芬園鄉彰南路四段172號及光復路6號'],
['165471','立登','台南市歸仁區民生北街106號'],
['165482','嘉坪','嘉義市西區大同路455號1樓'],
['165507','瑞權','花蓮縣瑞穗鄉瑞北路30之2號'],
['165518','太湖','高雄市湖內區中正路二段158號1樓'],
['165529','學屋','桃園市中壢區民族路三段400號402號406號1樓'],
['165530','安佳','新北市新店區安祥路111號'],
['165541','豫溪','新北市永和區中正路702巷1號3號及中正路710號1樓'],
['165596','元町','新北市鶯歌區光明街128號130號1樓'],
['165600','龍峰','台中市龍井區向上路六段298號'],
['165611','福運','新北市三重區福德北路57號59號1樓'],
['165633','鶯桃','新北市鶯歌區鶯桃路二段7號1樓'],
['165677','赤崁','台南市中西區民族路二段331號'],
['165688','馥都','新北市板橋區中山路二段399號401號'],
['165699','仙草埔','台南市白河區仙草里仙草6之30號'],
['165703','福泰','新北市五股區五福路49號51號1樓'],
['165725','立言','新北市中和區中正路872號'],
['165770','昌展','新北市樹林區復興路67號1樓'],
['165817','九德','台中市烏日區九德村中華路43.45.47號1樓'],
['165839','立農','台北市北投區承德路七段378號'],
['165851','矽導','新竹市東區力行一路1號'],
['165884','大椿','桃園市桃園區春日路1193號1樓'],
['165895','新灣','高雄市苓雅區自強三路3號12樓之6.7.8'],
['165910','鼎中','高雄市三民區鼎中路735號737號1樓'],
['165965','年代','嘉義縣中埔鄉中華路863號'],
['165976','新育商','台北市松山區寧安街3巷11號1樓'],
['166049','慶吉','台北市大同區重慶北路三段47號49號1樓'],
['166061','裕豐','台南市東區東門路二段289、291、293號1樓'],
['166094','瑞富','台北市內湖區瑞光路188巷51號1樓'],
['166108','萬金','屏東縣萬巒鄉萬金村萬興路18號1樓'],
['166153','永中','新北市永和區中山路一段58號'],
['166164','大正','新北市永和區中正路559號561號1樓'],
['166175','合江','台北市中山區合江街58巷1號1樓60號1樓60之1號1樓'],
['166201','原成','新北市新莊區化成路305號1樓'],
['166212','雅樂','台中市北屯區松竹路二段88號'],
['166289','向福','彰化縣溪湖鎮大溪路二段140號'],
['166290','苗栗高','苗栗縣後龍鎮新東路468號'],
['166315','科七','苗栗縣竹南鎮科專七路396號1樓'],
['166337','豐河','台中市南屯區向上路二段376號'],
['166382','東糖','台東縣台東市中興路二段360號1樓'],
['166429','長運','桃園市龜山區長青路7號C棟B1樓'],
['166441','板勝','新北市中和區連城路219巷6號8號'],
['166452','和新','彰化縣和美鎮彰新路五段臨396號'],
['166463','藝德','桃園市桃園區同德十一街98號100號'],
['166474','樂陽','台北市內湖區陽光街349號1樓'],
['166496','富證','桃園市楊梅區中正路80號82號1樓'],
['166500','秀泰','嘉義市西區國華里文化路293號1樓及2樓'],
['166522','富集','花蓮縣花蓮市國富里富國路32號1樓'],
['166533','智光','台中市梧棲區大智路一段525號1樓'],
['166555','桂花','彰化縣鹿港鎮鹿東路150號1+2樓'],
['166625','恆北','屏東縣恆春鎮網紗里省北路374-3號1樓'],
['166670','日日興','桃園市新屋區中山西路一段280巷20號'],
['166681','富亨','桃園市龜山區文青路206號208號210號1樓'],
['166739','金華','台北市大安區金華街140號1樓'],
['166740','澎興','澎湖縣馬公市興仁里雙頭掛1之2號'],
['166751','二甲','新北市鶯歌區中正三路165號167號'],
['166773','廣隆','桃園市八德區廣興路195號'],
['166784','好正義','高雄市苓雅區正義路195號197號1樓'],
['166876','萬東','台北市萬華區萬大路486巷61號63號65號1樓'],
['166887','城邑','桃園市大園區高鐵北路二段186號188號1樓'],
['166898','裕民','新北市板橋區裕民街110號'],
['166902','亞大醫','台中市霧峰區福新路222號B1樓'],
['166924','美賢','高雄市鼓山區美術東四路430號'],
['166957','南台','台南市永康區南台街1號1樓'],
['166979','素心','台南市仁德區中山路258號260號'],
['167134','綜合','台南市中西區水仙里民生路二段26號28號1樓'],
['167145','金富多','桃園市桃園區寶慶路470號1樓'],
['167156','金聖','新北市淡水區淡金路四段493號'],
['167237','金格','台中市北屯區松竹路一段965號1樓'],
['167260','吉鑫','台北市中山區南京東路二段11號1樓'],
['167318','愛樂','嘉義縣民雄鄉福樂村埤角547號'],
['167329','新卓蘭','苗栗縣卓蘭鎮興南街318號'],
['167396','福國','桃園市八德區福國北街48號50號1樓'],
['167444','隆華','新竹市香山區中華路五段193號1樓'],
['167466','福瀛','台北市北投區西安街二段345號1樓'],
['167499','華鳳','高雄市鳳山區北昌路10號'],
['167503','觀湘','桃園市觀音區忠孝路767號1樓'],
['167514','自強一','桃園市中壢區自強一路65號67號69號'],
['167547','欣清心','高雄市楠梓區清豐二路16號'],
['167569','九份子','台南市安南區國安里九份子大道6號1樓'],
['167581','安松','台北市大安區安東街50之2號50之3號50之4號'],
['167606','埔昌','新竹縣新埔鎮義民路一段92號'],
['167662','東山河','屏東縣屏東市機場北路500號1樓'],
['167695','鳳儀','桃園市蘆竹區南崁路二段285號1樓'],
['167732','湖前','新北市汐止區明峰街120號1樓'],
['167754','東清灣','台東縣蘭嶼鄉東清村東清路7號'],
['167765','晨寶','新竹縣湖口鄉三民南路117號1樓'],
['167798','趣淘','台南市楠西區密枝里密枝102之5號1樓'],
['167824','泉湧','宜蘭縣礁溪鄉玉石村溫泉路15鄰85號1樓'],
['167835','興灣','台南市永康區南灣里大灣東路63號1樓'],
['167846','板維','新北市板橋區四維路345號347號1樓'],
['167868','惠中','台中市南屯區黎明路二段425號1樓'],
['167916','伍鈺','台南市永康區永華路406號408號'],
['167927','新開元','台南市北區開元路112號'],
['167950','東門','台北市大安區信義路二段198巷6號1樓'],
['167961','涼山','屏東縣內埔鄉新展路22號1樓'],
['167983','安期','台南市安平區慶平路60號62號'],
['167994','菄大','新竹市北區東大路四段258.260號1樓'],
['168023','民視','新北市林口區信義路101號1樓'],
['169820','武青','桃園市大園區五青路287號289號1樓'],
['169875','好巧','台南市永康區安康里中華西街152號'],
['169886','湖口廠','新竹縣湖口鄉八德路三段30號'],
['169897','昌原','新北市新莊區中原路137之1之2之3號1樓'],
['170071','東華','台北市北投區裕民一路40巷1號'],
['170107','金星','新北市淡水區北新路65號'],
['170130','福氣','台北市士林區延平北路六段122號124號1樓'],
['170222','雅東','新北市板橋區南雅東路31之1號5號6號7號1樓'],
['170255','德復','基隆市中山區復興路193號195號197號1樓'],
['170266','明榮','高雄市鼓山區明誠里明華路204號'],
['170288','林邊','屏東縣林邊鄉仁和里中山路275號277號'],
['170299','開博','台北市中正區開封街一段40號42號1樓'],
['170314','洲子','台北市內湖區瑞光路517號1樓'],
['170392','復昌','台北市大安區通化里光復南路616號'],
['170462','新貴中','桃園市平鎮區新貴里中豐路一段98號1樓'],
['170473','文學','台北市士林區光華路26巷10號1樓'],
['170532','亮宏','高雄市鳳山區文德里文衡路558號1樓'],
['170705','北新','新北市新店區北新路一段289號291號'],
['170716','雲龍','雲林縣斗六市龍潭路14-1號'],
['170761','灣橋','嘉義縣竹崎鄉灣橋村221號'],
['170783','龍井','台中市龍井區遊園南路210號'],
['170808','廣東','高雄市苓雅區四維二路94之21號'],
['170853','晏丞','新竹市東區振興路50號1樓'],
['170864','鵬馳','台北市南港區南港路三段49-1號'],
['170886','基金','基隆市安樂區麥金路197號1樓'],
['170956','新虎山','桃園市桃園區成功路三段50號52號1樓'],
['170978','中航','台北市中正區林森南路12號'],
['170989','天津','台北市中山區天津街65號'],
['171007','七堵','基隆市七堵區明德一路174號'],
['171018','鑫漢王','高雄市鹽埕區港都里五福四路265號1樓'],
['171030','新樂興','屏東縣屏東市興樂里杭州街30號1樓'],
['171063','和金','台北市大安區和平東路一段91號'],
['171111','加州','新北市新莊區中平路81巷2號'],
['171155','新福成','基隆市仁愛區仁二路84號86號1樓'],
['171199','瑞和','台北市內湖區瑞光路316巷56號1樓'],
['171270','晴朗','高雄市苓雅區晴朗里復興二路162號'],
['171339','瓏慈','桃園市中壢區龍慈路712號716號718號1樓'],
['171421','統威','台北市松山區東興路13-1號1樓15巷3號1樓'],
['171513','孝豐','高雄市三民區覺民路238號240號'],
['171568','下竹圍','新北市三重區下竹圍街26號'],
['171580','汐忠','新北市汐止區忠孝東路282號'],
['171694','正麗','桃園市桃園區莊一街11號13號1樓'],
['171753','新桃行','桃園市桃園區力行路7號'],
['171764','福榮','台北市士林區中正路220號222號'],
['173531','婦聯','台北市松山區健康路224號'],
['173634','龍仁','苗栗縣頭份市中華路968-974號'],
['173667','前瞻','新北市三重區新北大道二段258號'],
['173678','正康','桃園市桃園區民光路49號'],
['173689','石棹','嘉義縣竹崎鄉中和村石棹22之27號'],
['173748','蓮安','花蓮縣吉安鄉中華路二段5號'],
['173782','新廣','新北市新店區中正路542之5號1樓'],
['173793','一新','新北市中和區永和路56號58號1樓'],
['173818','忠新','桃園市大溪區大鶯路1539-1號'],
['173841','寶強','新北市新店區寶中路88號1樓'],
['173885','帝標','台南市東區龍山街109號111號'],
['173896','頭寮','桃園市大溪區復興路一段902之1及906號1樓'],
['173900','仁心','高雄市仁武區考潭里仁心路198-1號1樓'],
['173922','竹光','新竹市北區文雅里18鄰竹光路123號'],
['173988','延壽','台北市松山區延壽街422號'],
['173999','重安','新北市三重區重安街60號及60-1號'],
['174017','猴探井','南投縣南投市八德路600之1號'],
['174028','三玉','台北市士林區天母東路88之1號1樓'],
['174039','新春','新北市淡水區新春街142號1樓'],
['174062','雙源','新北市板橋區雙十路二段47巷30號32號'],
['174121','汐峰','新北市汐止區仁愛路32號34號1樓'],
['174165','德聖','新北市林口區公園路17號'],
['174176','竹森','新竹市北區光華東街105.107號'],
['174187','興達港','高雄市茄萣區崎漏里民治路188號'],
['174202','時安','新北市新莊區建安街95號97號1樓'],
['174224','宏懋','新北市新莊區民安西路70號72號1樓'],
['174235','華中','高雄市路竹區竹南里中華路124號'],
['174246','東尊','雲林縣虎尾鎮惠來里142-3號'],
['174257','一級棒','新北市新莊區新北大道七段482號'],
['174291','維軒','屏東縣枋寮鄉人和村中山路二段143號'],
['174305','樂合','花蓮縣玉里鎮樂合里新民路13-1號'],
['174350','愛民','花蓮縣花蓮市民國路22號1樓'],
['174361','園中','高雄市林園區中門里中門路15-1號'],
['174372','雅潭','台中市大雅區學府路209號'],
['174408','平興','台中市北屯區遼寧路一段120號'],
['174419','股興','新北市五股區中興路一段3號、3-1號'],
['174523','登峰','新北市汐止區新台五路一段149號1樓'],
['174545','大肚','台中市大肚區沙田路二段740號'],
['174567','安學','台南市安南區南興里12鄰公學路五段685號一樓'],
['174589','貞永','苗栗縣頭份市永貞路二段1號'],
['174590','世紀','新北市中和區中正路710號1樓K棟'],
['174604','長德','台中市太平區長億里永成北路125號'],
['174615','卑南','台東縣台東市南榮里更生路1267號'],
['174626','忠福','台中市西區忠明南路192號1樓'],
['174637','樹林','新北市樹林區保安街一段3號'],
['174671','鎮宮','桃園市平鎮區中山路233號235號237號1樓'],
['174729','樺鑫','高雄市小港區中安路739號'],
['174763','慶祥','新北市土城區中華路二段126號1樓'],
['174774','廣城','桃園市平鎮區廣達里廣平街20號24號1樓'],
['174785','新峽','新北市三峽區民權街184號186號1樓'],
['174796','龍淵','台北市大安區和平東路二段118巷33號'],
['174811','崙上','屏東縣長治鄉崙上村中興路372-2號'],
['174877','港臻','台中市梧棲區文昌路333號'],
['174888','景高','台北市文山區景華里景興路14號'],
['174899','讚福','花蓮縣花蓮市國聯五路55號'],
['174903','精科','台中市南屯區嶺東路368號'],
['174914','內海','桃園市大園區民生路183號1樓'],
['174925','東晴','新北市汐止區新台五路二段80號'],
['174936','莊正','桃園市桃園區莊二街148號1樓'],
['174958','水林','雲林縣水林鄉水南村水林路157號159號'],
['174970','松智','台北市信義區莊敬路325巷43號'],
['174992','金林','新北市板橋區金門街303號305號'],
['175032','中廣','台北市大安區仁愛路三段25-1號27號'],
['175054','大明','台中市大里區中興路二段833號835號及中興路二段祥興一巷2號'],
['175065','御城','新北市五股區御史路3號5號1樓'],
['175076','統寶','苗栗縣竹南鎮科中路12號B2'],
['175098','田尾','彰化縣田尾鄉光復路二段752號'],
['175102','和全','彰化縣和美鎮竹營里美寮路二段390號'],
['177108','重惠','高雄市左營區福山里華夏路1152號1樓'],
['177256','藍昌','高雄市楠梓區建昌里後昌路1185號1187號1189號1樓'],
['177441','亞太','台中市北區中清路一段506、508號'],
['177463','天福','台北市士林區天福里天母東路８巷39號天母東路8巷41弄1號'],
['177555','順德','高雄市鼓山區龍子里大順一路860號1樓'],
['179562','八德介壽','桃園市八德區介壽路二段216號218號1樓'],
['179584','桃醫','桃園市桃園區中山路1492號'],
['179621','太明','台中市烏日區太明路136號'],
['179632','合康','新北市三重區永福街179之1及179之2號1樓'],
['179654','宏遠','新竹市東區金山十五街1號1樓'],
['179676','北勢','桃園市新屋區中山東路一段745號'],
['179724','正原','新北市中和區中山路二段530號1樓'],
['179735','鼎上','高雄市三民區鼎中路160號1樓'],
['179768','大瑩','台南市仁德區二行里中正西路347號1樓'],
['179816','學安','高雄市楠梓區藍田路816號'],
['179849','遠東','新北市汐止區新台五路一段75號1樓之2'],
['179850','水牛厝','嘉義縣太保市中山路一段210號'],
['179861','樂陶','新北市鶯歌區尖山路276號1樓'],
['179908','中心園','南投縣埔里鎮中山路一段427號1樓'],
['179931','群創B','台南市善化區南關里南科八路12號B1樓'],
['179942','社腳','彰化縣社頭鄉湳雅村山腳路三段525號'],
['179986','安同','台南市安南區同安路235號'],
['179997','高萱','桃園市中壢區高鐵南路二段369號1樓'],
['180023','嘉林','嘉義市東區林森東路950號'],
['180045','潭厝','台中市潭子區環中東路一段5號'],
['180056','京站','台北市大同區華陰街91號'],
['180089','亮亞','桃園市蘆竹區大福路189號'],
['180090','文清','新竹市東區建功路49號1.2樓'],
['180104','龍躍','苗栗縣苗栗市新川里圓墩路28號'],
['180115','慈中','桃園市桃園區中正路820號1樓2樓'],
['180137','賢和','台中市北屯區景賢路230號'],
['180159','明城','彰化縣大城鄉東城村北平路76號'],
['180171','欣二林','彰化縣二林鎮大成路一段236號'],
['180207','興榮珍','桃園市中壢區興仁路二段200之1號;198巷1之3號1樓'],
['180285','千富','桃園市蘆竹區長安路二段220號222號1樓'],
['180311','守福','屏東縣九如鄉九如路三段450號'],
['180322','采虹','新竹縣竹北市勝利八街一段345.347號1樓'],
['180333','大仁','台中市梧棲區頂寮里28鄰大仁路二段71號'],
['180344','大千','苗栗縣苗栗市中正路903號1樓'],
['180377','萬龍','桃園市龜山區萬壽路一段307號309號1樓'],
['180436','欣浩','台中市清水區五權路121號'],
['180481','福厚','桃園市八德區興仁里建德路229號'],
['180506','鎮天','新北市汐止區大同路三段611之5號611之6號1樓'],
['180528','騰達','新竹縣橫山鄉中豐路二段211號'],
['180551','港務','台中市梧棲區中和里15鄰中橫一路12號'],
['180573','國力','桃園市桃園區國際路二段426號428號1樓'],
['180609','青禾','桃園市中壢區高鐵站前西路二段96號1樓'],
['180610','奉天宮','嘉義縣新港鄉中山路33號.35號'],
['180632','環山','台中市和平區中興路三段64-5號.64-6號'],
['180687','景星','台北市大同區延平北路三段19之5號21號1樓'],
['180702','東安','台東縣台東市杭州街288號1樓'],
['180735','建發','桃園市龜山區南上里8鄰民生北路一段516號1樓'],
['180757','文成','台南市北區文元里文成路775號'],
['180780','嘉義大','嘉義市東區學府路300號1樓'],
['180805','錚大','嘉義縣民雄鄉文隆村11鄰鴨母?85號'],
['180816','觀龍','新北市板橋區龍興街39號41號1樓'],
['180827','鑫工三','台中市西屯區中工三路123.125號1樓'],
['180849','明月','高雄市楠梓區楠梓加工區第二園區創意北路1號'],
['180861','德芝','台北市士林區士東路266巷5弄18號20號1樓'],
['180872','成大','台南市北區勝利路138號B1樓'],
['180919','祥嘉','高雄市楠梓區立民路33號'],
['180931','秀鑫','彰化縣秀水鄉番花路101號'],
['180964','嶺寶','台中市南屯區忠勇路23-12號1樓'],
['180975','興豐','桃園市八德區興豐路418號'],
['181015','三越','台東縣台東市中華路一段169.171.173號1樓及169號2樓'],
['181037','通高','苗栗縣通霄鎮內湖里12鄰烏眉路308號'],
['181059','東興','新竹縣竹東鎮北興路一段468號1樓'],
['181129','新中勝','屏東縣內埔鄉龍潭村昭勝路13.15號1樓'],
['181141','桃捷','桃園市蘆竹區南山路三段98號100號1樓2樓'],
['181211','景平','新北市中和區景平路149號1樓'],
['181222','東凌','桃園市八德區中正路112號116號'],
['181233','明泰科技','新竹市東區力行七路8號B1樓'],
['181244','明興','台中市南區忠明南路929號'],
['181277','三舍','台南市新市區三舍里三舍55號'],
['181288','玉富','花蓮縣玉里鎮大同路214號及光復路184號'],
['181336','瑞祥','高雄市前鎮區瑞祥里崗山中街241號1樓'],
['181451','湖光','台北市內湖區基湖路35巷13號1樓'],
['181462','航明','桃園市蘆竹區南山路二段497號1樓'],
['181473','永權','新北市永和區民權路32號34號1樓'],
['181521','展穫','高雄市阿蓮區中正路897號'],
['181532','真新','台南市麻豆區油車里油車24之1號'],
['181554','盛烽','桃園市新屋區梅高路三段310之6號'],
['181565','世界','台中市東區十甲路202號'],
['181598','東楨','台南市白河區永安里新興路507號一樓'],
['181602','大硯','新竹縣竹北市文興路311號'],
['181624','興惠','台中市南區國光路250號'],
['181657','合興','彰化縣埤頭鄉斗苑西路406號'],
['181679','圳營','苗栗縣竹南鎮中正路114號1樓'],
['181691','宥昌','新竹縣芎林鄉文富街100號1樓'],
['181716','維妮','新北市新莊區四維路23號1樓'],
['181749','欽天','新竹市北區成德路123號'],
['181750','馬航','澎湖縣湖西鄉隘門村126之5號1樓(馬公航空站一樓航廈)'],
['181761','永冠','彰化縣永靖鄉永北村西門路142號1樓'],
['181831','景碩','新竹縣新豐鄉建興路二段526號行政棟3樓'],
['181886','溪東','彰化縣溪湖鎮員鹿路一段403號'],
['181923','深溝','宜蘭縣員山鄉惠民路207號'],
['181990','梓官','高雄市梓官區和平路278號1樓'],
['182018','晨星科','新竹縣竹北市台元街18號7樓之1'],
['182188','新武陵','桃園市桃園區上海路82號84號江南八街49號'],
['182225','迎和','桃園市八德區金和路52號'],
['182258','復忠','台北市大安區光復南路98之3號98之5號'],
['182317','燿福','新北市土城區中山路1-1號1樓'],
['182328','康勢','台中市霧峰區豐正路648號'],
['182339','權旺','台中市南屯區五權西路二段812號'],
['182362','永成','台南市南區佛壇里明興路1322號1樓'],
['182410','惠馨','台中市南屯區大墩南路332.336號'],
['182432','榮田','台中市烏日區三榮路二段199號'],
['182476','光泰','高雄市鳳山區光復路65號1樓(B室)1樓部分'],
['182487','寶勇','桃園市平鎮區湧光路455號457號459號1樓'],
['182498','朴子橋','嘉義縣六腳鄉正義村大橋頭190-2號'],
['182502','新安發','台南市安定區安加里安定407號'],
['182513','智慶','彰化縣大村鄉大智路一段197號'],
['182546','辰佳','台南市永康區永大路二段11號'],
['182568','力大','台南市東區生產路508號'],
['182580','銅鑼圈','桃園市龍潭區中豐路高平段402之1號1樓'],
['182591','米妃','高雄市仁武區文武里中華路327-1號'],
['182616','川越','台中市北屯區昌平東六路121號'],
['182694','苗龍','苗栗縣後龍鎮造豐路333號'],
['182731','合泰','嘉義縣大林鎮大美里19鄰大智一街1號'],
['182742','安捷','嘉義市西區保安里保安一路301.303號1樓'],
['182753','玉港','台北市南港區南港路三段8號10號'],
['182764','新榮','台中市大里區東榮路552號'],
['182775','航林','桃園市大園區三民路二段626號1樓'],
['182812','復育','新北市樹林區復興路227號1樓'],
['182834','緯華','桃園市龜山區文化二路34巷14弄12號14號1樓'],
['182867','曾厝','台中市霧峰區振興街32.36.38號'],
['182890','鳳中','高雄市三民區建國三路285號1樓'],
['182904','人田','高雄市鼓山區美術東二路7號'],
['182926','湖康','嘉義市西區湖內里湖子內路195號1樓'],
['182937','美家','桃園市中壢區中北路34號36號1樓'],
['182993','宗聖','雲林縣北港鎮大同路511-1號'],
['183077','多多利','屏東縣九如鄉九如路三段85號'],
['183170','梨山','台中市和平區中正路6號1樓'],
['183181','南化','台南市南化區南化里128號1樓'],
['183240','員大','彰化縣員林市員大路一段374號'],
['183251','羿龍','桃園市中壢區龍慈路283號1樓'],
['183262','建榮','高雄市鼓山區建榮路180號1樓'],
['183284','晨曦','基隆市暖暖區東勢街6之52號6之53號1樓'],
['183295','臣峰','新北市林口區文化北路一段62之1號'],
['183309','鑫國語','台北市中正區南昌路一段135號1樓'],
['183332','京鑫','南投縣草屯鎮中正路483號'],
['183343','進一廠','新竹縣寶山鄉園區三路123號'],
['183365','英荃','台中市清水區中山路39.41.43號'],
['183387','正發','高雄市大寮區會社里鳳林三路421號'],
['183402','民揚','新北市五股區新五路二段572號1樓'],
['183413','八仙','新北市八里區中華路二段290號292號296號'],
['183424','港昌','台中市梧棲區港埠路一段986號'],
['183446','北雄','嘉義縣水上鄉粗溪村中山路二段381號'],
['183457','國盛','花蓮縣花蓮市國民九街56號58號1樓'],
['183479','鏵智','台中市梧棲區中華路二段351號'],
['183491','海神','新北市八里區中山路二段6號8號'],
['183505','壯志','宜蘭縣壯圍鄉中央路二段311號'],
['183516','真潭','台南市歸仁區大潭里中正南路三段22號'],
['183527','振陞','桃園市龜山區振興路1301號1樓'],
['183549','群創八','高雄市路竹區路科十路11號1樓'],
['183550','壹盛','台中市南區忠孝路166號'],
['183561','楓港','屏東縣枋山鄉楓港村舊庄路21-3.21-4.21-5.21-6號1樓'],
['183572','華興','台北市文山區木柵路一段284號286號1樓'],
['183583','湖海','桃園市蘆竹區濱海路一段335號337號1樓'],
['183608','金桔','宜蘭縣礁溪鄉玉龍路二段417號'],
['183619','TBI','新北市樹林區三多路139號1樓'],
['183631','廣美','新北市中和區中和路52號1.2樓'],
['183642','汐園','新北市汐止區大同路一段237之7號1樓'],
['183675','聯鑫','台中市中區建國路143.145號'],
['183712','安合','高雄市楠梓區藍昌路420號'],
['183734','立青','台南市歸仁區南保里民權南路108號'],
['183745','凱利','桃園市平鎮區延平路三段413號415號417號1樓'],
['183778','佳立','台南市佳里區佳東路361號'],
['183790','維禮','新北市板橋區四維路276號278號1樓'],
['183848','仟瑞','台北市大同區民生西路84號1樓'],
['183871','中蘭','金門縣金沙鎮環島北路三段482號'],
['183918','科南','苗栗縣竹南鎮大埔里1鄰科學路243號'],
['183996','瑞景','台北市內湖區瑞光路583巷30號1樓'],
['184003','富達','宜蘭縣頭城鎮青雲路一段225號227號1樓'],
['184025','新悅','新竹市北區經國路二段188號190號1樓'],
['184106','龍億','台中市龍井區沙田路五段143號'],
['184117','內成','宜蘭縣員山鄉員山路二段264號1樓'],
['184128','造橋鄉','苗栗縣造橋鄉造橋村平仁路105-1號'],
['184140','北岸','澎湖縣馬公市西文里新店路359號1樓'],
['184173','鵝鑾鼻','屏東縣恆春鎮鵝鑾里鵝鑾路245.247.249.257號'],
['184184','金裕','新北市土城區裕民路255號1樓'],
['184195','三景','台中市梧棲區臺灣大道十段168號(第1930號櫃位)'],
['184232','星宇','桃園市桃園區永安路739號1樓'],
['184243','浤雅','台中市大雅區中清路四段737號'],
['184287','航站南','桃園市大園區航站南路15號B1樓'],
['184298','航站北','桃園市大園區航站南路15號B1樓'],
['184302','富宇','台中市北屯區建和路二段273.275號'],
['184335','幼勝','台中市大甲區中山路二段920之21號之22號之23號之25號之26號'],
['184357','后里棧','台中市后里區馬場路300號B1樓'],
['184368','科星','苗栗縣竹南鎮科專七路393號'],
['184379','睿豐','台東縣台東市大和路8-1.16-1號一樓'],
['184380','虎欣','雲林縣虎尾鎮林森路一段287.289.293號'],
['184438','威保','台南市關廟區南雄路一段851號1樓'],
['184449','立揚','桃園市桃園區正光路116號1樓'],
['184472','墘運','台北市內湖區洲子街12號1樓'],
['184508','大饌','台北市士林區大東路35號1樓'],
['184519','員全','彰化縣埔心鄉員林大道七段22號'],
['184601','技嘉','桃園市平鎮區南平路180之1號'],
['184612','凌雲','桃園市龍潭區中豐路上林段358-1號'],
['184667','北安','台南市北區公園路599-11號'],
['184782','復春','台北市松山區復興北路179號'],
['184793','警廣','台北市中正區廣州街10-2號10-3號10-4部分號1樓'],
['184841','新工建','新北市汐止區中興路60號'],
['184874','新廟口','基隆市仁愛區仁二路228號1樓'],
['184900','文慈','高雄市左營區福山里重愛路63號65號67號1樓'],
['184922','新九揚','桃園市龜山區復興一路264號1樓'],
['184955','華慶','台北市中正區中華路一段59之16號'],
['185051','新大直','台北市中山區北安路621巷48號'],
['185073','真莘','新北市新店區中正路362號'],
['185143','昌隆','台北市信義區基隆路二段131-4號'],
['185213','忠陽','台北市南港區忠孝東路六段465號1樓'],
['185257','藍海','新竹市東區關新路21號1樓'],
['185279','新愛國','台北市中正區延平南路177號'],
['185327','保聖','台北市大同區酒泉街58號60號'],
['185408','長中','台北市中山區中山北路二段40-1號'],
['185464','榮護','台北市北投區石牌路二段179號1樓'],
['185475','成苑','雲林縣斗六市莊敬路345號'],
['185512','立文','高雄市左營區新上里立文路77號1樓'],
['185534','南強','新北市新店區中興路三段168號1F'],
['185604','民美','台北市中山區圓山里中山北路三段57號'],
['185693','愛之船','高雄市前金區河東路165號1樓'],
['185752','博瑞','高雄市鳳山區瑞興里博愛路221號223號'],
['185800','大輔','高雄市苓雅區正心里輔仁路333號341號1樓'],
['185822','研究','台北市南港區研究院路二段14號'],
['185833','昆寧','台北市萬華區西寧南路50巷3號5號'],
['185855','愿景','桃園市龜山區文化一路42號'],
['185888','彩龍','台北市內湖區行善路35號1F'],
['185899','溪崑','新北市板橋區大觀路三段212巷70號72號1樓'],
['185925','榮泰','新北市三峽區文化路63號65巷2號1樓'],
['185947','新贊','新北市新店區北新路一段14號1樓'],
['185958','大將作','台中市西區英才路410號'],
['185981','新楊埔','桃園市楊梅區中興路47號1樓新興街66號1樓'],
['186021','東正','桃園市平鎮區平東路661號'],
['186157','大永博','台北市中正區博愛路97號1樓'],
['186191','洲子洋','新北市五股區芳洲八路107號109號111號1.2樓'],
['186250','工業','桃園市中壢區吉林路131號1樓'],
['186283','宏義','桃園市龜山區萬壽路一段378號380號1樓'],
['186319','喜悅','台北市大安區復興南路二段82-1及82-2號'],
['186386','新民享','新北市中和區民享街91號'],
['186397','新本館','高雄市三民區大裕路119號'],
['186401','大眾','台北市內湖區港墘路221巷41號1樓'],
['186526','行義','台北市北投區石牌路二段348巷1號3號1樓'],
['186559','國學','台北市中山區長春路182號'],
['186582','銀光','高雄市苓雅區林圍里光華一路263號'],
['186618','重信','高雄市左營區文川路195號.重建路2號'],
['186685','瑞陽','台中市南屯區河南路四段442號446號1、2樓'],
['186696','鐏賢','台北市北投區尊賢街247號247號之1號1樓'],
['186766','來峰','新北市五股區成泰路一段163號165號1樓'],
['186777','鵬權','屏東縣潮州鎮永春里光春路139號1樓'],
['186799','縣東','新北市板橋區縣民大道二段108號1樓'],
['186803','貝比','新北市林口區湖南村8鄰頭湖70-9號'],
['186825','頂新','新北市中和區興南路二段49號51號1樓'],
['186858','新奇美','台南市永康區甲頂路18、20號'],
['186869','汐政','新北市汐止區汐萬路一段222號1樓'],
['186870','中林','新北市土城區員林街14號'],
['186892','莒城','新北市中和區莒光路91號93號1樓'],
['186906','廣裕','台中市大雅區中山路145號'],
['186928','長坑','新北市八里區中華路三段168號'],
['186951','美禎','新北市蘆洲區復興路322號'],
['186962','新達豐','桃園市桃園區延平路202號;大豐路194號'],
['186995','頂埔','新北市土城區中央路四段274號276號1樓'],
['187002','巴頓','桃園市龜山區龍壽里萬壽路一段492號1樓'],
['187013','艾德蒙','新北市中和區中正路738號1樓'],
['187046','泰星','新北市蘆洲區成功里長安街276號'],
['187057','鑫泉州','台北市中正區汀州路一段285號一樓'],
['187079','權美','台中市西區美村路一段736號'],
['187080','元宏','台中市烏日區溪南路一段722號'],
['187091','湖崗','新竹縣湖口鄉中山路二段430號'],
['187138','太子','新北市土城區中山路47號'],
['187150','真愛','彰化縣員林市大同路二段2號'],
['187183','豪運','新竹市香山區香北路181號183號'],
['187219','鳳凰','台南市安南區北安路二段122號'],
['187231','仁興','台南市歸仁區南保里大德路307號'],
['187242','善和','台南市善化區坐駕里大成路319號'],
['187253','郡豐','台南市安平區郡平路307號'],
['187286','西安','台北市北投區大興街44號46號1樓'],
['187312','坑口','台中市霧峰區中正路563、563-1號'],
['187378','新雙安','桃園市桃園區安樂街48號50號1樓;安東街56號1樓'],
['187389','廣明','台北市萬華區昆明街285號之3之4'],
['187390','八德建國','桃園市八德區建國路165號'],
['187404','新社頭','彰化縣社頭鄉員集路二段279號'],
['187415','愛家','新北市三重區中興北街42巷11號'],
['187448','權貴','台中市南區五權南路189號'],
['187459','新龍邸','彰化縣彰化市光南里中興路109號'],
['187471','文青','新北市土城區青雲路243號245號'],
['187482','北大成','新北市三峽區學成路301號303號1樓'],
['187493','名言','高雄市小港區鳳森里鳳林路2-18號'],
['187530','麥金','基隆市安樂區基金三路80號80-1號1樓'],
['187541','德華','台北市士林區文林路669號1樓'],
['187552','大中','台北市北投區中央南路一段114號'],
['187585','鐵鎮','桃園市大園區中正東路二段428號'],
['187622','北深','新北市深坑區北深路二段183號'],
['187725','湯華','桃園市中壢區中華路一段745號747號749號1樓'],
['187736','仁義','台南市仁德區中正路二段1052號'],
['187747','瑞興','台中市豐原區中正路499號'],
['187758','東洋','台北市士林區中山北路七段14巷19號Ｂ1'],
['187769','景大','新北市新店區安忠路69號1樓71巷1號1樓'],
['187781','華江','台北市萬華區環河南路二段200號1樓'],
['187806','征唐','台北市松山區新東街41-7號'],
['187817','萬福','台北市文山區萬年里羅斯福路五段170巷33及35號'],
['187828','福新','南投縣草屯鎮虎山路495號497號'],
['187839','泳豐','新北市土城區永豐路264之1號'],
['187840','翔發','屏東縣萬丹鄉萬後村西環路637號'],
['187851','金山角','高雄市大寮區會社里1鄰鳳林三路1之10號'],
['187873','富竹','桃園市蘆竹區南竹路二段313號1樓'],
['187910','福真','新北市中和區景平路679號681號'],
['187965','立宣','嘉義市東區立仁路120號'],
['187976','峽光','新北市三峽區光明路62號1樓、永安街83號1樓'],
['187987','益志','桃園市桃園區樹仁三街102號'],
['187998','振盟','宜蘭縣蘇澳鎮蘇濱路二段302號'],
['188016','太順','新北市樹林區太順街49巷2號'],
['188038','城邦','桃園市桃園區樹仁三街81號83號85號1樓'],
['188049','龍庄','苗栗縣後龍鎮大庄里成功路207號'],
['188061','群創三','台南市新市區環西路二段2號1樓(群創三廠)'],
['188072','群創五','台南市新市區環西路二段2號1樓(群創五廠)'],
['188142','群創','苗栗縣竹南鎮頂埔里科學路160號1樓'],
['188153','瑞廣','屏東縣屏東市一心里廣東南路88-15號'],
['188164','安昌','台南市安南區塭南里安昌街101號'],
['188175','金中','新北市金山區中山路305號307號'],
['188197','仁愛','新北市永和區仁愛路128號130號1樓'],
['188201','跨海','澎湖縣西嶼鄉合界村3-1號'],
['188212','新學府','新北市土城區學府路一段223號225號1樓'],
['188234','念楨','屏東縣內埔鄉黎明村黎東路221號1樓'],
['188256','佳冬','屏東縣佳冬鄉賴家村佳和路1號'],
['188267','廣麗','新北市中和區廣福路87號89號91號1樓'],
['188278','百福','新北市新店區三民路50號52號1樓'],
['188290','中龍','台中市龍井區麗水里中南一路一段7號1樓'],
['188326','雄強','台北市南港區忠孝東路六段276號'],
['188348','鑫魚池','南投縣魚池鄉魚池街799號'],
['188407','德玉','新北市新店區安康路三段195號'],
['188441','新樹孝','台中市太平區樹孝路48號50號1樓'],
['188463','新雅竹','新竹市北區湳雅街255號'],
['188496','新黎明','台南市麻豆區興國路40-10號'],
['188511','民新','桃園市大園區民生南路167號'],
['188599','鑫青天','台北市萬華區青年路144號'],
['188681','松民','台北市松山區三民路10號'],
['188740','中城','台中市大里區中興路一段328號'],
['188751','新化成','新北市新莊區化成路213號1樓'],
['188795','華仁','高雄市岡山區仁壽里仁壽路106號'],
['188821','鹽埔','屏東縣鹽埔鄉維新路134-3號134-6號136號1樓'],
['188832','里宬','屏東縣里港鄉鐵店村鐵店路17-1號'],
['188843','加祿堂','屏東縣枋山鄉加祿村加祿路155號'],
['188887','荷韻','台南市白河區河東里9鄰冀萁湖122-35號'],
['188924','隆恩','台中市西屯區大墩十八街116號1樓'],
['188946','十八甲','新北市泰山區福興一街87號'],
['188957','東引','連江縣東引鄉中柳村85與86號1樓'],
['188968','華薪','桃園市中壢區新中北路二段179號181號'],
['188979','東鑽','新竹縣竹東鎮北興路三段517號519號'],
['188980','鼎利','台南市關廟區南雄路二段210號'],
['188991','鼎亨','台南市東區德東街101號'],
['189008','永安','高雄市永安區永安里永安路34號'],
['189019','永福','台南市中西區永福路二段65號1樓'],
['189020','遊園','台中市大肚區遊園路二段146號1樓'],
['189031','園頂','桃園市大溪區公園路111號115號'],
['189042','東寶','台中市潭子區昌平路三段152號'],
['189075','永富','基隆市七堵區永富路99號101號103號1樓'],
['189086','景鑫','新北市中和區中正路683號'],
['189101','新龍壽','桃園市桃園區龍壽街20號'],
['189112','喀哩','台中市烏日區溪南路二段380號1樓'],
['189123','天台','新北市三重區仁德里正義南路13號15號1樓'],
['189134','廣吉','屏東縣屏東市廣東路991之1、991之2號1樓'],
['189156','領航','桃園市中壢區領航北路二段239號1樓'],
['189178','軍總','台北市中正區汀州路三段129號'],
['189189','三洋','新北市新莊區中正路677號679號'],
['189226','朝天宮','雲林縣北港鎮東華里中山路150號'],
['189271','永康','台北市大安區永康街43號'],
['189307','新西屯','台中市西屯區西屯路二段281-3號281-4號'],
['189400','星成','台北市內湖區星雲街17號17-1號'],
['189466','立福','新北市三重區力行路一段60之1號60之2號1樓'],
['189503','羚陽','新北市泰山區泰林路二段304號1樓'],
['189628','省宜','宜蘭縣宜蘭市新民路159號161號1樓'],
['189695','文忠','台北市文山區忠順街二段10號1樓'],
['189765','永平','新北市永和區中山路一段149至153號'],
['189857','水鑫','新北市淡水區大忠街83號'],
['189868','得和','新北市永和區得和路113號1樓'],
['189905','正民','新北市新店區中正路508號1樓'],
['190019','青文','高雄市鳳山區文衡里文衡路343號'],
['190042','羅斯福','台北市文山區羅斯福路五段216號'],
['190190','新陽','新北市三重區三陽路62號64號'],
['190330','必成','台北市信義區基隆路一段178號180號1樓'],
['190592','德天','台北市士林區德行西路52號1樓'],
['190673','鑫領千','高雄市三民區民族一路94號1+2樓96號1樓'],
['190743','博源','台北市中正區思源街16號'],
['190776','宏亞','桃園市桃園區中平路102號1樓'],
['190798','鎮豐','桃園市平鎮區南豐路99號1樓'],
['190813','小東','台南市東區小東路256號1樓'],
['190824','金東山','彰化縣員林市南東里山腳路四段1號3號'],
['190879','彰美','彰化縣和美鎮彰美路三段385號387號'],
['190905','興復','台北市中山區興安街112號一樓'],
['190927','漢陽','台北市萬華區昆明街197號199號1樓'],
['190938','延埕','台北市大同區延平北路二段159號161號'],
['192543','廣達','宜蘭縣冬山鄉廣興路166號168號1樓'],
['192565','維仁','高雄市岡山區維仁路79號'],
['192602','九州','新北市新莊區五工二路60號62巷1號'],
['192624','浮洲','新北市板橋區大觀路一段38巷22號1樓'],
['192646','育溪','南投縣埔里鎮安七街89-1號'],
['192680','本鈿','彰化縣花壇鄉文德村彰員路二段臨1138號'],
['192691','樂有','彰化縣埔鹽鄉大有村員鹿路三段臨139號之9'],
['192705','金鑫','新竹市東區金城一路50-9號'],
['192716','糖友','彰化縣和美鎮中圍里彰新路三段臨368號'],
['192738','瑞光','屏東縣屏東市瑞光里民生東路58-2號'],
['192750','湖興','嘉義市東區興安里24鄰興美六路368號1樓'],
['192783','唯勝','台南市中西區民權路三段150號一樓'],
['192794','五福','桃園市蘆竹區五福一路202號1樓'],
['192819','和慶','台南市安南區安中路一段701巷33.35號'],
['192820','保雅','台中市沙鹿區屏西路55號'],
['192842','后旺','台中市后里區甲后路二段742號一樓'],
['192875','港勝','台北市南港區經貿二路2號B1樓'],
['192923','華壢','桃園市中壢區中華路一段288號290號1樓'],
['192990','國仁','桃園市八德區建國路250號256號'],
['193007','埔嵩','新竹縣新埔鎮田新路292號296號1樓'],
['193085','穀昌','南投縣名間鄉彰南路450號'],
['193122','北大門','新竹市北區北門街96號1樓'],
['193144','員道','新竹縣竹東鎮員山路218之1號'],
['193155','順太','台中市北屯區太順路112號1樓'],
['193199','喬興','台南市西港區慶安里新興街8-77.8-78號'],
['193236','京寶','台北市松山區南京東路五段291巷4之1號4之2號'],
['193292','福懋興','雲林縣斗六市石榴路317號'],
['193306','水美','桃園市楊梅區楊新路二段70號'],
['193432','黎營','台南市麻豆區井東里磚子井141-21號1樓'],
['193454','桃遠百','桃園市桃園區中正路20號B1樓'],
['193487','豐富','新竹縣竹北市復興三路一段105號1樓'],
['193498','禾安','桃園市平鎮區平德路295號1樓'],
['193568','北園','台南市北區北園街6號之6 1樓'],
['193638','甲渭','台中市大甲區中山路二段905之12號'],
['193649','文捷','桃園市龜山區文桃路426號1樓'],
['193742','永騰','新北市永和區信義路7號1樓'],
['193753','名湖','高雄市仁武區八德東路490號'],
['193775','興富','花蓮縣富里鄉中山路61號'],
['193797','君悅','台中市北屯區軍福十三路68號'],
['193845','鑫隆','桃園市楊梅區金龍三路1號3號1樓'],
['193867','陽光城','台南市善化區蓮潭里9鄰陽光大道198號1樓'],
['193878','香蘭','台東縣太麻里鄉太麻里街575號'],
['193889','柳子林','嘉義縣水上鄉柳林村柳子林50-98號1樓'],
['193948','彰欣','彰化縣彰化市彰興路一段臨528號'],
['193960','科興','台北市大安區復興南路二段271巷2號1樓'],
['193971','鈺興','南投縣竹山鎮集山路三段912.914號'],
['193982','逢星','台中市西屯區福星路651-8號'],
['193993','和平','台中市和平區東關路三段161之2號'],
['194000','君品','新北市淡水區北新路141巷56.58號1樓'],
['194044','和億','新北市淡水區濱海路一段306巷60弄35.41號1樓'],
['194055','福澳港','連江縣南竿鄉福澳村129號'],
['194066','彰北','彰化縣彰化市建國東路258號'],
['194077','萬濠','台北市中山區敬業四路1號1樓'],
['194088','衛國','台南市東區林森路二段192巷24弄5號.7號'],
['194099','廣耘','桃園市平鎮區廣泰路212號1樓'],
['194114','新頭高','苗栗縣頭份市中華路1186號1樓'],
['194192','鈦湖','金門縣金湖鎮新市里太湖路二段217號1樓'],
['194228','高達','桃園市楊梅區金山街302號1樓'],
['194251','和冠','彰化縣和美鎮彰新路六段臨566號'],
['194262','豐竹','台中市大里區健民路97號'],
['194273','頂王','彰化縣鹿港鎮頭崙里7鄰頂草路二段135號'],
['194284','沐東風','台南市東區德昌路58號'],
['194295','華敬','屏東縣屏東市中正里華正路12號1樓.14號1樓'],
['194310','航空城','澎湖縣馬公市烏崁里烏崁106-20號'],
['194321','安醫','台南市安南區州南里12鄰長和路二段66號B1'],
['194343','裕孝','台南市東區裕農路888號1樓'],
['194365','榮福','桃園市中壢區永福路1092號1092-1號1096號1樓'],
['194435','德厚','新北市汐止區福德二路189號1樓'],
['194446','禾康','台中市神岡區三民路630號1樓'],
['194505','美福','新北市新莊區頭興街186號188號'],
['194516','瑞賢','高雄市新興區民族二路90號'],
['194561','晞寶','台中市大雅區昌平路四段556號'],
['194572','復錦','台北市中山區復興北路348號1樓'],
['194594','加百列','新北市鶯歌區中正一路131號133號1樓'],
['194608','華立','台南市仁德區仁義里中清路208號'],
['194619','寶捷','新竹市東區田美三街35號'],
['194620','平和','台中市沙鹿區平等路100號'],
['194734','頂孝','新北市土城區中央路四段50-3.50-5號1樓'],
['194745','奇佳','台南市新化區信義路373號1樓'],
['194804','鑫文山','台中市南屯區文山路20號和22號'],
['194815','東珈','新竹市香山區中華路五段156號'],
['194826','新繼光','台中市中區繼光街64號一樓'],
['194882','安美','台北市內湖區石潭里安康路32巷24弄22號1樓'],
['194907','頂豐','雲林縣斗六市榴南里斗工十路62號'],
['194929','金昇','台南市南區金華路二段341號'],
['194952','源山','嘉義縣中埔鄉同仁村同仁1-20號1樓'],
['194963','成商','台南市東區大學里勝利路118號1、2樓'],
['194974','松容','桃園市中壢區青溪路一段85號'],
['195014','上鈺','台南市南區大成路一段128號1樓'],
['195025','泰勝','宜蘭縣大同鄉泰雅路一段34號1樓'],
['195036','金秀和','花蓮縣花蓮市和平路597號1樓'],
['195047','祥綸','桃園市大園區高鐵北路三段45號'],
['195058','金澳底','新北市貢寮區仁和路218號1樓'],
['195092','上巴陵','桃園市復興區華陵里10鄰巴崚116號'],
['195117','花海','彰化縣花壇鄉長春村彰員路一段280號'],
['195140','聯發D','新竹市東區力行三路11號'],
['195184','漢展','台中市東區自由路四段436號'],
['195243','聖安','台南市安南區安中路六段850號1樓'],
['195254','逢吉','台中市西屯區西安街275號'],
['195265','頭城','宜蘭縣頭城鎮青雲路三段96號1樓'],
['195287','星都心','新竹縣竹東鎮光明路182號186號'],
['195298','天期','台南市安平區國平路198號1樓'],
['195302','大立','新北市三重區力行路一段184號186號1樓'],
['195357','龍星','南投縣草屯鎮復興里碧山路731之5號'],
['195368','豐年','台中市太平區環太東路345號'],
['195380','精材三','桃園市中壢區中園路188號B1樓'],
['195391','精材二','桃園市中壢區自強一路8號2樓'],
['195438','華碩二','台北市北投區立德路115號3樓'],
['195450','逢美','台中市西屯區烈美街98號'],
['195461','羅威','雲林縣崙背鄉羅厝村東興路168-1號.168-2號'],
['195542','雄鼎','高雄市仁武區仁雄路346號1樓348號1-2樓'],
['195564','新安和','新北市新店區安和路二段89號91號'],
['195586','欣興','桃園市中壢區新興路226號228號'],
['195597','金旺','彰化縣彰化市延平路536號'],
['195645','城庚','新北市土城區金城路二段6號B1'],
['195656','銅鑼','苗栗縣銅鑼鄉銅鑼村中正路177、179、181號'],
['195704','金聯發','台北市內湖區金龍路137號1樓'],
['195807','富比世','台北市信義區松仁路246號248號1樓'],
['195852','保長坑','新北市汐止區大同路三段261號263號1樓'],
['195874','管興','彰化縣福興鄉沿海路三段286號'],
['195885','北霆','新北市三峽區大同路244號1樓'],
['195896','安博','新北市新店區安民街154號154-1號1樓'],
['195900','珍饌','台北市士林區文林路126號1樓'],
['195933','三和','台中市烏日區三榮路一段558號'],
['195977','育軒','新北市板橋區漢生東路268號270號1樓'],
['195988','大世紀','台南市東區自由路三段108號1樓'],
['195999','建丞','台中市南區建成路1683號1樓'],
['196006','埔安','南投縣埔里鎮西安路一段409-1號'],
['196039','昆明','台北市萬華區昆明街76之1號1樓'],
['196143','禾順','彰化縣線西鄉沿海路一段849巷10號'],
['196165','海星','花蓮縣新城鄉嘉新路63巷1號'],
['196176','三麗','台南市新化區協興里正新路305號1樓'],
['196202','國華','嘉義市西區國華里國華街283號1樓.2樓'],
['196213','江宸','嘉義縣民雄鄉興中村江厝店1之32號1樓'],
['196235','兆福','彰化縣彰化市一德南路2號、彰南路三段400號'],
['196268','卓聯','台北市大安區羅斯福路四段1號1樓卓聯大樓'],
['196279','美的','基隆市信義區教孝街28號1樓'],
['196291','航站五','桃園市大園區航站南路9號5樓'],
['196316','和樂','台北市大安區和平東路三段228巷45號1樓'],
['196372','墩煌','南投縣草屯鎮芬草路三段36號'],
['196383','虎真','雲林縣虎尾鎮穎川里頂南398號'],
['196408','鄉親寮','南投縣中寮鄉永安街79之1號1樓'],
['196419','振福','台中市太平區振福路361巷6號1樓'],
['196420','新生','新北市中和區新生街243號245號1樓'],
['196431','威海','桃園市龍潭區中正路三坑段563號1樓'],
['196453','冠興','桃園市觀音區成功路二段1247號'],
['196464','港華','台北市內湖區港華街46號1樓'],
['196497','京磚','台北市大同區華陰街65號1樓'],
['196512','路飛','高雄市路竹區竹東里中山路465號'],
['196626','吉華','花蓮縣吉安鄉中華路二段172號'],
['196648','登揚','新北市五股區登林路96號'],
['196660','大吉','台北市中山區吉林路97號99號1樓'],
['196671','永義','宜蘭縣冬山鄉義成路三段195號1樓'],
['196707','港隆','基隆市仁愛區孝四路23號1樓'],
['196718','桃華','桃園市桃園區南華街106號108號1樓'],
['196729','西湖鄉','苗栗縣西湖鄉金獅村2鄰金獅26-2號'],
['196774','超贊','台中市南區高工路202號1樓'],
['196855','侯成','宜蘭縣蘇澳鎮福德路463號465號1樓'],
['196866','七六埔','彰化縣埔心鄉員埔路1192號'],
['196958','廣福','桃園市八德區廣福路30號1樓'],
['196969','超億','台中市西區公益路126號'],
['197021','北庄','台中市北屯區后庄北路221-1號'],
['197043','墘都','台北市內湖區內湖路一段669號'],
['197087','敏盛','桃園市桃園區經國路168號B1樓'],
['197124','華藏','台北市萬華區西藏路107號107之1號1樓'],
['197146','明和','台南市南區中華西路一段89號'],
['197157','大埔','台北市中正區和平西路二段152號152之1號154號154之1號'],
['197205','雙全','台北市北投區中庸里大業路715-717號'],
['197227','瓏山林','台北市內湖區康樂街125巷2號2之1號'],
['197250','慶昌','高雄市楠梓區後昌路722號1樓慶昌街2-1號1樓'],
['197294','北站','台南市仁德區中洲村中洲路1巷200號1樓'],
['197308','龍學','桃園市中壢區龍昌路178號1樓'],
['197375','港捷','台北市南港區經貿二路1號'],
['197386','麗寶','新北市林口區文化北路一段301號1樓'],
['197412','忠三','基隆市仁愛區忠三路52之1號54號1樓'],
['197434','安德','新北市新店區安德街8號10號12號1樓'],
['197456','港安','台中市西屯區西屯路三段179之9號'],
['197478','八勇','桃園市八德區忠勇街197號'],
['197526','科技城','新竹市東區工業東四路42號'],
['197560','統佳','台北市中山區松江路237號1樓'],
['197571','雲醫','雲林縣斗六市雲林路二段627號'],
['197618','華康','台南市永康區中華路10巷2號1樓、中華路8-7號1樓'],
['197685','薇美','台北市中山區敬業三路11號1樓'],
['197744','金信','台北市大安區金山南路二段18號1樓'],
['197917','工站','台中市南屯區五權西路三段350號'],
['197939','星展','高雄市三民區天祥一路88號'],
['198002','德民','高雄市楠梓區海專路400號'],
['198172','光尚','高雄市苓雅區光華一路226號'],
['198208','瑞慈','新北市瑞芳區三爪子坑路64之39號64之40號1樓'],
['198219','雙鈺','台南市永康區永華路399號1樓'],
['198242','高竹','桃園市蘆竹區大竹北路737號'],
['198286','興隆','台北市文山區興隆路二段205號207號1樓'],
['198297','文瑞','花蓮縣壽豐鄉中山路222號1樓'],
['198356','山莊','台中市霧峰區中正路650號1樓'],
['198389','嘉馥','台北市信義區信義路六段21號23號1樓'],
['198390','甲誠','高雄市鳳山區三誠路76.78.80號'],
['198437','塭內','台南市佳里區塭內里塭子內12-1號'],
['198585','金芝','新北市三芝區中興街一段2號6號1樓'],
['198600','崇學','台南市東區崇善路168號'],
['198633','新清水','台中市清水區五權路16號1樓、民有路1號1樓'],
['198666','城政','新北市土城區中正路69號1樓'],
['198699','聯發科','新竹市東區篤行一路1號'],
['198714','富源','桃園市觀音區中山東路二段1027號1029號1樓'],
['198725','巧聖','台中市大里區西榮里益民路二段137號'],
['198747','福耀','台南市東區崇明路377號、377-1號'],
['198770','新新樓','台南市東區東門里前鋒路16號1樓'],
['198781','松信','台北市信義區松信路148號1樓'],
['198792','欣國榮','桃園市桃園區經國路860號1樓'],
['198806','維新','高雄市永安區維新路121號'],
['198817','天真','台北市士林區中山北路七段141巷6之1號1樓'],
['198828','登冠','桃園市龜山區文化二路52巷53號一樓'],
['198862','華原','花蓮縣花蓮市中華路426號'],
['198873','淺水灣','新北市三芝區中柳村北勢子42之11號1樓'],
['198884','連城','新北市中和區連城路89巷3之1號5之1號1樓'],
['198910','新海','新北市板橋區文德里新海路138號'],
['198921','鼎鑫','台南市關廟區中山路二段27號1樓'],
['198954','重樂','新北市三重區三信路196號1樓'],
['198965','常德','高雄市楠梓區清豐里常德路287號'],
['199027','新市','台南市新市區華興街48號1樓'],
['199038','汐福','新北市汐止區福德一路243號'],
['199061','蘆讚','新北市蘆洲區中山二路184號'],
['199072','龍興','新北市樹林區三興里龍興街33號'],
['199083','丰太','台中市太平區永豐路351號1樓'],
['199120','和港','彰化縣和美鎮和港路552號1樓'],
['199131','東和','台南市東區東安路291號293號1樓'],
['199142','工專','雲林縣虎尾鎮中正路307號'],
['199164','心蓮','宜蘭縣宜蘭市泰山路212號'],
['199245','南海','台北市中正區南海路50號'],
['199267','敦化','台北市松山區民權東路三段160巷9號1樓'],
['199278','環竹','苗栗縣竹南鎮環市路一段16號'],
['199289','廣環','台中市西屯區環中路二段698號'],
['199290','文新','台北市文山區木新路三段276號'],
['199326','中芸','高雄市林園區中芸里鳳芸二路57號1樓及鳳芸路3號1樓'],
['199337','雲桐','雲林縣莿桐鄉莿桐村中山路70號72號1樓'],
['199348','安東','台南市安南區安和路一段308號1樓'],
['199359','頂社','桃園市蘆竹區山林路三段170-2號'],
['199360','上興','桃園市蘆竹區上興路251號253號1樓'],
['199371','新福興','花蓮縣吉安鄉福興村吉安路三段78號80號82號福興路236號'],
['199407','南澳','宜蘭縣蘇澳鎮南強里蘇花路二段328號'],
['199418','美雅仕','新北市林口區文化二路一段262號1樓'],
['199429','竹樺','新竹縣竹北市華興街298號1樓'],
['199430','桃農','桃園市桃園區萬壽路三段111號113號115號1樓'],
['199441','汀州','台北市中正區汀州路一段127號129號'],
['199452','新員民','彰化縣員林市三民街20號'],
['199474','江翠','新北市板橋區文化路二段417巷8號1樓10號1樓2樓'],
['199496','慶斌','新北市樹林區中洲街51巷1號'],
['199533','府城','台南市安平區永華路二段532號'],
['199555','佳旺','宜蘭縣宜蘭市舊城東路47號'],
['199566','麗騰','宜蘭縣三星鄉三星路一段586號'],
['199588','嘉好','高雄市梓官區嘉展路370號'],
['199599','民越','桃園市桃園區大有路141號143號'],
['199603','鑫旺','桃園市中壢區興安二街1號1樓興仁路二段116號1樓'],
['199614','樹龍','新北市樹林區中正路222號1樓'],
['199658','金都','台南市南區金華路一段235號1樓'],
['199669','鑫碁泰','台北市內湖區康寧路三段63號65號67號'],
['199670','景華','台北市文山區興東里景華街130號1樓'],
['199821','寶科','新北市新店區寶橋路235巷5號1樓'],
['199854','三角湧','新北市三峽區中正路二段200號'],
['199887','日晴','苗栗縣三義鄉雙湖村雙湖11-8號1樓'],
['199898','金囍','金門縣金湖鎮復興路115號.115-1號.115-2號.115-3號'],
['199935','桃城','嘉義市西區北興街456號'],
['200022','軟體','台中市大里區東湖里中山路131號'],
['200055','兆溢','彰化縣彰化市崙美路246號'],
['200077','民瑞','高雄市前鎮區中山三路106號108號110號1樓'],
['200103','醫林','桃園市龜山區長庚醫護新村80號B1樓'],
['200125','義山','新竹縣竹北市十興路318號.新瀧一街6號'],
['200169','東踕','苗栗縣頭份市上埔里12鄰沙埔40號'],
['200170','辭修','彰化縣彰化市辭修路508號'],
['200181','易安','宜蘭縣五結鄉五結中路二段377號379號1樓'],
['200217','驛光','桃園市中壢區新興路124號1樓2樓'],
['200240','瓊林','高雄市燕巢區安招路1059號1樓'],
['200251','康明','台北市內湖區康寧路三段189巷21弄26號1樓'],
['200262','興鑽','桃園市蘆竹區中興路188號'],
['200273','神圳','台中市神岡區厚生路66-1號'],
['200310','龍旺','苗栗縣頭份市自強路117號'],
['200332','永業','雲林縣西螺鎮振興里振興215號'],
['200343','興工','彰化縣埤頭鄉崙腳村4鄰彰水路二段946號'],
['200354','舊舍','彰化縣社頭鄉松竹村3鄰社石路937號'],
['200365','埔溪','桃園市大溪區埔頂路二段310號312號1樓'],
['200387','七綻','台中市北屯區文心路四段57號'],
['200398','大琬','雲林縣大埤鄉中正路19號'],
['200424','莘鑫','南投縣南投市中興路221號'],
['200457','民華','新北市中和區民德路270號272號'],
['200468','北圓','彰化縣北斗鎮中華路91.93號'],
['200479','庭好','台南市善化區陽光大道587.589號1樓'],
['200491','興長安','屏東縣屏東市光復路352號1樓'],
['200516','興安','台中市沙鹿區興安路25-1號1樓'],
['200527','合行','高雄市路竹區大同路168.170.170-1號'],
['200538','米鄉','台東縣池上鄉福原村中山路241號'],
['200642','季欣','新北市泰山區全興路109號'],
['200697','嘉新','新北市中和區員山路419號421號1樓'],
['200701','欣花園','台中市北屯區華美西街二段478號'],
['200804','鑫德惠','台北市中山區德惠街15號1樓'],
['200815','天東','台北市士林區中山北路七段14巷2-1號'],
['200837','德偉','新北市中和區中興街162號164號'],
['200859','樂華','新北市永和區永和路一段143之1號145號1至2樓'],
['200929','誠義','台北市士林區忠誠路一段126號128號'],
['200996','廣華','桃園市龜山區文化三路386號1樓'],
['201014','寶湖','台北市內湖區民權東路六段180巷6號1樓'],
['201025','興園','新北市三重區重陽路一段132號134號1樓'],
['201036','新羅興','宜蘭縣羅東鎮興東路23之2號1樓2樓'],
['201287','樂和','台北市大安區樂利路29號29-1號'],
['201302','台場','台北市松山區八德路三段20-2號'],
['201380','旗廟','高雄市旗津區永安里廟前路12號1樓'],
['201461','欣欣鼎','屏東縣屏東市崇蘭里自由路666號1樓'],
['201519','群弘益','高雄市岡山區碧紅里中山北路2號'],
['201542','彩虹市集','高雄市左營區菜公里高鐵路115號1樓'],
['201597','聖保祿','桃園市桃園區福安里建新街68號'],
['201841','日內瓦','台北市內湖區瑞光路76巷59號1樓'],
['201852','墩富','台中市南屯區大墩路572號'],
['201977','逢華','台中市西屯區文華路10-7號'],
['202017','康福','台北市大安區永康街12之2號1樓'],
['202040','大庄','南投縣名間鄉大庄村南田路142之12號'],
['202095','西文','澎湖縣馬公市西文里10-3號'],
['202110','仁信','台北市信義區松仁路130號'],
['202132','金富','高雄市楠梓區金和街170號'],
['202165','協和','高雄市鳳山區自由路229號2樓231號1樓2樓'],
['202176','塘園','桃園市中壢區領航北路二段208號公園路二段208號'],
['202202','家園','台南市仁德區長興路77之1號.83號'],
['202213','鳴人','彰化縣鹿港鎮鹿和路四段347號'],
['202246','豐喜','台東縣台東市豐年里連航路3號'],
['202279','有魚','屏東縣恆春鎮砂尾路16-65號'],
['202291','泰樂','台北市內湖區安泰街26號28號'],
['202305','愛仁','高雄市新興區五福二路43號1樓2樓45號1樓2樓'],
['202338','新樺','桃園市新屋區中華南路一段379號381號'],
['202349','富名','桃園市楊梅區中山北路二段449號1樓'],
['202383','台達五','桃園市中壢區東園路16號 2樓'],
['202408','豐梅','台中市石岡區豐勢路460號1樓'],
['202420','玉成','台北市南港區西新里南港路三段3號1樓'],
['202453','統家','台北市大安區忠孝東路四段216巷27弄1號1樓'],
['202497','鑫衡陽','台北市中正區衡陽路6號1樓'],
['206558','庚院','桃園市龜山區文化二路11之5號1樓'],
['206569','信義路','新北市蘆洲區信義路341號341之1號341之2號341之3號1樓'],
['206581','上慶','雲林縣斗六市漢口路190.192號'],
['206606','美豐','台中市后里區三豐路五段128號'],
['206617','山隴','連江縣南竿鄉介壽村232號233號284號'],
['206639','富砡','嘉義市西區劉厝路221-1號、223號1樓'],
['206640','華峰','新北市林口區文化三路一段617巷51號'],
['206709','博一','台中市北區英才路388號388之1號及博館一街37號'],
['206732','新嘉友','嘉義市西區福全里友愛路222.222-1號'],
['206743','新晨','桃園市大園區國際路一段187號'],
['206798','建日','台中市烏日區建國路419號'],
['206846','佳嘉','彰化縣北斗鎮七星里13鄰五權路臨176號'],
['206857','潭頂','台南市新市區潭頂里潭頂400號'],
['206868','龍橋','台南市永康區烏竹里7鄰龍橋街406號'],
['206891','后科','台中市后里區內東路306號'],
['206927','浤淶','台中市大雅區中清路四段408號'],
['206949','蓮和','花蓮縣秀林鄉和平村和平263號(台泥和平廠)'],
['206950','社子','桃園市新屋區中興路1532之1號1樓'],
['206983','揚金','桃園市平鎮區金陵路二段288號'],
['207056','敦仁','台北市大安區忠孝東路四段148號部份'],
['207067','海口','苗栗縣竹南鎮明勝路491-1號'],
['207078','學信','台南市學甲區明宜里信義路50號1樓'],
['207089','鹿心','台中市沙鹿區光華路171號1樓、鎮南路二段535號1樓'],
['207104','金鶯鎮','新北市鶯歌區尖山路217之3號1樓'],
['207126','聖德','新北市土城區明德路二段207號1樓'],
['207159','北忠','台中市沙鹿區北勢東路806號'],
['207263','橋富','台南市永康區大橋二街130、132號'],
['207285','頂福','新竹市香山區中山路622號626號'],
['207388','景大和','台中市北屯區景賢路191號'],
['207399','旺泰','新北市新莊區榮華路二段105號1樓.中信街151號1樓'],
['207403','延福','新北市土城區延平街36號1樓'],
['207436','新縣福','新竹縣竹北市縣政二路396、398號1樓'],
['207458','勇忠','高雄市仁武區仁勇路30號1樓'],
['207481','甲智','高雄市鳳山區甲智路103號'],
['207528','智尊','台中市梧棲區八德路1號'],
['207540','達基力','花蓮縣秀林鄉崇德村海濱3號3之1號1樓'],
['207562','麥中','雲林縣麥寮鄉麥豐村中山路437巷1號'],
['207584','通苑','苗栗縣通霄鎮中山路42號'],
['207610','復惠','台北市松山區復興北路335號1樓'],
['207654','高昌','高雄市楠梓區創新路615號'],
['207687','高第一','高雄市楠梓區創新路950號1樓'],
['207746','浩瀚','新北市八里區龍形二街2-11號'],
['207816','興鳳','彰化縣埤頭鄉斗苑東路731號'],
['207827','青峰','桃園市大園區中山南路二段603號'],
['207894','盛合','高雄市楠梓區藍田里藍田路72號1樓'],
['207908','東基','台東縣台東市開封街350號1樓'],
['207919','吉翠','新北市板橋區裕民街53號1.2樓和55號'],
['207920','公力','桃園市大園區中正東路一段708之1號'],
['207931','寶棧','南投縣竹山鎮保甲路10號'],
['207942','建志','高雄市三民區建工路462號一樓'],
['207975','源福','新北市新莊區福壽街29.31號'],
['208004','聯勝','屏東縣南州鄉壽元村大同路6號'],
['208037','環禹','台中市大雅區雅環路二段126號'],
['208060','門諾','花蓮縣花蓮市民權路115號117號'],
['208082','港富','基隆市中山區中華路93號'],
['208107','弘大','台中市沙鹿區晉武路9號'],
['208118','梅花','台南市楠西區楠西里中正路176號前面'],
['208185','寶軒','高雄市岡山區仁壽南路100號1樓'],
['208196','尚順','苗栗縣頭份市東民五街1號和3號'],
['208266','民裕','新北市新莊區裕民街102.104號'],
['208277','仙隆','屏東縣新園鄉仙吉路9-2號'],
['208288','大晉','台中市沙鹿區東晉路133號'],
['208303','高鳳儀','高雄市鳳山區頂庄路209號'],
['208314','恆好','屏東縣恆春鎮恆南路70-1號'],
['208325','東蘭','台中市東勢區東蘭路194號'],
['208336','克強','高雄市苓雅區自強三路156號'],
['208347','薪永樂','彰化縣彰化市民族路494.496號'],
['208392','龍陽','苗栗縣頭份市光華北路150號'],
['208417','路博','高雄市路竹區路科五路15號1樓'],
['208439','安農','宜蘭縣冬山鄉長春路128號'],
['208451','諺東','彰化縣和美鎮彰美路二段臨236號'],
['208473','義強','新北市三重區正義北路131.133號'],
['208543','安西','台南市安南區安中路一段136號'],
['208554','豆油','雲林縣西螺鎮振興里振興55-3號'],
['208565','僑勇','屏東縣枋寮鄉隆山村中山路92-2號1樓'],
['208657','埔暉','嘉義縣中埔鄉和美村中山路五段450號'],
['208679','勁賀','桃園市蘆竹區光明路二段139號'],
['208691','欣來義','屏東縣新埤鄉萬安路4-2號'],
['208705','南勢埔','新北市林口區忠福路169號'],
['208749','鳳雄','高雄市燕巢區鳳雄里鳳旗路26-1號'],
['208761','聯發E','新竹市東區篤行路5號'],
['208783','富都','高雄市三民區力行路83.85號'],
['208794','成竹','台北市內湖區成功路四段173號1樓'],
['208808','程豪','桃園市觀音區福祥街157號163號1樓'],
['208831','朝日','台南市善化區蓮潭里龍目井路433.435號1樓'],
['208864','沅丞','苗栗縣竹南鎮公義里友義路67號'],
['208886','湖東','雲林縣口湖鄉中正路一段136號'],
['208912','鳳鳴','新北市鶯歌區永和街115巷44.46號1樓'],
['208934','花博','彰化縣溪州鄉中央路三段263號.265號.267號'],
['208945','壯美','宜蘭縣壯圍鄉美功路一段40巷1號'],
['208990','龍平','高雄市鳳山區文平街210號'],
['209018','農科','屏東縣長治鄉德和村農科路23號1樓'],
['209074','華川','新北市板橋區四川路二段245巷11.13號1樓'],
['209085','華億','台南市仁德區文華路三段432.436號'],
['209096','泉富','台中市潭子區中山路一段57號1樓'],
['209100','京運','台北市松山區南京東路三段262號1樓'],
['209122','篤勝','基隆市七堵區大德路103號'],
['209133','蘇澳','宜蘭縣蘇澳鎮中山路一段66號'],
['209144','武嶺','高雄市苓雅區武嶺街66號一樓'],
['209225','月湖','台中市后里區公安路147-15號'],
['209258','銅高','苗栗縣銅鑼鄉新興路2-26號'],
['209269','重陽','台北市南港區重陽路179號181號1樓'],
['209281','果毅','台南市柳營區果毅里果毅後14-1號1樓'],
['209317','社苓','苗栗縣苑裡鎮社苓里12鄰131-4號'],
['209362','福同','新北市汐止區福德一路178號'],
['209373','大唐','台中市北屯區大連北街98號1樓'],
['209384','御新','南投縣草屯鎮中正路1397-6號'],
['209395','大嘉瑩','台南市仁德區二仁路一段124.126號'],
['209454','溫莎','嘉義縣民雄鄉神農路129之10號'],
['209476','海藍','澎湖縣馬公市西文澳118-3號'],
['209487','晉興','高雄市楠梓區惠心街80號1樓'],
['209502','金碧','台北市內湖區金龍路219號217巷1號1樓'],
['209535','高吉','台南市新市區新和里中正路193號'],
['209557','公館鄉','苗栗縣公館鄉玉泉村玉泉29-1號'],
['209579','大北勢','雲林縣斗六市長平路7-32號'],
['209591','藍鵲','台中市大雅區永和路112-26號'],
['209616','利吉','新北市土城區延吉街261號'],
['209627','海廷','新北市土城區裕民路92巷22弄2號1樓'],
['209638','光漢','高雄市小港區漢民路755.757號一樓.二樓'],
['209649','榮曜','新北市林口區文化三路二段156.158號'],
['209650','寬士村','嘉義縣水上鄉寬士村崎子頭29-35號'],
['209683','后宥','台中市后里區甲后路一段955號'],
['209719','京旺','台北市中山區南京東路一段92號1樓'],
['209764','文銧','台中市沙鹿區斗潭路230號1樓'],
['209786','興中街','台中市新社區興中街90-11號'],
['209801','元盛','屏東縣屏東市瑞光路二段456號1樓'],
['209812','富信','新北市新莊區自信街46.48號1樓'],
['209823','東睿','新竹縣竹東鎮北興路三段446號1樓'],
['209834','福倉','桃園市桃園區正光路425號1樓427號1樓'],
['209845','都歷','台東縣成功鎮都歷路179號'],
['209867','和平東','台北市大安區和平東路一段129之1號'],
['209878','軍榮','台中市北屯區軍榮一街90號1樓'],
['209904','森泰','台北市中山區林森北路358號360號'],
['209915','嘉愛','嘉義市西區仁愛路212號'],
['209948','東利','台南市歸仁區南保里文化街三段47號1樓'],
['209959','達武','台東縣達仁鄉安朔村復興路21號及21-1號'],
['209960','上義','宜蘭縣三星鄉上將路三段559號'],
['209982','湖貫','新竹縣湖口鄉新興路486號'],
['209993','懷治','新北市板橋區民治街52巷1號.3號'],
['210029','學府居','新竹縣新豐鄉學府街45號47號'],
['210030','哈魚','台中市南屯區環中路四段6號'],
['210041','萬利','屏東縣萬丹鄉新鐘村萬新路15鄰277號'],
['210085','芸珈','桃園市龜山區民生北路一段203號'],
['210096','栗子崙','嘉義縣東石鄉西崙村栗子崙191.193號'],
['210133','虎爺','雲林縣虎尾鎮學府路39號'],
['210144','長源','台南市北區長榮路四段181號'],
['210177','庫中','雲林縣土庫鎮復興路92號'],
['210199','江北','新北市汐止區長江街97號'],
['210203','故宮','嘉義縣太保市東勢里故宮大道779號1樓'],
['210236','觀芳','桃園市觀音區成功路二段903號1樓2樓'],
['210247','員宿','彰化縣員林市中山路一段756號'],
['210269','白沙墩','苗栗縣通霄鎮白東里2鄰9號'],
['210281','城利','新北市土城區中央路二段223-13.223-15號'],
['210306','鹿禾','新竹縣竹北市莊敬南路118號1樓'],
['210340','明安','台南市安南區工業二路166號'],
['210351','金門醫院','金門縣金湖鎮復興路2-1號1樓'],
['210395','東苑','台中市龍井區台灣大道五段3巷62弄81號'],
['210410','光化','高雄市鼓山區鼓山二路33號'],
['210454','長林','桃園市龜山區復興街5號地下層'],
['210476','天鈺','台南市永康區勝利里勝利街25、27號1樓'],
['210487','日和','新竹縣竹北市文興路二段150號.高鐵二路51號'],
['210498','吉翔','桃園市蘆竹區吉林路130號1樓'],
['210502','欣欣','桃園市龜山區萬壽路二段1280號1樓'],
['210524','武昌','高雄市苓雅區武昌路77號1樓79號1樓2樓'],
['210535','福二','基隆市七堵區福二街157號1樓'],
['210557','俊林','新北市樹林區三俊街216號'],
['210605','大湧','桃園市八德區東勇二路111號'],
['210616','宜家','新北市新莊區化成路9-2.9-3號'],
['210627','大里杙','台中市大里區大里路510號'],
['210672','龍汶','桃園市中壢區龍文街33巷2號6號1樓'],
['210694','松祐','台北市松山區饒河街90號1樓'],
['210719','柑竹','彰化縣和美鎮竹圍里彰新路四段臨245號'],
['210764','鑫華福','台北市中正區漢口街一段36號1樓'],
['210786','樂欣','桃園市蘆竹區長興路二段28號30號1樓'],
['210797','昌樂','新竹縣竹北市環科一路13號'],
['210801','印月','新竹縣竹北市科大一路140號1樓'],
['210823','齊德','台北市士林區天母西路85號1樓2樓'],
['210845','大權','桃園市桃園區大同路43號1樓B1樓'],
['210867','莊敬','桃園市中壢區永福路1042號莊敬路903號905號1樓'],
['210904','嘉營','台南市仁德區中正路一段73號'],
['210915','仁盛','新北市三重區仁興街39巷14之6.14之7.14之8號'],
['210926','蘇花','宜蘭縣南澳鄉南澳村蘇花路二段433號'],
['210937','富亦','台中市南屯區公益路二段939號1樓和龍富路四段552號1樓'],
['210959','龍順','高雄市鼓山區龍德路87號'],
['210971','中蔗','台中市大肚區中蔗路39號'],
['210993','福原','花蓮縣花蓮市中原路328號1樓'],
['211000','文恩','高雄市左營區福山里自由四路496號'],
['211033','承晨','桃園市中壢區民權路五段65號1樓'],
['211044','保元','新北市新莊區中正路72號'],
['211055','工園','桃園市中壢區西園路27號西園路25巷5號1樓'],
['211077','巨新','台北市文山區木新路二段212號及木新路二段218巷2號4號'],
['211088','縣府','宜蘭縣宜蘭市中山路一段366號368號370號'],
['211099','環鑫','新竹縣竹北市環北路五段61號1樓'],
['211114','觀月','高雄市田寮區月球路34-6號'],
['211125','三社','台中市神岡區三社路256號'],
['211136','霧台','屏東縣霧台鄉神山巷15號'],
['211147','百建','新北市新店區民族路239號241號1樓'],
['211169','園和','新北市永和區仁愛路267號269號'],
['211181','利穗','新北市中和區民利街38號1樓'],
['211206','左鎮','台南市左鎮區榮和里菜寮62-35號'],
['211217','央大','桃園市平鎮區民族路三段275號高雙路3號'],
['211228','新溪州','彰化縣溪州鄉中山路三段436號'],
['211239','立昌','台南市歸仁區中山路三段370號'],
['211262','樂林','新北市三重區永安北路二段15號'],
['211273','民雄','嘉義縣民雄鄉民權路42-20號1樓'],
['211284','佳成','台南市佳里區興化里佳里興570-51號1樓'],
['211309','和成','高雄市鳳山區鳳育路2號和成路519之1號'],
['211354','央和','新北市土城區中央路一段307.309號1樓'],
['211365','凱旋','台南市東區怡東路111號1樓'],
['211398','極緻','基隆市仁愛區仁二路211號1樓'],
['211413','丁煌','新北市板橋區文化路二段227號、229號1樓'],
['211446','肯娣','高雄市岡山區壽華路6號1樓'],
['211457','承莊','宜蘭縣宜蘭市中山路五段148號'],
['211527','吉泰來','台中市霧峰區中正路583號'],
['211572','新營','台南市新營區復興路642號'],
['211594','石錠','新北市石碇區碇坪路一段50之1號50之2號'],
['211619','麻太','嘉義縣太保市過溝里6鄰過溝52-14號'],
['211664','享順','高雄市鼓山區明華路335號337號'],
['211675','紫騰','彰化縣埔心鄉員鹿路三段338號'],
['211697','朴子','嘉義縣朴子市中興路139號'],
['211701','康利','高雄市小港區康莊路40號'],
['211723','龍莊','新北市新莊區中正路893巷38號'],
['211756','佳政','新北市樹林區中山路三段209-1號211號1樓'],
['211778','迦恩','高雄市鳳山區中山東路192巷86號'],
['211790','鈺米','苗栗縣苑裡鎮山柑里山柑12-2號'],
['211826','中醫大','台中市北屯區經貿路一段110號'],
['211859','水水','新竹市東區水源街69號1樓'],
['211860','愛心','台中市大里區愛心路43號'],
['211871','苗公','苗栗縣苗栗市青苗里至公路12號'],
['211882','智復','台中市東區復興路四段210號1.2樓.地下層'],
['211893','佳東','台南市佳里區進學路7號1樓'],
['211941','新震','桃園市觀音區新生路171號'],
['211952','漢生東','新北市板橋區漢生東路45號1樓'],
['211963','台企','台北市內湖區新明路122之7號'],
['211985','潘桃','苗栗縣頭份市成功里6鄰信東路280號'],
['211996','忠正','苗栗縣頭份市中正路41-1號'],
['212036','丞展','新北市瑞芳區瑞濱路32之8號1樓'],
['212058','桂誠','高雄市小港區桂園路70號'],
['212106','六甲頂','台南市永康區尚頂里中正南路325號1樓'],
['212140','紅瓦厝','台南市歸仁區大成路211號1樓'],
['212151','添功','新竹市北區中山路436號'],
['212162','桃源','高雄市桃源區桃源里北進巷43-1號'],
['212173','公崙','新北市新店區安民街13號安民街3巷6弄12號'],
['212209','文豐','台中市南屯區文心南五路ㄧ段319號'],
['212210','仁順','新竹縣湖口鄉仁和路130號132號134號'],
['212221','慈豐','桃園市桃園區慈文路975號'],
['212243','大心','新北市三重區大同北路148巷2-1號1.2樓和2-2號'],
['212254','土定里','台南市南區永成路三段319號1樓'],
['212276','布拉格','桃園市大園區拔子林一路137號拔子林三路6號'],
['212302','春安','台中市南屯區嶺東南路165號'],
['212335','京采','桃園市桃園區延平路289號1樓'],
['212346','德欽','台南市仁德區後壁里德南路3鄰92號'],
['212357','富佑','新北市五股區五工路112號1樓'],
['212380','千晴','苗栗縣三義鄉西湖村伯公坑178號'],
['212391','權營','花蓮縣花蓮市民權路25之1號25之2號25之3號1樓'],
['212405','學東','台南市安南區公學路六段679號1樓'],
['212416','ㄚ樺','彰化縣二林鎮中央南街48巷12號'],
['212461','銀河','新北市新店區北宜路二段269號271號'],
['212520','鴻運','新北市五股區水碓一路1號'],
['212531','東源','屏東縣東港鎮水源路118號'],
['212542','新昌隆','苗栗縣頭份市昌隆一街31.33號'],
['212575','永照','花蓮縣吉安鄉自強路160號1樓'],
['212586','鴻華','桃園市觀音區四維路162號1樓'],
['212597','青航','桃園市中壢區領航北路二段60號、民權路四段309號1樓'],
['213589','潤泰','台北市中山區八德路二段314號'],
['213660','福泉','新北市中和區福祥路68號70號'],
['213671','北回','嘉義縣水上鄉回歸村中山路三段167號'],
['213707','信遠','台北市信義區松仁路58號B2樓'],
['213796','康興','台南市永康區中華路196號1樓'],
['213822','左運','高雄市左營區高鐵路107號B1'],
['213844','萬華','台北市萬華區莒光路216號萬大路57號1樓'],
['213969','水龍吟','桃園市龍潭區中原路一段506號1樓'],
['214054','中樂','台北市中正區延平南路47號'],
['214179','瑞江','台北市內湖區瑞陽里江南街71巷16弄76號'],
['214180','承天','新北市土城區承天路1號'],
['214320','鑫日新','台北市萬華區武昌街二段122之1號'],
['214397','新峨嵋','台北市萬華區峨嵋街111之2號之3號'],
['214423','雙興','高雄市三民區正興路1號3號'],
['214456','先嗇宮','新北市三重區光復路一段25號27號1樓'],
['214526','基河','台北市中山區樂群二路206號1樓'],
['214593','源隆','高雄市大寮區永芳里進學路103號1樓'],
['214607','擎天崗','台北市北投區湖山路一段12號'],
['214618','影華','桃園市中壢區九和一街20號1樓'],
['214641','新天際','新北市蘆洲區三民路575號'],
['214652','三中','台中市西區忠明路54-1號1樓、博館路231號233號235號237號1樓'],
['214663','鑫廣','台中市南區福順里忠明南路787號'],
['214733','欣漢華','台北市中正區中華路一段41號1樓'],
['214755','潭濟','台中市潭子區豐興路一段88號B1樓'],
['214777','龍袖','桃園市桃園區龍安街143號1樓'],
['214788','明義','台中市西區明義街6號'],
['214799','新復勢','台北市松山區八德路三段200號202號1樓'],
['214803','新寶清','台北市松山區南京東路五段334號336號1樓'],
['214847','南站','台南市仁德區中洲村中洲路1巷220號1樓'],
['214858','通化','台北市大安區通化街26之8號'],
['214892','忠林','台北市信義區忠孝東路五段470號1樓'],
['214906','世貿','台北市信義區信義路五段5號1樓'],
['214928','勇伯','桃園市八德區東勇北路380號'],
['214939','烏日','台中市烏日區新興路247號'],
['214962','來來','桃園市中壢區中央東路62號1樓'],
['214984','開懷','台北市中正區開封街一段15號17號1樓17號2樓'],
['215002','羅湖','新竹縣湖口鄉成功路1092號'],
['215013','世貿二','台北市信義區信義路五段5號2樓'],
['215068','仁泰','新北市泰山區明志路二段1號'],
['215079','傑元','新北市新莊區中正路929巷11號13號'],
['215080','湯旺','新北市三重區重新路五段609巷2之3號1樓'],
['215105','蓮發','花蓮縣新城鄉北埔村7鄰北埔路172號'],
['215138','球場','高雄市鳥松區本館路196號1樓'],
['215172','新汐農','新北市汐止區樟樹一路113號115號'],
['215194','新唐','新竹市東區研新三路4號2樓'],
['215208','建康','新北市中和區建康路270號'],
['215220','一揚','高雄市路竹區國昌路1號'],
['215231','新大港','台南市北區大和里大港街140號1樓2樓'],
['215242','鳳美','新竹市東區中華路二段64號'],
['215253','鑫吉','台北市信義區虎林街85號'],
['215286','無尾熊','台中市南區德富路73號75號1樓'],
['215297','翔濱','基隆市中正區祥豐街339號1樓'],
['215301','鑫友達','台中市西屯區中科路1號'],
['215312','友達宿舍','台中市西屯區科雅路2號'],
['215323','加賀','台南市歸仁區大廟里大廟一街1號'],
['215378','苗勝','苗栗縣苗栗市勝利里中正路1045號.勝利路316號1樓'],
['215404','富裕','台南市東區後甲里裕農路657號1樓'],
['215471','新天強','台北市士林區克強路11及11-1號1樓'],
['215493','安豐','彰化縣彰化市南安里彰鹿路166號1樓'],
['215529','京埔','南投縣草屯鎮南埔里中正路254-10號'],
['215552','秀鴻','彰化縣秀水鄉埔崙村民生街960號'],
['215596','泰安','苗栗縣泰安鄉錦水村圓墩83-2號'],
['215611','實萬','新北市汐止區汐萬路二段248號1樓'],
['215622','蘆正','新北市蘆洲區中正路261號'],
['215666','真開','苗栗縣竹南鎮大厝里開元路412號1樓'],
['215758','朝福','台北市松山區三民路115號'],
['215769','歌亭','新北市鶯歌區尖山里尖山路150號'],
['215781','永泰','高雄市苓雅區苓雅二路243號'],
['215828','金廣福','新竹縣北埔鄉南興街135號1樓'],
['215873','國藝','桃園市桃園區南平路185號187號1樓'],
['215910','迎竹','新竹市東區大學路1001-2號'],
['215943','明美','台北市中山區敬業一路130號1樓'],
['215954','新元','桃園市中壢區新生路232號234號'],
['215965','東尚','苗栗縣頭份市東民路163號及和平路251號1樓'],
['215987','環東','台中市北屯區東山路一段306-1號1.2樓及環中東路二段268號1樓'],
['215998','新錦秀','新北市新店區錦秀路13號15號1樓'],
['216038','同慶','宜蘭縣宜蘭市中山路三段203號205號207號1樓'],
['216049','奕慶','台中市北區五權路387號及五常街13號15號'],
['216072','新忠誠','台北市士林區中山北路六段18號20號1樓'],
['216108','復維','台北市大安區復興南路二段17號'],
['216119','芝山','台北市士林區福華路126號1樓'],
['216131','屏基','屏東縣屏東市大連路60號'],
['216153','正華','新北市板橋區中正路274號276號'],
['216164','員成','彰化縣員林市中山路二段214.216號'],
['216197','禾雅','新竹市東區鐵道路一段66號'],
['216256','仕豐','高雄市橋頭區仕豐路61號1樓'],
['216289','富安','新北市新莊區萬安街18-1號12-1號'],
['216304','大庭','新北市板橋區國光里6鄰國光路65號1樓'],
['216315','錦合','台北市中山區合江街117號'],
['216326','陽翟','金門縣金沙鎮光前里陽翟新興街23.23-1號'],
['216337','北體','台北市松山區北寧路66號'],
['216348','龍盛','新北市新莊區西盛街204巷1號1樓206號1樓'],
['216360','觀成','桃園市觀音區成功路一段557號559號1樓'],
['216371','統和','新北市新店區安和里安民街335號337號'],
['216382','政新','台北市文山區新光路一段10號12號14號1樓及B1'],
['216407','埔民','桃園市桃園區民生路535號1樓'],
['216430','萬長','台北市萬華區東園街78號1樓'],
['216474','新崛江','高雄市新興區振成里新田路114號'],
['216511','美庄','高雄市大寮區後庄村成功路43號'],
['216555','輕井澤','桃園市桃園區大業路一段355號357號一樓'],
['216577','欣三豐','台中市豐原區源豐路89、93、95號1樓'],
['216692','鑫港','台北市士林區後港街210號'],
['216739','福和','新北市中和區秀明里大勇街25巷1號1樓'],
['216751','正成','高雄市前鎮區成功二路62號'],
['216762','瑞彬','台中市豐原區西安街68號'],
['216773','梧棲','台中市梧棲區台灣大道八段960號、962號1樓'],
['216784','竹北','新竹縣竹北市中正東路194號'],
['216809','海寮','台南市安定區海寮里海寮街8號'],
['216810','德沅','桃園市八德區介壽路二段455號'],
['216821','永華','新北市中和區南山路127巷18弄42號1樓'],
['216832','學高','高雄市楠梓區藍田路962.966號'],
['216843','橋鈺','台南市永康區東橋七路369號1樓'],
['216854','工權','台中市南屯區工業區十八路31-1號'],
['216865','杭信','台北市中正區信義路二段15號1樓'],
['216887','詠豐','台中市南屯區永春東路1230號'],
['216902','權大','台中市西區五權西路一段271號1樓2樓'],
['216913','樂群','台中市西區林森路80號及樂群街81號1樓'],
['216935','東湖','台北市內湖區五分街62號'],
['216957','鳳陽','高雄市鳳山區鳳林路97號1樓'],
['216968','潮欣','高雄市大寮區潮寮里華中南路275號'],
['216979','坪高','高雄市小港區高坪二十二路321號'],
['216980','鑫寶華','高雄市三民區九如一路126號128號130號'],
['216991','百齡','台北市北投區石牌路一段37號'],
['217008','泉北','台北市北投區溫泉路70號'],
['217019','成德','桃園市平鎮區承德路2號4號1樓'],
['217031','大園港','桃園市大園區大觀路1088號'],
['217042','三星','宜蘭縣三星鄉義德村三星路五段228號'],
['217064','樸隱','宜蘭縣三星鄉大隱村三星路二段25鄰13號'],
['217075','詠淇','宜蘭縣冬山鄉香和村冬山路一段725號'],
['217086','海音','高雄市苓雅區海邊路48.48-1.48-2號'],
['217101','環安','台南市安南區長和路二段12巷272號'],
['217112','九份','新北市瑞芳區基山街3號'],
['217123','蓮冠','花蓮縣花蓮市中山路426號'],
['217134','西門','台南市北區西門路四段132號'],
['217189','陜西','台中市北區陜西路48號48之1號1樓'],
['217190','盛發','新北市蘆洲區光復路10號'],
['217204','懷翠','新北市板橋區懷德街203號205號1樓'],
['217215','副都心','新北市新莊區中央路287號289號1樓'],
['217237','冠冠','新北市新店區北新路一段231號1樓新生街1號1樓'],
['217259','高峰','新北市土城區中央路二段187號'],
['217260','興觀','新北市板橋區大觀路二段37巷34號36號1樓'],
['217271','延吉','台北市大安區延吉街237號'],
['217282','鑫仰德','台北市士林區仰德大道三段68號70號'],
['217293','熊貓','台中市南屯區向上南路一段325號1樓'],
['217330','森華','台北市中山區林森北路587號1樓'],
['217374','彰基','彰化縣二林鎮大成路一段571號'],
['217396','西屯重慶','台中市西屯區西屯路二段95之25號、95之26號1樓'],
['217422','五權','台中市西區南屯路一段60號62號64號'],
['217466','龍東','桃園市中壢區龍東路138號140號1樓'],
['217477','見晴','台北市內湖區瑞光路196號'],
['227603','熱氣球','台東縣鹿野鄉龍田村光榮路443號1樓'],
['227625','東明','基隆市信義區東明路181號183號1樓'],
['227658','藍天樓','台北市中山區北安路387號1樓'],
['227669','欣兆陽','彰化縣彰化市向陽里崙平南路367號'],
['227681','花田','台南市歸仁區中正北路二段130號1樓'],
['227706','沿山道','苗栗縣公館鄉尖山村尖山244-9號'],
['227717','煒達','台南市北區育德路491號1.2樓'],
['227728','臺醫東','台北市中正區中山南路7號1樓'],
['227913','許中營','台南市安定區中榮里許中營78-10號'],
['227924','神全','台中市神岡區豐洲路1556號'],
['227946','晟家','雲林縣斗六市長安西路1之5號'],
['227957','國悅','桃園市桃園區天祥七街101號103號'],
['227968','原康','苗栗縣苑裡鎮大同路16號'],
['227979','巨龍','台中市龍井區中央路二段273號'],
['227980','飛翔','台中市清水區和睦路三段238號'],
['228008','澎科大','澎湖縣馬公市六合路300號'],
['228019','天合','花蓮縣瑞穗鄉溫泉路二段308號1樓'],
['228031','禾群','彰化縣鹿港鎮永康路71號'],
['228042','永誠','桃園市楊梅區永美路385-9號1樓2樓'],
['228075','文景','花蓮縣吉安鄉中山路二段73號75號1樓昌隆一街48號50號1樓'],
['228086','美利堅','桃園市楊梅區青山五街25號1樓'],
['228101','復興','高雄市前鎮區復興三路146號'],
['228112','墩璞','新北市板橋區中正路106號1樓'],
['228123','金廣興','彰化縣社頭鄉中山路一段766號'],
['228134','榮春','台中市豐原區圓環西路92號'],
['228145','永鎮','宜蘭縣壯圍鄉壯濱路四段373號373之1號1樓'],
['228167','國賓','台北市中山區中山北路二段71號1樓'],
['228178','沅均','新竹縣湖口鄉光復東路120之1號'],
['228189','營銓','高雄市左營區重和路226號'],
['228204','后成','台中市后里區成功路231巷2號'],
['228226','寶興','新北市新店區寶橋路88號1樓'],
['228248','平昌','桃園市桃園區中平路167號1+2樓'],
['228307','羅浮','桃園市復興區羅浮119之1號'],
['228318','上青','桃園市蘆竹區中山路12之2號1樓'],
['228341','茂華','台中市大甲區蔣公路170號1樓'],
['228352','永康綠海','台南市永康區東橋里東橋5路218號'],
['228363','豐市','台中市西屯區市政路396號'],
['228374','滿分','高雄市三民區本安里黃興路339號'],
['228385','太元','新北市樹林區太元街31號33號1樓'],
['228396','廣運','台北市萬華區廣州街170號1樓2樓部份'],
['228400','儒虎','雲林縣虎尾鎮新吉里新吉30之5號'],
['228433','東新','新竹市東區東新路86號'],
['228477','永錦','台北市中山區錦西街1號'],
['228488','福人','台中市東區復興路五段142號1樓'],
['228503','冠亨','新竹市北區南寮里東大路四段123號'],
['228536','超全','高雄市鳳山區海洋一路31號1樓'],
['228547','振聲','桃園市桃園區復興路389號1樓'],
['228569','金汲','桃園市桃園區力行路385巷11號13號1樓'],
['228570','萇盛','屏東縣鹽埔鄉維新路60-1號'],
['228592','永倫','台北市士林區社中街381號1樓'],
['228606','那瑪夏','高雄市那瑪夏區達卡努瓦里秀嶺巷205-1號'],
['228617','傑森','高雄市苓雅區林森二路19號1樓'],
['228628','觀岷','桃園市觀音區民生路65號1樓'],
['228640','丞芯','台南市南區萬年七街380號'],
['228695','芳美','南投縣南投市中興路413號'],
['228754','靜大','台中市沙鹿區晉文路45.47號1樓'],
['228765','正莊','屏東縣屏東市中正路766號'],
['228776','陽明','台北市北投區立農街二段155號1樓'],
['228798','豐嶟','台中市豐原區豐科路53號'],
['228802','英專','新北市淡水區英專路91號'],
['228813','阿罩霧','台中市霧峰區中正路815號'],
['228846','祥興','台中市大里區祥興路551號'],
['228880','莘苑','台北市文山區新光路一段97號99號'],
['228938','禾笙','新竹縣竹北市中山路45.47.49號'],
['228950','奕樂','台中市西區民生北路100號1樓及民權路217巷17號1樓'],
['228961','豪順','新竹市香山區香山里瑞光街23號'],
['228983','林旺','新北市林口區仁愛路二段196號1樓'],
['228994','鑫光復','澎湖縣馬公市光復路116號'],
['229012','興祥','台中市烏日區興祥街189號'],
['229034','連強','台中市梧棲區自強一街76號'],
['229045','豐洲路','台中市神岡區豐洲路656號'],
['229078','金墩','彰化縣花壇鄉花壇村23鄰花南路臨558號1樓'],
['229089','雅合','台中市北屯區松義街132、136號1樓及夾層'],
['229090','樹義','台中市南區福田三街156號1樓'],
['229115','霧工','台中市霧峰區霧工一路58.60號'],
['229126','園臻','台中市烏日區三榮路一段111號'],
['229148','凌華科','桃園市龜山區華亞一路68號1樓'],
['229160','興全','台南市新市區民權路80號'],
['229171','民治','高雄市小港區飛機路523號'],
['229193','望景','台中市西屯區科園三路1號1樓之1'],
['229207','隆陞','桃園市龜山區頂湖路25號27號1樓'],
['229263','其美','高雄市小港區其美街81號1樓83號1樓83號2樓'],
['229274','萬連','台北市大同區萬全街40巷4號6號1樓'],
['229285','永臻','台南市永康區中山東路59號'],
['229300','連興','高雄市三民區大連街336號1樓'],
['229311','鼎泰','高雄市三民區鼎泰街111號'],
['229322','能仁','新北市新店區光明街38號'],
['229333','雙琉','屏東縣獅子鄉草埔六巷23-1號'],
['229344','上將','宜蘭縣三星鄉上將路一段381號'],
['229355','永明','台北市中山區明水路397巷7弄41號1樓'],
['229377','夏督','台中市西屯區寧夏路170號'],
['229447','青青','台南市北區和緯路五段278號1樓'],
['229458','果菜','台南市安南區怡安路二段150、152、156號'],
['229469','錚多','嘉義縣民雄鄉鎮北村建國路一段1020-2853號'],
['229481','泰順','新北市三重區仁義街180.182號'],
['229492','雙福','新北市三重區雙園街57巷2.4號'],
['229539','育見','台中市太平區育賢路321.323號'],
['229551','超級郡','桃園市中壢區松信路36號38號'],
['229562','鑫巨蛋','高雄市左營區至真路305號1樓2樓'],
['229573','新茄投','台中市龍井區茄投路66-2號'],
['229595','三釗','雲林縣虎尾鎮中興里中興163之1號'],
['229610','滬江','台北市文山區羅斯福路六段270號'],
['229632','金芳','新北市新店區永安街72號74巷2號1樓'],
['229654','日進','台中市西區梅川西路二段33號1樓'],
['229665','欣廟東','台中市豐原區中正路131.133號'],
['229687','豐業','台中市龍井區中社路312號'],
['229713','愛佳','台南市佳里區仁愛路269號1樓'],
['229735','安科','台南市安定區嘉同里六塊寮10-13.10-15號'],
['229757','新永愛','新北市永和區永平路314號316號1樓'],
['229779','北屯幸福讚','台中市北屯區崇德十六路218號'],
['229791','秀宸','嘉義縣民雄鄉秀林村1鄰東義6之12號1樓'],
['229827','新苗治','苗栗縣苗栗市北苗里自治路68號'],
['229849','東山','台南市東山區東中里中興南路32號'],
['229850','鑫建德','台中市東區建德街174.176.178.180號'],
['229872','大排','台中市梧棲區中華路一段982號'],
['229883','嘉朴','嘉義縣朴子市大鄉里大慷榔253-23號'],
['229894','立京','桃園市中壢區五族二街66號68號1樓'],
['229908','鎮翊','桃園市平鎮區中豐路南勢一段173號1樓 南東路1-1號1樓'],
['229919','總圖','高雄市前鎮區中華五路1421號'],
['229953','利興','苗栗縣頭份市成功里中興路769號'],
['229964','俊盛','新北市樹林區俊興街156號'],
['229975','義明','高雄市三民區義華路169號'],
['230001','逢辰','台中市西屯區西屯路二段260-18號1樓'],
['230034','開漢','台東縣台東市開封街760號1樓'],
['230078','成功嶺','台中市烏日區榮和路230號'],
['230089','大幅','屏東縣竹田鄉連成路26號'],
['230090','木鳴','台北市文山區木柵路三段115號117號1樓'],
['230126','華順','新北市中和區華安街16巷1號'],
['230160','安溪','新北市三峽區大同路188、190號'],
['230171','隆山','屏東縣枋寮鄉中正大路412號1樓'],
['230193','松賀','台中市北屯區松茂里松山街148號1樓和地下層'],
['230207','銳陽','台北市內湖區文德路22巷44弄6號8號1樓'],
['230218','桃誠','桃園市八德區公園路160號'],
['230229','新民','台南市新營區民生里三民路152-13號1樓'],
['230230','鑫大庄','新竹市香山區香山里大庄路75、77號1樓'],
['230241','勁援','高雄市楠梓區中興里大學西路62號大學二街102號'],
['230263','易京','台南市安南區頂安里北安路三段400-1號'],
['230274','普賢','彰化縣永靖鄉中山路三段238號'],
['230285','亞昕','新北市林口區仁愛二路58號及民富街77號'],
['230300','高發','台南市歸仁區高發二路371.373號'],
['230322','慈安','桃園市桃園區永安路511號513號1樓'],
['230333','站前','台中市烏日區站區二路181號、183號'],
['230355','松德','台北市松山區八德路四段755號1樓'],
['230366','東盛','台東縣台東市更生路391號1樓'],
['230399','山富','新北市三峽區中山路9號1.2樓'],
['230414','延平','苗栗縣竹南鎮照南里15鄰延平路63巷1號'],
['230425','樂平','台中市太平區東平路773號1樓'],
['230447','世翊','南投縣埔里鎮和平東路223號'],
['230458','明倫','台南市中西區金華路三段88號1.2樓'],
['230492','亞旺','台中市大雅區中清東路240號'],
['230506','華利','新北市板橋區華江一路209、211號'],
['230517','靖欣','桃園市八德區中興街42號興仁路46號48號'],
['230539','新通豪','台中市北區漢口路三段101號'],
['230562','鑫東冠','新北市汐止區康寧街459巷3號1樓2樓5號1樓'],
['230584','新豐','高雄市小港區學府路50號'],
['230595','立和','台中市東區立德街47、49、51、53號'],
['230609','和碩','台北市北投區立德路15號1樓'],
['230632','瑞盈','高雄市前鎮區瑞北路95號1樓'],
['230643','永美','新北市中和區中山路二段2巷45弄6號8號1樓'],
['230665','興文','台南市仁德區中正路二段508號1樓'],
['230698','水道','台南市山上區山上里249、249-1、249-2號'],
['230702','興庄','高雄市大寮區民族路429號1樓'],
['230757','中華賓士','台北市北投區立功街9號1樓'],
['230768','尖石','新竹縣尖石鄉麥樹仁179-9號'],
['230779','成科','台中市西屯區成都路221、223號'],
['230791','茂林','高雄市茂林區茂林巷12-6號'],
['230805','大葆','台南市永康區?行里正南五街311號'],
['230816','榮陽','台北市北投區西安街一段345號1樓'],
['230838','龍樂','苗栗縣後龍鎮大庄里中山路426號'],
['230850','花樂','台中市石岡區豐勢路1111號1樓'],
['230861','金巧','新北市淡水區北新路184巷238號240號及242號1樓'],
['230872','松坪','高雄市小港區高松路12-26號'],
['230894','埔山','新竹縣新埔鎮文山路犁頭山段936號'],
['230920','高青','桃園市大園區大成路一段2號1樓'],
['230931','敦富','台中市北屯區敦富路371號1樓'],
['230942','鴨姆寮','台中市梧棲區永興路一段588巷28號1樓'],
['230953','萬榮','花蓮縣萬榮鄉萬榮162之1號162之2號'],
['230964','摩天灣','新北市淡水區中山北路一段257號1樓'],
['231004','泰福','新北市三重區安和路36、38號'],
['231037','立功','台中市太平區育才路446.448.450號'],
['231048','麻生','台南市麻豆區新生南路165號1樓'],
['231071','森豪','桃園市八德區東勇北路295之1號'],
['231093','興功','台南市仁德區民安路一段423、425號1樓'],
['231107','永春','台中市南屯區永春東七路629號'],
['231118','睿奇','彰化縣員林市和平街18號1樓'],
['231130','旗開','新北市蘆洲區中央路181號1樓及復興路16號1樓'],
['231141','莊年','新北市新莊區豐年街55號之8、55之9號'],
['231152','福賜','高雄市鼓山區美明路88號'],
['231163','鑫麟','台北市信義區和平東路三段391巷22號24號1樓及地下室一樓'],
['231174','京成','台中市南區學府路145號、台中市南區學府路147巷1、3、5、7號'],
['231185','卓溪','花蓮縣卓溪鄉卓溪村中正57-6號'],
['231196','久旺','高雄市大樹區九曲里新鎮路1號1樓'],
['231200','武陵','新竹市北區武陵路63號1樓'],
['231211','甲尚','台中市大甲區武陵里興安路263號1樓'],
['231222','蘇濱','宜蘭縣蘇澳鎮蘇濱路三段61號63號65號'],
['231244','喬富','彰化縣花壇鄉白沙村彰員路三段389號1樓'],
['231277','社鑫','台北市士林區社子街42號44號1樓'],
['231288','鑫豐洲','桃園市八德區豐德路577號建德路20號'],
['231303','全泰','新北市新莊區建中街139.141號1樓'],
['231314','昱品','彰化縣埔鹽鄉員鹿路一段118號'],
['231325','揚心','新北市淡水區義山路二段299號'],
['231347','樂仁','高雄市苓雅區憲政路96號'],
['231369','盈全','台中市太平區新光里新福路218號'],
['231370','潭旺','台中市潭子區人和路39號'],
['231381','華城','新北市新莊區中正路829巷20號1樓、22弄2號(1+2樓)'],
['231417','鹿洋','彰化縣鹿港鎮鹿草路三段398號'],
['231439','貴志','新北市泰山區貴子路13.13-1號1樓'],
['231440','文雅','台中市梧棲區文匯街66號'],
['231451','渡船頭','新北市淡水區中正路號55號及55-1號'],
['231473','鳳杉','新竹縣竹北市長青路二段251-1號臨'],
['231484','友情','高雄市岡山區大遼路128之1號1樓'],
['231509','樹溪','新北市板橋區溪北路43.45號1樓'],
['231510','后探','台中市北屯區崇德十路二段361號'],
['231532','中科院','桃園市龍潭區佳安里中正路佳安段481號2樓'],
['231554','南三井','台南市歸仁區歸仁大道101號1樓'],
['231565','三條村','彰化縣溪州鄉中央路二段95號'],
['231598','未央','新北市林口區文化三路二段283.283-1號'],
['231613','小東里','雲林縣斗南鎮小東里大同路573號'],
['231624','郡寶','台中市潭子區大富路一段7號1、2樓'],
['231646','嘉佃','彰化縣和美鎮彰和路三段202號'],
['231657','保成','高雄市鳳山區南成里和成路350號'],
['231668','湧順','台中市北屯區樹孝路666號'],
['231679','鑫台一','南投縣埔里鎮中山路一段176號'],
['231680','茶鄉','南投縣名間鄉彰南路335之8號'],
['231727','耘晨','台中市東勢區東關路六段432號'],
['231738','五源','宜蘭縣五結鄉五結路二段332號1樓'],
['231750','成鳳','高雄市鳳山區南成里南華一路302號'],
['231772','凰舞','桃園市楊梅區萬大路116巷59號'],
['231783','廣慈','台北市信義區大道路115號117號1樓'],
['231864','環武','台北市內湖區環山路一段8號1樓'],
['231875','南山','宜蘭縣大同鄉南山村泰雅路七段220號'],
['231886','新鑫','彰化縣二林鎮二溪路三段295號'],
['231923','順澤','彰化縣埔鹽鄉彰水路一段301號305號1樓'],
['231934','漢口','台中市西屯區漢口路一段22.24號1樓'],
['231967','樟弘','新北市汐止區樟樹二路279號281號1樓'],
['231978','龍勇','桃園市龍潭區中正路三林段388號'],
['231989','觀山海','基隆市中正區砂子里觀海街49號51號1樓'],
['232052','盛馨','台南市東區府連路351號1樓.353號1樓'],
['232074','路邦','高雄市路竹區路科五路35號1樓'],
['232100','初來','台東縣海端鄉海端村初來11之1號'],
['232111','玉仁','花蓮縣玉里鎮光復路5號7號9號1樓'],
['232122','銘德','苗栗縣頭屋鄉明德村明德路72-1號1.2樓'],
['232133','延平鄉','台東縣延平鄉桃源村10鄰昇平路167之2號'],
['232144','太子城','高雄市楠梓區楠梓路263號265號267號'],
['232188','翁園','高雄市大寮區翁園里翁園路155之1號'],
['232203','北林','桃園市大園區大成路二段127號129號1樓2樓'],
['232214','蓮正','花蓮縣花蓮市中正路156號1樓'],
['232247','瑞井','台中市大肚區遊園路一段90-1號'],
['232258','富江','新北市板橋區長江路一段110.112號1樓'],
['232269','新寧南','台北市萬華區西寧南路78號1樓'],
['232317','合禾','桃園市桃園區溫州一路302號306號1樓2樓'],
['232328','嶺春','台中市南屯區永春北路53號1樓'],
['232339','青盛','高雄市前金區大同一路268號'],
['232421','頭獎','苗栗縣頭屋鄉頭屋村尖豐路49號'],
['232432','芳欣','南投縣草屯鎮芬草路二段311號'],
['232454','敦南','台北市大安區大安路一段83巷14號1樓'],
['232465','鼎和','高雄市三民區鼎泰街222號'],
['232476','湖日','台中市烏日區公園路269號'],
['232487','海晴','新北市淡水區濱海路二段202巷69.71號1樓'],
['232591','身修','高雄市苓雅區身修路1號建民路100號'],
['232605','金剛','台東縣長濱鄉長濱村長光58之1號'],
['232616','臻臻','彰化縣二林鎮斗苑路五段432號'],
['232638','權輝','台中市西區五權路1之218號'],
['232649','望安','澎湖縣望安鄉東安村89號'],
['232661','台東東奇','台東縣台東市豐谷里漢陽北路209號1樓'],
['232672','竹樂','新竹縣湖口鄉仁樂路97號1樓'],
['232694','鳳邑','高雄市鳳山區維新路97號光明路111號'],
['232708','綠川','台中市中區成功路35.37號、綠川東街84號'],
['232719','福順','台北市士林區重慶北路四段177號1樓'],
['232720','智匯城','桃園市中壢區松信路190號192號'],
['232742','華僑','屏東縣東港鎮朝隆路16-1號18號'],
['232753','新後勁','高雄市楠梓區後昌路139-1號'],
['232764','金雅','新竹市北區金雅路165號'],
['232775','祥順','台中市北屯區祥順路二段93.95號'],
['232786','福基','新北市新莊區五工路68巷5.7號1樓'],
['232801','臻暉','嘉義市東區民族路101號'],
['232834','明嘉','新竹縣新豐鄉重興村新庄路203號1樓'],
['232915','順和','台中市西屯區工業區三十八路135號'],
['232960','統領','台北市大安區忠孝東路四段223巷9號1樓'],
['232971','鑫泰','台北市大安區泰順街60巷9號11號'],
['232982','社正','台北市士林區社正路75號社中街84號1樓'],
['233000','芳工','彰化縣芳苑鄉斗苑路三合段410號'],
['233011','Fresh亞萬','台南市安平區永華路二段812號1樓'],
['233055','宇順','台中市西屯區福安路51號'],
['233066','麻源','新竹縣竹北市中正西路999.1001號1樓'],
['233136','華夏','新北市中和區工專路110號112號1樓112號2樓'],
['233147','樹躍','新北市樹林區中正路438號.440號'],
['233158','丞丞','桃園市龜山區文青路331號333號1樓文青一路1號1樓'],
['233181','旺矽','新竹縣竹北市泰和路155號5樓'],
['233192','忠順','台北市文山區忠順街一段26巷22號24號'],
['233217','鑫浦深','新北市深坑區文化街116號118號1樓'],
['233228','謙和','宜蘭縣宜蘭市民族路461號463號1樓'],
['233239','石安','高雄市阿蓮區民生路1250巷2號'],
['233251','堯山','高雄市三民區堯山街25號1樓27號1樓2樓'],
['233273','峰政','台中市清水區鰲峰路360號1樓'],
['233295','鑫源','花蓮縣吉安鄉中山路三段232號236號1樓'],
['233309','鴻川谷','新竹市東區埔頂二路101號'],
['233310','東山站','台南市東山區科里里枋子林74-6號'],
['233343','大嘉葆','台南市歸仁區中正南路二段49號1樓'],
['233354','佳耘','南投縣埔里鎮西安路二段132號'],
['233376','聚豐','新竹縣新豐鄉松柏村明新六街36號'],
['233402','興中','南投縣南投市光明一路561號'],
['233424','青美','南投縣竹山鎮大明路540號'],
['233435','東峰','台中市大里區大峰路429號'],
['233446','安南鎮園','台南市安南區長和路四段396號'],
['233457','明鳳','高雄市前鎮區明鳳三路145號'],
['233468','新德','雲林縣北港鎮新德路78號'],
['233480','文林北','台北市北投區文林北路260號1樓'],
['233491','牡丹花','彰化縣線西鄉慶福路53號'],
['233505','馬卡龍','高雄市鼓山區馬卡道路353號'],
['233550','加圻','台南市安平區育平路100號.102號.府平路392號'],
['233583','澎樂','澎湖縣馬公市珠江110-22號1樓、110-30號1、2樓'],
['233594','欣順','新北市五股區成泰路一段239-9號1.2樓'],
['233608','科金','苗栗縣竹南鎮科專六路275號'],
['233619','富發','彰化縣溪湖鎮大公路166號'],
['233631','上利','新北市新莊區中德路27號.29號1樓'],
['233697','金昭','高雄市林園區林內路119號'],
['233701','龍埔','新北市三峽區民生街1巷1-17號1樓、1-18號1樓、1-19號1樓2樓'],
['233723','平麗','台中市沙鹿區南斗路29-1號'],
['233734','小滿','台中市西屯區中工三路220之20號'],
['233745','德權','新北市林口區民權路161號1樓'],
['233756','環金','台北市內湖區環山路二段123號125號1樓'],
['233789','興華','新北市三重區中華路2巷2號4號1樓'],
['233790','德倉','高雄市前鎮區德昌路209號213號'],
['233804','園豐','台中市太平區祥順路一段46號'],
['233826','湖口中正','新竹縣湖口鄉中正村19鄰中正路二段38號'],
['233837','富森','新竹市東區林森路32號1樓(C9櫃位)'],
['233848','竹圍仔','苗栗縣竹南鎮復興路380號'],
['233860','神尚','台中市神岡區大圳路41-105號'],
['233871','均文化','高雄市鳳山區文華里文化路73號'],
['233882','金山里','新竹市東區金山街207號1樓'],
['233893','花蓮理想','花蓮縣壽豐鄉共和村豐坪路三段265號'],
['233907','溪園','新北市新店區溪園路391之1號1樓'],
['233929','中景','新北市中和區景新街383巷66號68號1樓'],
['233930','光遠','高雄市鳳山區新興里光遠路292號一樓、二樓294號一樓296號一樓'],
['233941','鶯國','新北市鶯歌區建國路126號1樓'],
['233974','新龍安','桃園市桃園區龍安街136號1樓'],
['233996','應昇','高雄市三民區應昇路42號'],
['234003','君勻','新北市汐止區忠孝東路495號1樓'],
['234036','楓和','台中市南屯區楓樹里楓和路700-1號及楓樹西街292號1樓'],
['234047','清春','台中市梧棲區長春路10號'],
['234058','聯悅','台中市清水區民族路三段131.131-1號'],
['234070','豐學','花蓮縣壽豐鄉吳全131號一樓之三及一樓之五'],
['234081','吉佳','新北市板橋區漢生西路89巷5弄5.7號'],
['234092','星旺','雲林縣水林鄉土厝村王厝寮3-6號'],
['234106','保運','台中市南區復興北路783號'],
['234128','合億','台北市大安區和平東路三段1巷51號1樓'],
['234140','順安','桃園市中壢區正義里廣州路75之1及75之2號'],
['234151','力一','桃園市桃園區力行路515號1樓'],
['234173','嶺東','台中市南屯區嶺東路1號'],
['234184','嶺東二','台中市南屯區中台路7號'],
['234195','竹勝','新北市永和區竹林路39巷21之1號1樓'],
['234209','星都匯','新竹縣竹東鎮光明路258號1樓旭光二路1號1樓'],
['234232','宏圖','新北市永和區保平路10號12號1樓'],
['234243','芳洲','新北市五股區新城八路9號'],
['234254','晟樂','雲林縣斗南鎮延平路一段261號'],
['234265','勇維','台中市清水區大勇路36號'],
['234287','美都','高雄市三民區美都路98號'],
['234298','好時光','台中市西屯區光明路55-26號、55-27號1樓'],
['234313','梧棲大居','台中市梧棲區中興路360號'],
['234324','維芯','宜蘭縣羅東鎮維揚路131號1樓'],
['234335','牡丹','屏東縣牡丹鄉石門路5號5-2號'],
['234346','三本','桃園市八德區和平路276巷59號1樓'],
['234368','新竹金竹','新竹市北區金竹路121號1樓及地下層'],
['234379','蘆民','新北市蘆洲區民族路387.389號1樓'],
['234380','東延','新竹市北區延平路三段590號1樓'],
['234391','天藍','台中市烏日區溪南路一段126巷255號及257號'],
['234405','鶯寶','桃園市桃園區桃鶯路236號236之1號'],
['234416','幸福五','桃園市龜山區幸福五街17號19號1樓'],
['234450','森森','新北市中和區建八路174號1樓'],
['234461','羅正','宜蘭縣羅東鎮中正南路131號1樓2樓部份'],
['234483','紫雲','台北市內湖區康寧路一段263號265號1樓'],
['234494','富貴','新北市新店區富貴街9巷2號、6號1樓2樓'],
['234519','GRC','新竹市東區科園里工業東三路1號1樓'],
['234553','興興','台中市南區東興路一段77號'],
['234564','萬年','屏東縣屏東市建國路79號1樓'],
['234575','原新','台北市中山區中原街82號1樓84號1樓'],
['234597','金世桔','苗栗縣苑裡鎮客庄里世界路二段148號'],
['234612','梧棲宅','台中市梧棲區文化路一段88-1號1樓'],
['234623','振陽','彰化縣彰化市中正路二段403號1樓'],
['234656','園宸','嘉義縣大林鎮民權路192號'],
['234667','汐水','新北市汐止區水源路一段272號274號一樓'],
['234690','松探','台中市北屯區松竹五路一段325號'],
['234704','崧雅','台中市大安區大安港路589號'],
['234715','南茂','台南市新市區南科七路5號3樓'],
['234726','民盛','新北市新莊區民安東路132號1樓'],
['234748','新竹金農','新竹市北區金農路2號'],
['234760','宗美','新北市永和區福和路76巷2號4號1樓'],
['234807','巨富','台中市北屯區敦富路807號1樓'],
['234829','龍坡','宜蘭縣宜蘭市大坡路一段111號113號'],
['234830','樂寶','台中市東區進德路600號'],
['234841','和宜','高雄市甲仙區新興路16-5號1樓'],
['234852','愛霖','新北市林口區仁愛路一段252號、中正路57巷12弄36號地下層'],
['234863','虎尾永聖','雲林縣虎尾鎮廉使里永興南七路79號'],
['234874','旅順路','台中市北屯區旅順路二段357、359號1樓'],
['234896','鵬儀','台中市太平區鵬儀路137.137-1.139.139-1號'],
['234900','營新','台南市新營區復興路1039號'],
['234922','楓橘','新北市土城區?廷街3、5號1樓'],
['234933','湖功','新竹縣湖口鄉成功路423號1樓'],
['234944','北泱','新竹縣竹北市中央路200號1樓'],
['234966','吉神','彰化縣員林市員林大道三段209號211號'],
['234977','新和碩','台北市北投區立德路150之3號B1F'],
['234999','佑鑫','新北市中和區立德街180號1樓'],
['235006','禾立','台中市神岡區神岡路53號1樓'],
['235017','櫻沐','台中市西屯區大河一巷三弄1號、3號1樓'],
['235040','寶食','新竹市東區新光里1鄰食品路389號1樓'],
['235051','鑫江南','台北市內湖區江南街10號1樓'],
['235095','金武','台南市新營區金華路一段262號'],
['235110','官田隆悅','台南市官田區隆田里中山路一段185號'],
['235121','大樹水寮','高雄市大樹區中山路38號'],
['235143','新麗寶','台中市后里區福容路201號1樓'],
['235198','新橫濱','基隆市中山區復興路209之3號1樓'],
['235202','廣林','台北市信義區福德街84巷52號1樓'],
['235213','彰巧','彰化縣彰化市新興里自強路68號'],
['235257','茉莉花','彰化縣花壇鄉長沙村29鄰成功街237號'],
['235280','豐勢','台中市豐原區圓環北路二段410號1樓'],
['235291','白宮','高雄市左營區辛亥路105號1樓'],
['235305','松翠','新北市板橋區松江街52號及54號1樓'],
['235316','萬湖','高雄市湖內區湖中路908號'],
['235327','祈安','屏東縣屏東市公園東路128號'],
['235338','富聚','南投縣草屯鎮富寮里富中路373號'],
['235361','樂園','高雄市鳳山區大東二路113號'],
['235372','新都','新北市新莊區復興路二段31號1樓'],
['235383','全安','新北市新莊區新豐街46號.48號1樓'],
['235394','艾文','高雄市林園區東林西路99號101號全部'],
['235419','成光','桃園市中壢區成章二街78號1樓'],
['235420','清水巧鄰','台中市清水區中清路九段1178號'],
['235431','德運','桃園市桃園區三民路一段118號1樓'],
['235442','延平北','台北市大同區延平北路一段110號112號116號1樓'],
['235453','枕山','宜蘭縣員山鄉枕山路39之1號1樓'],
['235464','鹽寮','花蓮縣壽豐鄉鹽寮130號'],
['235475','海心','苗栗縣竹南鎮開元路549號'],
['235486','鑫楷','台中市西屯區順平路218號'],
['235501','後州','新北市淡水區新市二路二段2號1樓'],
['235523','Fresh千塘','桃園市觀音區莊敬路377號379號'],
['235545','飛米','屏東縣枋寮鄉勝利路9號'],
['235578','薪埔','桃園市桃園區中埔六街128號1樓'],
['235589','成佳','新北市三重區成功路145巷44、46號'],
['235604','和洲','新北市三重區三和路二段75號1樓'],
['235615','文河','台中市北屯區文心路四段500號1樓'],
['235626','昊恆','新竹縣湖口鄉光復東路356號358號'],
['235637','政東','花蓮縣花蓮市中山路74號'],
['235648','林園鳳芸','高雄市林園區中芸里中芸三路85號'],
['235660','金萬','桃園市桃園區莊二街1號1樓'],
['235671','湧洸','桃園市平鎮區湧光路136巷32號34號36號1樓'],
['235682','金喬','金門縣金城鎮民族路2號1樓2樓民族路2之1號1樓'],
['235693','智鴻','台中市梧棲區大勇路240號1樓'],
['235707','東宜','台東縣台東市開封街586號'],
['235729','寶瑩','新北市中和區廣福路50號1樓52號1樓'],
['235730','新店寶','新北市新店區央北二路61、63、65號'],
['235774','丰富','新北市林口區中華路511號1樓'],
['235785','觀雲','高雄市小港區港平路29號'],
['235796','學美','屏東縣內埔鄉學人路321-1號'],
['235800','遼寧','台北市中山區遼寧街160號1樓'],
['235833','霧峰五福','台中市霧峰區五福路240號'],
['235855','東榮','台北市松山區民生東路五段71號1樓'],
['235877','七張站','新北市新店區北新路二段152巷2號'],
['235888','豪利旺','苗栗縣苗栗市南勢里坪頂東25號1樓'],
['235903','大樹','高雄市大樹區檨腳里中興南路1號及1-1號1樓'],
['235914','虎科','雲林縣虎尾鎮工專路103號'],
['235925','美功','宜蘭縣壯圍鄉美功路二段158號'],
['235936','裕成南','桃園市楊梅區裕成南路292號294號296號'],
['235947','文森','台北市文山區興隆路一段125巷1之1號'],
['235969','福旺','花蓮縣花蓮市和平路259號'],
['235992','富雅','台中市潭子區雅豐街220號'],
['236009','祥儀','桃園市桃園區桃鶯路457號459號1樓'],
['236021','源豐','新北市淡水區水源街一段118號1樓'],
['236043','砡安','嘉義市東區頂庄里義教街556號'],
['236054','天綻','新北市中和區建八路16號1樓'],
['236065','彩虹','嘉義縣中埔鄉義仁村5鄰十字路2-25號'],
['236076','德光','台南市東區崇德路277號1樓、2樓'],
['236098','青興','高雄市三民區熱河一街131號133號遼寧一街144巷20號'],
['236113','士東','台北市士林區士東路42號1樓'],
['236124','太巴塱','花蓮縣光復鄉富田二街55號57號'],
['236135','仁松','高雄市鳥松區夢裡里大仁北路113號'],
['236146','鳳龍','新北市鶯歌區鳳鳴路541號543號1樓'],
['236157','學圓','新竹市東區科學園路54號1樓'],
['236179','景賢八','台中市北屯區景賢八路228號1樓'],
['236205','後壁米樂','台南市後壁區長短樹里10鄰長短樹24-2號'],
['236227','詠嘉','南投縣南投市中興路756號'],
['236238','學鼎','新北市三峽區學成路333號1樓'],
['236261','樂學','桃園市龜山區樂善二路505號1樓'],
['236272','玉忠','花蓮縣玉里鎮中城里忠孝路101號'],
['236283','翰聖','新竹縣新埔鎮田新路476號478號1樓'],
['236308','展龍','新北市土城區學府路二段265號、學海街307號'],
['236319','成金','新北市永和區成功路二段147號149號1樓'],
['236331','金民','金門縣金城鎮民生路9號1樓'],
['236342','廣安','宜蘭縣冬山鄉廣興路331號333號'],
['236353','精福','台中市南屯區精誠路500號'],
['236364','九容','宜蘭縣蘇澳鎮蘇濱路二段251號253號'],
['236375','古松','屏東縣屏東市崇朝路176號'],
['236401','立陽','台北市北投區立農街二段299號1樓'],
['236412','永佳','台南市新市區復興路173.175號'],
['236434','武松','台北市信義區松山路121號1樓'],
['236445','楊梅廠','桃園市楊梅區民富路一段301號B1樓'],
['236456','三聖','台南市南區興南街149號1樓'],
['236467','恆耀','桃園市龜山區樂學路111號113號1樓'],
['236478','富展','桃園市中壢區復華九街71號'],
['236489','三松','新北市三重區成功二街50號、52號'],
['236607','錦捷','台北市中山區錦州街229號1樓'],
['236618','紹興','台北市中正區紹興北街37號1樓'],
['236629','青島','台北市中正區青島東路4號'],
['236630','裕元','台中市西屯區安和路168號'],
['236641','后庄','台中市北屯區后庄里后庄路141號1樓'],
['236663','逢貿','台中市西屯區黎明路三段1218號'],
['236674','逢德','台中市西屯區青海路二段321號323號'],
['236696','愛六','基隆市仁愛區仁一路281號1樓'],
['236700','潤霖','宜蘭縣羅東鎮公正路136號1樓'],
['236711','宜莊','宜蘭縣宜蘭市光復路26號'],
['236722','利陶','宜蘭縣羅東鎮興東南路188號'],
['236733','慶中','新北市板橋區重慶路194號光明街91號1樓'],
['236755','金采','新竹市北區金雅路62號'],
['236777','建國','新北市新店區中正路236號'],
['236788','深瑞','基隆市信義區深澳坑路129號1樓'],
['236799','健華','新北市三重區忠孝路二段63號'],
['236803','北福興','台北市文山區興旺里福興路20號'],
['236814','復強','桃園市中壢區自強六路53號復華街212號1樓'],
['236825','吉祥','台北市松山區八德路四段245巷52弄31號'],
['236836','阿蓮','高雄市阿蓮區中山路15號17號19號'],
['236847','港榮','新北市新莊區中港路597.599號.中榮街2號'],
['236869','城中','台南市安南區安中路六段599號、601號1樓'],
['236870','長朴','嘉義縣朴子市仁和里嘉朴路西段6-7號1樓'],
['236892','文嘉','新竹縣竹北市文興路一段398號1樓'],
['236906','竹杉','新竹縣竹北市中山路303號(臨)'],
['236917','新福隆','新北市貢寮區福隆里興隆街24之1號1樓'],
['236939','瑞盟','台中市西屯區福雅路143-1號'],
['236962','天裕','台北市士林區中山北路七段156號1樓'],
['236973','鑫通','台北市大安區信義路四段294巷7號1樓'],
['236984','懷得','台北市北投區懷德街85號1樓'],
['237002','福華','苗栗縣苗栗市福星里中華路273.275.277號'],
['237024','新加昌','高雄市楠梓區加昌路275.277號'],
['237035','巨林','彰化縣彰化市中山路一段286號1樓'],
['237057','金馬芯','彰化縣彰化市茄苳路一段276號'],
['237068','新港原','新北市新莊區中原路201號203號1樓'],
['237079','哈囉','高雄市左營區左營大路676號1樓2樓678號1樓'],
['237105','隆城','新北市土城區學士路15巷2號17號1樓'],
['237116','祥崁','桃園市龜山區南祥路41號43號45號1樓'],
['237127','錦欣','桃園市蘆竹區南竹路一段63號1樓'],
['237138','復貴','新北市三重區光復路二段146號1樓'],
['237149','濱江','台北市中山區龍江路356巷39及41號1樓'],
['237150','福致','台北市北投區致遠一路二段49號51號1樓'],
['237172','平埔','新北市深坑區文化街82號'],
['237183','南雅','新北市板橋區新興里南雅南路一段8號1樓'],
['237194','昌宏','新北市新莊區昌隆街29、31號1樓'],
['237219','紅林站','新北市淡水區中正東路二段65號'],
['237220','中愛','台北市中正區寧波東街17號1樓'],
['237253','陡門頭','新北市三重區三民街329號'],
['237437','復星','台北市松山區復興北路15-6號1樓'],
['237507','新林','新北市林口區忠孝路128號130號'],
['237552','維群','新北市板橋區四維路139號'],
['237622','泰豐','高雄市前鎮區瑞隆里永豐路1號1樓保泰路353號1樓及夾層'],
['237644','景中','台北市文山區景文里景文街96號98號'],
['237677','新劉興','桃園市大溪區南興里永昌路320號'],
['237770','千山','桃園市桃園區縣府路212號216號'],
['237792','匯和','新北市三重區三和路四段390巷2號'],
['237828','家安','新竹縣竹北市嘉興路168巷2號'],
['237839','新聖明','高雄市前鎮區英明路一號'],
['237840','福鑫','台北市士林區中正路324號'],
['237851','金央','金門縣金寧鄉伯玉路一段222之8號1樓'],
['237873','附育','彰化縣彰化市中山路三段229號1樓'],
['237884','海青','高雄市鼓山區青海路641號1樓'],
['237932','永興順','澎湖縣湖西鄉隘門34之2號'],
['237987','岡農','高雄市岡山區壽天里公園東路154號'],
['238005','藏美','高雄市鼓山區光榮里西藏街6號1樓'],
['238016','敦親','台北市大安區辛亥路二段171巷8號'],
['238027','萬忠','台北市萬華區東園街28巷56號58號'],
['238038','湧久','台北市大同區延平北路四段157號159號'],
['238049','星鑫','雲林縣口湖鄉崙東村中山路96-6號'],
['238050','廣豐','屏東縣屏東市大連里廣東路280號280-1號'],
['238061','鳳山綺','新竹縣湖口鄉勝利路二段254號1樓'],
['238072','復和','新北市新莊區復興路一段79號81號1樓'],
['238094','正龍','新北市三重區正義北路332號'],
['238119','華國','新竹市東區中華路一段107號109號'],
['238131','東香','新竹市香山區頂埔路2號'],
['238142','禾臣','桃園市龍潭區高平里高楊北路1號'],
['238153','裕信','台南市東區裕信路352號'],
['238164','新海勝','高雄市左營區翠華路601巷122號126號'],
['238175','林頂','台南市仁德區中山路155號'],
['238186','敦維','台北市大安區東豐街43號45號1樓'],
['238212','新慶陽','台北市大同區重慶北路二段60號'],
['238223','德力','桃園市八德區大福里介壽路一段134號136號'],
['238234','宜增','新北市新莊區中平路158號1樓'],
['238245','景旺','新北市中和區成功路1號'],
['238278','新壯觀','基隆市安樂區麥金路64號66號1樓'],
['238289','中興','台北市信義區基隆路二段22號'],
['238315','擎天','桃園市桃園區桃鶯路50號52號1樓'],
['238326','友勤','新北市樹林區大有路65號1樓'],
['238337','京城','台北市松山區南京東路四段75之2號1樓'],
['238360','德鄰','台北市信義區松德路127號129號1樓'],
['238371','行善','台北市內湖區行善路468號1樓新湖二路369號1樓'],
['238382','延龍','台北市大同區延平北路四段16號18號1樓'],
['238393','勝利','高雄市左營區勝利路123號125號1樓'],
['238407','廟東','高雄市左營區左營大路340號'],
['238429','建六','新北市中和區建六路62號'],
['238441','嘉西','嘉義市西區大溪里北港路13鄰597號'],
['238452','新球庭','高雄市新興區林森一路162號'],
['238485','昭勝','屏東縣內埔鄉龍潭村昭勝路216號218號220號'],
['238496','永藝','新北市永和區永和路二段272號274號1樓'],
['238500','恆安','台北市大安區永康街2巷12號1樓'],
['238511','德東','台北市士林區德行東路262號1樓'],
['238522','瑞安','台北市大安區瑞安街182號'],
['238533','合維','台北市大安區四維路170巷8號1樓'],
['238544','昕美','雲林縣斗六市民生路170號'],
['238566','寶元','新北市新店區寶橋路156之2號156之3號1樓'],
['238599','國府','新北市板橋區國光路184號186號1樓'],
['238603','布拉諾','新北市淡水區坪頂路56-8號56-9號1樓'],
['238614','內鑫','台中市大里區東昇里新仁路二段92號'],
['238625','加賀屋','台北市北投區溫泉路73巷5號地下二樓之1'],
['238647','裕興','台南市東區復興里裕文路76號1樓'],
['238669','經貿','台北市南港區三重路19號1樓'],
['238670','京東','台北市松山區南京東路五段16號1樓'],
['238681','林北','台北市中山區民生東路一段46號46-1號1樓'],
['238706','芳榮','新北市三峽區中正路二段534號536號538號'],
['238717','親親','台中市北區錦洲里北屯路14號.14-2號.14-3號1樓'],
['238739','青年','台北市萬華區青年路188號1樓'],
['238740','林宏','新北市新莊區成功街1號'],
['238751','鳳明','高雄市大寮區新厝里鳳林二路160號'],
['238762','雅客','屏東縣恆春鎮墾丁里墾丁路166號'],
['238773','華榮','高雄市鼓山區明倫路149號'],
['238784','豐詳','南投縣南投市民族路66、68號1樓'],
['238810','美南','高雄市鼓山區龍水二路1.3號'],
['238876','有民','新北市永和區民有街9號11號1樓'],
['238887','正心','高雄市苓雅區正大里輔仁路145號1樓'],
['238898','仁寶','新北市永和區仁愛路266號1樓'],
['238902','金美','新北市金山區中山路143號145號'],
['238913','縣道','新北市板橋區縣民大道二段200巷1號3號1樓'],
['238924','百祐','台中市南區美村路二段188號190號1樓'],
['238935','仕吉','台北市大安區忠孝東路四段223巷42號'],
['238946','向美','台中市西區美村路一段302之1號302之7號'],
['238957','伊東','台北市中山區伊通街30號1樓'],
['238979','左岸','新北市八里區龍米路二段230號之1號之2號1樓'],
['238980','蘆興','新北市蘆洲區長樂路2之6號1樓'],
['238991','鑫城','新北市土城區中華路一段100號1樓'],
['239019','麗池','新北市林口區中山路583號1樓.文化二路二段120號1樓'],
['239031','國邦','桃園市蘆竹區忠孝西路206號1樓'],
['239042','番路','嘉義縣番路鄉下坑村菜公店92號'],
['239053','巃頭','嘉義縣番路鄉公田村龍頭18號'],
['239064','朝陽','新竹縣竹東鎮朝陽路70號72號74號1樓'],
['239075','德城','新北市土城區明德路一段139號141號'],
['239086','廷寮','新北市土城區清水路252號254號1樓'],
['239097','埤頭','彰化縣埤頭鄉合興村彰水路三段5鄰537號1樓'],
['239101','園東','高雄市林園區東林西路1號3號5號'],
['239134','景鑽','新北市中和區景新街373號373之1號'],
['239145','北投','台北市北投區中和街222號'],
['239156','迪化','台北市大同區民生西路343號345號'],
['239178','靖笙','高雄市路竹區中正路172號172之1號'],
['239189','旗津','高雄市旗津區海岸路9號'],
['239190','火車頭','彰化縣彰化市長樂里中正路一段536號538號'],
['239204','三民','彰化縣彰化市三民路341號'],
['239215','森吉','台北市中山區林森北路624號626號1樓'],
['239226','錢忠','台北市大安區忠孝東路四段26巷5號'],
['239248','欣隆昌','台北市大安區基隆路二段142之1號及142之2號'],
['239259','秀水','彰化縣秀水鄉文化街31號'],
['239271','德欣','基隆市中山區復興路328號之6號之7號1樓'],
['239282','永益','高雄市小港區民益路46號1樓及2樓'],
['239293','光榮','屏東縣屏東市信義路73之6 號73之7 號75號1樓'],
['239318','光揚','新竹縣竹北市光明六路247號249號251號一樓'],
['239329','寶新','新北市新店區北新路二段57號'],
['239330','同華','桃園市龍潭區中正里龍華路396號1樓'],
['239352','新太麻里','台東縣太麻里鄉泰和村外環路128號1樓'],
['239385','金山','台北市中正區金山南路一段108號'],
['239396','南英','台南市中西區永福路一段30號32號1、 2樓'],
['239400','樟福','新北市汐止區樟樹一路256號258號1樓'],
['239411','凱富','台北市萬華區西園路一段278號1樓'],
['239422','新如東','高雄市三民區九如二路86號1樓'],
['239433','摩漾','新北市土城區中央路二段61巷21號1樓'],
['239444','明揚','桃園市平鎮區延平路二段76號'],
['239455','北府','台北市信義區松仁路162號164號1樓'],
['239477','鑫愛群','高雄市前鎮區復興三路435號437號'],
['239488','聖陶','新北市鶯歌區文化路407號411號'],
['239499','鶯瓷','新北市鶯歌區尖山埔路100號102號'],
['239514','仟翔','苗栗縣竹南鎮龍山路二段275號'],
['239525','上誠','台中市西區向上路一段381號383號385號'],
['239536','鑫建昌','高雄市楠梓區建昌里右昌街148號'],
['239547','榮星','台北市中山區龍江路322號'],
['239606','松柏林','桃園市八德區介壽路二段685巷50弄2號1樓'],
['239617','國站','屏東縣屏東市中山路1.3號一樓'],
['239628','里昂','台北市內湖區瑞光路406號1樓'],
['239640','莊鑫','新北市新店區中正路503之3號503之4號1樓2樓'],
['239651','青雲','新北市土城區青雲路499號501號'],
['239662','文聖','新北市板橋區文聖街64號1樓.松柏街96號1樓'],
['239673','關新','新竹市東區關新路179號1樓'],
['239695','達人','台北市內湖區內湖路二段249號251號'],
['239709','鼎瑞','高雄市三民區鼎泰里裕誠路56號'],
['239710','東展','台中市東勢區南平里豐勢路336號'],
['239721','中崙','台北市松山區八德路三段27號'],
['239732','臨江','台北市大安區安和路二段67號'],
['239743','民有','台北市松山區民權東路三段108號'],
['239754','茂源','新北市新莊區思源路40-1號'],
['239765','永利','新北市永和區永元里永元路93號1樓'],
['239776','龍和','台北市大安區和平東路二段197號199號1樓'],
['239787','詠樂','台北市大同區迪化街一段13號全棟'],
['239802','廣懋','桃園市八德區廣福路578號'],
['239813','京山','台北市中山區南京東路二段100號1樓'],
['239846','龍恩','新北市三峽區國學街13號'],
['239857','貴興','新北市板橋區貴興路25號27號1樓'],
['239868','昌和','台中市北屯區東山路一段146之39號'],
['239879','漢西','新北市板橋區漢生西路64號66號1樓'],
['239880','港達','台南市安定區港口里245-10號1樓'],
['239891','英順','屏東縣潮州鎮介壽路145號1樓'],
['239927','金銘','新北市三峽區介壽路一段27號'],
['239938','安南','台南市安南區安和路四段520號'],
['239949','全球','台北市內湖區新湖二路329號1樓'],
['239950','山和','屏東縣潮州鎮三和里延平路89號'],
['239983','博吉','台中市北屯區東光路786號1樓'],
['239994','宏禧','新北市中和區景平路429號1樓2樓'],
['240008','龍城','高雄市三民區寶安里建興路51號53號1樓'],
['240019','晶鑽','台北市中山區中山北路二段39巷8號1樓'],
['240020','金蓬','台北市中山區民權西路73號1樓'],
['240031','合旺','台北市大安區復興南路二段151巷41號1樓'],
['240101','正御','新竹市北區中正路309號1+B1樓'],
['240112','圓通南','台中市潭子區潭陽里圓通南路239號'],
['240167','新暖東','基隆市暖暖區暖暖街175號177號1樓'],
['240190','梅竹','新竹市東區光明里14鄰大學路56號58號60號'],
['240215','龍欣','桃園市龍潭區中興路257號259號'],
['240226','仟發','台北市大同區民生西路95號97號'],
['240237','庄研','台北市南港區研究院路二段152號1樓'],
['240248','寶山街','桃園市桃園區寶山街280號1樓'],
['240260','景興','台北市文山區景興路113號115號'],
['240271','寶山','新竹縣竹東鎮中興路三段173號1樓'],
['240282','吉豐','桃園市中壢區長沙路8號10號1樓'],
['240293','東加','台中市北屯區東山路一段185號'],
['240307','嘉興','高雄市岡山區嘉興路151號1.2樓'],
['240329','中安','新北市中和區宜安路62號66號'],
['240330','安斌','新北市中和區中安街84號86號1樓'],
['240363','壽德','新北市中和區壽德街11號1樓'],
['240396','冠廷','桃園市龜山區南上路332號1樓'],
['240400','麻佳','台南市麻豆區苓子林17-13號'],
['240411','同州','台北市中正區同安街62號1樓'],
['240422','東泥','高雄市苓雅區意誠里三多四路93號'],
['240455','長洲','新北市蘆洲區長安街25.27號1樓'],
['240466','環永','新北市永和區環河西路二段231號233號1樓'],
['240477','榮富','新北市新莊區中榮街43號47號'],
['240488','南衫','新竹市東區南大路123.125號'],
['240525','寶謙','新竹縣寶山鄉有謙路2.6號'],
['240536','德瑞','台北市內湖區洲子街70號1樓'],
['240547','鼻頭角','新北市瑞芳區鼻頭路227之4號1樓'],
['240569','總站','台北市信義區吳興街486號488號1樓'],
['240570','德馨','台北市內湖區洲子街46號'],
['240592','德享','桃園市平鎮區南勢里14鄰中豐路南勢二段377號379號381號'],
['240606','瑞城','台中市大里區瑞城一街1號'],
['240617','大同南','新北市三重區大同南路102號106號'],
['240639','忠承','新北市土城區忠承路103號1樓'],
['240640','銅利','苗栗縣銅鑼鄉中興路2號'],
['240651','復安','台北市松山區民生東路三段130巷2之1號1樓'],
['240662','忠明義','台中市西區忠明南路16號16之1號18號1樓'],
['240673','同榮','台中市北屯區同榮路161號1樓'],
['240684','獅甲','高雄市前鎮區忠純里中華五路997號正勤路106號1樓'],
['240695','中翔','南投縣埔里鎮中正路704號'],
['240721','合立','南投縣南投市營北里向陽路101號'],
['240732','天虹','高雄市鳳山區鎮南里五甲二路744號'],
['240743','森鑽','台北市中山區林森北路101號1樓'],
['240754','國京','台北市中山區南京東路三段21號1樓'],
['240765','昇陽','新北市永和區雙和里1鄰中和路417號419號'],
['240776','中慈','桃園市桃園區中正三街411號1樓'],
['240798','意幼','新北市新莊區後港一路173號1樓'],
['240813','新佳興','台南市佳里區東寧里文化路196號1樓'],
['240846','龍鎮','高雄市鳳山區龍成路58.60.62號'],
['240857','善志','高雄市鳳山區善志街27號'],
['240868','和武','屏東縣屏東市和生路二段342號'],
['240879','花道','花蓮縣花蓮市中正路563號1樓'],
['240880','仁忠','高雄市林園區仁愛路129.131.133號'],
['240891','黎明東','台中市南屯區黎明東街22號'],
['240905','峽太','新北市三峽區大同路90號92號94號'],
['240916','慈愛','台北市南港區重陽路164號'],
['240938','仁森','新北市林口區粉寮路1段62、64號1樓'],
['240949','明水','台北市中山區明水路636號樂群三路1號'],
['240950','文林','台北市士林區大北路14號16號1樓'],
['240961','中正大學','嘉義縣民雄鄉三興村大學路一段421號'],
['240972','鄉長','新北市汐止區鄉長路二段16號'],
['240994','永強','台南市永康區埔園里中正路102號'],
['241001','港鑫','台北市內湖區內湖路一段737巷35號'],
['241012','國銨','台南市安南區國安街111號113號'],
['241023','文仁','桃園市桃園區延壽街9號11號1樓'],
['241034','板依','新北市板橋區文化路一段188巷38號40號1樓'],
['241056','福上','台中市西屯區河南路二段71號1樓'],
['241067','鑽石','桃園市龍潭區八德里梅龍路23鄰139號141號1樓'],
['241078','金昂','新北市淡水區新市一路一段99巷51.53號1樓'],
['241089','竹圍','新北市淡水區民權路109號111號1樓'],
['241104','新道明','高雄市苓雅區建國一路211號213號'],
['241126','生活','台中市南區復興路二段71巷70號1樓及忠明南路730巷17號1樓'],
['241159','新西華','台北市中山區民生東路三段31號'],
['241160','友成','台北市士林區社中街211號1樓'],
['241182','大鋒','台中市潭子區大豐一路439號1樓'],
['241193','頂安','台北市大安區大安路一段67號1樓'],
['241207','錢京','台北市松山區敦化北路100號1樓'],
['241229','一路發','台中市清水區鰲峰路580號之15號1樓'],
['241230','新新善','台南市新市區復興路59號61號63號一樓'],
['241241','新國光','台中市南區國光路82及84號;愛國街67及69號'],
['241263','下埔下','金門縣金寧鄉慈湖路一段69.71號'],
['241296','豐采','台中市南屯區黎明路二段504、506、506-1號'],
['241300','花壇','彰化縣花壇鄉中山路二段1、3、5號1樓'],
['241311','克難','台北市萬華區萬青街168號'],
['241322','寶斗','彰化縣北斗鎮復興路281號'],
['241333','口湖','雲林縣口湖鄉中正路一段222號'],
['241344','泰民','新北市板橋區民族路222巷13.15號1樓'],
['241355','德興','桃園市平鎮區德育路二段3號1樓振興路12號1樓'],
['241366','元化','桃園市中壢區元化路1-1號'],
['241377','劍湖','雲林縣古坑鄉永昌村永興路145號'],
['241388','鼎強','高雄市三民區鼎金後路432號1樓'],
['241399','權鑫','台北市大同區民權西路157之1號1樓'],
['241403','明華','台北市北投區明德路99號'],
['241425','復北','台北市中山區復興北路164號1樓'],
['241436','新極景','新北市新店區北新路二段252-1號'],
['241458','新憲德','高雄市前鎮區瑞隆路619號'],
['241470','昭明','高雄市大寮區義仁里鳳林一路51巷5號1樓'],
['241481','國祥','桃園市桃園區自強里經國路685號'],
['241506','裝甲','新竹縣湖口鄉勝利路二段93號94號95號1樓'],
['241517','龍池','桃園市龍潭區中豐路上林段187號189號1樓'],
['241528','正福','新北市永和區中正路546號1樓'],
['241540','都會','高雄市楠梓區惠豐里德民路115號'],
['241584','馥樺','台北市南港區三重路23號1樓'],
['241595','金宴','台北市中山區建國北路二段151巷8號1樓'],
['241609','湧豐','南投縣南投市彰南路三路613號、615號'],
['241687','東園','台中市烏日區溪埧里溪南路一段413號'],
['241698','埔西','新北市板橋區文化路一段393號1、2樓'],
['241702','科米','台南市安定區中沙里中崙6之1號1樓'],
['241724','麻豆謝厝寮','台南市麻豆區謝厝寮里謝厝寮30之30號'],
['241735','華雅','新北市板橋區華東街270號1樓'],
['241746','福興旺福','彰化縣福興鄉秀厝村11鄰南環路三段267號'],
['241768','嘉峰','高雄市岡山區嘉峰里嘉峰路200號'],
['241779','鳳鶯','新北市鶯歌區鳳三路25號'],
['241780','功湖','彰化縣芳苑鄉草湖村1鄰二溪路草二段423號'],
['241791','峰吉','桃園市中壢區吉林路68之9號68之10號1樓'],
['241816','金鑽','台北市中山區民權西路56號1樓'],
['241827','庚塑','台北市松山區敦化北路199巷2弄9號'],
['241838','夢幻誠','台中市烏日區高鐵路二段118號'],
['241849','令和','彰化縣員林市三和里3鄰員東路二段42號'],
['241850','永晟','雲林縣西螺鎮新安里新興路488號'],
['241861','涼州','台北市大同區延平北路二段258號'],
['241872','揚都','新北市淡水區義山路二段237號'],
['241883','米樂','高雄市鳥松區鳥松里文海街23號'],
['241894','聯合醫院','高雄市鼓山區中華一路976號1樓'],
['241919','瑞源','台東縣鹿野鄉瑞源村瑞景路二段78號'],
['241920','花鹿米','台東縣鹿野鄉鹿野村中華路一段119號'],
['241931','祥勛','桃園市中壢區華勛街293號1樓'],
['241942','行美','台北市內湖區行善路191號193號'],
['241953','星空','新竹縣竹北市高鐵七路167號1樓'],
['241964','電研所','桃園市楊梅區電研路99之2號99之3號1樓'],
['241975','三崙','宜蘭縣頭城鎮三和路375號1樓'],
['241986','東竺','新竹市北區竹光路498號'],
['242004','鑫美','彰化縣和美鎮彰美路六段199號1樓.201號1樓'],
['242015','興高樹','屏東縣高樹鄉興中路323號1樓'],
['242037','清水又菁','台中市清水區港新五路266號'],
['242059','鎮新','宜蘭縣宜蘭市進士路二段406號'],
['242060','佳利','台南市新化區中山路332號'],
['242082','凱盛','新北市三重區捷運路19巷4弄19號1樓、2樓'],
['242093','國富','桃園市八德區建國路473號475號1樓'],
['242107','讚前','台北市中正區忠孝西路一段50之1號地下街(8-2.8-3.8-4)'],
['242130','東坪','桃園市平鎮區東豐路127號1-2樓129號1樓131號1樓'],
['242141','安順','新竹縣湖口鄉永安街66號68號1樓'],
['242163','南和','苗栗縣通霄鎮南和路二段185號'],
['242174','高雄大','高雄市楠梓區大學南路301號'],
['242200','美濃美中','高雄市美濃區美中路92號'],
['242211','天力','台北市中山區中原街37號.吉林路168巷22號'],
['242222','路金','高雄市路竹區金平路418-1號'],
['242233','福多','新北市樹林區三福街32、34號(一樓)'],
['242244','銀泰','桃園市八德區銀和街73號75號77號'],
['242255','楠西','台南市楠西區鹿田里油車16-22號'],
['242266','東營','新竹縣竹東鎮東榮路52號56號1樓'],
['242288','金冠','金門縣金湖鎮環島南路四段560號562號566號'],
['242299','賀亞','桃園市蘆竹區南崁路一段312號'],
['242303','勝威','新竹市北區天府路一段166號'],
['242336','三民鼎昌','高雄市三民區鼎山街576之1號'],
['242347','關功','新竹縣關西鎮中山東路31號33號1樓'],
['242358','常榮','台北市中山區復興北路514巷39號41號1樓'],
['242369','詠富','宜蘭縣礁溪鄉礁溪路五段152號1樓'],
['242370','佳昌','台南市佳里區安西里文化路428號'],
['242392','巨東','台北市信義區忠孝東路四段553巷6弄2號1樓'],
['242417','北基','新北市萬里區忠六街2號3號1樓'],
['242428','新城','新北市鶯歌區國際二路6巷3號5號1樓'],
['242439','南西','台北市大同區南京西路316號1樓'],
['242451','富山','新竹縣芎林鄉富林路三段693號695號'],
['242462','樂蒂','高雄市橋頭區隆豐路122號'],
['242473','佰納','台南市中西區民生路二段294號1樓'],
['242484','南寮東大','新竹市北區東大路三段502、504號1樓'],
['242509','夏都','台南市北區成功路114號1樓'],
['242510','吉聖','桃園市桃園區吉昌街237號1樓'],
['242532','寶進','新竹縣寶山鄉明湖路338號'],
['242543','頭份公園','苗栗縣頭份市後庄里公園六街9號'],
['242565','悠揚','新竹縣湖口鄉安宅八街1號3號1樓'],
['242576','灣錏','彰化縣花壇鄉彰員路一段930號'],
['242587','和旺','高雄市苓雅區青年二路29號1樓'],
['242598','滿峊','桃園市桃園區經國二路89號一樓'],
['242602','永立','台南市永康區西勢路90號'],
['242613','高南','雲林縣虎尾鎮科園路180號'],
['242624','八德德豐','桃園市八德區豐田路216號'],
['242635','營墘','台南市下營區中山路一段206號'],
['242657','福高','高雄市左營區文府路363之1號'],
['242668','和鑫','台北市大安區和平東路三段38號1樓'],
['242679','天健','高雄市新興區中山一路297號299號一樓部分'],
['242691','丰康','台中市北屯區中清西二街10號'],
['242705','德和','新竹縣湖口鄉德盛村德興路148、150、152號1樓'],
['242716','桃子','高雄市左營區勵志中街21號23號'],
['242738','和家','台北市文山區和平東路四段383號385號1樓'],
['242749','台北大','新北市三峽區大學路151號'],
['242750','興安泰','高雄市三民區重慶街238號'],
['242761','仁武五和','高雄市仁武區五和路332號'],
['242783','紘遠','台中市龍井區遠東街60號.60-1號'],
['242794','吉添','台北市中山區吉林路296號1樓新生北路二段137巷67號1樓'],
['242808','總太','台中市北屯區環太東路500、501號1樓'],
['242819','南橫','高雄市六龜區寶來里中正路27號'],
['242820','金峰鄉','台東縣金峰鄉嘉蘭村嘉蘭163號'],
['242831','和醫三','新北市中和區圓通路301號1樓(雙和醫院第三醫大樓)'],
['242853','明郎','新北市淡水區淡金路36號、36-1號1樓'],
['242864','享裕','高雄市仁武區新寶街12號'],
['242875','學洲','台南市學甲區光華里中洲571號'],
['242897','Fresh橋港','新北市八里區商港八路1號1樓'],
['242901','Fresh湖美','台南市中西區和緯路五段55號'],
['242912','天鑫','台北市士林區天玉街10號'],
['242923','德勝路','台中市大雅區民生路三段86號'],
['242945','新南宮','台中市烏日區溪南路三段32號'],
['242956','築林','台中市沙鹿區中山路98號'],
['242989','九張犁','台中市烏日區中華路168號'],
['243007','北屯總富','台中市北屯區敦富路219號'],
['243018','益嘉','新北市新店區安祥路101號103之1號1樓'],
['243029','沐森','彰化縣伸港鄉海尾村中興路二段385號'],
['243041','成鈺','台南市南區永成路二段841號'],
['243063','善化胡厝寮','台南市善化區胡家里胡厝寮30之3號'],
['243074','新寶','台北市中山區建國北路一段156號一樓'],
['243096','幸運','新北市板橋區區運路78號80號1樓'],
['243100','新玉','台南市新化區忠孝路10號'],
['243122','森林裕','台南市北區林森路三段198號1樓'],
['243144','金航','金門縣金湖鎮尚義機場2號1樓'],
['243166','檜進','桃園市桃園區三民路二段127號129樓一樓'],
['243177','蓁蓁','台南市新營區太子宮140之2號1樓'],
['243188','田中白玉','彰化縣田中鎮員集路三段270號'],
['243199','佳旻','台南市東區崇善路1191號1樓'],
['243203','大園沐林','桃園市大園區大成路二段55號一樓'],
['243236','板樂','新北市板橋區三民路二段35巷11號1樓'],
['243247','保安','台中市南屯區保安十街140號.142號.146號.148號'],
['243258','吉江','高雄市三民區合江街39號1樓'],
['243281','富藏','桃園市中壢區復興里復華街360號一樓'],
['243292','仁仁愛','新北市林口區仁愛路二段634號636號1樓'],
['243306','嶺萬','桃園市龜山區萬壽路二段735號737號733巷2號1樓'],
['243317','樂禹','新竹縣湖口鄉光復東路229號1樓'],
['243328','藝文','苗栗縣竹南鎮新南里公園路118-6號'],
['243339','廣鳴','台北市信義區福德街88號90號'],
['243340','園鑫','台北市萬華區雙園街28號30號1樓'],
['243351','大安綻','台中市大安區海墘里11鄰東西六路二段189號'],
['243362','伸中','彰化縣伸港鄉新港路106.108.110號'],
['243384','內厝五','桃園市大園區中興路二段367號'],
['243409','上得','台中市太平區中平路160號'],
['243410','園峰','桃園市大園區中山南路二段660號'],
['243421','勝吉','新北市汐止區新台五路一段114號'],
['243432','錚新','嘉義縣新港鄉中正路366號一樓'],
['243454','金湖村','雲林縣口湖鄉中正路32.34號1樓'],
['243465','玉祥','台南市玉井區民生路320號1樓'],
['243476','壢和','桃園市中壢區中平路8號1樓及10號1樓2樓'],
['243487','仁武勇全','高雄市仁武區勇全路111號1樓'],
['243498','埤北','高雄市鳳山區埤北路235號'],
['243502','海王','新北市八里區中山路一段143.145號1樓'],
['243513','日美','台北市士林區中山北路六段435號437號'],
['243535','哈妮','台南市東區中華東路二段69號71號'],
['243546','超群','高雄市楠梓區秀群路465號1樓'],
['243557','輔英科大','高雄市大寮區進學路151號'],
['243568','長治潭龍','屏東縣長治鄉潭頭路185號'],
['243579','肉圓','彰化縣彰化市三民路248號.248-1號1樓'],
['243580','國琪','新北市板橋區大同街29.31號1樓'],
['243605','鹽忠','台南市永康區?洲里?忠街178號'],
['243616','澄德','高雄市仁武區八卦里京吉六路67號1樓及69號1樓'],
['243627','永富樂','屏東縣九如鄉東寧村東寧路102號'],
['243638','兆泓','台中市烏日區學田路446號'],
['243661','德成','台北市內湖區內湖路二段281號.283號'],
['243672','惠誠','高雄市楠梓區惠誠街88號'],
['243694','勤美','台中市西區民龍里公益路155巷13號1樓'],
['243708','新月','宜蘭縣宜蘭市神農路二段131號133號'],
['243720','三民陽豐','高雄市三民區大豐二路457號'],
['243731','風勝','高雄市鳳山區工協街28號'],
['243742','魚躍','屏東縣恆春鎮漁港街112號'],
['243764','力社','屏東縣崁頂鄉力社村舊店路1-63號'],
['243797','大於','台中市太平區環中東路三段311號313號1F'],
['243801','祺淯','台東縣台東市豐田里中興路五段232號'],
['243823','新市廠','台南市新市區大營里7號1樓'],
['243845','灣內','嘉義縣六腳鄉灣南村灣內119之1號'],
['243856','湖口達成','新竹縣湖口鄉中正村中正六街220號'],
['243867','百香果','南投縣埔里鎮合成里西安路三段296號'],
['243878','漢光','新北市板橋區光正街12號1樓'],
['243889','大果','台中市北屯區崇德十一路50號'],
['243890','寶楊','桃園市楊梅區中山北路二段89號91號1樓'],
['243915','重清','高雄市左營區重清路111號'],
['243926','和美仁愛','彰化縣和美鎮仁壽路189號'],
['243937','大合宜','新北市板橋區合宜路173號1樓'],
['243948','開寧','台北市萬華區西寧南路16號1樓及2樓18號1樓'],
['243959','露興','彰化縣埤頭鄉彰水路一段291號'],
['243960','埔里恩泉','南投縣埔里鎮育英街1號'],
['243971','正權','台南市歸仁區中正南路一段441號'],
['243982','天馳','桃園市桃園區民光東路357號359號1樓'],
['244000','八寶','桃園市桃園區德華街173號'],
['244022','新竹介壽','新竹市東區介壽一路37號'],
['244033','遠雄','桃園市大園區航翔路9號1樓'],
['244044','清水岩','彰化縣社頭鄉朝興村山腳路二段636號'],
['244055','興強','桃園市龜山區中興路一段14號16號'],
['244066','挖子','彰化縣二林鎮二溪路七段271號'],
['244088','高科大','高雄市燕巢區大學路1號1樓'],
['244103','海埔','彰化縣鹿港鎮海埔里鹿草路二段903號'],
['244147','興一','桃園市桃園區大興路265號'],
['244170','苗華','苗栗縣頭份市中華路512號'],
['244181','瑞昱','新竹市東區園區二路9-1號B2'],
['244239','鳳昭','高雄市大寮區鳳林路四段629號'],
['244240','帝凡內','台南市北區中華北路一段78巷53號1樓'],
['244251','九如清聖','屏東縣九如鄉後庄村後庄路108號'],
['244262','埔心街','桃園市大園區埔心街2號1樓之1、1樓之2'],
['244273','丞洋','台南市南區萬年七街85號'],
['244284','欣屏鵝','屏東縣恆春鎮南灣里南灣路新生巷1號'],
['244295','富隆','苗栗縣頭份市昌隆二街301.303號'],
['244309','赫騰','新北市新莊區思源路593巷6弄23號1+2樓'],
['244310','蘆信','新北市蘆洲區三民路26巷33號35號1樓'],
['244321','港育','台北市南港區玉成街66號.66之13號'],
['244332','延仁','台北市大安區延吉街175號1樓'],
['244354','台東關豐','台東縣關山鎮豐泉里和平路129號1樓'],
['244365','土城','新北市土城區中央路三段42-1號1樓'],
['244376','大展','新北市樹林區俊英街252號1樓'],
['244387','板和','新北市板橋區三民路二段145號145-1號153巷1號'],
['244491','民生廠','新北市土城區民生街4號1樓'],
['248622','豐盛','台南市北區勝利路192號194號'],
['248655','東隆','屏東縣東港鎮頂中里延平路107號'],
['248666','民醫','台北市內湖區民權東路六段123巷22號22之1號'],
['248688','桂陽','高雄市小港區桂陽路255號1號257巷1號1樓'],
['248747','蘆三','新北市蘆洲區三民路6號8號'],
['248770','新萬隆','台北市文山區羅斯福路六段20號22號'],
['248839','成旺','新北市五股區成泰路三段212號216號218號1樓'],
['248851','粉寮','新北市林口區粉寮路二段36號'],
['248873','北醫','台北市信義區吳興街252號'],
['248909','中寧','台北市萬華區中華路二段602-1、602-2號1樓'],
['248910','新北市','新北市板橋區中山路一段161號B1樓'],
['248965','天越','台北市士林區天母東路50巷25號'],
['248976','新鼎祥','高雄市三民區鼎泰里民族一路543巷25號1樓'],
['248998','興北','台北市文山區興隆路三段108號'],
['249005','東偕','台東縣台東市長沙街303巷1號'],
['249016','文信','高雄市鼓山區明誠里南屏路527號529號'],
['249038','鎮揚','台中市沙鹿區南陽路439號'],
['249049','軍暉','嘉義市東區軍輝路60號1樓'],
['249083','連發','新北市中和區連城路208號1樓2樓'],
['249094','易順','彰化縣社頭鄉員集路四段697號'],
['249108','關渡站','台北市北投區大度路三段270巷69號71號1樓'],
['249120','富慶','高雄市左營區富民路65號一.二樓'],
['249131','晉學','高雄市楠梓區大學西路815.817號'],
['249153','二崙','雲林縣二崙鄉崙東村中山路一段269號'],
['249164','復全','新竹市東區新莊里長春街11.13號1樓'],
['249186','暖碇','基隆市暖暖區碇內街9號11號'],
['249197','南屯','台中市南屯區南屯路二段570號'],
['249201','興福','台中市南區復興路二段175之1之2號'],
['249212','金雲','台北市內湖區星雲街136號'],
['249223','新盛','高雄市前金區草江里七賢二路193號193-1號193-2號1樓'],
['249234','三禾','新北市三重區大智街139號139之2號1樓'],
['249256','尚讚','高雄市仁武區仁雄路97-3號1樓'],
['249278','欣東勢','台中市東勢區上新里第一橫街153、155號1樓和三民街2號1樓'],
['249290','瑞竹','高雄市鳳山區中山東路209-1及209-2號1樓'],
['249304','理馨','高雄市三民區明吉路9號'],
['249315','彰泳','彰化縣彰化市永安街388號1樓'],
['249326','義東','嘉義市東區東義路85號'],
['249337','長北','台北市中山區長春路11號'],
['249348','崇信','基隆市信義區東信路212-4及214號1樓'],
['249371','弘揚','桃園市中壢區弘揚路47號1樓'],
['249407','金川','彰化縣彰化市中正路二段611號'],
['249418','溪洲','台中市太平區新平路二段221號1樓'],
['249429','海山','新北市板橋區漢生東路310號'],
['249430','萬鑫','桃園市楊梅區民富路三段828號830號1樓'],
['249441','民府','台中市西區四維街22-1號24號'],
['249452','金站','宜蘭縣羅東鎮公正路31號1樓'],
['249474','國門','桃園市桃園區春日路1486號1484號'],
['249485','經國一','桃園市桃園區經國路838號1樓'],
['249496','杰昕','基隆市信義區信二路243號245號'],
['249511','孝三','基隆市仁愛區孝三路89號91號1樓'],
['249522','上賀','桃園市蘆竹區光明路一段100號'],
['249533','享溫馨','台東縣台東市中正里中正路308號1樓'],
['249544','頂崁','新北市三重區光復路一段82號1樓'],
['249555','龍客','高雄市前金區大同二路1號'],
['249566','三元','桃園市桃園區大業路一段54號56號1樓'],
['249577','新安慶','雲林縣虎尾鎮民主路52-1號'],
['249599','八斗子','基隆市中正區北寧路327號1樓'],
['249603','統棒','屏東縣屏東市永安里棒球路45號'],
['249636','板南','新北市中和區板南路486號'],
['249669','牯嶺','台北市中正區廈門街99巷19-2號1樓'],
['249692','同銘','桃園市龜山區大同路212號1樓'],
['249717','禾豐','桃園市桃園區秀山路95號1樓'],
['249728','龍華','台南市永康區烏竹里自強路825-1號'],
['249739','欣大林','台南市南區大同路二段136巷3號1樓'],
['249751','仁峰','高雄市岡山區壽峰里前峰路152號之1一樓'],
['249762','大成','桃園市楊梅區梅山西街10號'],
['249773','蓮權','花蓮縣花蓮市民權路136號138號1樓'],
['249795','科雅','台中市西屯區福雅路571-1號'],
['249809','福雅','台中市西屯區福雅路338號'],
['249810','東中','新竹市北區東門街194號1+B1樓'],
['249821','竹城','新竹市北區西門里中山路100號'],
['249832','恆新','新竹市北區民富里7鄰北大路342號'],
['249854','綠島','台東縣綠島鄉南寮村南寮路139號'],
['249865','新店','新北市新店區碧潭路14號1樓'],
['249876','尊品','桃園市桃園區建國路41-1號1樓'],
['249887','三隆','高雄市大寮區光明路二段810號1F'],
['249898','翁聚德','嘉義縣中埔鄉和睦村司公部4-20號1樓'],
['249902','三豐路','台中市豐原區三豐路二段289號'],
['249913','宜商','宜蘭縣宜蘭市延平路39之8號1樓'],
['249946','水擇','新竹市北區水田里中正路194號'],
['249957','智成','新北市三芝區中正路二段1號智成街79號'],
['249968','新東帝','台北市大安區敦化南路二段99號1樓'],
['249979','光谷','新北市三重區光復路一段61巷27-1號'],
['250005','真美','嘉義縣梅山鄉梅北村006鄰新興路279號'],
['250027','嘉榮','嘉義市西區自強街34、36號1樓'],
['250038','名寶','台北市內湖區民權東路六段180巷17號19號'],
['250050','壽興','桃園市龜山區中興路一段73號1樓'],
['250083','榮鑽','台北市中山區五常街23號25號民族東路410巷62號1樓'],
['250094','京達','台中市豐原區中正路805號'],
['250108','新山外','金門縣金湖鎮山外里復興西路2號'],
['250131','新隆豐','高雄市橋頭區仕隆里隆豐路273號275號'],
['250142','河堤','高雄市三民區鼎泰里河堤路510號'],
['250164','文建','高雄市鳳山區文福里文化西路35號1樓文建街179號2樓'],
['250186','豐華','台中市北區崇德里進化北路148號1樓及榮華街121號1樓'],
['250197','新安村','新竹縣竹北市博愛街515號'],
['250201','東佳','台東縣台東市長沙街178號180號182號'],
['250212','藍田','高雄市楠梓區藍昌路379號1樓'],
['250223','坪里','連江縣北竿鄉?里村42號1樓'],
['250234','蓮花','桃園市楊梅區青山一街2號2-1號1樓'],
['250245','上安','台中市西屯區至善路61號'],
['250278','山林','桃園市蘆竹區海山路407號409號411號'],
['250289','國鶯','新北市鶯歌區中山路142號1F'],
['250290','安康','新北市新店區安德街70號72號1樓+2樓'],
['250304','明大','新竹縣新豐鄉松林村新興路1號'],
['250315','瑛才','苗栗縣苗栗市英才路109號'],
['250326','大山','苗栗縣後龍鎮大山里龍文路6號1樓'],
['250337','竹揚','新竹市東區文華里北大路38號'],
['250348','塘岐','連江縣北竿鄉塘岐村219號'],
['250359','健一','台北市松山區健康路11號'],
['250360','大金','台中市大里區中興路一段255號'],
['250371','林興','屏東縣林邊鄉中山路312號'],
['250382','雙德','高雄市楠梓區翠屏里德惠路66號1樓'],
['250407','德泰','新北市五股區成泰路一段10號'],
['250418','文心','台中市西屯區文心路三段76號、78號'],
['250429','旭泰','新北市汐止區建成路57巷1號3號'],
['250430','板仁','新北市板橋區大智街93號.大仁街101號'],
['250441','德緯','台南市北區成德里育德二路20鄰308號'],
['250463','莊勝','新北市新莊區八德街59號61號1樓'],
['250474','樹復','新北市樹林區復興路340號'],
['250485','詠康','桃園市桃園區長春路37號39號1樓'],
['250496','秀杉','新北市中和區自立路129號131號'],
['250500','朗廷會','新北市林口區文化三路二段91號1樓'],
['250511','金功','新竹市東區建功二路2號及6號1樓'],
['250533','立軒','新北市林口區文化一路一段200號202號1樓2樓'],
['250544','鑫騰龍','桃園市龜山區萬壽路一段156.158號1樓'],
['250555','元福','嘉義市東區王田里林森東路288號'],
['250566','歸來','屏東縣屏東市和生路一段107-3號'],
['250577','聯信','台中市南區建成路1107號1樓'],
['250588','長榮大','台南市歸仁區長大路1號(長榮大學內第4宿舍B1)'],
['250603','冠綸','新北市三峽區中華路59號61號1樓'],
['250614','清江','台北市北投區公館路165號1樓.165-1號B1'],
['250625','湖山','新竹縣湖口鄉中山路三段487號489號'],
['250636','源晟','新竹縣湖口鄉新興路628號630號'],
['250658','大楊','桃園市楊梅區楊湖路一段90號92號94號1樓'],
['250669','清康','台中市清水區中山路106號'],
['250670','中園','新北市三峽區民權街235號1樓'],
['250681','百吉','桃園市大溪區復興路二段35號'],
['250692','新嘉勝','嘉義市西區博愛路一段419、421號及北興街148號150號152號'],
['250706','新宏盛','新北市新莊區後港一路114號'],
['250717','百年','桃園市龍潭區烏樹林里中豐路317號１樓'],
['250728','樂添','基隆市安樂區樂利二街62巷291號2樓292號293號1樓'],
['250739','竹探','台中市北屯區松竹路三段676-1號'],
['250740','美河','新北市新店區三民路35巷2號'],
['250751','聖昌','宜蘭縣羅東鎮站前南路260號262號1樓'],
['250784','神采','台中市神岡區中山路773號'],
['250809','慶福','桃園市中壢區同慶路277號1樓'],
['250810','星月','雲林縣口湖鄉福安路26-3號'],
['250821','惠心','高雄市楠梓區惠民里高楠公路1764之1號'],
['250832','試院','台北市文山區木柵路一段139號141號'],
['250854','慶平','台南市安平區慶平路235號1樓'],
['250865','仁善','桃園市大溪區埔頂路二段183號'],
['250876','霖園','高雄市林園區鳳林路一段2號1樓'],
['250887','天元','新北市淡水區北新路三段30號1樓'],
['250898','正翔','新北市林口區中正路285.287號'],
['250902','元保','台中市北區進化北路413號1樓'],
['250913','自興','新竹市東區自由路69號'],
['250924','竹醫','新竹市東區鐵道路二段9號1樓'],
['250946','關爺','桃園市平鎮區南東路376號1樓'],
['250968','線西','彰化縣線西鄉寓埔村沿海路一段892號'],
['250979','駁藝','高雄市鹽埕區大勇路29號'],
['250980','金學','桃園市桃園區國際一路121號'],
['250991','興源','桃園市桃園區大興西路二段82號1樓'],
['251008','觀工','桃園市觀音區成功路一段525號527號529號1F'],
['251019','青新','新北市新店區中山路137號1樓'],
['251020','大華','台北市萬華區萬大路495號497號'],
['251031','鳳屏','高雄市大寮區鳳屏一路564號566號'],
['251042','樹樺','新北市樹林區中華路341之5號341之6號一樓'],
['251053','新昇','桃園市中壢區新生路四段28.30號1樓'],
['251064','名品','花蓮縣花蓮市國富里十三鄰莊敬路72號1樓國富十街1之1號1樓'],
['251075','得晴','新北市中和區景平路239巷1號3-5號1樓'],
['251086','集興','新北市三重區光明里24鄰集美街202號'],
['251097','真旺','新北市三重區成功路50巷1號'],
['251101','國勝','高雄市左營區富國路112號116號1樓'],
['251112','象上','苗栗縣頭屋鄉象山村象山路176號'],
['251123','萬鄰','新北市板橋區華江里民生路二段226巷46號1樓'],
['251134','有家','桃園市桃園區大有路457號459號1樓'],
['251145','大潤','新竹市北區湳雅里22鄰湳雅街46號'],
['251156','金西屯','台中市西屯區西屯路三段79-33號'],
['251167','裕東','高雄市鼓山區裕誠路1946號1樓'],
['251178','國城','高雄市三民區自立一路68號70號1樓'],
['251190','愷傑','台南市永康區中正北路122號'],
['251204','迴龍站','新北市新莊區中正路895號895號之1號'],
['251226','屏生','屏東縣屏東市瑞光里民生路33號'],
['251259','鳳新','高雄市鳳山區新康街241號243號245號1樓'],
['251260','皓倫','桃園市平鎮區振興西路70號72號1樓'],
['251271','花市','台北市大安區建國南路一段274號'],
['251282','存德','新北市板橋區篤行路二段86號88號1樓'],
['251293','德誠','台北市士林區德行東路106號108號1樓'],
['251318','秀和','新北市永和區國中路99號101號'],
['251341','關渡','台北市北投區知行路282號284號1樓'],
['251352','鑫壽','台北市松山區延壽街323號'],
['251363','潮維','屏東縣潮州鎮三共里四維路201號'],
['251374','竹東','新竹縣竹東鎮學前路29號1樓'],
['251396','吉仕多','台中市太平區樹德路255號'],
['251400','西寧南','台北市萬華區西寧南路141號1樓2樓'],
['251411','鈞泰','台中市北屯區太原路三段1112之1號1120之1號1樓'],
['251433','德園','新北市林口區文化二路一段120巷1之1號'],
['251455','長泰','新北市三重區三和路二段125號127號1樓'],
['251466','嘉樂','嘉義縣民雄鄉東榮村文化路36號1樓'],
['251477','泉源','台北市北投區泉源路30號地下一樓'],
['251499','福海','高雄市苓雅區三多一路239號1樓'],
['251514','憲金','新北市蘆洲區光華路22巷1號'],
['251525','金誼','金門縣金城鎮南門里浯江北堤路100號'],
['251536','致聖','台南市東區北門路二段12號'],
['251547','鑫鑽','台中市南屯區文心南三路663號'],
['251569','新瓦屋','新竹縣竹北市文興路一段172.176號1樓'],
['251570','富朋','新北市永和區永和路二段116號'],
['251581','瑞慶','台中市豐原區豐原大道三段261號'],
['251606','好事達','高雄市大社區保社里旗楠路71號'],
['251617','育大','苗栗縣造橋鄉學府路100號'],
['251628','蓮山','高雄市阿蓮區民生路92號'],
['251639','港德','台北市南港區福德街373巷25號1樓'],
['251640','康葫','台北市內湖區民權東路六段296巷33號'],
['251651','新童','台中市梧棲區台灣大道八段699號'],
['251662','和豐','基隆市中正區新豐街203號1樓'],
['251673','蘭潭','嘉義市東區大雅路二段573號575號'],
['251684','德庄','高雄市大寮區中庄里八德路69號71號73號'],
['251695','崇武','屏東縣屏東市崇武里華盛街5-6號'],
['251710','順苓','高雄市小港區漢民路381號'],
['251721','崇明','台南市東區林森路一段184號'],
['251732','慶東','台南市東區青年路416號'],
['251743','開山','台南市中西區開山路245號1樓'],
['251765','安保','台北市內湖區安康路28號1樓'],
['251776','鎮興','高雄市前鎮區鎮興路170號'],
['251787','新猷','新北市新店區安和路三段81號83號1樓'],
['251798','臨通','台北市大安區通安街64號1樓'],
['251802','欣昌','台北市萬華區西昌街177號179號179-1號'],
['251813','莊壢','桃園市中壢區莊敬路199號'],
['251835','重南','台北市中正區武昌街一段1-2號1樓'],
['251846','青山','新北市汐止區新興路83-2號'],
['251857','六家','新竹縣竹北市福興東路二段105號1樓'],
['251868','四湖','雲林縣四湖鄉四湖村中山東路113號'],
['251879','墘麗','台北市內湖區港墘路37巷15號'],
['251880','橋安','新北市中和區橋安街20號1樓'],
['251891','柳橋','高雄市岡山區後協里仁壽路248號'],
['251905','圓通','新北市中和區圓通路280號282號'],
['251916','渴望村','桃園市龍潭區三和里渴望路428號B1樓'],
['251927','富邑','桃園市桃園區龍泉五街82號龍祥街98號'],
['251938','映竹','桃園市蘆竹區南竹路四段250號1樓'],
['251949','立莊','桃園市中壢區莊敬路805號普騰街38巷18號1樓'],
['251950','仁東','高雄市岡山區大仁北路175號1樓'],
['251961','翁子','台中市豐原區豐勢路一段669號一樓'],
['251983','楊梅','桃園市楊梅區楊新路73號1樓'],
['251994','嘉和','嘉義市東區中山路169號171號173號'],
['252001','樹佳','新北市樹林區佳園路三段31之1號'],
['252012','郡王','台南市中西區府前路一段144號'],
['252023','新車店','嘉義市西區福民里南京路462號1樓、2樓'],
['252034','國庭','新北市板橋區國光路1號3號1樓'],
['252045','志城','新北市土城區金城路三段243號245號247號1樓'],
['252067','廣興','桃園市平鎮區忠孝路69號1樓'],
['252078','鐵興','新竹縣竹北市嘉豐六路二段16號.18號.12號部分'],
['252104','新新明','桃園市中壢區民族路208號1樓'],
['252115','湖大','新竹縣湖口鄉東興村10鄰中山路三段358號臨'],
['252126','集成','新北市三重區環河南路254巷43之1、43之2號'],
['252137','圓真','雲林縣虎尾鎮信義路52號及三民路93號'],
['252148','蓮讚','花蓮縣花蓮市國聯里國聯三路16號18號'],
['252171','武慶','高雄市鳳山區五武漢里武慶二路52號54號'],
['252182','后安','高雄市前鎮區草衙里后安路146號'],
['252193','櫻花','台中市西屯區櫻花路111號'],
['252207','樹保','新北市樹林區保安街二段357號'],
['252218','羅昌','台北市中正區南昌路二段206號1樓'],
['252229','真豪','新北市新莊區中華路一段73號'],
['252230','華樂','桃園市龜山區華亞三路195號197號1樓'],
['252241','保誠','台中市西區五權路2-104號及貴和街222號'],
['252252','體育','台南市中西區健康路一段166號'],
['252263','羅捷','台北市文山區景行里羅斯福路六段391號'],
['252274','幸福川','高雄市前金區自強一路149號1樓2樓'],
['252285','宏文','高雄市小港區泰山里宏平路83-2號'],
['252296','鑫樂昇','台北市萬華區武昌街二段114之3號.之4號'],
['252300','八重','新北市三重區重新路三段115巷18號'],
['252311','菜寮站','新北市三重區重新路三段98號1+2樓.100號1樓'],
['252322','財府','新北市淡水區學府路136巷36號、38號1樓'],
['252333','霖口','新北市林口區中山路250號250之3號1樓'],
['252355','桃民','桃園市桃園區民族路79號1樓'],
['252366','天公','台南市中西區忠義路二段109號'],
['252377','忠孝東','台北市中正區忠孝東路一段72號76號1樓'],
['252388','集吉','新北市三重區三賢街61號63號1樓'],
['252399','雙鳳','新北市新莊區雙鳳路114號1樓'],
['252403','健勝','台中市北區健行路701號'],
['252425','高應大','高雄市燕巢區深中路58號1樓'],
['252447','新東灣','台南市永康區民族路186號188號1樓'],
['252458','鑫永康','台南市永康區中華路617-1號'],
['252469','頭份','苗栗縣頭份市中正路232號'],
['252470','漢翔','台中市西屯區福星北路59號'],
['252481','德金','台北市中正區八德路一段29號'],
['252492','鑫左岸','新北市中和區中原街120號122號1樓'],
['252506','竹博','新竹市東區民生路226號'],
['252517','進合','台中市北區進化路328號'],
['252528','民悅','新北市蘆洲區民族路316.318號'],
['252539','義學','新北市泰山區明志路二段74號76號'],
['252540','得勝','新北市蘆洲區得勝街67號1樓'],
['252551','縣北','桃園市桃園區中山北路136號1樓'],
['252562','里農','屏東縣里港鄉大平村中山路3號'],
['252584','暖鑫','基隆市暖暖區暖暖街554號'],
['252595','中雅','高雄市苓雅區中山二路463號'],
['252609','育英','新竹市北區育英里15鄰四維路53號1樓.西門街212號1樓'],
['252610','國校','台中市北屯區國校巷16號'],
['252621','美人魚','台南市新市區新市里中興街162號1樓'],
['252654','萬誠','新北市三峽區民生街25號'],
['252665','鴻臣','桃園市龜山區楓樹里忠義路一段870-1號'],
['252687','瑞德','台北市中正區新生南路一段170巷14之3號1樓'],
['252698','遠來','新北市林口區仁愛路二段510號1樓'],
['252702','秀昌','高雄市楠梓區後昌路858之2號1樓'],
['252713','昶林','高雄市岡山區仁壽里公園西路三段131號133號'],
['252724','東都','台南市北區成功路140號'],
['252735','吉福','桃園市蘆竹區吉林路167號1樓'],
['252746','社員','彰化縣社頭鄉員集路三段16號'],
['252768','鑫德','台中市太平區新興路85-1號'],
['252779','重福','高雄市左營區重愛路215號'],
['252816','武晴','基隆市安樂區基金一路214之17號'],
['252838','環河東','新北市永和區環河東路四段22號'],
['252861','泰隆','新北市中和區立德街102號'],
['252872','社旺','高雄市大社區大社路30-29號'],
['252883','富港','台北市內湖區港墘路46號48號1樓'],
['252894','崇華','台南市東區崇善路259號1樓'],
['252908','岡燕','高雄市岡山區岡山路264號、266號1樓'],
['252919','立竹','新北市淡水區民族路58號1樓2樓'],
['252931','銀川','高雄市鼓山區鼓山三路8-25號1樓'],
['252942','復興崗','台北市北投區中央北路二段68之2號68之3號'],
['252953','桃匯','桃園市桃園區國際路二段557號559號1樓'],
['252964','長政','新竹縣竹東鎮中正路15號1樓'],
['252975','永吉','台北市信義區永吉路217號1樓2樓及219號1樓'],
['252986','新本安','台南市安南區淵東里安中路三段360號1樓'],
['252997','樂河','台中市北屯區軍和街457號1樓和461號1樓2樓'],
['253004','台江','台南市安南區安中路二段140號1樓'],
['253037','成雲','新北市五股區西雲路200.202號1樓'],
['253048','彌盛','高雄市彌陀區中正路246號'],
['253059','彌安','高雄市彌陀區文安路1-1號1樓1-2號1樓'],
['253060','新獅潭','苗栗縣獅潭鄉新店村新店22-5號1樓'],
['253082','豐亞','桃園市中壢區民族路六段232號236號1樓'],
['253093','一中','台中市北區一中街98號1樓'],
['253107','佳茂','台中市潭子區中山路一段17號1樓'],
['253118','宏明','高雄市三民區本和里大福街211號1樓'],
['253129','莊泰','新北市新莊區新泰路21號'],
['253130','後山埤','台北市信義區中坡北路11號1樓'],
['253141','友愛','台南市中西區友愛街197之199號'],
['253163','新壢智','桃園市中壢區興仁路二段57號1樓'],
['253174','新福街','桃園市中壢區福州二街392號1樓'],
['253185','新東峰','台中市北區東光路340號'],
['253196','成湖','台北市內湖區成功路四段346號'],
['253211','合安','新北市板橋區合宜路111號1樓'],
['253222','大統','嘉義市西區西平里博愛路二段696號1樓'],
['253233','皇裕','新北市土城區裕民路114巷16號1樓'],
['253244','蘆豐','桃園市蘆竹區南山路二段48號1樓'],
['253255','長揚','新北市三重區三和路二段6號之2'],
['253277','矽功','新北市汐止區大同路一段284號'],
['253288','豐基','台北市士林區基河路368號370號'],
['253299','福星','台中市西屯區福星路580號'],
['253303','鎮權','台中市沙鹿區鎮南路二段107號109號'],
['253325','布新','嘉義縣布袋鎮中正路63號'],
['253336','裕文','台南市東區裕學路1號'],
['253347','博嘉','台北市文山區木柵路四段117號119號1樓'],
['253369','文華','台中市西屯區寧夏路232號'],
['253370','政大','台北市文山區指南路二段99號101號'],
['253381','嘉太','嘉義縣太保市北港路二段190號'],
['253392','八福','桃園市八德區福國街76-1號'],
['253406','南衙','高雄市前鎮區南衙路47號'],
['253417','華新一','基隆市七堵區華新一路22號26號1樓'],
['253428','旭日','台中市北區五權路272.274.276號與太平路221號'],
['253439','德龍','高雄市大寮區八德路197號1樓2樓199號'],
['253440','東海','台中市龍井區台灣大道五段3巷43號45號1樓'],
['253451','清圳','台北市內湖區東湖路113巷88號'],
['253495','安一','基隆市安樂區安一路172及174號'],
['253509','新翡翠灣','新北市萬里區龜吼里美崙90號'],
['253510','文南','台南市南區健康路二段268-1、270號'],
['253521','及人','新北市新店區安民街72號'],
['253532','華欣','新北市中和區華新街109巷1之2號1樓'],
['253543','華耀','新竹市香山區明德路1號1樓'],
['253554','福利國','桃園市桃園區同德六街170號1樓'],
['253565','學城','新北市土城區學府路一段118號'],
['253576','新大業','嘉義市東區安寮里24鄰吳鳳南路194號'],
['253598','山民','桃園市龜山區三民路100號'],
['253613','員新','新北市中和區員山路504號'],
['253624','春光','台北市信義區大道路9號11號1樓'],
['253646','松鑫','台北市中山區松江路208號'],
['253657','新文華','台北市中正區廈門街77號77之1號1樓'],
['253668','金門城','金門縣金城鎮金門城128-6號'],
['253680','龍武','新北市鶯歌區龍五路89號'],
['253691','科有','新竹市東區光復路一段531巷70-1號'],
['253716','逢大路','台中市西屯區逢大路13號1樓'],
['253727','福崙','新竹縣竹北市福興路705號1樓'],
['253738','南屏','高雄市左營區新下里華夏路256號'],
['253749','惠豐','高雄市楠梓區壽豐路517號519號521號'],
['253750','建中','新北市新莊區建中街6號8號'],
['253761','新壽豐','花蓮縣壽豐鄉中山路五段131號'],
['253783','萬壽','桃園市龜山區萬壽路二段1057號1樓'],
['253794','耀興','桃園市蘆竹區南山路二段328號330號1樓'],
['253819','廣泰','桃園市平鎮區廣泰路130號132號1樓'],
['253820','馬賽','宜蘭縣蘇澳鎮永榮里馬賽路151號'],
['253831','瑞揚','桃園市楊梅區新成路97號'],
['253842','幸和','新北市新莊區中和街174號176號1樓'],
['253853','林美','屏東縣林邊鄉中林路295號'],
['253864','寶成','高雄市新興區青年一路220號'],
['253886','學成','台南市學甲區慈生里中正路296號'],
['253897','慶陽','台北市中正區衡陽路93號1樓'],
['253901','樹東','新北市樹林區東榮街91巷2弄2、4號1樓'],
['253912','保長','雲林縣斗六市雲林路二段76號1樓'],
['253934','鈦旺','高雄市大社區中山路261號'],
['253945','星潭','花蓮縣花蓮市華西121-9及121-10及121-11號'],
['253956','雅神','台中市大雅區昌平路四段286號'],
['253967','尚頂','台南市永康區中正南路314號'],
['253989','金山街','新竹市東區金山街30號1樓'],
['253990','松邑','新竹市香山區牛埔南路2號'],
['254007','長和','台南市安南區長和一街39號'],
['254018','路好','高雄市路竹區大社路162號'],
['254029','大佶','桃園市桃園區三民路三段490號'],
['254030','豐樂','台中市北屯區崇德路三段608號'],
['254041','民工','嘉義縣民雄鄉北勢子73-54、73-55號1樓'],
['254052','北陽','台中市豐原區北陽路288號'],
['254063','崁鼎','屏東縣崁頂鄉崁頂村中正路135.137.139號1樓'],
['254074','鑫佳慶','台中市太平區大源二街1號1F'],
['254085','蓮莊','花蓮縣新城鄉北埔村光復路462號1樓'],
['254096','明新','新竹縣新豐鄉新興路5、7號1樓'],
['254100','珈多','新北市泰山區台麗街5號7號9號1樓'],
['254111','裕田','屏東縣里港鄉玉田路65-3號65-5號65-6號65-7號'],
['254122','昌福','新北市新莊區福壽街101號1樓'],
['254133','黃埔','高雄市鳳山區光遠路71號73號1樓'],
['254166','後驛','高雄市三民區安和里察哈爾一街148號1樓'],
['254177','奇岩','台北市北投區崇仁路一段76號'],
['254214','大興','新北市三重區仁華街80巷27號1樓'],
['254225','富華','基隆市中山區中華路9號'],
['254236','杰朋','新北市板橋區新海路385巷10弄11號'],
['254247','華德','新北市板橋區四川路二段47巷3弄8號及8之1號'],
['254258','江海','桃園市大園區中正東路三段343號'],
['254269','闔平','台南市安南區府安路五段98巷56弄33號'],
['254270','東敬','台南市東區莊敬路90號1樓;東平路35-1號、35-2號1樓'],
['254281','成曜','新北市五股區凌雲路一段87號89號91號1樓'],
['254292','韌性','宜蘭縣礁溪鄉礁溪路二段49號51號'],
['254317','清愿','台北市松山區八德路二段439號'],
['254328','鳳駿','高雄市鳳山區北門里鳳松路108.110.112號1樓'],
['254339','磐石','新竹市北區西大路740號1樓'],
['254340','篤鑫','基隆市七堵區堵南街22-1號1樓'],
['254351','崇道','台南市東區崇善路569、571號'],
['254362','湧北','桃園市八德區東勇街396-1號'],
['254395','偕成','新北市淡水區民生路54號'],
['254409','承富','台北市士林區承德路四段39號'],
['254410','僑隆興','台中市烏日區中山路三段180號'],
['254421','萬能科','桃園市中壢區萬能路1之2號1樓'],
['254432','新旭勝','新北市汐止區建成路160巷2號'],
['254454','道成','台南市北區北門路二段500號'],
['254465','高雄','高雄市前鎮區復興三路116號'],
['254487','工一','台中市西屯區工業區一路98-32號1樓'],
['254498','赤山','高雄市仁武區仁孝路368號1樓'],
['254524','湖鑫','新北市汐止區湖前街37號1樓39號1樓'],
['254546','新永華','台南市中西區永華路一段248號1樓'],
['254557','瑞明','新北市瑞芳區明燈路三段86號1樓2樓'],
['254627','大欣','台南市北區和緯路五段76號'],
['254649','敦北','台北市松山區敦化北路149號1樓'],
['254661','鹿鼎','台中市沙鹿區台灣大道七段812號1樓'],
['254683','新光信','桃園市桃園區中正路612號'],
['254694','美麗華','台北市中山區北安路839-1號'],
['254731','堤頂','台北市內湖區堤頂大道二段411號1樓'],
['254753','西濱','台南市南區中華南路二段317號319號'],
['254812','彰督','彰化縣彰化市南校街135號1樓'],
['254845','新廈門','台北市中正區廈門街46號1樓'],
['254856','旺來','新北市林口區文化三路二段20號1樓'],
['254878','一零一','台北市信義區信義路五段7號35樓'],
['254889','雙泰','新北市新莊區新泰路330號'],
['254890','松慶','台北市松山區慶城街1號1樓'],
['254926','建欣','台北市中山區建國北路二段13號1樓'],
['254971','康喜','台北市文山區興隆路三段42號'],
['255000','秀湖','台北市內湖區成功路四段359號1樓'],
['255011','權東','台北市中山區民權東路三段71號73號1樓'],
['255022','西湖','台北市內湖區內湖路一段321號'],
['255033','環湖','台北市內湖區環山路一段70號'],
['255044','貢寮','新北市貢寮區仁和路9號'],
['255055','金生','金門縣金城鎮西門里民生路67.69號'],
['255077','復橫','高雄市新興區復興一路28號30號32號1樓'],
['255088','修平','台中市大里區工業二路100號'],
['255099','大享','桃園市中壢區中正路1262號1樓'],
['255103','福峽','新北市三峽區介壽路一段286號1樓'],
['255125','佶林','桃園市中壢區吉林路128之11號1樓'],
['255136','大恩','台南市南區大同路二段692.694號及國民路2號'],
['255158','玫瑰','新北市新店區玫瑰路58巷4號地下室'],
['255169','鑫永年','高雄市三民區安康里九如一路877、877-1、877-2號1樓'],
['255170','民城','嘉義縣民雄鄉東榮村四鄰建國路一段134號'],
['255181','嘉華','嘉義市西區仁愛路415號417號'],
['255206','內灣','新竹縣橫山鄉內灣村2鄰20號'],
['255217','後庄','苗栗縣頭份市中央路603、605號'],
['255228','台博','新竹縣竹北市泰和里中和街10號'],
['255239','統賀','新竹縣竹北市中正東路67號69號'],
['255240','信東','苗栗縣頭份市忠孝里12鄰信東路158號'],
['255273','東禾','雲林縣古坑鄉東和村文化路145號'],
['255309','祥吉','新北市土城區延吉街194號'],
['255332','華太','台中市北區中華路二段137號'],
['255343','昌鴻','台中市北區賴厝里山西路一段48號'],
['255365','忠貞','桃園市平鎮區中山路63之3號63之5號'],
['255398','東埔','新竹市香山區牛埔路146號'],
['255413','樂三','基隆市安樂區樂利三街257號259號1樓'],
['255424','纘祥','宜蘭縣頭城鎮民鋒路18號20號'],
['255435','新台茂','桃園市蘆竹區南崁路一段135號'],
['255446','康軒','彰化縣秀水鄉安溪村彰鹿路19號'],
['255457','大銅','苗栗縣銅鑼鄉銅鑼村中正路6之25號'],
['255468','春城','台北市中山區長春路135號135之1號1樓'],
['255480','伊級','雲林縣林內鄉大同路20號'],
['255491','興武','桃園市桃園區復興路239之1號1樓;241號1樓'],
['255505','龍江','台北市中山區龍江路83號85號1樓B1'],
['255527','福林','台中市西屯區福林路31巷150號'],
['255538','雙慶','桃園市桃園區安慶街84號86號1樓'],
['255549','瓏門','桃園市中壢區龍昌路538號1樓'],
['255550','鳳凌','高雄市鳳山區中山路223.225.227號'],
['255561','蘆安','新北市蘆洲區長安街64號1樓'],
['255594','豐成','新北市板橋區三民路一段31巷89弄10號12號1樓'],
['255631','豐鎮','雲林縣西螺鎮光復西路259號'],
['255642','行真','台北市內湖區金莊路80號1樓'],
['255653','Fresh首府','台南市南區開南里新和東路138號1樓'],
['255664','林森北','台北市中山區民生東路一段29、31、33號'],
['255686','圓武','台北市中山區吉林路24號之2一樓'],
['255697','豐原文賢','台中市豐原區文賢街198號1樓'],
['255712','海景','彰化縣鹿港鎮東石里海浴路168號'],
['255723','永康忠孝','台南市永康區忠孝一路75號一樓'],
['255745','楊平','桃園市楊梅區中山南路518號'],
['255767','布蘭其','宜蘭縣五結鄉親河路一段147號'],
['255790','航祥','桃園市大園區三民路一段787號1樓'],
['255804','百利','新北市三重區仁義街229號231號'],
['255826','新野柳','新北市萬里區港東158號'],
['255848','湖口大智','新竹縣湖口鄉鳳凰村仁興路1巷27號29號1樓'],
['255871','豐原誠恭','台中市豐原區成功路505號1樓'],
['255882','蘆洲美和','新北市三重區仁美街100號102號'],
['255907','龍崎','台南市龍崎區崎頂里新市子202號1樓'],
['255918','明昇','新竹縣新豐鄉新市路168號'],
['255929','怡富','新北市中和區國光街215巷8弄1號3號5號(1樓)'],
['255930','前金自立','高雄市前金區七賢二路118號1樓自立一路5號1樓'],
['255941','垶岳','新北市五股區新五路二段281號1樓及夾層'],
['255952','龍聖','台南市永康區自強路439號1樓'],
['255963','深坑埔新','新北市深坑區北深路二段57.59.61號'],
['255985','岩秀','高雄市三民區鼎新路199巷15號'],
['255996','龍功','桃園市龍潭區成功路198號1樓2樓'],
['256003','安定蘇福','台南市安定區蘇厝里蘇厝289-11號1樓'],
['256014','威武','新竹縣關西鎮十六張111號1樓'],
['256025','北屯松和','台中市北屯區松和街80號1樓'],
['256047','達東','苗栗縣竹南鎮華東街83號'],
['256069','信仁','台北市大安區仁愛路三段143巷8號'],
['256081','順欣','南投縣南投市自強一路118號'],
['256092','湖口民生','新竹縣湖口鄉民生街416號'],
['256106','烏石港','宜蘭縣頭城鎮青雲路三段412.416.418號'],
['256117','冬山武淵','宜蘭縣冬山鄉富農路二段276號1+2樓'],
['256140','潮園','屏東縣潮州鎮公園路106號'],
['256162','大肚王福','台中市大肚區王福街752號'],
['256173','泉淼','台中市西區華美街237號1樓'],
['256209','學園','台中市龍井區台灣大道五段3巷30弄40號1樓部份'],
['256210','花蓮美崙','花蓮縣花蓮市中興路233號'],
['256221','榮盛','台中市大肚區榮華街48號'],
['256232','新店雙城','新北市新店區安康路三段96號'],
['256243','南興','彰化縣彰化市中山路一段119巷36、38號及南興街3號'],
['256254','中壢華強','桃園市中壢區自強四路64號'],
['256265','鑫康','台中市西屯區中康街46號'],
['256276','中正牯嶺','台北市中正區牯嶺街138號1樓'],
['256313','花都','彰化縣田尾鄉民生路一段582號'],
['256324','桃園香緹','桃園市龜山區萬壽路二段608號610號1樓'],
['256335','錚嬡','嘉義縣民雄鄉西昌村竹子腳1之7號'],
['256346','正德','台中市沙鹿區正德路120巷90號'],
['256357','賀潭','台南市歸仁區大潭里長榮路一段75號1樓'],
['256368','新竹樹林頭','新竹市北區士林里東大路二段618號'],
['256379','信義湧高','台北市信義區松高路77號地下1樓'],
['256391','海誠','高雄市鳳山區忠誠路100號'],
['256405','淡水揚海','新北市淡水區新市三路二段199號201號203號1樓'],
['256438','桃園竹春','桃園市蘆竹區大福路111號113號115號1樓'],
['256449','竹北復興','新竹縣竹北市復興二路68號 嘉豐七街60號62號66號'],
['256461','北屯雷中街','台中市北屯區雷中街2-18號1樓'],
['256483','梅州里','彰化縣田中鎮中州路二段398號'],
['256494','古坑中山','雲林縣古坑鄉中山路64號'],
['256508','光隆','台中市太平區光興路735號737號739號1樓'],
['256519','大安復興','台北市大安區復興南路一段247號'],
['256531','新屋永安','桃園市新屋區中山西路二段1272-1號'],
['256542','湖口信昌','新竹縣湖口鄉中勢村中平路一段315號'],
['256553','新竹縣政府','新竹縣竹北市北崙里光明六路10號B1'],
['256564','黎安','台中市西屯區上安路218號'],
['256575','大甲順天','台中市大甲區順天路154號'],
['256586','七堵長安','基隆市七堵區長安街239巷2號.241巷1號'],
['256597','吉勝','台南市仁德區仁愛里保仁路142號1樓146號1樓'],
['256601','鳳荔','高雄市大樹區實踐街79號81號83號85號'],
['256623','中山天津','台北市中山區天津街48.50號'],
['256634','宜蘭大洲','宜蘭縣三星鄉上將路三段130.132號'],
['256645','朴町','嘉義縣朴子市竹村里鴨母寮539號1樓'],
['256667','中壢光環','桃園市中壢區環中東路48號50號1樓'],
['256678','林口三井','新北市林口區文化二路一段123號1樓'],
['256689','岡山中山','高雄市岡山區民有路19號'],
['256704','新雲','台北市中正區臨沂街65巷25號、27號'],
['256715','新店豐和','新北市新店區央北一路100號'],
['256726','京中','高雄市仁武區京富路155號'],
['256737','金山環金','新北市金山區環金路286號'],
['256759','大麗花','彰化縣伸港鄉興工路530號'],
['256760','南州勝元','屏東縣南州鄉勝利路38-6號'],
['256771','新美皇','彰化縣大村鄉福興村山腳路67-2號'],
['256782','照南','苗栗縣竹南鎮佳興里至善街2號'],
['256793','展旺','新竹市香山區延平路二段1277號'],
['256807','高德','桃園市中壢區聖德路一段450號'],
['256863','松山富泰','台北市松山區新東街11巷28號'],
['256885','民雄十四甲','嘉義縣民雄鄉大崎村十四甲16之148號'],
['256900','新竹大遠百','新竹市北區西門街111號'],
['256911','台南星鑽','台南市中西區金華路三段218號'],
['256933','八德仁貴','桃園市八德區中山一路116號'],
['256944','欣保鑫','屏東縣車城鄉新街村保新路25之2號一樓'],
['256955','豐榮','台南市新市區大營里豐榮143號'],
['256966','大福','宜蘭縣壯圍鄉壯濱路六段250號1樓部分'],
['256977','宜居','台南市安南區國安里宜居路509號'],
['256999','竹崎錚好','嘉義縣竹崎鄉和平村坑仔坪163之5號1樓'],
['257006','千賀','桃園市中壢區月眉里6鄰月桃路242號'],
['257028','竹北勝利','新竹縣竹北市勝利十一路193號'],
['257039','湖口成功','新竹縣湖口鄉成功路616號、616-1號'],
['257040','八德榮興','桃園市八德區興豐路770號1樓'],
['257073','前鎮廣西','高雄市前鎮區廣西路468號1樓'],
['257095','森寓','台中市霧峰區柳豐路492號1樓'],
['257109','康詠','彰化縣彰化市彰南路五段406.408.410號'],
['257110','竹北中正西','新竹縣竹北市聯興里中正西路573號1樓'],
['257121','北屯洲探','台中市北屯區四平路576號'],
['257154','永建','雲林縣斗六市建成路97號99號'],
['257165','沅陞','桃園市中壢區文化二路257號1樓2樓'],
['257176','花和','台中市北屯區建和路一段410、412號'],
['257202','古坑水碓','雲林縣古坑鄉水碓村水碓1之1號'],
['257213','永康榮醫','台南市永康區復興路427號1樓'],
['257235','祥城','高雄市三民區自立一路411號1樓413號1樓2樓'],
['257246','龍潭神瓏','桃園市龍潭區神龍路37之1號'],
['257257','馬公三多','澎湖縣馬公市三多路99號1樓'],
['257268','觀高','桃園市觀音區文中路30號'],
['257279','鍾愛','新竹市香山區中隘里中華路六段697.699號1、2樓及701號1樓'],
['257291','樹林鳳園','新北市樹林區佳園路三段199號201號1樓'],
['257305','菩提','台中市大里區大明路66號.66之1號'],
['257316','鑫明','台中市大里區新明路14.16號1.2樓'],
['257327','屏東好棒','屏東縣屏東市永安里棒球路5號'],
['257338','內湖威剛','台北市內湖區潭美街535號'],
['257350','新惠','屏東縣新園鄉媽祖路53號'],
['257361','漁光','台南市安平區國平里34鄰健康路三段355號'],
['257372','和靖','彰化縣和美鎮和靖路1號1樓'],
['257383','冬山成興','宜蘭縣冬山鄉成興路251.253號'],
['257394','墾丁大灣','屏東縣恆春鎮墾丁路312號314號一樓'],
['257408','翠屏','高雄市大社區中山路350號1樓2樓'],
['257420','長九','新北市蘆洲區九芎街66 號'],
['257442','彰德','彰化縣彰化市香山里彰南路二段505號'],
['257453','八德富順','桃園市八德區介壽路二段804號806號808號'],
['257464','媽祖宮','台南市安南區鹿耳里顯宮二街2號'],
['257475','板橋金門','新北市板橋區金門街415號417號419號1樓'],
['257486','巨福','台中市烏日區興祥街21號23號25號27號'],
['257501','永康崑大','台南市永康區崑山里崑大路182號1樓'],
['257512','五福春','澎湖縣馬公市五福路361號'],
['257545','大潭','台南市歸仁區長榮路一段297-1號'],
['257556','大甲蔣公','台中市大甲區蔣公路270-1號'],
['257567','基隆星野','基隆市中山區復興路213號'],
['257578','科博之櫻','台中市西區博館二街129號'],
['257604','崇禮','基隆市七堵區永富路55號'],
['257615','大村村中','彰化縣大村鄉中正西路34巷2號'],
['257626','義崙','雲林縣二崙鄉中山路228號'],
['257637','龍肚','高雄市美濃區龍山里中華路60號'],
['257648','湖口德享','新竹縣湖口鄉德和路10巷55號.57號'],
['257659','楊梅環東','桃園市楊梅區環東路297號'],
['257660','虎興','南投縣草屯鎮虎山路652號'],
['257682','長富','台中市豐原區豐原大道一段165-10號'],
['257707','鑫大延','彰化縣彰化市大埔路619之1號'],
['257718','觀升','桃園市觀音區新華路一段486號'],
['257730','八德捷安','桃園市八德區興豐路635號1樓2樓637號1樓'],
['257741','雅楓','台中市大雅區民生路三段472號'],
['257752','浦和','新竹縣新豐鄉埔和村11鄰埔頂296號'],
['257763','勤學','台中市太平區中山路一段350號'],
['257774','泰山辭修','新北市泰山區辭修路10-7號1樓'],
['257796','鳳林鳳悅','花蓮縣鳳林鎮信義路117號'],
['257800','木木','新竹縣竹北市自強三路120號'],
['257811','桃園總圖','桃園市桃園區南平路301號1樓106櫃位'],
['257822','大員','台南市安平區安北路420號422號壹樓貳樓部分'],
['257833','喜福','桃園市龜山區文昌一街50號1樓'],
['257844','興鄰','台中市南區南門路59巷47、49號'],
['257855','梅瓏','桃園市龍潭區梅龍路517號1樓2樓與519號1樓'],
['257866','三峽大學路','新北市三峽區大學路67號69號1樓'],
['257877','三重森一','新北市三重區五谷王北街45巷50號52號56號1樓'],
['257899','坪林北宜','新北市坪林區北宜路八段229.231號1樓'],
['257903','翊豐','桃園市平鎮區中豐路一段36號'],
['257925','Fresh愿橋','高雄市仁武區高楠里霞海路378號'],
['257936','捷東','高雄市鳳山區鳳捷路112號'],
['257958','大安臥龍','台北市大安區臥龍街291-2號.291-3號'],
['257969','御豪','雲林縣虎尾鎮新生路146號'],
['257981','侖澧','南投縣草屯鎮中正路1132-1號'],
['257992','學愛','屏東縣麟洛鄉麟趾村中正路72之1號'],
['258010','戰車','台中市烏日區新興路461號'],
['258021','大園西園','桃園市大園區建國路154號156號'],
['258032','德寶','台北市士林區德行東路109巷106號'],
['258043','長治繁榮','屏東縣長治鄉繁昌村中山路39號'],
['258054','濰坊','桃園市觀音區大觀路一段311號1樓'],
['258065','豐荷','新竹縣竹東鎮中豐路二段338號1樓'],
['258087','蘆洲湧勝','新北市蘆洲區得勝街163號'],
['258098','三重向榮','新北市三重區大智街96號及長壽西街170號'],
['258102','鉦祺','台東縣台東市中興路一段279號'],
['258113','中山大直','台北市中山區大直街13號1樓'],
['258135','市政','台中市南屯區大墩十七街137號'],
['258157','庄鎂','台中市北屯區庄美街19號1樓'],
['258179','龍佳','苗栗縣竹南鎮龍山路三段152號1樓'],
['258191','虎興北','雲林縣虎尾鎮永興北三路125號'],
['258205','民銨','台中市梧棲區大仁路一段299號'],
['258216','豐邑','台中市龍井區龍社路48號1樓'],
['258227','田富臻','彰化縣田中鎮中州路一段135號'],
['258238','埔里鑫驛','南投縣埔里鎮中山路四段2之5號'],
['258249','新店中正','新北市新店區中正路396號398號'],
['258250','淡水銀河','新北市淡水區新市一路一段178號1樓'],
['258261','福秀','彰化縣福興鄉彰水路288號'],
['258272','永丰富','台中市太平區永豐路268-6號1樓'],
['258308','林森東','嘉義市東區林森東路315-1號'],
['258319','金源','新北市土城區福仁街22號24號1樓'],
['258320','星台','台北市內湖區南京東路六段392號1樓'],
['258353','鼓峰','高雄市鼓山區九如四路1795號'],
['258375','二城','宜蘭縣頭城鎮青雲路一段476號'],
['258386','和園','新北市新莊區公園路9號和興街1號1樓'],
['258397','民權西','台北市大同區民權西路120號'],
['258412','鑫新福','台中市太平區中山路四段211號2樓'],
['258434','馥羽','彰化縣和美鎮仁安路57號1樓'],
['258445','東廣','台東縣台東市傳廣路492號1樓'],
['258489','水長流','南投縣國姓鄉大長路532號'],
['258490','前鎮漁港','高雄市前鎮區漁港南一路37號1樓'],
['258504','慶華','高雄市前鎮區光華二路393號1樓'],
['258515','福緻','台中市沙鹿區福至路99號'],
['258526','后平','高雄市前鎮區佛道路218號'],
['258548','樂誠','台中市烏日區高鐵二路267、269號'],
['258559','馥郁','新北市板橋區光復街76號78號'],
['258582','朝興','台南市安南區海佃路四段55巷177號1樓'],
['258593','財旺','基隆市中正區新豐街460號'],
['258607','福恩','桃園市桃園區大有路914號'],
['258641','三井','台北市南港區經貿二路131號(B1-01300櫃位)'],
['258663','內關帝','屏東縣東港鎮文昌街41號'],
['258674','德崙','台南市仁德區德崙路23號1樓'],
['258685','青蔥','宜蘭縣三星鄉三星路四段315.317號'],
['258696','后豐','台中市后里區成功路507.509號1樓'],
['258700','士福','台北市士林區中正路219號'],
['258733','跳石','新北市石門區下員坑39之1號1樓與下員坑39之2號1樓'],
['258744','吉光','花蓮縣吉安鄉海濱86號1樓'],
['258755','五條港','雲林縣台西鄉五港路503號'],
['258766','森光','台北市中正區忠孝西路一段47號B1(櫃號KB111)'],
['258788','詔安','彰化縣和美鎮新庄里彰美路二段119號'],
['258803','自貿區','桃園市大園區航翔路101號'],
['258814','麗港','台北市內湖區內湖路一段737巷51弄4號4之1號'],
['258825','昇東','屏東縣潮州鎮朝昇東路91-1號'],
['258836','玲瓏','台北市中正區羅斯福路三段244巷7-1號'],
['258847','明泉','台南市安定區港南里港口55-1號'],
['258858','香榭','台北市南港區重陽路41號1樓'],
['258870','港明','高雄市小港區山明路291號1樓'],
['258881','多強','高雄市苓雅區三多四路106號1樓及自強三路52號54號1樓'],
['258892','民湖','台北市內湖區民權東路六段90巷8號.10號'],
['258906','力行','高雄市鳳山區力行路160號'],
['258917','逢善','台中市西屯區逢甲路132、134號'],
['258939','聖濱','新竹市北區聖軍路45號'],
['258940','勝華','新北市淡水區義山路一段395號'],
['258951','中原東','新北市新莊區中原東路91號1樓'],
['258962','德鑫','桃園市八德區新興路1145號1147號1樓1149號1樓2樓'],
['258973','內江','台北市萬華區內江街101號1樓'],
['258984','野柳東','新北市萬里區野柳里港東61號'],
['258995','品晶','桃園市觀音區中正路143號'],
['259002','福龍','桃園市平鎮區福龍路一段559號'],
['259024','聯大二坪','苗栗縣苗栗市恭敬里聯大1號(建築一館1F113室)'],
['259035','聯大八甲','苗栗縣苗栗市南勢里聯大2號(理工學院一館東側1樓)'],
['259046','大發','高雄市大寮區鳳林三路308號'],
['259057','亞熱帶','高雄市梓官區大舍南路297號299號'],
['259080','聯悅臻','台中市梧棲區臨港路4段586號'],
['259105','莊霖','新北市新莊區瓊林路59號之77'],
['259116','如義','苗栗縣三義鄉中正路192、193號'],
['259127','文賢','台南市北區文賢路1126號'],
['259138','捷新','新北市三重區重新路四段91號91-1號'],
['259149','太保驛','嘉義縣太保市中山路一段64號'],
['259150','清仁','新北市土城區青仁路358號清水路21號23號1樓'],
['259172','新三民','新竹縣竹北市三民路202、206號1樓'],
['259183','莊敬路','台北市信義區莊敬路390號'],
['259208','亞鑫','台中市大雅區雅環路一段188號'],
['259219','歐鄉','桃園市龍潭區大昌路一段60號1.2樓與大昌路62.64號1樓'],
['259242','石園','桃園市大溪區石園路750號1樓'],
['259253','塗城','台中市大里區塗城路270、272、274號1樓'],
['259264','莫內','新北市新莊區新知三路95號97號'],
['259286','竹清','新竹市北區中清路一段110號'],
['259297','外埔','台中市外埔區中山路250號'],
['259312','四維','台中市清水區四維路二段100號'],
['259323','富海','新北市板橋區長江路一段6號'],
['259334','新安高','台南市安定區港尾里港子尾38之3號1樓'],
['259345','仁里','屏東縣南州鄉三民路11號'],
['259356','榮家','雲林縣斗六市林頭里榮譽路132號'],
['259390','稻豐','南投縣草屯鎮新豐路627號及新豐路629巷1號'],
['259404','育樂','台中市北區雙十路二段62號1樓及育樂街92號1樓'],
['259415','力正','桃園市桃園區力行路100號1樓'],
['259426','開大','桃園市蘆竹區開南路1號(行政大樓一樓)'],
['259437','仁頂','桃園市大溪區仁和路一段205號207號1樓'],
['259448','喜雅滋','南投縣埔里鎮中山路一段266,268號'],
['259459','永群','宜蘭縣冬山鄉冬山路三段183號.185號'],
['259460','南海七','花蓮縣吉安鄉海岸路489號1.2樓'],
['259493','豐愉','南投縣南投市彰南路三段1267號'],
['259507','萬保','屏東縣萬丹鄉寶厝村中興路二段456號1樓及452號1樓'],
['259529','海大夢泉','基隆市中正區北寧路2號(第一餐廳)'],
['259541','錦和','新北市中和區錦和路362號364號'],
['259552','青昕','桃園市中壢區龍慈路36號38號'],
['259563','萬武','台北市萬華區萬大路486巷5.7號1樓'],
['259574','雙秀','新北市中和區秀朗路三段40.42號'],
['259611','工商','新北市五股區工商路153號153-1號1樓'],
['259622','銘興','桃園市龜山區明興街88號'],
['259633','文武','高雄市前金區七賢二路203號1樓'],
['259644','林厝','雲林縣四湖鄉文化路55號'],
['259666','宏大','宜蘭縣羅東鎮羅榮路2號'],
['259688','研華科','桃園市龜山區文德路27之5號B1'],
['259699','新深溪','基隆市信義區深溪路76號一樓部分、78號一樓全部'],
['259703','恩太','台中市北屯區環太東路556號'],
['259725','新延','新北市土城區延和路123號125巷1號'],
['259736','新橋','台南市永康區大橋一街245號1樓'],
['259747','康貴','台北市萬華區康定路154.156號1樓'],
['259758','新高','台中市太平區立功路150號152號一樓'],
['259770','鎮北','高雄市鳳山區鳳誠路16號'],
['259781','南園二','台北市南港區園區街3號2樓之7'],
['259806','埔新','彰化縣埔心鄉員鹿路一段123、125、127號'],
['259817','梓安','高雄市楠梓區旗楠路長安巷30之1號1樓'],
['259828','文鈺','台南市永康區西灣里文化路61號'],
['259840','崇光','台北市大安區復興南路一段135巷7號1樓'],
['259851','置地','台南市中西區西門路一段660號1樓'],
['259910','上晟','新北市泰山區信華五街126號128號1樓'],
['259932','竹元','新竹縣竹北市台元二街16號'],
['259976','吉德','台北市松山區八德路三段74巷43號1樓'],
['259998','南波灣','台南市永康區南灣里大安街75號'],
['260002','忠孝一','桃園市觀音區忠孝路189號'],
['260035','鈺星','台南市新化區全興里竹子腳177-11號1F+2F(部分)177-10號1F(部分)'],
['260057','塘林','彰化縣竹塘鄉竹林路一段447號'],
['260068','大竹人','桃園市蘆竹區大竹路401號403號1樓'],
['260079','通鑽','台北市中山區林森北路107巷83號'],
['260091','庫高','雲林縣土庫鎮建國路33-1號'],
['260105','重慶','新北市板橋區重慶路75號75號之2 一樓'],
['260116','開鑫','苗栗縣竹南鎮和仁街23巷10號'],
['260138','瓏來','桃園市中壢區龍昌路308號310號312號1樓'],
['260149','正和','新北市蘆洲區正和街87號89號一樓'],
['260150','雅點','台中市大雅區神林路一段202之1號202之2號202之3號'],
['260183','海湖北','桃園市蘆竹區海湖北路41號43號1樓'],
['260194','東億','雲林縣虎尾鎮光復路2號'],
['260219','雙盈','新北市永和區中正路465巷5、7號'],
['260220','建忠','台北市大安區忠孝東路三段251巷2弄1號'],
['260242','必勝','屏東縣內埔鄉龍泉村原勝路40號'],
['260253','新生北','台北市中山區德惠街65、67、69、71號'],
['260264','重榮','新北市三重區文化北路10號1樓'],
['260275','壢綻','桃園市中壢區建國路95號1樓'],
['260286','樂湖','台北市內湖區東湖路114號1樓'],
['260297','仁川','台南市歸仁區文化街二段116號'],
['260301','威京','台北市松山區八德路四段147號'],
['260312','新三德','新北市鶯歌區八德路5-3、5-4號'],
['260323','源興','彰化縣和美鎮彰和路二段320號'],
['260334','森晴','宜蘭縣礁溪鄉仁愛路42.46號'],
['260345','橘貝','彰化縣和美鎮南佃里彰草路三段19號'],
['260356','大理','台北市萬華區大理街128之1、128之2號1樓'],
['260378','飛駝','新北市中和區興南路二段159巷10號'],
['260390','重立','高雄市左營區重立路158號'],
['260404','月江','新北市板橋區中正路487號489號491號'],
['260415','順中','新北市樹林區中山路二段151巷12-2號'],
['260426','健康','嘉義市西區健康九路580號'],
['260437','京萬','台北市松山區南京東路三段331號1樓'],
['260518','崇輝','台南市東區東智里崇賢三路93號95號1樓'],
['260529','親河','宜蘭縣五結鄉親河路二段109.111.113號'],
['260541','東南','雲林縣西螺鎮東南路277號1樓'],
['260552','上亨','屏東縣萬丹鄉廈北村南北路二段277號'],
['260563','萊茵','新北市新店區竹林路30巷1號.3號1樓'],
['260585','潭佳','台中市潭子區僑興路95號97號99號'],
['260600','天喜','台東縣台東市光明路190.192號'],
['260611','鼎桃','桃園市桃園區宏昌六街281號1樓'],
['260622','新捷市','桃園市桃園區龍泉六街49號及龍城一街89號91號'],
['260633','布鹽','嘉義縣布袋鎮新厝里13鄰新厝仔67之1號'],
['260666','海濱','台中市清水區中華路429號'],
['260688','桃中','桃園市桃園區中正路233號1樓'],
['260699','富泰','花蓮縣花蓮市國聯一路55號'],
['260714','縣運','新竹縣竹北市莊敬南路21號1樓'],
['260725','垂楊','嘉義市西區垂楊里仁愛路315號'],
['260736','成美','台北市內湖區新明路317號'],
['260747','秋雅','新北市板橋區南雅南路二段144巷14號1樓'],
['260758','淡大','新北市淡水區北新路182巷5弄39號'],
['260769','太晟','南投縣草屯鎮中正路557之26號'],
['260770','光彩','嘉義市西區民生北路182號184號1樓'],
['260781','台林','嘉義市東區新生路723號'],
['260792','文一','台北市文山區木新路三段351號353號1樓'],
['260806','芬農','彰化縣芬園鄉彰南路四段337號1樓'],
['260817','新中工','台中市西屯區工業區一路58之1號'],
['260828','澤康','台中市南屯區五權西路二段412號1樓'],
['260839','合莊','高雄市新興區六合二路37號'],
['260840','慶寧','台北市大同區寧夏路23號23之1號'],
['260851','統新','台北市中正區臨沂街27巷10號1樓'],
['260862','市大','台北市松山區市民大道路四段105號'],
['260884','新莊伯','桃園市桃園區莊敬路一段175號177號1樓'],
['260895','新泰','新北市新莊區新泰路267號'],
['260909','創意','台南市永康區鹽行里中正二街268號'],
['260932','永保','新北市永和區保平路197號199號1樓'],
['260943','湖子內','嘉義市西區湖內里南京路124號'],
['260954','大道','台中市大里區仁化里至善路188號'],
['260965','欣功','台東縣成功鎮三民里大同路70號'],
['260976','里春','新北市三重區中正南路125、127號1樓'],
['260987','宏恩','苗栗縣頭份市中正路2號'],
['260998','鎵華','新竹市香山區中華路六段131.133.135號1樓'],
['261005','豐贊','台中市豐原區豐勢路二段979號1樓'],
['261016','益華','台中市北區健行路49號1樓'],
['261027','康壽','南投縣南投市復興路311號1樓'],
['261038','崇尚','台中市北屯區崇德路二段450號1樓'],
['261049','海洋','基隆市中正區中正路609號1樓'],
['261050','常勝','台南市北區長榮里長勝路1號'],
['261061','美德','台中市北區民權路472號1樓466巷1.3號1樓'],
['261072','新平','台中市太平區永平路一段105號107號1樓'],
['261083','生態園區','高雄市左營區博愛三路378.380號'],
['261094','聖約翰','新北市淡水區淡金路四段532號、534號1樓'],
['261108','孔鳳','高雄市小港區孔宅里高鳳路332號'],
['261119','強泥','高雄市苓雅區自強三路2.6號新光路72.74號'],
['261131','羅盛','台北市文山區羅斯福路六段235號237號1樓2樓'],
['261153','湧強','桃園市桃園區自強路215號1樓'],
['261164','隘口','新竹縣竹北市隘口二路27號'],
['261175','館源','苗栗縣苗栗市水源里11鄰水流娘15-3號1樓'],
['261186','關連','台中市梧棲區臨港路三段70.72號'],
['261197','新枋寮','屏東縣枋寮鄉枋寮村中興路7號1樓2樓'],
['261201','文化','高雄市苓雅區五福一路77號1樓'],
['261212','橋東','新北市汐止區建成路31號33號1樓'],
['261223','輔進','新北市新莊區中正路510號'],
['261234','鈺順','嘉義市西區新榮路35巷20號1樓'],
['261256','茶專','桃園市龜山區萬壽路二段353號1樓'],
['261267','聯順','台中市西屯區福聯里福順路898號900號'],
['261278','源栗','苗栗縣苗栗市水源里14鄰中正路1402號'],
['261304','香山','新竹市香山區牛埔路447號'],
['261315','花農','花蓮縣花蓮市建國路236號238號1樓'],
['261326','竹北中華','新竹縣竹北市中華路881號1樓'],
['261337','南勢角','新北市中和區興南路一段55號'],
['261348','大社','高雄市大社區翠屏里三民路304號'],
['261359','安福','新北市永和區福和路213號'],
['261360','藍山','新北市中和區南山路41號43號1樓及南山路37巷2號1樓'],
['261371','大台','台北市大安區羅斯福路三段333巷18號1樓20號1樓(部分)'],
['261382','連勝','新北市中和區景平路513號連勝街1號'],
['261393','安華','高雄市左營區明華一路126號'],
['261418','高昇','高雄市苓雅區中華四路64號'],
['261429','康健','台南市北區北門路三段49號'],
['261430','和東','彰化縣和美鎮愛德路27號'],
['261452','景捷','台北市文山區景福街252號'],
['261463','福美','新北市中和區景平路756號756之1號758號758之1號'],
['261474','華勛','桃園市中壢區華勛街191號193號一樓'],
['261496','欣仙吉','屏東縣新園鄉仙吉路128號130號132號1樓'],
['261511','文萊','高雄市左營區孟子路632號一樓'],
['261522','勝財興','南投縣埔里鎮榮光路1-11號'],
['261533','嘉德','嘉義市西區八德路73號'],
['261544','虎高','雲林縣虎尾鎮延平里3鄰中南34之26號'],
['261555','大屯','雲林縣虎尾鎮西屯里大屯349號'],
['261566','安民','新北市新店區安民街133巷9號11號'],
['261577','鼎東','屏東縣東港鎮興東里中正路二段491號1樓'],
['261588','安坑','新北市新店區安民街346號348號1樓'],
['261599','禾遠','新竹縣竹北市莊敬五街13號'],
['261603','見欣','新北市淡水區中正東路一段三巷12號1樓'],
['261614','竹滬','高雄市路竹區華正路390號'],
['261625','華文','高雄市苓雅區文橫二路2號與文橫二路二巷2號'],
['261636','南美','台中市南區南平路182號'],
['261658','權金','台北市內湖區金湖路405號1樓'],
['261669','前金','高雄市前金區自強二路172號'],
['261692','海豐','彰化縣田尾鄉中正路三段78號1.2樓'],
['261706','新港','嘉義縣新港鄉宮前村中山路72巷1號.中山路74號'],
['261717','小碧潭','新北市新店區中央路157號1樓'],
['261728','鑫庫','新北市深坑區北深路一段118號120號'],
['261739','志廣','桃園市中壢區志廣路107號109號1樓2樓'],
['261740','時尚','台南市永康區鹽洲里仁愛街19號21號1樓'],
['261762','國航','桃園市大園區國際路一段300-1號1樓'],
['261773','東儷','台中市西屯區臺灣大道四段1727號'],
['261795','竹捷','新北市淡水區竹圍里民族路10號'],
['261810','鑫文德','台北市內湖區文德路99號1樓'],
['261821','凱立','台北市士林區忠義街68號'],
['261832','森北','台北市中山區林森北路108號'],
['261854','新湖','雲林縣虎尾鎮林森路二段475號'],
['261865','松怡','台北市中山區民權東路二段146號1樓'],
['261876','鋒彩','桃園市中壢區中正路1439之1號'],
['261887','萬新','屏東縣萬丹鄉新鐘村萬新路342號'],
['261898','革新','台北市信義區永吉路32號34號'],
['261902','和和','新北市永和區秀朗路二段128號130號1樓'],
['261913','昱廣','高雄市左營區自由二路398號1樓400號1樓402號1樓'],
['261924','敦和','南投縣草屯鎮仁愛街197號199號1樓'],
['261946','建平','台南市安平區建平七街689號'],
['261957','瑞升','台北市大安區杭州南路二段91號'],
['261968','新盛心','高雄市前鎮區一心二路208號'],
['261979','永振','新北市中和區南華路14號'],
['261980','好事登','高雄市楠梓區鳳楠路235號朝明路233號'],
['262008','光寶','台北市北投區光明路132之2號1.2樓'],
['262019','忠隆','台北市信義區忠孝東路五段71巷6號1樓'],
['262020','風復','台北市松山區復興南路一段43號1樓'],
['262031','修德','新北市三重區重陽路三段11號13號1樓'],
['262042','育德','台南市北區民德路87號'],
['262053','公道','台南市南區夏林路1-16號、1-17號'],
['262064','澎港','澎湖縣馬公市鎖港里292號1樓'],
['262075','太華','高雄市前金區成功一路455之1號'],
['262086','玉興','桃園市大園區華興路一段1號1樓.和平西路145號2樓'],
['262097','學源','高雄市前鎮區三多二路437號439號441號441-1號1樓'],
['262101','豐訊','桃園市平鎮區中豐路山頂段479號'],
['262112','蓮潭','高雄市左營區店仔頂路23.25號'],
['262123','香城','台北市南港區南港路一段167號1樓'],
['262134','田金','高雄市小港區山明里水秀路59號'],
['262156','新大億','台中市太平區大興路151號151-1號'],
['262167','嘉庚','嘉義縣朴子市仁和里嘉朴路西段8號'],
['262178','永正','台南市永康區永康里中山南路537號'],
['262189','新宇鈞','新北市樹林區大安路115號117號1樓'],
['262190','正大','新北市三重區中正北路235號'],
['262204','尚群','桃園市八德區中山路181號'],
['262226','吉盛','台北市松山區南京東路五段66巷3弄1號1樓'],
['262237','富貴角','新北市石門區大溪墘2-1號1樓'],
['262248','太武山','金門縣金湖鎮太湖路一段29號'],
['262259','十興','新竹縣竹北市莊敬北路130號'],
['262260','民真','嘉義縣民雄鄉民新路188號'],
['262271','四季春','高雄市楠梓區鳳楠路82號1樓'],
['262282','鈺勝','台南市北區小東路307巷75號77號1樓'],
['262293','湖華','台南市中西區西湖街3號'],
['262307','文五','台南市安平區文平路217號1樓'],
['262318','東星','台東縣台東市正氣路159.159-1號1樓'],
['262329','宏得','南投縣埔里鎮仁愛路450之2號1樓'],
['262330','福廣','台中市大雅區中山路1號3號5號1樓'],
['262341','新晴光','台北市中山區雙城街30號1樓'],
['262374','環興','桃園市平鎮區環南路188號1 樓'],
['262396','保忠','新竹市東區忠孝路1號'],
['262400','鹽埕','高雄市鹽埕區大仁路137號139號1樓瀨南街172號1樓'],
['262411','新三華','高雄市新興區中東里復興一路72號1樓'],
['262433','成發','彰化縣彰化市彰水路177號'],
['262444','信吉','台北市信義區永吉路278巷58弄2號'],
['262455','華園','台南市北區北門里公園南路71號'],
['262466','東義','台中市北區北平路二段141號1樓'],
['262477','全鎮','桃園市桃園區春日路238號240號1樓'],
['262488','康榮','台南市北區實踐里北門路三段2號'],
['262499','逢大二','台中市西屯區福星北路98號1樓'],
['262514','向上','台中市南屯區黎明路二段193號'],
['262525','樂美','台北市中山區樂群三路75號77號1樓'],
['262536','國旺','台北市中山區南京東路一段132巷8號'],
['262547','永竹','新北市永和區竹林路172號174號1樓'],
['262558','安峰','新北市新店區安康路二段350之3號'],
['262569','忠愛莊','桃園市觀音區忠愛路一段90號92號1樓'],
['262581','公園賞','新北市泰山區仁愛路66號'],
['262606','潮昇','屏東縣潮州鎮三和里朝昇路316號'],
['262617','鶯湖','新北市鶯歌區大湖路374號'],
['262628','新龜山','桃園市龜山區萬壽路二段1170號'],
['262639','百惠','台中市西屯區台灣大道三段182號1.2樓'],
['262651','益壽','桃園市桃園區延壽街169號171號'],
['262662','嘉美','桃園市蘆竹區大新路454.456號1樓'],
['262673','豐康','新北市三峽區成福路241號'],
['262684','埔墘','新北市板橋區永豐街87號1樓'],
['262695','慈苑','嘉義縣大林鎮平林里6鄰下潭底23-5號'],
['262709','崴信','桃園市桃園區信光路22號1樓'],
['262710','嶺雙','桃園市中壢區民族路五段76號78號'],
['262721','中港','新北市新莊區中港路133號'],
['262732','孟竹','新竹市東區軍功里16鄰建新路26號1樓'],
['262754','得永','高雄市仁武區八德西路1870-1號1樓'],
['262765','重德','高雄市左營區政德路585號'],
['262787','福州一','桃園市中壢區福州一街102號1樓'],
['262798','真樂','苗栗縣苗栗市玉清路329號1樓'],
['262802','板宏','新北市板橋區宏國路109.111號'],
['262813','坤耀','新北市板橋區南門街39號1F'],
['262824','馬祖','連江縣南竿鄉介壽村215號1樓'],
['262835','鈱鎙','苗栗縣頭份市田寮里14鄰民族路501.503號1樓'],
['262846','瑞順','高雄市鳳山區瑞興路216號1樓'],
['262868','宏太','桃園市桃園區桃鶯路384-9號384-10號1樓'],
['262879','順風','彰化縣彰化市中華西路212號'],
['262880','二水','彰化縣二水鄉員集路四段6.8.10號'],
['262891','高工','台中市南區高工路168號1樓'],
['262905','哨臨','高雄市鼓山區臨海二路52號1樓52-1號1樓'],
['262916','武江','新北市板橋區光武街2巷2號'],
['262927','稻江','台北市中山區新生北路三段35號農安街67號69號'],
['262938','文潭','新北市樹林區千歲街61巷44號1.2樓和46號'],
['262949','樂安','台北市大安區樂業街71號73號'],
['262950','富強','台中市北區國強街142號及天祥街100號1樓'],
['262961','捷忠','台北市信義區忠孝東路五段617號'],
['262972','翔運','台北市中山區中山北路二段44巷2號1樓'],
['262983','鼎富','台南市關廟區南花里中正路881號'],
['263001','基義','基隆市中正區義二路181號185號1樓'],
['263012','北福','新北市永和區福和路121號1樓2樓'],
['263023','聰明','台北市松山區寶清街34號1樓'],
['263034','新兆湘','高雄市岡山區介壽路78號'],
['263045','桃朋','桃園市桃園區大興西路二段1號1樓'],
['263056','仁雄','高雄市仁武區仁雄路6之11號1樓'],
['263078','新再發','金門縣金湖鎮復興路8號10號'],
['263089','景安','新北市中和區景安路210號1樓'],
['263090','龍泉','台北市大安區羅斯福路三段193號1樓'],
['263115','和復','新北市中和區復興路19號'],
['263126','崗正','高雄市前鎮區瑞平里公正路25號'],
['263137','義興','台中市南區復興路一段128號'],
['263159','東社','桃園市平鎮區平東路148號150號'],
['263160','景福','新北市中和區景新街467巷22號'],
['263171','歌園','新北市鶯歌區國華路31號'],
['263182','陽州','新北市蘆洲區重陽街92.96號1樓'],
['263193','來家','高雄市鳳山區新強里崗山北街36號38號1樓'],
['263207','竹圍東','高雄市岡山區竹圍東街93號1樓'],
['263218','竑嘉','新北市三重區仁愛街32號之1'],
['263229','權強','新北市新店區民權路68號'],
['263230','升榮','桃園市龜山區文化三路81巷1號1樓'],
['263241','新博如','高雄市三民區博愛一路1號'],
['263252','頭目','屏東縣三地門鄉中正路二段3號1樓'],
['263263','湯城','新北市三重區重新路五段609巷16之7 號1樓'],
['263274','觀湖','桃園市觀音區濱海路廣興段132號'],
['263285','國揚','桃園市桃園區莊敬里經國路242號1樓'],
['263296','錦明','桃園市蘆竹區光明路二段102號1樓'],
['263300','金陵','桃園市平鎮區金陵路76號78號1樓'],
['263311','慶城','台北市中正區武昌街一段18號1樓'],
['263322','豐后','台中市豐原區三豐路二段186、188號1樓'],
['263333','日揚','新北市三重區中正北路18之2號之3號之4號1樓'],
['263344','中行','新北市新店區中興路一段193號195號1樓'],
['263355','嶄新','新北市新店區中正路57-2號1樓'],
['263377','汐旺','新北市汐止區中興里6鄰中興路105號'],
['263388','壢美','桃園市中壢區中美路39號1樓及建國北路55號1樓'],
['263399','富里','台南市安南區安富里府安路五段154號155號156號'],
['263403','長沙','彰化縣花壇鄉中正路130號1樓'],
['263414','盧奉','桃園市蘆竹區奉化路25號27號1樓'],
['263425','航海','桃園市蘆竹區南山路一段175之1號1樓'],
['263436','月眉','台中市后里區民生路226.228號1樓'],
['263447','竹運','新竹市東區中華路二段471號'],
['263470','禧緻','新北市中和區華新街156號'],
['263481','宜安','新北市中和區宜安路103號1樓'],
['263492','八德','台北市中正區臨沂街1號1樓'],
['263506','江陵','台北市中山區一江街23號1樓'],
['263517','新和慶','基隆市中山區中和路166之5號166之6號1樓'],
['263528','東森','台南市北區林森路三段76號78號'],
['263539','新饒河','台北市松山區八德路四段697號1樓'],
['263540','長慶','桃園市龜山區長慶三街68號78號82號1樓'],
['263551','新街','桃園市中壢區環北路537號539號543號1樓'],
['263562','涵碧','新北市新店區永業路6號6之1號8號'],
['263573','東鐵','新竹縣竹北市隘口三街231號1樓'],
['263595','南北棧','屏東縣枋山鄉枋山村中山路三段38號'],
['263609','新自孝','屏東縣屏東市北勢里自由路476號壹樓'],
['263610','文漾','高雄市新興區文橫二路164-1號.164-2號'],
['263621','宏順','高雄市苓雅區三多一路66號68號'],
['263643','新昌','高雄市左營區光輝里後昌路637號639號1樓'],
['263654','方城市','高雄市三民區文濱路22號'],
['263665','新真愛','台南市永康區東橋六街208號1樓'],
['263676','智惠','台中市西屯區智惠街52號1樓'],
['263687','財豐','基隆市中正區新豐街389號1樓'],
['263698','富美','新北市五股區五股工業區五權路23號'],
['263702','新真理','新北市淡水區新民街102號104號'],
['263713','新大慶','基隆市中山區中和路168巷7弄13號15號1樓'],
['263735','鑫海','桃園市蘆竹區龍安街二段1007號1樓'],
['263757','錦龍','台北市中山區龍江路281-1號'],
['263768','瑞元','桃園市蘆竹區長春路87號'],
['263779','圓德','新北市中和區圓通路391之3號391之4號391之5號1樓'],
['263780','光復','台北市信義區光復南路471號'],
['263791','麗安','台北市內湖區內湖路一段445號1樓'],
['263805','曉陽','彰化縣彰化市民族路341號343號1樓'],
['263816','賴厝','台中市北區漢口路四段102號1樓.地下樓'],
['263827','連埔','桃園市桃園區大連一街61號正康四街8號1樓'],
['263850','台師大','台北市文山區汀州路四段88號行政大樓1樓'],
['263861','鴻瑞','台北市內湖區瑞光路335號1樓'],
['263894','光忠','台北市大安區復興南路一段107巷5弄1號1樓'],
['263908','笙園','桃園市中壢區新生路738號740號742號1樓'],
['263919','君匯','桃園市大園區園航路411號413號1樓'],
['263920','電通市','桃園市蘆竹區南山路一段27號29號1樓'],
['263931','廣沅','苗栗縣竹南鎮公義里公義路1683號1685號1樓'],
['263942','龍昇','苗栗縣竹南鎮龍山路二段120號'],
['263953','元祖','雲林縣元長鄉中山路4-100號'],
['263964','元長','雲林縣元長鄉長南村7鄰中山路32號.32-2號1F'],
['263975','鎮昌','高雄市前鎮區鎮海里鎮海路17號1樓'],
['263986','信科','高雄市左營區重信路601號'],
['263997','中義','高雄市新興區六合一路27號'],
['264004','竹永','新竹縣竹東鎮仁愛里北興路二段185號187號'],
['264015','俊國','台中市西屯區永福路40巷5號7號1樓'],
['264026','埔站','新北市板橋區民生路二段237號1樓'],
['264037','內庄','台南市大內區內庄172-8號1樓'],
['264059','楓江','新北市泰山區楓江路39之1號39之2號1樓'],
['264060','松美','台南市善化區小新里成功路2-2號'],
['264071','新縣政','新竹縣竹北市光明九路12號1樓'],
['264082','銘仁堂','桃園市龍潭區民生路139號1樓'],
['264093','富新','新北市新莊區瓊林南路118-5號'],
['264107','萬惠','屏東縣萬丹鄉萬丹路一段21號1樓'],
['264118','建宗','新北市板橋區溪福里篤行路三段玉平巷76弄8號及10號'],
['264129','京興','台北市松山區南京東路五段206號1樓'],
['264130','商城','台北市北投區裕民六路111號113號1樓'],
['264141','吉昌','花蓮縣吉安鄉吉安路一段114號1樓'],
['264152','新勤益','台中市太平區中山路一段217號'],
['264163','三春','彰化縣花壇鄉彰員路一段臨551號'],
['264185','鑫公信','台北市中正區信陽街9號11號1樓'],
['264196','得合','高雄市仁武區八德西路1660號'],
['264200','永仁','高雄市仁武區八卦里永仁街436號'],
['264211','三田','新北市三重區福田里三民街274號276號1樓'],
['264222','豐泰','台中市豐原區豐勢路二段396號'],
['264255','克里斯','台北市內湖區五分街33號35號1樓'],
['264266','龍延','台北市大安區師大路59巷13號'],
['264277','邁群','新北市永和區民生路42號'],
['264288','毓鄰','台北市內湖區新湖二路160號162號1樓'],
['264325','正鵬','新北市新店區中正路688號690號1樓'],
['264336','民生北','桃園市龜山區民生北路一段54號1樓'],
['264347','國安','桃園市桃園區經國路405號'],
['264369','廣進','新北市新莊區四維路173號'],
['264370','松京','台北市中山區南京東路二段144號1樓'],
['264381','豐春','台中市南屯區文心南路100號'],
['264392','復麗','桃園市桃園區復興路162號1樓'],
['264406','柳營','台南市柳營區士林里柳營路二段1號3號'],
['264417','新壢','桃園市中壢區日新路66號68號'],
['264428','勇利','桃園市龜山區文化一路86-6號'],
['264439','尚國','桃園市桃園區國強一街218號220號1樓'],
['264440','強鹿','新竹縣竹北市自強北路256號1樓'],
['264451','航園','桃園市大園區中正東路102號'],
['264462','講美','澎湖縣白沙鄉講美村78號1樓'],
['264473','沿海','高雄市小港區康莊路178之1號1樓'],
['264484','合生','屏東縣潮州鎮中正路1號'],
['264495','學廣','屏東縣內埔鄉內埔村廣濟路2-6號'],
['264509','覺民','高雄市三民區覺民路113號115號'],
['264510','善文','台南市善化區中山路518號'],
['264521','中勇','台中市南屯區忠勇路105之27號1樓'],
['264532','寶昇','台中市北屯區北屯路224之1號'],
['264543','興府','台中市大雅區學府路51號'],
['264565','社子島','台北市士林區延平北路九段215號'],
['264576','莊龍','新北市新莊區龍安路66號68號'],
['264587','松興','高雄市小港區松山里高鳳路34-3號34-4號34-5號34-6號'],
['264598','清峰','台中市清水區中華路330號、鰲峰路173-3號'],
['264602','僑興','新北市板橋區僑中二街116巷2號.4號'],
['264613','榮總','台北市北投區石牌路二段301號'],
['264624','科管','新竹市東區科園里新安路2之1號1樓'],
['264635','成都','台北市萬華區成都路96號1樓'],
['264646','永進','台中市北區進化北路297號'],
['264657','愛田','花蓮縣吉安鄉建國路一段200號.202號'],
['264668','富仟','新北市三重區五谷王北街139號'],
['264679','鑫鋒','新北市新店區北新路一段90號1樓'],
['264680','新福民','新北市新店區中央路135號1樓'],
['264691','景順','新北市中和區中正路778號1樓'],
['264705','環埔','桃園市中壢區領航北路一段281號1樓'],
['264716','福興','新北市泰山區全興路165號'],
['264727','安平','台南市安平區安平路99號'],
['264738','新盛昌','新北市汐止區長江街13巷1號'],
['264749','桃全','桃園市桃園區中正路342號1樓2樓'],
['264750','鑫巴黎','台中市北屯區崇德路二段199號1樓'],
['264761','達勇','高雄市三民區九如二路345-1號'],
['264772','興國','高雄市三民區建國二路123號1樓'],
['264783','榮信','新北市新莊區中原里中榮街25鄰90號92號1樓'],
['264794','新竹建華','新竹市東區建華街2號1樓'],
['264808','新林口','新北市林口區中正路90號92號1樓'],
['264819','苑裡','苗栗縣苑裡鎮房裡里13鄰北房8-9號'],
['264820','新站','新竹市東區榮光里林森路7號中華路二段458號'],
['264831','寧夏','台中市西屯區寧夏路105號'],
['264853','甲旺','台中市大甲區經國路2076號'],
['264864','埔竹','新竹市東區埔頂二路148號1樓'],
['264875','濟新','台北市中正區濟南路二段50號'],
['264886','鑫博','高雄市鼓山區明誠里博愛二路345號1樓'],
['264897','民族西','台北市大同區民族西路151號153號155號'],
['264901','瑞豐','桃園市楊梅區瑞原里民富路三段22號24號'],
['264912','農專','宜蘭縣宜蘭市神農路一段96號98號'],
['264923','慶林','台北市信義區虎林街151號153號1樓'],
['264934','昌平','台中市北屯區昌平路一段70號'],
['264956','美樹','高雄市三民區十全三路2號6號'],
['264967','長曜','新北市林口區文化三路一段249巷36號.38號1樓'],
['264978','光明','新北市蘆洲區光明路71號'],
['264989','聯坊','台北市南港區東新街118巷1號'],
['265018','安復','新北市新莊區復興路一段213號'],
['265029','伯爵','新北市汐止區明峰街13號13之1號1樓'],
['265030','吉客','新北市中和區德光路90號92號1樓'],
['265041','府運','新北市板橋區重慶路18號20號1樓'],
['265052','岡好','高雄市岡山區岡山路612、612-2號1樓'],
['265063','新田園','桃園市大園區新興路62號'],
['265074','篤明','新竹市東區林森路184號'],
['265085','匯陽','台北市內湖區陽光街288號1樓'],
['265122','玄海','桃園市大園區和平西路二段5號'],
['265133','嘉洋','嘉義市西區民生南路600號'],
['265155','靜安','台北市大安區光復南路262號'],
['265166','王公','高雄市林園區頂厝里田厝路2-1號1樓'],
['265177','洲美','台北市士林區延平北路六段505號'],
['265199','龍井豐御','台中市龍井區沙田路六段323號'],
['265203','長城','台北市中山區中山北路二段56號1樓'],
['265214','崴盛','桃園市桃園區慈文路51號;正康三街284號'],
['265225','松林','新北市板橋區松江街109巷1號松江街107號'],
['265236','中德','新竹縣北埔鄉北埔村中山路42號一樓'],
['265247','奕真','新北市泰山區明志路二段185號1樓(部份)'],
['265269','源德','新北市淡水區水源街一段75-2號1樓'],
['265270','墩十九','台中市西屯區大墩19街186號'],
['265281','彰化金泰','彰化縣彰化市金馬路一段358號1樓'],
['265292','斗六正心','雲林縣斗六市西平路362號'],
['265306','安龍','台中市西區五權路2-12號2-13號1樓'],
['265317','欣鑫','南投縣南投市仁和路26號'],
['265328','昇容','新北市板橋區重慶路346巷8號'],
['265339','員泉','宜蘭縣員山鄉溫泉路1之27號1之28號1樓'],
['265340','多利','桃園市新屋區中山東路二段760號1樓'],
['265362','台南民族','台南市中西區公正里民族路二段53號'],
['265373','五峰鄉','新竹縣五峰鄉大隘村12鄰五峰246之3號(臨)'],
['265384','藍天','新北市林口區公園路203號之1;203號之2'],
['265395','新永元','新北市永和區永元路28號30號'],
['265409','淡海','新北市淡水區淡海路178號1樓'],
['265410','逢福','台中市西屯區黎明路三段348號'],
['265421','原義','台中市西屯區忠義街80號'],
['265432','景茂','桃園市蘆竹區南山路一段391號'],
['265443','艾科卡','新北市汐止區茄苳路196號'],
['265454','隆合','台北市文山區羅斯福路五段218巷28號30號'],
['265465','鑫忠孝','台北市大安區忠孝東路四段313號1樓'],
['265476','清境','南投縣仁愛鄉定遠新村26之1號'],
['265487','昌富','高雄市三民區大豐一路151號153號'],
['265513','文東','高雄市前金區新田路226號228號'],
['265524','泰武','屏東縣泰武鄉佳平巷12-2號16號1樓'],
['265535','龍騰','基隆市中正區義一路22號24號'],
['265546','新美','台中市大甲區經國路329號'],
['265568','成興','台中市中區柳川里成功路271號1樓、興中街68號1樓'],
['265579','樹豐','新北市新莊區豐盛一街6.8.10號'],
['265591','新德蕙','屏東縣屏東市大連里興豐路193號'],
['265605','巧龍','基隆市七堵區百三街61號'],
['265616','精工','台南市永康區中正北路735號'],
['265627','立德','新北市中和區立德街103號'],
['265638','泰和','新北市三重區長安街71號1樓'],
['265650','集鑫','台北市士林區延平北路六段229號231號'],
['265661','新泰順','台北市大安區泰順街13號'],
['265672','合喬','新北市樹林區三福街68號'],
['265683','學業','屏東縣竹田鄉竹南村潮州路90-1號'],
['265720','鑫大安','台中市大安區中山南路271號'],
['265775','樂明','台北市中山區敬業一路56號'],
['265801','冒泡','宜蘭縣員山鄉大湖路18-21、18-22號'],
['265834','莊鳳','新北市新莊區雙鳳路49號51號1樓'],
['265856','輔醫','新北市泰山區貴子路57號(右半)61號63號1樓'],
['265867','泰言','高雄市旗山區中正路81號'],
['265878','慶順','台中市大肚區中沙路168號'],
['265890','正鎰','桃園市桃園區正光二街155號1樓'],
['265915','統上','桃園市中壢區新中北路457號459號'],
['265937','城東','台南市東區自由路一段158號160號1F'],
['265960','吾界','桃園市桃園區大業路一段316-7號'],
['265982','好勢','屏東縣竹田鄉西勢村龍門路170號'],
['266000','樹德','高雄市橋頭區樹德路60號62號'],
['266022','長冠','桃園市中壢區長春路227號'],
['266044','草馨','桃園市觀音區大觀路二段53號'],
['266066','冬樂','台北市士林區美崙街114號'],
['266077','三勝','雲林縣麥寮鄉仁德西路一段37號'],
['266088','和正','新北市中和區中正路276號1樓'],
['266103','長漢','新北市板橋區長安街331巷109號111號'],
['266125','統讚','桃園市中壢區龍江路60之1號1樓'],
['266147','中角','新北市金山區海興路172-2號'],
['266169','萬巒','屏東縣萬巒鄉中正路29號'],
['266309','海豚灣','屏東縣枋山鄉坊山村中山路三段61-3號1樓'],
['266310','新福慶','台北市士林區基河路1號1樓(部份)'],
['266321','鑫港醫','台中市西屯區台灣大道四段1650號1樓'],
['266343','新豐榮','屏東縣屏東市豐源里廣東路86之1號1樓'],
['266354','金大埔','苗栗縣竹南鎮大埔七街50號'],
['266376','吉宏','台中市烏日區九德里20鄰中華路593號'],
['266387','新長澄','高雄市鳥松區大埤路123號'],
['266398','合平','高雄市苓雅區安祥里六合路60號'],
['266402','新新賢','高雄市新興區開平里七賢一路268號270號'],
['266435','欣聖','台中市東勢區新盛街290號一樓'],
['266446','元信','新北市三重區元富一街45號47號1樓2樓'],
['266457','慶忠','新北市新店區北新路二段121巷1號'],
['266468','一品','桃園市楊梅區民生街149號'],
['266479','城林','新北市土城區學成路18號20號'],
['266480','崙萍','桃園市觀音區忠愛路一段339號'],
['266505','強陽','新北市三重區自強路二段20號1樓及地下室'],
['266538','愛三','基隆市仁愛區仁五路6號'],
['266561','鳳竹','新竹縣竹北市鳳岡路三段160號'],
['266608','萊福','台北市信義區林口街48號'],
['266664','台大','台北市中正區林森南路53號55號'],
['266686','漢慶','台北市中正區漢口街一段82號1樓'],
['266778','安邦','新北市中和區連勝街68號1樓'],
['266789','元泰','屏東縣萬丹鄉萬後村萬壽路二段346號'],
['266815','干城','花蓮縣吉安鄉吉安路六段1號'],
['266826','振裕','桃園市八德區福德一路46號48號1樓'],
['266860','黎明','宜蘭縣宜蘭市延平路19之15號'],
['266871','丸山','宜蘭縣冬山鄉義成路二段29號'],
['266882','金正','桃園市平鎮區金陵路2段448號452號'],
['266893','利中','桃園市中壢區文中路二段350號'],
['266918','十美','桃園市中壢區中美路一段12號1樓B櫃'],
['266929','鑫館','台北市中正區汀州路三段180號'],
['266941','統流','台南市新市區王甲路11號B1樓'],
['266952','圓和','新北市中和區中正路275號1樓'],
['266985','山鼻驛','桃園市蘆竹區機捷路二段766號'],
['267014','松復','台北市松山區光復北路32號1樓'],
['267025','為公','苗栗縣苗栗市為公路602號'],
['267036','寶國','高雄市三民區褒揚街210號212號1樓2樓'],
['267047','壹順','台中市太平區樹孝路253號'],
['267058','汐德','新北市汐止區福德二路49號.51號.53號'],
['267070','后厝','苗栗縣竹南鎮龍山路一段211號'],
['267081','太堤','台中市大里區立仁路371號373號壹樓'],
['267092','仁林','高雄市仁武區仁林路204號'],
['267106','水晴川','台南市安南區國安里生態街577號'],
['267117','惠陽','台中市豐原區惠陽街91、91-1及91-2號1樓'],
['267128','泰肱','新北市五股區成泰路三段545號547號1樓'],
['267140','峰州','台中市霧峰區錦州路399號一樓'],
['267151','乾坤科','新竹縣寶山鄉研發二路2號3樓'],
['267162','聖麗','台中市大里區爽文路998號'],
['267173','龍鳳','苗栗縣竹南鎮龍江街17、19號'],
['267184','安海','台北市中山區北安路458巷47弄51號'],
['267195','密蒙花','彰化縣線西鄉慶濱路18號'],
['267209','糖鑫','彰化縣和美鎮美寮路一段483,485號'],
['267210','青田','台北市大安區和平東路一段141巷15.17號1樓'],
['267243','寶得','桃園市桃園區南平路502號1樓'],
['267254','金峰','新北市土城區明峰街10號12號'],
['267276','馬偕兒','新竹市東區建功二路28號B1'],
['267287','嘉城','嘉義市西區新民路771.775.777號'],
['267298','華豐','高雄市鼓山區裕誠路1160號1162號'],
['267302','大益','桃園市觀音區濱海路大潭段22之1號'],
['267335','好蒔光','南投縣仁愛鄉仁和路88號'],
['267346','竹星','桃園市蘆竹區上興路129號'],
['267357','新忠福','桃園市蘆竹區龍安街二段310號'],
['267368','西武','台北市內湖區內湖路一段285巷65弄2號1樓'],
['267380','牛角坡','桃園市龜山區樂善二路650號1樓'],
['267405','祥福','台北市中山區撫順街8號'],
['267416','德虎','台北市信義區松德路157.159號'],
['267427','鑫親旺','台中市大肚區沙田路二段195號199號'],
['267438','觀杉','桃園市觀音區中山路二段22號'],
['267450','金葳','台中市北屯區軍福十九路681號'],
['267461','楓樹','桃園市龜山區忠義路一段202號1樓2樓'],
['267472','樟隆','台北市文山區興隆路四段50-3.50-4號1樓'],
['267483','富禹','新竹市東區埔頂三路6號'],
['267494','園桂','台北市萬華區西園路一段80.82號1樓'],
['267508','新輔英','屏東縣東港鎮中山路2號'],
['267519','多慶','桃園市桃園區永安北路501號1樓503號1樓'],
['267531','爽文','台中市大里區爽文路692號1樓永隆二街189號191號1樓'],
['267564','愛將','台北市中正區愛國東路60號1樓.B1'],
['267586','吉強','花蓮縣吉安鄉自強路541號1.2樓'],
['267704','大同','台北市北投區大同街26號'],
['267715','日日新','台南市安南區義安街86巷29號31號'],
['267726','金永興','彰化縣永靖鄉永興路二段3號5號'],
['267737','鳳科','嘉義縣民雄鄉建國路二段120之78號'],
['267748','西螺大同','雲林縣西螺鎮大同路159號'],
['267807','永鑽','新北市永和區中山路一段110號1樓'],
['267818','浤安','台中市西屯區國安一路102號'],
['267863','吉安站','花蓮縣吉安鄉南昌北路72號1樓'],
['267896','崁溪','桃園市桃園區經國一路25號1樓'],
['267922','大僅','台中市北屯區軍功路一段287號一樓'],
['267933','九曲堂','高雄市大樹區久堂里久堂路城隍巷15-8號及久堂路22-3號'],
['268017','櫳昇','台中市南屯區龍富路四段101號'],
['268028','鑫豐喜','台中市豐原區南陽路120號1號'],
['268039','長秝','台南市安南區長和路一段499號'],
['268073','東環','新竹市東區東門街33號'],
['268110','澎福','澎湖縣馬公市西衛里五福路91號'],
['268132','雅玥','嘉義市東區雅竹路21、23號'],
['268143','榴中','雲林縣斗六市中興路15號一樓'],
['268176','明青','台中市北區青島路二段16號18號一樓及夾層'],
['268187','海富','高雄市左營區緯六路181號183號'],
['268198','樂泰','桃園市龜山區新興街82號86號'],
['268213','墾丁','屏東縣恆春鎮墾丁路60號62號'],
['268246','中權','高雄市苓雅區民權一路30號1樓及興中一路66之2號1樓'],
['268268','民忠','桃園市桃園區民安路102號104號106號1樓'],
['268279','環城北','屏東縣恆春鎮環城北路188號190號192號196號'],
['268291','十六股','花蓮縣花蓮市尚志路35之16號'],
['268305','鑫富強','台南市永康區富強路一段91號'],
['268316','林居','新北市淡水區紅樹林路179號1樓'],
['268327','照安','宜蘭縣冬山鄉冬山路65號'],
['268338','祥平','台中市北屯區和順路552號'],
['268349','永佶','桃園市八德區永豐路237號235-1號235號1樓'],
['268350','元亭','桃園市蘆竹區六福路189號'],
['268383','一詮','新北市新莊區新知八路32號'],
['268394','荳荳樂','台南市官田區工業路21號'],
['268408','新工農','台北市信義區忠孝東路五段236巷6號.6-1號1樓'],
['268419','富國','桃園市蘆竹區富國路三段1332號'],
['268420','園龍','台北市萬華區西園路一段171.173號1樓'],
['268431','鳳彥','嘉義市東區北門里長榮街171號'],
['268442','生醫','新竹縣竹北市生醫路二段22號1樓'],
['268464','幸福成','台中市梧棲區八德東路61號'],
['268486','德鴻','新北市新莊區八德街132及134號1樓'],
['268545','弘富','台中市潭子區弘福街63號'],
['268556','明鶯','新北市鶯歌區光明街17號19號'],
['268590','興佳','台北市文山區興隆路三段185巷7弄2號'],
['268604','東後勁','高雄市楠梓區後勁東路150號152號152-1號'],
['268615','金勇','桃園市八德區東勇街80號82號1樓'],
['268626','大稻埕','台北市大同區民生西路409.411號'],
['268637','江河','桃園市大園區中正東路三段536巷20號22號'],
['268659','彌海','高雄市彌陀區漯底里樂安路3-1號'],
['268660','南京西','台北市大同區南京西路71號'],
['268671','建楠','高雄市楠梓區建楠路130號132號一樓'],
['268693','宏裕','南投縣魚池鄉義勇街18號'],
['268718','環康','台北市萬華區環河南路一段35號1樓'],
['268730','六寶','台中市大雅區中清路四段656之1號'],
['268741','茗旺','花蓮縣花蓮市中山路303號、305號'],
['268752','德航','台南市仁德區大同路三段478號'],
['268785','興亞','台北市中山區松江路26巷32號34號'],
['268796','富壕','新北市新莊區民安路379號1樓'],
['268844','祐閤','桃園市中壢區中園路二段177-1，179號'],
['268855','安筌','新竹縣竹東鎮竹中路87-1號'],
['268877','富域','苗栗縣苗栗市中華路532號'],
['268888','正元','台北市中正區和平西路二段70巷15弄3號1樓'],
['268947','吉永','新北市土城區延吉街365號367號'],
['268981','香陽','台北市南港區向陽路120巷2弄35號'],
['268992','寶文','新北市林口區文化一路二段269號'],
['269009','興龍','桃園市龜山區中興路399號401號'],
['269032','三塊厝','台中市南屯區南屯路二段856號858號'],
['269054','中大智能','桃園市中壢區中大路300號(女十四舍B1)'],
['269065','西松高','台北市松山區健康路325巷5弄1號1樓'],
['269076','麗湖','台北市內湖區內湖路一段631號'],
['269087','環悅','桃園市大園區環區北路58號60號'],
['269098','明泰','新北市泰山區明志路二段363號1樓'],
['269124','太原醫','台中市北屯區太原路三段1141號B1'],
['269146','阿麗拉','桃園市楊梅區金溪路397號1樓'],
['269157','勇興','新北市三峽區大勇路18之2號18之3號'],
['269168','水湳','台中市西屯區中清西二街139-1號'],
['269191','數位','台北市內湖區石潭路157號'],
['269205','佰三','基隆市七堵區百三街118.120號、福三街40號'],
['269238','高舟','桃園市新屋區民族路六段295-1號'],
['269249','樂利','台北市大安區樂利路74號'],
['269250','永鑫','宜蘭縣羅東鎮中正北路171.171-1號1樓'],
['269272','鶯峽','新北市三峽區中山路283號'],
['269319','富景','台北市松山區三民路137號1樓'],
['269320','南機場','台北市萬華區中華路二段430號1樓'],
['269331','德豐','台北市士林區德行東路109巷61號'],
['269342','和福','台北市士林區和豐街39巷2號'],
['269353','美鑫','台中市西區美村路一段22號'],
['269375','鑫金港','金門縣金城鎮金水里金豐路300號'],
['269386','雲鼎','新北市三重區忠孝路三段151號1樓2樓'],
['269397','豐田村','屏東縣內埔鄉豐田村建業路66號1樓'],
['269423','滿溢','屏東縣滿州鄉永靖村新庄路171之1號'],
['269434','水鳥','台北市北投區知行路1號'],
['269456','德松','台北市中山區德惠街200號1樓'],
['269478','海大勇泉','基隆市中正區北寧路2號'],
['269489','藝發','桃園市桃園區同安街340號342號1樓及同安街338巷1號1樓部分'],
['269490','直武','台北市中山區北安路595巷14.16號'],
['269504','成學','台南市東區大學路1號(成大奇美樓1樓)'],
['269526','體育場','嘉義市東區體育路29號'],
['269559','永順','新北市鶯歌區永和街126及128號1樓'],
['269571','樟忠','台北市文山區興隆路四段72-2號.74巷2號.4號'],
['269582','大平','台中市北屯區綏遠路二段216號'],
['269618','龍鑫','宜蘭縣冬山鄉自強路29-2號'],
['269629','延新','台北市松山區延壽街91號93號'],
['269630','樟濃','新北市汐止區樟樹一路135巷19.21號'],
['269663','鑫庄','新竹縣竹北市中正西路2001號'],
['269674','湖濱城','台中市東區進德路367號'],
['269685','金田','台北市大安區金華街241之1號'],
['269700','沐目','桃園市平鎮區德育路2段163號165號'],
['269711','舊莊','台北市南港區舊莊街一段81號83號'],
['269744','利羅莊','宜蘭縣羅東鎮天祥路95.97號'],
['269755','美好','花蓮縣花蓮市化道路91號、93號'],
['269788','新館福','苗栗縣公館鄉福星村8鄰福星243號、245號'],
['269803','金昕','桃園市楊梅區新梅六街31號'],
['269814','昌信','新北市新莊區昌平街2號'],
['269847','貴仁','桃園市八德區豐田路255號'],
['269869','輝寶','台中市北屯區敦富路700號'],
['273167','上楓樹','台中市南屯區中和里黎明路一段263號'],
['273189','大敦','台北市大安區敦化南路二段63巷7號1樓'],
['273190','鳳甲','高雄市鳳山區一甲里鳳南路167號1樓'],
['273204','芯德','桃園市大溪區復興路186號1樓188號1至2樓'],
['273215','建龍','台北市中山區龍江路239號1樓'],
['273226','景愛','新北市中和區仁愛街45號47號1樓'],
['273248','李斯特','雲林縣虎尾鎮興南里竹圍60號'],
['273259','福漢','台中市西屯區何福里漢口路二段112號112-1號'],
['273260','美武','高雄市鼓山區美術南二路137號'],
['273271','高美','高雄市鼓山區龍水里美術東二路181號'],
['273282','龍南','桃園市平鎮區龍南路348號'],
['273293','統文','桃園市龜山區文化七路179號1樓'],
['273307','新北屯','台中市北屯區太原路三段516號1樓'],
['273318','萬應','高雄市苓雅區四維四路190-1號'],
['273329','明星','高雄市新興區自立二路146號'],
['273330','建武','高雄市鳳山區武松里建國路二段2號'],
['273352','福田','台中市南區文心南路883、885號1樓'],
['273363','彰化','彰化縣彰化市長樂里中正路二段41號1樓'],
['273374','善良','台南市善化區中正路385號1樓'],
['273396','麥福','雲林縣麥寮鄉台塑工業園區1號'],
['273400','合利','桃園市楊梅區楊湖路二段910號912號914號'],
['273433','康醫','台北市內湖區成功路五段420巷30號'],
['273455','夏興','台南市南區夏林路258號1樓'],
['273466','亞新灣','高雄市前鎮區林森四路255號'],
['273488','墩陽','台中市南屯區大墩10街254號1樓'],
['273499','松盛','台北市中山區南京東路二段115巷1號'],
['273503','竹賀','桃園市蘆竹區蘆興南路379號1樓'],
['273514','員信','新北市土城區金城路一段131號1樓'],
['273525','基信','基隆市信義區信二路23號23之4號'],
['273536','新仁二','基隆市仁愛區仁二路11號13號1樓'],
['273547','仁智','新竹縣湖口鄉仁和路38號1樓'],
['273558','新北','台南市新營區民治路228號1樓'],
['273569','知心','台北市北投區知行路185號1樓'],
['273570','豐園','高雄市左營區新上里新庄仔路828.830.832.834號'],
['273581','慶和','桃園市中壢區後寮一路140號142號1樓'],
['273592','新埔','新竹縣新埔鎮中正路221號'],
['273606','石門','新北市石門區中山路78號'],
['273628','愛萣','高雄市茄萣區仁愛路二段157號159號161號'],
['273639','席悅','台南市東區東光里東興路41號1樓'],
['273651','復華','桃園市中壢區中華路一段670號1樓'],
['273662','斗高','雲林縣斗南鎮小東里17鄰大業路86號'],
['273673','新宜','新北市新店區北宜路二段4號6號'],
['273684','江東','台北市中山區長安東路二段43號45-1號1樓'],
['273695','木盛','台北市文山區木柵路三段88號'],
['273709','褒忠','雲林縣褒忠鄉中正路99號1樓'],
['273710','忠聯','台北市中正區忠孝東路二段100號1樓'],
['273721','新新豐','新竹縣新豐鄉新興路177號179號1樓'],
['273732','新台元','新竹縣竹北市台元街26-5號'],
['273743','正勤','台中市西屯區黎明路三段539-3號.539-5號'],
['273754','大邁','台中市大雅區大林路275號'],
['273765','荷運','新北市三重區三和路四段97號.97之1.97之2號1樓'],
['273776','府中','新北市板橋區府中路82號84號1樓'],
['273798','明躍','新北市泰山區明志路三段202號'],
['273802','惠富','台中市西屯區朝富路286號1樓'],
['273813','昌進','台中市南屯區大進街387號1樓.大墩十二街151號1樓'],
['273835','新天地','台南市柳營區太康里22鄰201-10號'],
['273846','懷生','台北市大安區忠孝東路三段248巷9號'],
['273857','北崙','新竹縣竹北市光明三路35.37號1樓'],
['273868','康泰','台中市豐原區安康路34、36、38號1樓'],
['273879','敬興','新竹縣竹北市莊敬北路258.260號1樓'],
['273880','銓國','新竹縣竹北市中正西路244.246號'],
['273905','沅氣','新北市中和區中山路三段29號31號1樓'],
['273916','新寶橋','新北市新店區寶橋路192號'],
['273927','敦安','台北市大安區安和路一段86號'],
['273938','圓金','台北市大安區仁愛路四段112巷7號7號之1'],
['273949','勝福','新北市汐止區福德一路98號100號(夾層)樓'],
['273950','新國聯','台北市大安區光復南路180巷12號'],
['273972','蘆順','桃園市蘆竹區奉化路168號170號172號1樓'],
['273983','庚樺','台中市北區崇德路一段143之2號'],
['273994','員勝','彰化縣員林市育英路131號'],
['274001','大勝','新竹縣竹北市勝利十一路101號'],
['274012','白金','台南市永康區復國一路357號'],
['274023','善成','台南市善化區中正路386號'],
['274034','憲訓','桃園市龜山區文化三路1-1號'],
['274045','龍米','新北市八里區龍米路二段46號48號50號'],
['274056','津佳','桃園市大溪區康莊路372號374號376號1樓'],
['274067','景山','新北市中和區景安路211號213號1樓'],
['274078','瑞信','新北市瑞芳區民生街23號1樓'],
['274089','羅亭','台北市中正區羅斯福路二段68號'],
['274104','太陽城','新北市土城區中央路四段281之8號281之9號'],
['274115','六張街','新北市三重區六張街255巷17弄1號1樓255巷15號'],
['274126','金金','苗栗縣通霄鎮內湖里17鄰內湖165-8號'],
['274137','福國路','台北市士林區福國路17號17之1號19之1號'],
['274159','科技站','台北市大安區復興南路二段203號'],
['274160','建綸','台北市大安區仁愛路四段151巷33號忠孝東路四段216巷32弄19號21號'],
['274171','欣安和','台北市大安區安和路一段47號'],
['274182','鑫中華','台中市中區中華路一段153.155號一樓157號一二樓'],
['274193','隆心','台中市西屯區文心路二段566號'],
['274207','欣昌隆','屏東縣佳冬鄉昌隆村大豐路680號'],
['274218','祐瑄','台中市沙鹿區光華路502號506號'],
['274230','誠安','台北市大安區敦化南路一段247巷12號1樓'],
['274263','東成','台北市中正區延平南路129巷3號1樓'],
['274274','航發','台中市西屯區河南路二段242號'],
['274296','正陽','新北市三重區正義北路386號388號'],
['274300','板民','新北市板橋區三民路二段77號1樓'],
['274311','嘉家','新竹縣竹北市嘉豐十一路一段30號1樓'],
['274322','榮山','高雄市左營區榮總路229號231號'],
['274333','內惟','高雄市鼓山區九如四路1432號1434號'],
['274344','豐彩','桃園市龍潭區中豐路398號1樓'],
['274355','永華東','台南市安平區永華路二段210號'],
['274366','東君','新竹市香山區東華路14號1樓'],
['274377','建權','台北市中山區民權東路二段206號1樓'],
['274388','復慶','台中市南區樹義里大慶街二段5-2號'],
['274399','伸冠','彰化縣伸港鄉大同村中興路二段316號'],
['274403','德隆','桃園市八德區永豐路408號410號1樓'],
['274414','蓮昌','花蓮縣花蓮市建國路二段298號'],
['274425','五興','宜蘭縣五結鄉五結路三段258號'],
['274436','華晟','新北市三峽區中華路38之1號38之2號1樓'],
['274447','瑞濱','新北市瑞芳區海濱路157號1樓'],
['274469','天北','台北市士林區天母里天母西路39-1號1樓'],
['274470','北原','桃園市中壢區新中北路239號241號1樓'],
['274492','舊社','新北市板橋區中山路二段412號'],
['274506','美生','台中市西區美村路一段54號'],
['274517','環德','新北市三重區福德南路38號1樓'],
['274528','天城','新北市中和區景平路240巷1弄4號'],
['274540','澎衛','澎湖縣馬公市西衛里光復路408號'],
['274551','香湖','嘉義市西區香湖里文化路8鄰700號'],
['274562','竹陵','新竹市北區東大路二段174號'],
['274573','福德三','新北市新莊區福德三街70號72號1樓'],
['274584','宏全','新北市新莊區中和街61號'],
['274609','博仁','高雄市前金區五福三路97之1號1樓'],
['274610','玉井','台南市玉井區中正路54號'],
['274621','高正','桃園市中壢區中正路三段134號136號一樓'],
['274632','鎮光','桃園市平鎮區湧光里中豐路山頂段206號208號1樓'],
['274643','蓮馨','高雄市阿蓮區和平路136號'],
['274676','王子','桃園市中壢區三光路130號1樓'],
['274687','忠純','高雄市前鎮區忠純里中華五路969巷6號1樓'],
['274698','明峰','新北市汐止區明峰街179之1號'],
['274702','東吉','台北市松山區民生東路五段100號'],
['274735','松聯','台北市信義區忠孝東路四段559巷24號1樓'],
['274757','永一','台南市永康區正強街221號1樓'],
['274768','埔灃','南投縣埔里鎮中山路二段108號中華路184之2號'],
['274779','愛鑫','基隆市仁愛區愛二路65號'],
['274780','光中','台北市北投區光明路122號'],
['274791','商華','新竹縣竹東鎮東寧路三段25號1樓'],
['274805','宏鑫','新北市中和區中正路837號'],
['274816','少觀','台南市南區大林路113號'],
['274827','館慶','新北市板橋區館前東路26號1樓'],
['274838','逢科','台中市西屯區青海路二段556號'],
['274850','鑫櫃','台北市中山區松江路187號1樓及187-1號1樓'],
['274861','汐興','新北市汐止區連興街150號152號1樓'],
['274872','路嘉','高雄市路竹區後鄉路37號1樓之1.2'],
['274883','鳳城','高雄市鳳山區杭州西街111號1樓'],
['274894','明日城','新北市泰山區信華六街17號19號1樓'],
['274908','成龍','桃園市中壢區龍岡路三段192號194號196號1樓'],
['274919','園華','桃園市大園區中山北路75號77號79號81號'],
['274920','朴欣','嘉義縣朴子市竹圍里四維路一段635號'],
['274931','高蓉','桃園市大園區高鐵北路三段96號1樓'],
['274942','新東','台南市東區林森路二段84號'],
['274953','新華成','基隆市仁愛區成功一路115號117號1樓'],
['274964','宜峰','桃園市龜山區樂善三路112號'],
['274975','碩豐','台中市南屯區萬和路一段30號'],
['274986','員泰','宜蘭縣宜蘭市泰山路33之3號33之4號1樓'],
['274997','興頂','新北市三重區中興北街177號'],
['275004','北勢頭','屏東縣屏東市自由路445號'],
['275026','義北','新北市三重區正義北路8號1樓'],
['275048','海德堡','台中市南屯區向心南路928號930號'],
['275060','台南蔡','台南市永康區中正南路628號'],
['275071','泰里','新北市五股區成泰路四段12號1樓'],
['275082','都峰苑','新北市新莊區中央路686號1樓'],
['275093','華龍','桃園市龜山區萬壽路一段292號1樓龍華街2巷6號B1'],
['275107','鎮金','桃園市平鎮區金陵路二段24號26號1樓'],
['275118','梅鄉','嘉義縣梅山鄉梅南村中山路125號1樓'],
['275129','博祐','新竹縣竹北市博愛街25-1號'],
['275130','文康','高雄市左營區新光里文康路156號1樓'],
['275141','心日','高雄市前鎮區忠誠路213號'],
['275152','高銀','高雄市新興區六合一路158號'],
['275163','瑞寶','台北市內湖區瑞光路583巷27號1樓'],
['275174','凱成','桃園市楊梅區文化街220號222號222-1號'],
['275185','復中','高雄市苓雅區興中一路138號'],
['275196','雲梯','嘉義縣梅山鄉太平村下坑仔5.6.7號'],
['275200','悅來','台北市內湖區五分街9號11號1樓'],
['275211','庚亞','桃園市龜山區復興一路150號1樓'],
['275222','樂民','高雄市楠梓區加昌里壽民路60號1樓'],
['275233','鑫成','台北市士林區至誠路二段82號1樓'],
['275255','善心','台南市善化區中山路355號1樓'],
['275266','重義','高雄市鹽埕區五福四路83號'],
['275277','鹿興','台中市沙鹿區向上路七段1號'],
['275288','景新','新北市中和區景新街436號'],
['275299','基醫','基隆市信義區信二路268號1樓'],
['275303','金滬','新北市淡水區中山路66號1.2樓.66-1號1樓'],
['275314','海裕','台南市北區雙安里海安路三段219巷5號1樓'],
['275325','塔優','台北市松山區撫遠街197號199號'],
['275336','園生','桃園市大園區新生路四段273號1樓'],
['275347','豆腐岬','宜蘭縣蘇澳鎮南寧路41號.42號42-1號1樓'],
['275358','紫新','台北市內湖區康寧路一段34號'],
['275369','市賢','高雄市前金區市中一路242號'],
['275370','大東家','台中市南區新榮里復興路三段138、140號'],
['275392','精業','台中市西區精誠路41號之6之7'],
['275406','健太','台中市北屯區太原路三段1138號'],
['275417','華美','台中市西屯區西屯路二段19號19之1號21號'],
['275428','嘉上','嘉義市西區車店里上海路147號1樓'],
['275439','德友極','桃園市桃園區中華路117號117之1號一樓二樓'],
['275440','新埔站','新北市板橋區民生路二段232號1.2樓之14、232號1.2樓之15'],
['275473','新家專','台南市永康區鹽行里中正路12鄰545號1樓'],
['275484','鹿山','南投縣竹山鎮延祥里集山路三段73號、73-1號'],
['275495','皇翔','新北市土城區中央路一段88號1樓、裕民路10-1號.10號.8-1號.8號'],
['275509','公學','新竹市東區建功一路93號'],
['275510','茄安','新北市汐止區茄苳路259號1樓'],
['275521','田豐','新北市三重區三民街150.152號'],
['275532','大強','高雄市鳳山區新強里大明路193號'],
['275565','榮躍','桃園市中壢區榮民南路462號464號'],
['275576','板慶','新北市板橋區忠孝路37號1樓'],
['275587','鎮南','雲林縣斗六市鎮南路301號'],
['275598','森之丘','高雄市橋頭區橋新七路1號1樓'],
['275602','麻園','桃園市八德區介壽路二段360號362號'],
['275613','康曜','新北市新店區安康路三段41號1樓'],
['275624','馬武督','新竹縣關西鎮中豐新路2-1號1樓'],
['275635','世達','新竹市北區延平路一段159號1樓'],
['275657','大南庄','苗栗縣南庄鄉南江村5鄰東江75-3號'],
['275668','濟南','台北市大安區濟南路三段12號1樓'],
['275679','仁愛醫','台北市大安區復興南路一段253巷52號1樓'],
['275680','友華','台北市北投區承德路六段120號'],
['275691','萬達','高雄市橋頭區經武路60號1樓2樓'],
['275705','華貴','新北市板橋區貴興路85號87號1樓'],
['275716','德旺','新北市中和區壽德街22號1樓'],
['275727','東復','台北市松山區復興北路313巷25號'],
['275738','華勇','台南市永康區華興街122號1、2樓'],
['275750','新高榮','高雄市左營區榮總路175號1樓'],
['275761','莊和','新北市新莊區中和街34.36號'],
['275772','阿波羅','台北市大安區忠孝東路四段222號224號1樓'],
['275783','頂東','台北市大安區大安路一段43號'],
['275794','新楠梓','高雄市楠梓區中陽里楠梓新路188號188-1號1樓'],
['275808','蜜寶','台南市關廟區香洋里中山路一段203號1樓'],
['275819','青建','高雄市鳳山區文福里建國路三段295號'],
['275831','新鳳松','高雄市鳥松區鳥松里大仁北路2號1樓'],
['275842','仁慈','高雄市仁武區仁慈里仁慈路169號1樓'],
['275853','京發','台北市松山區南京東路五段139之4及139之8號'],
['275864','頭張','台中市潭子區家福里頭張路一段31號'],
['275875','豐社','台中市豐原區社皮里社皮路78號'],
['275886','雅慶','高雄市苓雅區同慶里同慶路88號90號'],
['275897','南昌','台北市中正區南昌路一段67號69號1樓'],
['275901','正果','新北市三重區中正北路122號124號1樓'],
['275912','工協','高雄市鳳山區埤頂里建國路一段79號1樓'],
['275923','新仁','台中市龍井區新興路40之3之3號1樓'],
['275934','多田','台中市大里區立新街350號，立新二街5號'],
['275945','欣高','桃園市楊梅區楊梅里文德路1號1樓梅高路52-9號'],
['275956','謙悅','桃園市桃園區新埔六街58號60號1樓'],
['275967','萬峰','台中市霧峰區中正路146-20號'],
['275978','東里','台中市大里區大里路295號1樓'],
['275989','真親切','新北市新店區中央路212號214號'],
['275990','蘋果','台中市大里區善化路155號'],
['276007','埔運','新北市板橋區民生路三段40號42號1樓'],
['276018','海安','台南市北區海安路三段716號'],
['276030','樹新','新北市樹林區樹新路245號'],
['276041','龍運','桃園市龍潭區中正路105號1樓及107巷1號1樓'],
['276052','光壢','桃園市中壢區莒光路35號1樓'],
['276063','貴族','桃園市桃園區南平路306號1樓'],
['276074','富友','桃園市中壢區中山東路三段419號421號423號1樓'],
['276085','大傳','桃園市龜山區大同路357號357-1號1樓及壽山段926地號'],
['276096','金福','新北市板橋區金門街330號1樓'],
['276100','港義','新北市新莊區中港路527號1樓.中義街2號1樓'],
['276111','香圃','新竹市香山區牛埔東路253號1樓'],
['276122','川詠山','新北市三重區集賢路158號1樓'],
['276144','蘆義','新北市蘆洲區民義街1.3.5號'],
['276155','光政','彰化縣北斗鎮光復路208號'],
['276177','松東','台中市北屯區松竹路三段125號'],
['276188','苗栗','苗栗縣苗栗市民族路99號101號1樓'],
['276199','新醫','台南市新營區民權里民權路96號96-1號1樓'],
['276203','四圍','嘉義市西區福安里竹圍路190號'],
['276214','翁和','桃園市大溪區仁文里介壽路1151號1153號1樓'],
['276225','海光','台北市士林區延平北路五段35號37號39號'],
['276236','蓮營','台南市後壁區福安里200號'],
['276247','正隆','新北市板橋區民生路一段53號'],
['276258','貴賢','新北市泰山區明志路三段165號1樓2樓、167號1樓'],
['276269','北勝','屏東縣內埔鄉北寧路142號1樓'],
['276270','新劍潭','台北市士林區福港街246號248號'],
['276281','天文','苗栗縣竹南鎮天文路176號'],
['276292','心心','新北市板橋區實踐路105號107號'],
['276306','北瑞','屏東縣潮州鎮北門路265號'],
['276317','西苑','台中市西屯區福星路112號1樓'],
['276328','錦盛','新北市中和區錦盛里圓通路335巷三弄21號'],
['276340','新湖工','新竹縣湖口鄉中華路54號'],
['276351','皓東','高雄市三民區本武里大豐二路489號'],
['276362','源前','新北市新莊區思源路388.390號'],
['276373','援中','高雄市楠梓區藍田路1185號'],
['276384','梓官光明','高雄市梓官區光明路66之1號'],
['276395','福鹿','彰化縣福興鄉彰鹿路七段652.654號'],
['276409','貴鳳','新北市泰山區貴鳳街2號'],
['276410','權湖','台北市內湖區民權東路六段212號1樓212之1號1樓'],
['276421','有成','桃園市桃園區大有路6號1樓'],
['276432','大通','台南市歸仁區和平北街32號'],
['276443','萬里','新北市萬里區瑪鋉路49號51號'],
['276454','重美','新北市三重區重新路四段100號102號1樓'],
['276465','元富','新北市三重區仁義街106、108、110號'],
['276476','雙嶺','桃園市中壢區松義路111號113號1樓'],
['276487','國醫','台北市內湖區成功路二段325號1樓'],
['276502','蘭雲','宜蘭縣頭城鎮青雲路三段315號317號'],
['276513','鑫華新','台中市中區中華里中華路一段75號77號及民族路218號'],
['276546','沙鹿中山','台中市沙鹿區中山路198號'],
['276557','社和','台中市新社區中和街五段115號1樓'],
['276568','港都','基隆市中正區義二路8號1樓'],
['276579','全新','新北市新店區安康路二段147號1樓'],
['276580','漢揚','桃園市桃園區漢中路123號1樓'],
['276591','常楓','桃園市龜山區光峰路221號1樓'],
['276605','竹豐','新竹縣竹東鎮中豐路三段93號95號1樓'],
['276616','龍京','台北市中山區龍江路104號1樓'],
['276627','自立','新北市中和區自立路15巷13號15號1樓'],
['276638','麟光','台北市大安區臥龍街252號及252之1號'],
['276649','行天','台北市中山區農安街178號180號'],
['276650','精明','台中市西區精誠路15號'],
['276683','神寶','台中市神岡區中正路100號'],
['276694','高民','桃園市平鎮區延平路二段214號1樓'],
['276719','秀朗','新北市永和區得和路389號391號1樓'],
['276720','京吉','高雄市仁武區京吉三路103號'],
['276731','昇隆','台北市大安區敦化南路二段238號'],
['276753','新裕生','新北市土城區裕民路57號及55巷2號'],
['276764','三沅','桃園市楊梅區三民北路88號1樓'],
['276775','園寶','台北市萬華區西園路二段281巷29號1樓31號1樓33號1樓'],
['276786','育鑫','台中市太平區樹孝路490號'],
['276797','信二','基隆市信義區信二路167號'],
['276801','北宜','新北市新店區北宜路二段82-2號82-3號1樓'],
['276812','富寓','桃園市龜山區文德路80號82號'],
['276823','達昇','桃園市大園區大觀路525號527號1樓'],
['276834','竹林','新北市永和區竹林路211號'],
['276845','信興','台北市大安區信義路四段32號'],
['276856','科學城','桃園市中壢區中北路二段206號'],
['276867','後港','新北市新莊區後港一路76巷14弄1號1樓'],
['276878','誠美','高雄市鼓山區龍子里裕誠路2080號'],
['276889','厚讚','台北市大同區長安西路228號1樓'],
['276904','建鑫','苗栗縣頭份市建國路86號1樓'],
['276915','華東','台南市永康區中華路472號'],
['276926','恆豪','台南市永康區中正南路432號1樓'],
['276937','長寧','台南市東區長榮路三段12號'],
['276948','利新','桃園市楊梅區楊新路三段8號10號'],
['276959','梧汊港','台中市清水區北堤路30號'],
['276960','新康','新竹縣新豐鄉松林村7鄰康樂路一段216號1樓'],
['276982','新豐陽','台中市豐原區南陽路372號1樓'],
['276993','興和','新北市中和區自立路187號189號1樓'],
['277000','汐湖','新北市汐止區康寧街141巷49號51號1樓'],
['277011','緯創舍','新竹縣寶山鄉雙新村明湖五街11號'],
['277022','大茄苳','雲林縣西螺鎮大新210之3號1樓'],
['277033','鑫崙','雲林縣斗南鎮新崙路65之1號'],
['277044','善農','台南市善化區中山路243號1樓'],
['277055','天送埤','宜蘭縣三星鄉三星路七段208號'],
['277088','榮德','新北市樹林區東榮街8-10號'],
['277099','潭欣','台中市潭子區福潭路622號1樓'],
['277103','里商','新北市八里區商港三路99、101號'],
['277114','吉美','桃園市中壢區吉林二路77號77之1號1樓'],
['277125','尚美','花蓮縣花蓮市中興路71號'],
['277136','宜寧','台中市南區東興路一段21號1樓'],
['277147','長億','台中市南區工學路108號'],
['277158','埔成','彰化縣埔心鄉中正路一段137號139號1樓'],
['277170','實踐大學','台北市中山區大直街70號1樓'],
['277181','金門大學','金門縣金寧鄉大學路1號1樓'],
['277192','彭福','新北市樹林區忠孝街33號35號'],
['277206','墩十','台中市西區大墩十街92號'],
['277217','榮夏','高雄市鼓山區華榮路387號1樓'],
['277228','麥田','台北市中山區晴光里中山北路三段47號'],
['277240','源盛','桃園市桃園區國聖一街188號1樓;宏昌十二街587號1樓'],
['277251','松敬','台北市信義區吳興街11號1樓'],
['277262','育賢','新竹市東區南大路611號613號1樓'],
['277273','功興','台中市太平區建興路47號'],
['277284','成章','桃園市中壢區成章二街192號'],
['277295','仁美','高雄市鳥松區學堂路18號20號'],
['277309','福隆站','新北市貢寮區福隆里福隆街8號1樓'],
['277310','嶺中','台中市南屯區永春南路58號'],
['277321','苓民','高雄市小港區漢民路219號1樓'],
['277332','金鶯','新北市鶯歌區鶯桃路131-133號'],
['277343','鎮鑫','新北市新店區中興路一段289號'],
['277354','南華','高雄市鳳山區五甲二路232號'],
['277365','鑫國泰','台北市信義區忠孝東路五段68號24樓'],
['277376','京典','台北市中山區南京東路三段86號1樓'],
['277387','胡適','台北市南港區研究院路二段94號96號98巷1號'],
['277398','德信','基隆市信義區東信路50號52號1樓'],
['277402','鑫台北','台北市中正區黎明里忠孝西路一段35號一樓'],
['277413','松潭','台中市北屯區軍功路二段183號1樓'],
['277424','銘傳','台北市士林區中山北路五段250號'],
['277435','新錦祥','台北市中山區錦西街16號'],
['277457','延華','台北市大同區延平北路一段89號91號93號1樓'],
['277468','泰山','新北市泰山區楓江路22號24號'],
['277479','成泰','新北市五股區成泰路二段84號1樓'],
['277480','俊友','新竹市東區林森路81號'],
['277491','觀景','新北市八里區觀海大道53號'],
['277505','曾德','台北市中山區錦州街21-2號'],
['277516','榮和','新北市新莊區中和街191巷1號3號5號'],
['277527','忠太','台中市北區太原路一段492號地下1層和忠明八街1號1樓'],
['277538','聖淳','雲林縣四湖鄉四湖村15鄰環湖東路1號'],
['277549','大莊園','台中市西區向上路一段15號1樓'],
['277550','鹿東','彰化縣福興鄉中正路224號'],
['277561','駿隆','宜蘭縣礁溪鄉中山路一段175號1樓'],
['277572','楠鎮','高雄市楠梓區加昌路600-11號1樓'],
['277583','園興','桃園市大園區大興路75號1樓'],
['277594','自強','高雄市前金區自強二路39號'],
['277608','景禮','新北市中和區景安路100號1樓102號1樓104號1樓'],
['277619','芯建','新北市中和區建一路182號1樓'],
['277620','金龍','台北市內湖區內湖路二段407號409號411號1樓'],
['277642','思瑀','花蓮縣花蓮市建國路二段862號及866號1樓'],
['277653','佳樂','台北市南港區南港路一段303號305號307號1樓'],
['277664','武勝','高雄市苓雅區武廟路55號55之1號57號1.2樓59號2樓'],
['277675','東亭','新竹縣竹東鎮和江街2號6號'],
['277686','橫科','新北市汐止區民權街二段28號1樓'],
['277697','昌旺','台中市北屯區昌平路二段12之16號'],
['277701','集福','台南市中西區金華路四段194號與信義街60巷6號'],
['277712','新長基','基隆市安樂區安樂路二段161號'],
['277723','美朵','高雄市鼓山區美術東四路132號136號1樓'],
['277734','景陽','新北市中和區景新街29號31號33號'],
['277745','白雲','新北市汐止區民權街二段79號1樓'],
['277756','建一','新北市中和區建康路101號'],
['277767','大湳','桃園市八德區和平路875-1號'],
['277778','臨沂','台北市中正區文祥里臨沂街74號76號'],
['277789','日泰','彰化縣員林市三義路15號'],
['277790','八德廣長','桃園市八德區長興一路111號1樓廣興三路80號1樓'],
['277804','星翔','新竹市北區經國路二段346、348號1樓'],
['277815','驊豐','桃園市桃園區建國路101號1樓'],
['277826','園林','新北市板橋區南雅西路二段102號104號1樓'],
['277837','興都','新北市林口區文化二路一段378號1樓之一之二之三'],
['277848','秀傳','彰化縣彰化市中山路一段546號1樓'],
['277859','海正','新北市淡水區中正東路一段113號115號115-1號'],
['277860','木新','台北市文山區木新路二段255號'],
['277871','永和','新北市永和區文化路7號'],
['277882','美藝','高雄市鼓山區龍水里美術東二路103號1樓'],
['277893','自由','台南市東區和平里自由路二段37號'],
['277907','天山','高雄市前鎮區一心一路406號'],
['277918','灃將','桃園市龜山區文化五路45號47號興華二街33號1樓'],
['277929','吉民','台北市中山區吉林路277號279號1樓'],
['277930','新遠','新北市新莊區中正路651號之8號'],
['277941','理園','新北市新莊區中正路510號'],
['277952','維雄','高雄市苓雅區和平一路100號'],
['277974','福元','南投縣草屯鎮中正路885號1樓'],
['277985','青草湖','新竹市東區明湖里明湖路3鄰1012-1號'],
['277996','朱崙','台北市中山區復興北路56號58號1樓'],
['278003','柳豐','新北市萬里區港東路162之11號162之12號'],
['278014','參龍','台北市內湖區新湖一路95號1樓'],
['278025','超學','台中市北區進化北路327號與325號1樓'],
['278036','新宏國','桃園市八德區中華路292號294號1樓'],
['278047','新東育','台南市東區大學路西段53號1樓2樓'],
['278058','新鎮興','桃園市平鎮區中興路平鎮段349號351號353號'],
['278069','德陽','高雄市新興區八德一路164號1樓、2樓，166號1樓，168號1樓'],
['278070','三村','台南市永康區鹽行里仁愛街68號70號1樓'],
['278081','埔東','桃園市大園區埔心里中正東路一段165號1樓'],
['278106','佳佳','台北市中山區民生東路二段157號'],
['278117','統全','台北市中正區汀州路三段249號'],
['278128','豐禾','新竹縣竹北市嘉豐六路二段76號1樓'],
['278139','愛國','台北市大安區愛國東路75號'],
['278140','昌春','新竹縣竹東鎮長春路三段26號1樓'],
['278151','和雅','南投縣鹿谷鄉廣興村中正一路225號'],
['278162','樹子腳','雲林縣莿桐鄉和平路28號'],
['278173','卡里善','彰化縣和美鎮和厝路一段350號'],
['278184','博真','高雄市左營區新中里博愛三路16號'],
['278195','和業','台北市北投區中和街10號'],
['278209','新廉瀚','花蓮縣新城鄉新興路28號30號1樓'],
['278221','慶丞','苗栗縣頭份市合興里信義路14鄰381號'],
['278232','光環','新北市板橋區光環路二段68號70號1樓'],
['278243','壢福','桃園市中壢區廣州路200號202號1樓'],
['278254','雙榮','桃園市平鎮區雙連里民族路雙連三段8號1樓'],
['278265','羅鑫','台北市大安區羅斯福路三段29號31號1樓'],
['278276','尚義','高雄市新興區中正二路218號1樓'],
['278287','竹中','高雄市前鎮區和平二路242號1樓'],
['278298','新北大','新北市三峽區大學路156號1樓'],
['278313','中和','新北市中和區橋和路9號1樓'],
['278324','華陽','新北市三重區中華路45、47號'],
['278335','板橋中正','新北市板橋區中正路379巷3弄1號3號'],
['278346','旗山','高雄市旗山區中山路72號'],
['278357','東光','台北市松山區南京東路五段23巷4號1樓'],
['278379','華星','苗栗縣苗栗市福星里國華路276號.276-1號及278號'],
['278380','新成功','高雄市岡山區台上里成功路82號1樓'],
['278391','船帆石','屏東縣恆春鎮船帆路720號1樓'],
['278405','央福','新北市新莊區中央路128號130號'],
['278416','圓環','嘉義市西區北杏里文化路155之2號1樓'],
['278427','新瑞鴻','嘉義市西區文化里民族路456號458號1樓'],
['278438','長松','台北市中山區松江路65號'],
['278450','極品','基隆市仁愛區仁三路19號21號1樓2樓'],
['278461','和華','新北市蘆洲區正和街28號'],
['278472','太舜','台中市潭子區潭興路二段350號1樓'],
['278483','鹿成','台中市沙鹿區光華路394.396號1樓'],
['278494','古亭','台北市中正區汀州路二段210號'],
['278508','桃園大昌','桃園市桃園區正康二街72號76號78號1樓'],
['278519','成豐','桃園市中壢區元化路197巷3號1樓'],
['278520','桃龍','桃園市桃園區龍安街79號81號'],
['278531','富莊','桃園市中壢區莊敬路141號'],
['278542','勝全','彰化縣彰化市林森路205號'],
['278564','正順','高雄市三民區建德路69號1樓'],
['278575','信義','台北市大安區信義路四段265巷12弄1號'],
['278586','微風南山','台北市信義區松智路17號B2樓'],
['278597','鑫大富','台中市神岡區大富路20巷1號'],
['278601','萬和','台北市萬華區萬大路182號184號'],
['278612','福鶯','桃園市龜山區山鶯路155號1樓'],
['278623','楓華','新北市新店區中華路20號1樓'],
['278634','土庫中正','雲林縣土庫鎮中正路201號之1'],
['278645','新大內','台南市大內區石城里石子瀨122之153號'],
['278656','金樹','屏東縣屏東市仁愛路16號'],
['278667','佑忠','新竹市東區忠孝路430號432號'],
['278678','燕巢','高雄市燕巢區西燕里中民路612號'],
['278689','新和高','新北市中和區中正路502號1樓'],
['278690','田多','彰化縣田中鎮公館路205號'],
['278715','慈佑','新北市三重區溪尾街189號191號'],
['278726','富凱','高雄市鳳山區新富路385號1樓'],
['278737','重慶北','台北市大同區重慶北路一段30-1號'],
['278748','興忠','台北市中正區紹興北街3號1樓B1'],
['278759','新尊爵','桃園市龜山區復興三路139號141號143號145號1樓'],
['278760','澄雄','高雄市仁武區仁雄路35號澄合街172之1號'],
['278771','興信鑫','台北市中正區館前路59號1樓'],
['278782','蔗園','台中市大肚區遊園路一段143號'],
['278793','俊瑋','高雄市鳳山區忠義里光復路一段193號'],
['278807','鎮山','台南市中西區西湖里湖美街10號'],
['278818','家美','新北市中和區中山路二段317號之1'],
['278829','台塑','高雄市仁武區竹後里水管路189號191號'],
['278830','延慶','高雄市三民區中民里永年街48號50號52號1樓'],
['278841','鑫力成','新竹縣湖口鄉大同路10號6樓'],
['278852','丞億','高雄市路竹區中興路150-6號'],
['278863','東品','新竹市東區食品路146號1樓'],
['278874','P11','新竹市東區力行四路29號1樓'],
['278885','港龍','台南市安定區港南里163號'],
['278900','橋都','高雄市橋頭區橋都路86號1樓'],
['278911','佳翰','新北市板橋區中山路二段170號'],
['278922','重化','高雄市左營區文自路339號1樓'],
['278933','豫鋒','台北市士林區大南路322號'],
['278955','興聖','桃園市中壢區新生路二段48號1樓'],
['278966','大中原','桃園市中壢區新中北路151號151-1號一樓'],
['278977','新統義','新北市新莊區建中街91號93號1樓'],
['278988','海華','桃園市中壢區慈惠三街152號154號1樓'],
['278999','永福路','台中市西屯區永福路136號1樓'],
['279006','北寧','基隆市中正區北寧路382號382-5號'],
['279017','漁港','基隆市中正區中正路672號1樓'],
['279039','梅北','嘉義縣梅山鄉梅北村中山路437號'],
['279040','蚵仔寮','高雄市梓官區漁港一路160號'],
['279051','民昇','新北市三峽區民生街136號'],
['279062','富得','新北市五股區五權路48號1樓'],
['279073','新洛華','新北市三重區中華路113號115號'],
['279084','東吳','台北市士林區臨溪路70號'],
['279095','安遠','台北市北投區致遠二路149號'],
['279109','新南','台北市中正區新生南路一段126-7號'],
['279110','雙鑫','新北市新店區北新路二段169號'],
['279121','勝星','屏東縣屏東市中山路61-13號'],
['279154','華社','高雄市大社區中華路16-66號1.2樓'],
['279165','遠平','台中市北屯區北平路三段75-4號75-5號'],
['279176','文豪','新北市蘆洲區民族路402號406號1樓'],
['279187','珈英','新北市蘆洲區復興路92號'],
['279198','安生','高雄市三民區十全一路74號'],
['279202','巨蛋','台北市信義區忠孝東路四段500之2號'],
['279224','樂鑫','新北市中和區新生街146號'],
['279235','三興','台北市信義區吳興街156巷2弄2號4號1樓'],
['279246','金城','新北市土城區金城路三段71號'],
['279257','旭昇','新北市汐止區大同路三段332號'],
['279268','新裕新','台南市新營區新進路二段90號1樓'],
['279279','宏旺','南投縣南投市復興路38號'],
['279280','頭前','新北市新莊區化成路429-4號'],
['279305','鑫寶','台北市萬華區寶興街 43號45號1樓'],
['279316','崛星','高雄市新興區五福二路209.211號'],
['279327','集美','新北市三重區集美街107號'],
['279338','高進','桃園市中壢區環北路196號'],
['279349','長治','屏東縣長治鄉新潭村長興路13號1樓'],
['279350','縣科','新竹縣竹北市縣政二路南段103號'],
['279372','東金','台南市東山區新東路一段19號1樓'],
['279383','新東立','雲林縣斗六市成功路286號288號290號'],
['279394','祥櫂','桃園市龜山區萬壽路二段97號'],
['279419','欣民','桃園市中壢區民權路三段985號'],
['279420','民鑽','桃園市桃園區民生路57號1樓'],
['279431','安林','新北市林口區文化二路一段24號26號'],
['279453','盧長','桃園市蘆竹區南山路二段183號1樓'],
['279464','百君','高雄市前鎮區瑞竹里籬仔內路19號'],
['279475','留公','台北市信義區福德街247號249號'],
['279486','信福','台北市信義區福德街308號310巷1號'],
['279497','新麻豆','台南市麻豆區榖興里11鄰中山路11號'],
['279501','新有光','高雄市三民區有光路123號.125號.127號'],
['279512','隆興','嘉義縣中埔鄉隆興村汴頭1-80號'],
['279523','合樂','彰化縣線西鄉下犁路22-1號'],
['279534','歸仁大展','台南市歸仁區歸仁十三路一段119號'],
['279545','維陽','新北市板橋區陽明街158號160號1樓'],
['279556','鳳文','高雄市鳳山區文英里文衡路50號1樓'],
['279567','三重力行','新北市三重區力行路二段51號53號1樓'],
['279578','宸騰','台中市西屯區上石路201號'],
['279589','東民','新竹市東區忠孝路149號'],
['279590','璟觀','新竹市香山區東香里景觀大道830號'],
['279604','正達','高雄市新興區中正三路45號1樓'],
['279615','崠豪','新竹縣竹東鎮東林路103號1樓'],
['279626','東豐','新竹縣竹東鎮東寧里東寧路一段1號'],
['279637','達仁','高雄市三民區吉林街68號'],
['279648','益風','台中市西區精誠路107號'],
['279659','米魯','台中市烏日區光華街1號'],
['279660','雅壹','台南市永康區埔園街339號'],
['279671','華電','台北市大安區通化街177號'],
['279682','興陽','高雄市苓雅區復興二路22號'],
['279693','科工館','高雄市三民區安發里平等路91號93號'],
['279707','漢威','高雄市小港區崇本街67號'],
['279718','龍潭佳園','桃園市龍潭區中正路三坑段776號1樓'],
['279729','瑞鑽','台北市內湖區瑞光路478巷24號1樓'],
['279730','福正','台北市士林區中正路301號'],
['279741','文慶','台中市南區大慶街一段243.245號'],
['279752','第一','台中市太平區新福里中山路四段112、112-1.112-2號1樓'],
['279763','仁文','台南市東區仁和路57-7號59號1樓'],
['279774','濬家','新北市土城區廣明街2號'],
['279785','新仁政','高雄市苓雅區仁政里青年一路299號301號303號1樓'],
['279796','美圳','新北市三重區過圳街14.16號1樓'],
['279800','二溪','彰化縣溪湖鎮二溪路一段369號'],
['279811','北投奇岩','台北市北投區中央南路二段31號1樓'],
['279822','福大','新竹市香山區茄苳里五福路二段728號'],
['279833','科五','苗栗縣竹南鎮大埔里大埔五街67號'],
['279855','大坪林','新北市新店區民權路18號'],
['279866','校舍','宜蘭縣宜蘭市校舍路25號'],
['279877','福中','台北市信義區福德街159號161號1樓'],
['279888','三重中正北','新北市三重區中正北路29之8號'],
['279899','繁華','屏東縣長治鄉繁華村水源路71.71-1號'],
['279903','新前鋒','高雄市鼓山區九如四路1999.2001號'],
['279914','瑞金','基隆市安樂區基金三路75號75之1號1樓'],
['279925','捷興','新北市中和區興南路一段81號'],
['279936','明湖','台北市內湖區東湖路45號'],
['279947','鹿濱','彰化縣鹿港鎮彰濱五路二段臨406、臨408、臨410號'],
['279958','順舜','桃園市蘆竹區南順六街22號24號26號'],
['279969','北泰','新竹縣竹北市中正西路132號134號'],
['279970','港寰','台北市南港區重陽路336號1樓2樓'],
['279981','新德鴻','桃園市桃園區永福西街111號113號'],
['279992','軟科','高雄市前鎮區復興四路10之1號'],
['280006','富田','高雄市林園區林園北路477號1樓'],
['280017','大園園庄','桃園市大園區新生路19號1樓'],
['280028','東亮','台東縣台東市連航路88巷31號33號35號1樓'],
['280039','超美','高雄市鼓山區龍水里美術東四路560號'],
['280040','捷南','新北市中和區捷運路69號71號1樓'],
['280051','新芳林','彰化縣芳苑鄉斗苑路芳苑段249號251號'],
['280062','品客','彰化縣大村鄉中山路一段86號'],
['280073','嘉北','嘉義市西區保安里興達路331號'],
['280084','全利','台中市太平區樹孝路338號'],
['280095','科安','台中市西屯區國安一路105號107號109號一樓'],
['280109','歐洲','新北市三峽區三樹路199號'],
['280110','樹英','新北市樹林區大同里中華路120號'],
['280121','上弘','台北市松山區敦化北路168號B2'],
['280132','新馬偕','新竹市東區光復路二段690號1樓'],
['280143','華秀','高雄市小港區山明路1之36號'],
['280154','同勝','屏東縣屏東市潭墘里大同北路1號1樓勝利路262之2號1樓'],
['280165','晉豐','台中市豐原區西勢路425號'],
['280176','溫東','台北市大安區和平東路一段266號'],
['280198','竹篙厝','台南市東區仁和路126號1樓'],
['280202','三德','台北市大同區承德路三段55號57號1樓'],
['280213','信安','台北市大安區大安路一段218號'],
['280224','佳客','新北市中和區民德路126號126之1號'],
['280235','福濱','新北市三重區龍濱路51號53號1樓'],
['280246','頂宏','新北市三重區頂崁街210巷23弄1號3號1樓'],
['280257','東宏','新竹縣竹東鎮中正路217號1樓'],
['280268','板信','新北市板橋區信義路142號144號146號1樓'],
['280279','君天','台南市永康區中山南路518號'],
['280280','福安','新北市汐止區仁愛路178號180號1樓'],
['280291','東村','台中市太平區東村路200號'],
['280305','頂美','台南市中西區西和路1號3號'],
['280316','智樂','新北市板橋區新生街89巷2號'],
['280338','甲圍','高雄市橋頭區甲北里甲圍路71號'],
['280349','林德','高雄市苓雅區林南里林德街37號1樓'],
['280350','坤麟','雲林縣斗六市社口里大學路二段579號'],
['280361','保愛','嘉義市西區新厝里捌鄰友愛路711號'],
['280372','安運','台南市安平區平安里華平路742號1樓'],
['280383','滿泰','新北市泰山區明志路一段28、30號1樓'],
['280408','百麗','澎湖縣馬公市東文里新店路463號1號'],
['280419','旗皇','高雄市旗津區中華里旗津三路900巷1號3號'],
['280420','益昌','高雄市三民區九如二路582號'],
['280431','新連正','新北市中和區連城路347巷2號1樓'],
['280486','蓮興','花蓮縣花蓮市東興路369號371號1樓'],
['280501','龍竹','台中市龍井區竹坑里沙田路四段316號'],
['280512','華信','桃園市桃園區成功路一段47號1樓'],
['280534','金和','台北市北投區中和街314號316號1樓'],
['280545','大錢站','桃園市桃園區中華路5號1樓2樓'],
['280556','新新甲','高雄市鳳山區海洋里海洋二路57號59號1樓'],
['280567','華富','新北市板橋區華江一路501號1.2樓.503號1.2樓'],
['280578','北葉','屏東縣瑪家鄉北葉村風景1-1號'],
['280589','薇閣','台北市北投區中央北路一段108號'],
['280590','宏福','新北市新莊區公園一路34號36號1樓'],
['280615','大崁','新北市八里區龍米路三段50號52號56號'],
['280626','灣勝','高雄市三民區新民路101號103號105號'],
['280637','和建','新北市中和區建一路16號1樓'],
['280648','清和','新北市土城區清水路100號'],
['280659','民族','新北市板橋區福祿里民族路310號'],
['280660','萬成','屏東縣萬丹鄉成功街二段258號260號262號1樓'],
['280671','智德','台中市東區大智路336號'],
['280682','盛民興','台中市太平區中山路二段366號、366-1號、368號1樓'],
['280693','潭子勝利','台中市潭子區勝利路185號'],
['280707','吉川','台東縣台東市中華路二段272號1樓274號1樓2樓276號1樓'],
['280718','丹比','台南市北區西門路四段332號334號1樓'],
['280729','松鑽','台北市松山區八德路四段686號'],
['280730','光龍','屏東縣九如鄉九明村九龍路7號9號11號13號'],
['280752','鹿鑫','彰化縣鹿港鎮復興路289號291號293號'],
['280763','登發','高雄市仁武區八卦里八德南路65號'],
['280774','縣汶','新竹縣竹北市縣政二路233號235號1樓'],
['280785','清順','屏東縣潮州鎮光華里光華路153號1樓'],
['280796','昆福','台北市萬華區昆明街30-1號30-2號1樓'],
['280800','大都會','台中市西屯區惠來路二段238之1號1樓'],
['280811','全美','宜蘭縣壯圍鄉美城村大福路三段1號5號'],
['280833','海科大','高雄市楠梓區海專路143號145號1樓'],
['280844','龍濱','新北市三重區龍濱路207號209號'],
['280855','復吉','台北市松山區南京東路三段275號1樓'],
['280866','中平','新北市新莊區中平路76號1樓'],
['280877','寶園','台南市北區元寶里北園街78號78-1號78-2號78-3號1樓'],
['280888','三重一','新北市三重區正義南路133號135號'],
['280899','成洲','新北市五股區成泰路三段577巷92號94號96號'],
['280903','溪陽','彰化縣溪州鄉登山路二段15號'],
['280925','惠明','彰化縣員林市惠明街51號'],
['280936','池田','新北市蘆洲區民族路224號226號1樓'],
['280958','國雙','台北市萬華區西藏路125巷17號及129-9號'],
['280969','敦禾','台北市大安區敦化南路二段265巷6號1樓'],
['280970','旗山旗力','高雄市旗山區旗屏一路52號'],
['280981','新南科','台南市新市區南科三路17號19號1樓'],
['280992','民強','高雄市鼓山區九如四路706號708號710號712號'],
['281009','宇陽','新北市永和區永利路77號'],
['281010','宏旭','台北市萬華區西園路一段238號1樓2樓'],
['281021','桂明','台北市萬華區桂林路55號'],
['281032','昆陽','台北市南港區忠孝東路六段448號'],
['281043','潮貴','台中市西屯區朝馬路158號1樓'],
['281065','幸福市','新北市林口區文化三路二段302號1樓'],
['281076','林榮','花蓮縣鳳林鎮兆豐路699號'],
['281087','侑群','高雄市橋頭區甲昌路227號'],
['281102','康鑫','台中市霧峰區吉峰路153號'],
['281113','漢成','台中市西屯區漢成四街2號'],
['281124','高清','新竹市東區建功里建功路6號1樓'],
['281135','大德','高雄市三民區寶玉里大豐二路348號350號352號'],
['281146','富陽','台北市大安區和平東路三段298號300號1樓'],
['281157','重富','新北市三重區溪尾街321號323號1樓'],
['281168','中仁','高雄市苓雅區興中二路38號1樓'],
['281179','金石','金門縣金城鎮民權路192號196號1樓'],
['281180','京復','台北市松山區光復北路11巷44號'],
['281191','文守','高雄市左營區孟子路6號'],
['281205','至誠','台北市士林區至誠路二段31號'],
['281227','民龍','台北市內湖區新湖二路26號'],
['281238','國企','台北市內湖區行善路136號1樓'],
['281250','家興','新竹縣竹北市嘉豐五路二段168號1樓'],
['281261','祥安','台南市安南區大安街58.60.62.64號1樓'],
['281272','竹科','新竹市東區埔頂路8號'],
['281283','加捷','台南市永康區中山南路12-5號'],
['281308','民和','桃園市桃園區和平路108號110號112號一樓部分'],
['281319','鳳和','高雄市鳳山區中和里自由路202號204號206號'],
['281320','大寮江山','高雄市大寮區鳳屏二路84號86號88號'],
['281331','正濱','基隆市中正區豐稔街27號29號'],
['281342','再興','台北市文山區興隆路四段55號1樓'],
['281353','旭東','基隆市中正區中正路54號'],
['281364','婷婷','台中市北區學士路67號69號1樓'],
['281375','信德','台北市信義區松德路200巷10號'],
['281386','立飛','新北市淡水區民生路126號128號1樓2樓'],
['281397','新平智','台中市東區新庄里大智路49號'],
['281401','京富','高雄市仁武區八卦里八德南路382號1樓'],
['281412','鳳展','新北市板橋區吳鳳路23 及25 號1 樓'],
['281423','致理','新北市板橋區陽明街23巷29號1樓'],
['281434','弘安','新北市新莊區萬安街82號84號'],
['281456','柏德','桃園市中壢區中北路158號1樓'],
['281467','華民','高雄市左營區民族一路1084號'],
['281478','新保捷','新北市永和區保生路22巷2號1樓'],
['281489','竹秀','南投縣竹山鎮集山路二段58號'],
['281490','大湖','桃園市龜山區大湖一路126-1號1樓'],
['281504','板橋樂群','新北市板橋區樂群路152號156號'],
['281515','遠揚','新北市板橋區南雅南路二段124號及二段142巷12號1樓'],
['281526','光南','苗栗縣竹南鎮照南里光復路342號'],
['281537','鎮陽','高雄市前鎮區鎮陽里前鎮街278號280號'],
['281559','回家','嘉義市西區中山路518號及林森西路580號'],
['281560','五華','新北市三重區五華街148號1.2樓，150號1樓'],
['281571','同樂','宜蘭縣員山鄉同新路286號'],
['281582','香楊','屏東縣屏東市瑞光里香楊巷59-12號'],
['281593','秋紅谷','台中市西屯區朝富路30號32號1樓'],
['281607','光輝','台中市南區美村路二段79號81號1F'],
['281618','永宜','新北市中和區宜安路118巷22號24號1樓'],
['281629','興泰','高雄市楠梓區德民路1208號'],
['281630','溪州','新北市板橋區溪崑二街108.110號1樓'],
['281652','綺華','新北市樹林區復興路369.371號1樓'],
['281663','佳辰','新北市樹林區佳園路三段488號'],
['281685','弘裕','台東縣台東市豐原里中華路四段731號'],
['281696','內安','彰化縣田中鎮碧峰里中南路二段562號564號566號1樓'],
['281700','村東','彰化縣大村鄉山腳路92之8號1樓'],
['281711','嘉義新榮','嘉義市西區新榮路259號261號1樓2樓'],
['281722','文發','苗栗縣苗栗市文發路177號.177之1號'],
['281733','源昌','苗栗縣苗栗市橫車路111號1樓'],
['281744','錦興','新北市新莊區思源路181號'],
['281755','信林','台北市信義區虎林街222巷7號9號1樓'],
['281766','學勤','新北市三峽區學勤路105號及大德路211號1樓'],
['281777','永樂','新北市蘆洲區永樂街35號37號1樓'],
['281788','文元','新竹縣竹北市台元二街1號1樓'],
['281799','新崙','高雄市鳳山區中崙路501.503.505號'],
['281803','長坤','新北市林口區文化一路一段43號1樓'],
['281814','尊南','台南市南區尊南街268.270號'],
['281825','福科','台中市西屯區福林路409號'],
['281836','豐大','高雄市三民區大昌一路211號'],
['281858','鑫富民','台北市大安區忠孝東路四段181巷40弄22號1樓'],
['281869','烈嶼','金門縣烈嶼鄉八青一路1號'],
['281870','開源','台北市信義區松山路136號138號'],
['281881','豐德','桃園市八德區永豐路605號1樓'],
['281892','龍逸','桃園市龍潭區民族路372號374號1樓'],
['281906','合廣','南投縣草屯鎮碧山路307.309號'],
['281917','豐瑞','南投縣名間鄉員集路137號'],
['281928','民主','台中市南區復興路三段320、322、324、326號'],
['281939','富農','高雄市鼓山區南屏路857號'],
['281951','北投石牌','台北市北投區承德路七段166號1樓'],
['281962','大貿','台中市西屯區中平路279號'],
['281973','興東','桃園市中壢區中山東路三段226號228號228之1號'],
['281984','鳳仁','高雄市鳳山區鳳仁路174號'],
['281995','征東','台北市松山區新東街15巷1號'],
['282002','潭德','台中市潭子區崇德路五段489號'],
['282024','新三連','台北市信義區逸仙路42巷25號1樓'],
['282035','保康','台中市豐原區保康路160號'],
['282057','大義','高雄市三民區大昌二路123號123-1號'],
['282068','智華','新北市蘆洲區光華路72號'],
['282079','員和','新北市中和區員山路118號120號1樓'],
['282080','虹海','新北市土城區中央路四段109號111號1樓'],
['282091','吉發','新北市淡水區自強路275號'],
['282105','澎灣','澎湖縣馬公市中華路56號'],
['282116','德協','屏東縣長治鄉德成村中興路652號'],
['282138','春森','台北市中山區長春路67號'],
['282149','中隴','連江縣南竿鄉介壽村3鄰48-2號'],
['282150','福溢','台北市士林區德行西路96號'],
['282161','天富','台北市北投區富貴一路3號1樓'],
['282172','家豐','新北市板橋區中山路二段137號1樓'],
['282183','日光','新竹市東區民權路100號1樓'],
['282194','新智','台南市新化區大智路33號1樓'],
['282208','千成','台北市中正區林森南路4號之3'],
['282219','大林','嘉義縣大林鎮西林里仁愛路23號25號27號1樓'],
['282220','新康莊','桃園市大溪區復興路31號1樓'],
['282231','富翊','台南市永康區中華二路146號1樓'],
['282242','新育才','台中市北區三民路三段116號'],
['282253','福寶','台中市北屯區陳平路50號'],
['282264','妙禎','嘉義縣大林鎮中坑里南華路一段55號B1(南華大學學慧樓)'],
['282275','勇福','新北市三重區永福街115、117號'],
['282286','鯊魚','新北市淡水區沙崙路196號'],
['282297','遠專','台南市新市區中華路53巷9號1樓'],
['282301','台科一','台北市大安區基隆路四段43號1樓'],
['282312','嘉義榮醫','嘉義市西區世賢路二段600號1樓'],
['282334','庚大','桃園市龜山區文化一路259號B1樓'],
['282345','金興','台中市太平區新興路312號1樓'],
['282356','新元嘉','高雄市林園區港嘴里沿海路三段237號'],
['282367','新福玉','台北市南港區成福路145號147號'],
['282389','頭屋','苗栗縣頭屋鄉尖豐路118號120號1樓'],
['282390','塔城','台北市大同區長安西路271號1樓及273巷2號1樓'],
['282404','品冠','彰化縣員林市新生路278號'],
['282415','景仁','新北市中和區忠孝街103號103之1號'],
['282426','文大','台北市士林區格致路57號'],
['282437','廣正','屏東縣屏東市北興里中正路443號1樓'],
['282459','統合','台北市大安區忠孝東路四段181巷7弄11之1號11之2號'],
['282460','崇祐','台南市東區崇成里崇明路561號1樓'],
['282471','峽北','新北市三峽區大同路9號1樓'],
['282482','加群','高雄市楠梓區加昌里40鄰樂群路153號155號1樓'],
['282493','坎城','高雄市三民區十全一路183號'],
['282507','敦巨','台北市松山區南京東路四段25號25之1號'],
['282518','新玉馥','台南市玉井區玉田里中山路97號1樓'],
['282529','泰興','台北市信義區吳興街600巷94號'],
['282530','庫德','台北市松山區八德路二段366巷7號1樓'],
['282541','豐利','桃園市中壢區南園二路63號一樓'],
['282552','海帝','桃園市中壢區元化路307號1樓'],
['282563','松茂','台北市信義區松山路11號(地下一層商業空間C2號)'],
['282574','五峰','新北市新店區中興路一段252號'],
['282585','央晉','桃園市桃園區青溪一路1號及中央街223號'],
['282600','欣東雲','台中市東勢區第五橫街28號及三民街165號'],
['282611','龍新','台中市龍井區新興路18號1樓'],
['282622','中友','台中市北區育才北路74號76號'],
['282644','昌吉','台北市大同區承德路三段60號60-1號'],
['282655','馥華','宜蘭縣宜蘭市東港路2段156號'],
['282666','鳳武','高雄市鳳山區鎮北里經武路372號1樓'],
['282677','東龍','台南市東區東門路一段362號'],
['282688','元馨','台南市東區大同路二段95-3號'],
['282699','璽運','台南市東區東門里東門路一段199號'],
['282703','鑫錦州','台北市中山區錦州街263號'],
['282714','飛揚','桃園市楊梅區中山北路二段58號1樓2樓'],
['282725','橋鄰','高雄市橋頭區仕隆里成功南路151號1樓'],
['282736','建福','高雄市苓雅區五福里建國一路212號1樓2樓'],
['282747','寶德','台北市松山區八德路四段295號297號1樓'],
['282758','同德','桃園市桃園區中埔二街150號'],
['282769','敦頂','台北市大安區敦化南路一段190巷10號1樓'],
['282770','武強','新北市淡水區自強路375號1樓'],
['282781','加吉利','彰化縣田中鎮中正路276號'],
['282792','童醫','台中市沙鹿區成功東街1號'],
['282817','鹿福','台中市沙鹿區光大路99號'],
['282828','康譽','台中市霧峰區德泰街9號'],
['282839','平義','台中市太平區太平路672.672-1號'],
['282840','新墘','台南市新市區港墘里民族路118號'],
['282851','松錢','台北市信義區松隆路192號194號1樓'],
['282862','公裕','屏東縣屏東市北興里廣東路818號'],
['282873','三峽溪東','新北市三峽區溪東路93號1樓'],
['282884','頂尖','台中市沙鹿區北勢東路617號619號'],
['282895','社鑽','台北市士林區中正路639號1樓'],
['282909','文儀','台北市文山區木新路三段54號56號'],
['282910','民復','台北市松山區民生東路五段10號1樓'],
['282921','宏府','新竹市東區學府路164號'],
['282932','佑安','台北市大安區忠孝東路三段217巷1弄2號'],
['282943','中新','新竹縣竹北市中正西路389號1樓'],
['282965','路科','高雄市路竹區社南里大社路42號42之1號46號1樓'],
['282976','興洲','新北市新莊區新泰路472號1樓'],
['282987','丹鳳','新北市新莊區新北大道七段842號'],
['282998','川金','新北市淡水區淡金路一段567號569號571號1樓'],
['283005','新旺淇','高雄市三民區建國三路169號1樓'],
['283016','福康','台中市西屯區福林里福康路33號'],
['283027','冬美','雲林縣虎尾鎮民權路2-3號'],
['283038','上龍','嘉義縣水上鄉龍德村十一指厝75-90號'],
['283049','觀海','新北市八里區龍米路一段140、 142號'],
['283050','竹灣','新竹市北區客雅里延平路一段252號1樓'],
['283061','福來','新北市新莊區五權一路8號'],
['283072','東毓','台中市沙鹿區北勢東路507之8號9號'],
['283083','文龍','高雄市鳳山區文龍東路199號'],
['283094','溫州','台北市大安區羅斯福路三段245號'],
['283108','德致','台北市北投區明德路87號89號1樓'],
['283119','捷仕堡','新北市新莊區龍安路15號.龍安路69巷1號'],
['283120','日福','新北市中和區中和路380號'],
['283131','南投','南投縣南投市民族路289、291、293號中山街143號1.2樓'],
['283142','藏富','台中市北屯區山西路二段639號'],
['283153','中央南','新北市三重區中央南路39號41號'],
['283164','伍泉','新北市三重區五華街52.54號1樓'],
['283175','正仁','高雄市新興區中正三路84號1樓'],
['283186','萬順','新北市深坑區北深路三段198號200號1樓'],
['283197','好家園','花蓮縣花蓮市國聯一路2號2-1號'],
['283201','原億','新北市三重區仁和街95號97號1樓'],
['283212','高桂','高雄市小港區孔鳳路390號'],
['283223','政戰','台北市北投區中央北路二段15號17號'],
['283245','文富','桃園市龜山區文化三路48號50號1樓及文三一街1號1樓'],
['283256','龍門','台北市大安區和平東路二段38之1號40號1樓'],
['283267','明采','新竹縣竹北市光明一路158號1樓'],
['283278','淡水','新北市淡水區中正東路3號'],
['283289','車路頭','新北市三重區車路頭街135號'],
['283290','新興','台南市南區新興路529號531號1樓'],
['283304','公館','台北市北投區公館路31號'],
['283315','岩投','台北市北投區公館路230號'],
['283326','前中','高雄市大寮區自由路1號1-1號1樓'],
['283337','博勝','屏東縣屏東市博愛路263號1樓'],
['283348','聖民','桃園市桃園區民生路208號一樓'],
['283359','和興','屏東縣屏東市復興南路一段153.155號1樓.和生路一段900號1樓'],
['283360','長元','新北市三重區長元街2-2號'],
['283371','國宅','台南市南區新興路441號443號'],
['283382','興村','高雄市新興區五福二路92號'],
['283393','桃德','桃園市八德區介壽路一段794號1樓'],
['283407','成達','桃園市平鎮區育達路136號'],
['283418','寶隆','新北市新店區寶橋路69號1樓'],
['283429','祥泰','新北市土城區中山路38號'],
['283430','康雲','台北市內湖區康寧路一段160號'],
['283452','福豐','台中市后里區福美路17號'],
['283463','青允','屏東縣萬巒鄉新置村新隆路75號'],
['283474','斗抵','台中市沙鹿區沙田路43-12號'],
['283485','八大','嘉義市西區保福里八德路237號'],
['283496','樂善','桃園市龜山區文明路131號1樓'],
['283500','康寧','台北市內湖區康寧路三段26巷1號'],
['283511','雙環','台北市萬華區環河南路二段207號'],
['283522','關圓','新竹市東區關東路56號1樓'],
['283533','榮耀','高雄市左營區福山里民族一路1014號1樓'],
['283544','哈蜜','台北市大同區重慶北路三段309、311號1樓'],
['283555','天闊','新北市新店區環河路16號1樓'],
['283566','康德','高雄市前鎮區鎮興路8號1樓'],
['283577','權松','台北市中山區松江路363號'],
['283588','大華街','桃園市蘆竹區大華街93號一樓'],
['283599','賢德','新北市蘆洲區集賢路362號364號'],
['283603','祥裕','高雄市鼓山區明誠里裕誠路1610號1612號'],
['283614','富敦','桃園市龜山區樂學三路83號1樓'],
['283625','大灣','台南市永康區大灣路951號'],
['283636','家麒','新北市板橋區宏國路27號'],
['283647','太平','台中市太平區中政里中興路171.173號'],
['283658','春寶','桃園市桃園區春日路670號1樓'],
['283669','新嘉商','嘉義市東區民權路72號1樓'],
['283670','中埔','嘉義縣中埔鄉和美村中山路五段856號'],
['283681','百事達','高雄市左營區左營大路155號'],
['283692','崇博','屏東縣屏東市博愛路429號'],
['283706','盛田','高雄市楠梓區享平里興楠路326號'],
['283717','貴林','桃園市龜山區樂善里15鄰文明路43號'],
['283728','宮前','嘉義縣新港鄉新民路238之50號1樓'],
['283739','永欣','雲林縣斗六市斗六三路6號'],
['283740','台北灣','新北市淡水區新市一路一段108號1樓'],
['283751','員玉','宜蘭縣員山鄉員山路一段446號448號'],
['283762','八甲','台南市歸仁區八甲里中正北路一段194號'],
['283773','靖立','桃園市八德區豐德一路17號豐田一路83號'],
['283784','雙民','新竹市東區民族路205號1樓'],
['283795','佳美','宜蘭縣五結鄉中正路二段127號1樓'],
['283809','漢華','台中市北區漢口路五段60號62號66號1樓'],
['283810','潭富','台中市潭子區中山路二段585之1號'],
['283821','新港庄','苗栗縣後龍鎮新民里中心路122.122-1.122-2.122-3號'],
['283832','松旅','高雄市小港區山明里松信路88號1樓'],
['283843','景竹','桃園市蘆竹區南竹路五段200號1樓'],
['283854','至善','台北市大安區復興南路二段377號1樓'],
['283865','文昌','高雄市新興區六合路117號'],
['283876','王田','台中市大肚區沙田路一段386號'],
['283887','世和','台北市文山區和興路1.3.5號'],
['283898','福僑','桃園市八德區廣福路162號164號1樓'],
['283902','臻愛','桃園市桃園區大業路一段152號'],
['283913','中孝','桃園市中壢區忠孝路248號1樓2樓'],
['283924','澄合','高雄市仁武區仁光路165號1樓'],
['283935','松機','台北市松山區敦化北路340之10號1樓'],
['283946','玉璽','台北市南港區昆陽街16號1樓'],
['283957','光仁','新北市板橋區中山路二段273號'],
['283968','堡勤','屏東縣屏東市新生里復興南路一段370號1樓'],
['283979','永勝','台南市永康區六合里中華二路320號1樓'],
['283980','港興','台北市南港區興華路117號119號121號123號125號'],
['283991','安立','台南市安南區安中路四段150號'],
['284008','蘆華','新北市蘆洲區長安街140號1樓'],
['284019','美宜','宜蘭縣壯圍鄉大福路三段362號1樓362號2樓之1'],
['284020','國貿','台北市信義區基隆路一段333號B3'],
['284031','欣福','台北市內湖區成功路二段320巷60號'],
['284042','清華','高雄市三民區義華路92號'],
['284053','哨船頭','基隆市中正區義一路83號1樓'],
['284064','福壽','新北市新莊區福壽街140號'],
['284075','吉利','桃園市中壢區吉林二路83巷30號32號34號'],
['284086','中一','新北市板橋區中正路332之5號1樓'],
['284097','東洸','桃園市平鎮區平東路27號東光路16之1號1樓'],
['284101','冠德','新北市中和區景平路71-5號'],
['284112','橋和','新北市中和區橋和路99號1樓'],
['284123','蓮富','花蓮縣光復鄉中正路一段90號1樓中山路二段250號252號1樓'],
['284145','復美','新北市永和區秀朗路一段146號'],
['284156','樂多','金門縣金寧鄉伯玉路二段229號'],
['284167','新樟樹','新北市汐止區樟樹二路255號'],
['284178','唯鑫','南投縣南投市南崗三路8號2樓'],
['284189','嘉府','嘉義市東區民權路194號196號198號'],
['284190','田正','彰化縣田尾鄉中山路一段191號'],
['284215','德美','彰化縣和美鎮德美路700號'],
['284226','富勝','桃園市龜山區文學路250號1樓'],
['284237','加勝','新竹縣竹北市勝利八街二段63.65號1樓'],
['284248','蘆洲普安','新北市蘆洲區中興街57號59號61號63號'],
['284259','品嘉','新北市新莊區新樹路69之4號之5號1樓'],
['284260','鑫昌','新竹市東區文昌街34、36號一樓'],
['284271','易仕','桃園市龍潭區中豐路695巷2-1號'],
['284282','麗興','新北市林口區麗園一街11巷1號1樓之2'],
['284293','鑫程','高雄市岡山區程香里大德二路61號1樓'],
['284307','港口','高雄市小港區平和路75號77號79號1樓'],
['284318','達義','桃園市平鎮區義民路199號1樓'],
['284329','萬興','桃園市中壢區月眉路二段357號1樓部份'],
['284330','宏宇','桃園市平鎮區金陵路二段104號'],
['284341','華鎮','新北市樹林區中華路381號1樓2樓'],
['284352','新安','新北市新莊區民安東路185號187號部份1樓'],
['284363','清漢','高雄市新興區德望里民生一路154號1樓'],
['284374','僑一','新北市板橋區僑中一街104號106號'],
['284385','朴站','嘉義縣朴子市平和路11-1號1樓'],
['284396','松柏嶺','南投縣名間鄉松柏村名松路二段182號'],
['284400','汕頭','高雄市前鎮區汕頭街81號1樓'],
['284411','鹿港','彰化縣鹿港鎮中山路257號'],
['284422','鹿和','彰化縣鹿港鎮鹿和路一段271、273、275號'],
['284433','永隆','台中市大里區大明路457號'],
['284455','東林','高雄市林園區東林西路154號'],
['284466','奕維','雲林縣斗南鎮興國路35.37號1樓'],
['284477','學裕','新北市土城區學成路91巷2號93號1樓'],
['284499','龍岡','桃園市中壢區龍東路508號510號1樓'],
['284514','勝多','新北市板橋區縣民大道三段270巷2-6號'],
['284525','新北科','台北市大安區新生南路一段3號B1樓'],
['284536','善安','台南市安定區蘇林里7號'],
['284558','千湖','高雄市湖內區葉厝里保生路135號137號'],
['284569','天青','台南市永康區復華三街25號1樓'],
['284570','新同安','台南市安南區理想里海佃路二段432號'],
['284581','永嘉','台南市永康區二王路139號'],
['284592','高灃','新竹市東區高翠路331號1樓'],
['284606','源冠','新竹縣新豐鄉尚仁街92號1樓'],
['284617','竹高','新竹市東區東山街17號19號21號1樓'],
['284628','羅高','宜蘭縣羅東鎮公正路357號359號'],
['284639','環民','桃園市中壢區環西路2號1樓民族路336號338號1樓'],
['284640','樂樂','台中市太平區東平路422、430號1樓'],
['284651','昶誼','苗栗縣頭份市後庄里幼英街131號1樓'],
['284662','鎮瀾','台中市大甲區大甲里鎮瀾街102號'],
['284673','內埔','屏東縣內埔鄉內田村光明路224號226號1樓'],
['284684','富寶','桃園市平鎮區新富五街9號1樓'],
['284695','馥竹','新北市淡水區民權路187巷19號1樓'],
['284709','國圖','台北市中正區中山南路20號B1樓'],
['284710','愛鄉','新北市林口區仁愛路二段140號142號1樓'],
['284721','紫陽','台北市內湖區紫陽里陽光街159號'],
['284732','古樓','屏東縣來義鄉中正路52號'],
['284743','軍建','台中市北屯區軍福十三路198號'],
['284754','懷民','新北市板橋區民治街111號'],
['284765','板府','新北市板橋區中山路一段158巷4號6號1樓'],
['284776','南建平','台南市安平區建平路19、21、23號1樓'],
['284798','揚善','桃園市楊梅區中山北路一段23號25號1樓'],
['284802','大智','新北市三重區大同北路63號'],
['284813','松仁','台北市信義區松仁路213號'],
['284824','正湧','桃園市平鎮區正義路82號1樓'],
['284835','龍政','桃園市龍潭區中正路190號192號1樓2樓'],
['284846','展奇','高雄市鳳山區青年路二段169號1樓169號2樓'],
['284857','大街','屏東縣恆春鎮墾丁里墾丁路225.227號1樓'],
['284868','新東勢','屏東縣內埔鄉東勢村大同路三段2號6號1樓'],
['284879','鹽洲','屏東縣新園鄉共和村光復路1號'],
['284880','興昌','台中市北屯區興安路二段62號1樓'],
['284891','添丁','新北市永和區永貞路365號367號1樓'],
['284905','新鎮','高雄市大樹區九曲里九曲路99號'],
['284916','捷西','高雄市鳳山區中山東路400巷30弄60號'],
['284927','安北','台南市安南區安中路一段546號552號'],
['284938','聯合','台北市信義區忠孝東路四段559巷6號'],
['284949','板安','新北市板橋區長安街202.204號'],
['284950','雨萌','台中市大里區中興路一段11-6、11-7號1樓及東南路1號1樓'],
['284961','新海佃','台南市安南區海佃路一段239號一樓'],
['284972','鎮業','桃園市平鎮區南豐路238號240號1樓'],
['284983','創薪','桃園市中壢區龍昌路270號1號'],
['284994','太隆','台中市太平區德隆里工業路148號150號'],
['285001','新興運','台南市新化區護國里中山路211號'],
['285012','崑崙','台北市中山區中山北路一段105巷13號'],
['285023','褒旺','雲林縣褒忠鄉中正路456之1號'],
['285034','美群','台中市大里區美群路60號'],
['285045','友達光電','台中市西屯區林厝里中科路1號1樓'],
['285056','新永健','台南市中西區健康路一段346號'],
['285067','于義','苗栗縣竹南鎮公義路1098號'],
['285078','冠成','桃園市八德區重慶街172號'],
['285089','昌順','台中市北屯區北屯路439之16號1樓'],
['285090','展騰','台中市西屯區台灣大道三段688號690號'],
['285115','向心','台中市南屯區大墩6街284號'],
['285126','美村','台中市西區美村路一段542號546號'],
['285137','美吉','新北市三重區集美街223號225號'],
['285148','板橋華江','新北市板橋區華江九路58號60號'],
['285159','萬美','台北市文山區萬和街6號2樓之1'],
['285160','埔惠','南投縣埔里鎮大城里中山路三段546號1樓'],
['285171','員昌','彰化縣員林市黎明里12鄰南昌路70號72號1樓'],
['285182','青溪','桃園市桃園區自強路2號1樓與中山東路153號1樓'],
['285193','保東','台南市關廟區關新路二段7號'],
['285207','新茄萣','高雄市茄萣區茄萣路二段403號1樓'],
['285218','囍洋洋','屏東縣萬丹鄉萬丹路一段366號368號1樓'],
['285229','順越','屏東縣內埔鄉南寧路19、21號'],
['285230','省新','台南市新市區永就里9鄰中山路180號1樓'],
['285241','仁發','台南市永康區東橋里東橋六街61號'],
['285252','東勇','桃園市八德區東勇街83號'],
['285263','紫德','台北市內湖區文德路210巷30弄32號34號1樓'],
['285274','仁武名山','高雄市仁武區灣內里八德東路613號'],
['285285','新東專','高雄市湖內區湖東里中山路一段229號'],
['285296','前德','台北市士林區前港街17號'],
['285300','向興','台中市西區向上路一段95號'],
['285311','維樂','台中市太平區溪州西路98號'],
['285322','廣和','新北市板橋區和平路101巷1號'],
['285333','碧湖','新北市新店區文中路2號1樓2樓'],
['285344','東發','台南市東區中華東路三段379號'],
['285355','日昇','新北市中和區中和路326號1樓'],
['285366','至興','高雄市左營區光興街54號及56號'],
['285377','德正','新北市新店區德正街23巷1號'],
['285388','勤醫','台北市信義區吳興街220巷33號'],
['285399','博河','高雄市三民區熱河二街17號'],
['285403','板耀','新北市板橋區自由路52號54號1樓'],
['285414','新大豐','高雄市三民區正忠路259號'],
['285425','瑞中','高雄市前鎮區崗山中街99之5號'],
['285436','汶莊','台中市北區中清路一段102號1樓'],
['285447','力成三','新竹縣湖口鄉大同路15之1號6樓'],
['285458','微笑','台中市北區育樂街66.68號一樓及夾層'],
['285469','愛琴灣','新北市淡水區濱海路一段430號432號'],
['285470','惠宇','台中市南屯區向上南路一段167之1號'],
['285481','板中','新北市板橋區府後街4.4-1.4-2號1樓'],
['285506','愛河','高雄市前金區博孝里河東路8號1樓'],
['285517','辛亥站','台北市文山區辛亥路四段132號'],
['285528','松家','台北市信義區松山路608號610號'],
['285539','民笙','桃園市桃園區民生路287號289號'],
['285540','日勝','新北市泰山區山腳里泰林路二段515號517號'],
['285551','東學','新北市林口區東湖路100號1樓'],
['285562','達陞','新竹縣湖口鄉中山路一段537號1樓'],
['285573','新桃府','桃園市桃園區縣府路312號312之1號'],
['285584','和泰','台北市大安區和平東路一段169號'],
['285595','元翔','桃園市蘆竹區六福路247巷2-1號'],
['285609','貝殼','高雄市旗津區復興里旗津三路356.358號'],
['285610','管仲','高雄市前鎮區管仲路20號1樓'],
['285632','長通','台北市中山區長安東路二段101號'],
['285643','新聖母','宜蘭縣羅東鎮中正南路160號(聖母醫院內)'],
['285654','市鑫','台中市中區自由路二段9號1樓'],
['285665','新茂','新北市新莊區化成路118號120號'],
['285676','中泰','新北市新莊區中港一街10號10-1號'],
['285687','汐東','新北市汐止區忠孝東路430號432號1樓'],
['285698','森美','台北市大安區信義路三段65號1樓'],
['285702','新東宮','台北市信義區松山路455號'],
['285713','雙假','桃園市桃園區大有路660號1樓之2'],
['285724','北投光明','台北市北投區光明路178號1樓'],
['285746','新萬盛','台北市文山區羅斯福路五段21號1樓'],
['285768','豐創','高雄市楠梓區創新路76號78號80號1樓'],
['285779','承義','新北市土城區忠承路22號'],
['285780','陽旭','台中市北屯區北屯路200巷1號及北屯路200-1號一樓、地下一層'],
['285791','關東','新竹市東區金山里光復路一段187、189號1樓'],
['285805','天湖','新竹市東區明湖路180號'],
['285816','中央','新北市新莊區中平路439號B1樓'],
['285827','海和','桃園市中壢區六和路66號68號'],
['285838','曜駿','桃園市龍潭區中興路292號1樓'],
['285850','新北竹','新竹縣竹北市博愛街358.360號1樓'],
['285861','小金','金門縣烈嶼鄉林湖村東林街156號'],
['285872','西屯安星','台中市西屯區福星路301號1樓'],
['285883','軍松','台中市北屯區松竹五路二段199號'],
['285894','大甲東','台中市外埔區甲后路五段15號1樓'],
['285908','新五福','基隆市七堵區福五街80號82號1樓'],
['285919','明園','新北市汐止區汐萬路二段62巷1號1樓'],
['285920','龜山銘傳','桃園市龜山區德明路152號154號1樓'],
['285931','長壽','新北市三重區正義北路198號200號1樓'],
['285942','鼎盛','台北市文山區景文街79號'],
['285953','中棲','台中市沙鹿區台灣大道七段259號1樓'],
['285975','雅津','台中市北區天津路二段9號.11號'],
['285986','平西','台中市北區陜西路107號109號'],
['285997','新安順','台南市安南區安和路三段55-1號57號1樓'],
['286004','文炳','台南市永康區南台街1號'],
['286026','友福','高雄市楠梓區土庫三路25號1樓'],
['286037','高原','桃園市龍潭區中原路二段362、364號1、2樓'],
['286048','大順','高雄市苓雅區大順三路76號1樓'],
['286059','府樂','新竹縣竹北市縣政九路80號一樓'],
['286060','海福','苗栗縣竹南鎮明勝路318號'],
['286071','鳳岡','新竹縣竹北市長青路一段388號390號'],
['286082','觀濤','桃園市觀音區樹林里民權路1號'],
['286093','二八水','彰化縣二水鄉員集路三段488號'],
['286107','鹽水','台南市鹽水區中正路35號'],
['286118','萬運','台北市萬華區西園路一段153號地下室'],
['286129','森和','高雄市鳳山區南和里16鄰林森路203號'],
['286130','金順','高雄市大社區金龍路380號'],
['286141','好好','新竹縣湖口鄉中山路一段790號1樓'],
['286152','福德','新北市新店區三民路179號1樓'],
['286163','卿斳','新北市林口區竹林路48號'],
['286174','新義民','新北市蘆洲區民族路122號124號'],
['286185','明貴','新北市泰山區明志路三段44號46號1樓'],
['286196','東道','宜蘭縣宜蘭市東港路一段575號'],
['286200','保平','新北市永和區保平路135號'],
['286222','中為','苗栗縣頭份市信義路128號1樓'],
['286233','鈞吉','苗栗縣頭份市成功里11鄰建國路198號1樓'],
['286244','光員','新北市土城區光明街15號'],
['286255','芝加灣','新北市三芝區錫板里海尾14-35號1樓2樓3樓'],
['286266','樹鳳','新北市樹林區中正路417號 1樓'],
['286277','秀山','台北市北投區中和街476號478號480號1樓'],
['286288','萬光','台北市中正區中華路二段157號'],
['286299','世運','台北市萬華區昆明街81號83號'],
['286303','富由','台中市東區自由路三段169-1號'],
['286314','安居','台北市大安區安居街33號'],
['286325','新板橋','新北市板橋區文化路一段135號'],
['286336','南應大','台南市永康區鹽行里中正七街27.29號1樓'],
['286347','群創C','台南市善化區南科八路12號B1'],
['286369','美新','新北市新莊區復興路二段141號143號'],
['286370','瑞東','台北市內湖區洲子街102號1樓'],
['286381','金沙','新北市淡水區沙崙路133號'],
['286392','港東','高雄市三民區建國二路233號'],
['286428','新揚','新竹市東區民生路149號151號153號1樓'],
['286439','碇內','基隆市暖暖區源遠路158號160號'],
['286440','力成貳','新竹縣湖口鄉三民路7號B1'],
['286451','長權','高雄市前鎮區民權二路380號1樓'],
['286462','和氣','桃園市大溪區仁和路二段51號1樓'],
['286473','憲政','高雄市苓雅區憲政路266號1樓2樓，264號1樓'],
['286484','力成玖','新竹縣湖口鄉文化路4號B1樓'],
['286509','新艋舺','台北市萬華區萬大路292號294號'],
['286510','大民','高雄市大社區三民路213號'],
['286521','通河','台北市士林區通河街151號1樓'],
['286532','南濱','花蓮縣吉安鄉南濱路一段208號'],
['286543','深坑','新北市深坑區北深路三段145號'],
['286565','勝新','桃園市楊梅區瑞溪路一段253號255號1樓'],
['286602','加仁','高雄市楠梓區加仁路1號'],
['286624','文安','台南市仁德區文賢路一段576號'],
['286635','清華竹師','新竹市東區光復路二段101號'],
['286646','崗埔','高雄市岡山區華崗里華崗路150號'],
['286668','七美','澎湖縣七美鄉南港村南滬50號51號'],
['286680','盛天','新竹市北區延平路三段545號'],
['286691','長樂','新北市蘆洲區長安街269號'],
['286716','麗景','高雄市楠梓區清豐里旗楠路891號1樓'],
['286727','斗煥坪','苗栗縣頭份市中正二路188號188之2號'],
['286749','鑽寶','台北市萬華區興義街41號.43號'],
['286886','鑫興','桃園市蘆竹區中興路528號'],
['287144','力成科','新竹縣湖口鄉大同路26號6樓'],
['287443','港新','高雄市三民區建國一路417號'],
['287454','力成捌','新竹市東區力行三路15號6樓'],
['287487','前進','新北市蘆洲區中正路185巷50號52號1樓'],
['287786','大樂','新北市八里區文昌五街11號13號'],
['287801','登雲','苗栗縣造橋鄉平仁路53-1號'],
['287823','犁耘','台北市信義區信安街29號'],
['287867','國田','桃園市桃園區建國路156-9號'],
['287878','景后','台北市文山區景興路202巷11號'],
['287915','東興一','台中市北屯區南興一路136號'],
['287937','新恆','新北市新莊區明中街45號之2、47巷1號'],
['287948','蓮達','花蓮縣新城鄉嘉里三街63號1樓'],
['287959','長濱','台東縣長濱鄉長濱路2-5號'],
['287971','大漢','新北市板橋區長江路一段375號'],
['288000','幸福灣','屏東縣枋山鄉枋山村中山路三段61及61-1號部分'],
['288022','裕隆','新北市新店區中興路三段7號'],
['288055','山昌','高雄市楠梓區三山街61-7號'],
['288066','監理所','台北市松山區八德路四段22號、22-1號'],
['288077','芊莆','桃園市中壢區永信路287號289號291號'],
['288088','九井','南投縣魚池鄉通文巷6-13號'],
['288099','復大','台北市北投區復興四路21、23號1樓'],
['288158','鉅山','苗栗縣後龍鎮灣寶里下彎寶庄128之5號、128之6號'],
['288169','鑫華崇','高雄市左營區崇德路358號'],
['288170','榮美','台北市士林區美崙街51號'],
['288206','原中','台北市中山區中原街132號'],
['288217','湖市','新竹縣湖口鄉中正路一段104號'],
['288251','嘉政二','新竹縣竹北市嘉政二街51號'],
['288309','逢文','台中市西屯區逢甲路16號'],
['288310','帝景','桃園市中壢區西園路118號1F'],
['288321','樂嘉','桃園市蘆竹區長興路二段76號1樓'],
['288332','松華','高雄市鳥松區大同路66之1號'],
['288365','內埔仔','嘉義縣竹崎鄉內埔村崁腳40號'],
['288387','復瑞','台北市大安區復興南路二段116號'],
['288398','金山六','新竹市東區金山六街59.61號1樓'],
['288424','聖亭','桃園市龍潭區聖亭路八德段78號、80號、82號'],
['288435','酷比','桃園市楊梅區自立街301號1樓'],
['288479','宜中','宜蘭縣宜蘭市民權新路297號1樓'],
['288480','福王','高雄市鹽埕區育仁里大義街106號及五福四路92號94號'],
['288527','角板山','桃園市復興區中正路93號95號'],
['288572','南京東','台北市松山區南京東路五段254號1樓'],
['288594','桃漾','桃園市八德區建德路350號'],
['288642','三富','桃園市蘆竹區南崁路二段442號1樓'],
['288675','辛昌','台北市文山區辛亥路四段99號'],
['288734','碇遠','基隆市暖暖區源遠路299、301號'],
['289069','成研','台南市東區大學路1號成功大學光復校區第二宿舍地下一樓餐廳'],
['290221','東東強','台南市善化區東勢寮186-9號'],
['290254','北榮','台北市北投區石牌路二段201號'],
['293404','鑫寧','台北市大同區民生西路214號216號1樓'],
['293644','東洲','台中市豐原區豐原大道七段488號'],
['294049','豐科','台中市豐原區豐原大道七段381號1樓'],
['780827','和順','台南市安南區安和路五段166號'],
['791241','佳里','台南市佳里區光復路197號197-1號'],
['800125','豐東','台中市豐原區豐東路218號'],
['810410','永興','新北市永和區竹林路98號'],
['822169','公園','台南市北區公園路1072-1號2號3號'],
['822642','雙行','台中市北區雙十路二段47號'],
['830698','富盟','雲林縣斗六市文化路304號306號'],
['832030','新墩','台中市西屯區大墩路901號'],
['832498','幸福','新北市三重區自強路一段272號'],
['833000','美田','高雄市苓雅區林森二路79號'],
['833468','農安','台北市中山區農安街28-1號1樓28-2號1樓'],
['842060','武聖','台南市中西區武聖路47號49號'],
['844712','員山','新北市中和區員山路163號、165號、167號1樓'],
['844745','大溪','桃園市大溪區中央路152號'],
['844860','晉江','台北市中正區和平西路一段26號'],
['844882','彌陀','嘉義市東區芳安路1號1F'],
['845472','溪湖','彰化縣溪湖鎮彰水路三段105號107號109號'],
['845597','安中','台南市安南區安中路一段711號'],
['845612','新立德','台中市東區復興路四段4號台中路45號'],
['846109','育仁','台中市北區進化路581號、583號1樓'],
['846235','千歲','新北市樹林區千歲街26-10號'],
['846420','高仁','新北市三重區仁愛街274號'],
['846659','仁德','台南市仁德區中山路497、499、501號1樓'],
['850119','北港','雲林縣北港鎮民主路106號'],
['850762','山鶯','桃園市龜山區山鶯路372號'],
['851064','伍誼','台南市歸仁區復興路162之1號'],
['851721','一德','台北市北投區中央北路四段513號'],
['852067','順大','台中市大甲區中山路一段1085號'],
['852230','益彰','新北市八里區中山路二段409號411號'],
['852425','昌大','台中市北屯區大連路二段283號'],
['854351','厚生','屏東縣屏東市和平路2號'],
['854443','中東','高雄市鳳山區中山東路88號1樓仁愛路65號1樓'],
['854557','一心','台南市東區中華東路一段24號'],
['854661','大全','台中市西區公館路136號138號'],
['854742','豐信','台中市豐原區復興路75號信義街77號'],
['854971','鼎力','高雄市三民區天祥一路124號'],
['855055','公平','台南市北區公園路694號'],
['855206','懷德','新北市板橋區懷德街55號57號'],
['855239','嫩江','高雄市三民區嫩江街101號1樓喜?街134號'],
['855295','宏平','高雄市小港區宏平路388號390號392號1樓'],
['855354','添恩','台北市文山區指南路三段8號10號'],
['855398','木柵','台北市文山區木柵路二段157號'],
['855572','和安','台北市大安區和平東路三段230號'],
['860057','新園','屏東縣新園鄉興龍村14鄰南興路319號'],
['860301','蘆竹','桃園市蘆竹區山腳里南山路三段306號308號'],
['860644','日出','台中市大甲區孟春里通天路168號'],
['860655','保生','新北市永和區保安里保生路1號1樓'],
['860688','立人','台南市北區和順里西門路三段81號1樓、西門路三段47巷12號1樓'],
['860770','成功','台北市內湖區成功路二段252號'],
['861131','綠洲','新北市三峽區鳶山里12鄰中山路186號1樓'],
['861544','嘉南','台南市仁德區二行里二仁路一段151號'],
['862190','安冠','高雄市三民區莊敬路289號'],
['862330','社口','台中市神岡區社口里8鄰中山路736號'],
['863252','六甲','台南市六甲區六甲里22鄰中正路552號'],
['863447','鼎好','台中市烏日區中山路二段289號'],
['863458','醫湖','新竹縣湖口鄉孝勢里忠孝路20號22號'],
['863551','麥寮','雲林縣麥寮鄉麥津村中山路196號'],
['863632','昌盛','台中市北屯區昌平路二段45號之8及45號之9'],
['863698','豫銘','台北市大安區大安路二段102號'],
['863757','配天','嘉義縣朴子市竹圍里大同路212號1樓、文化南路81號83號1樓'],
['863975','精美','台中市太平區中平里精美路1號'],
['864462','航空','桃園市蘆竹區中正路304號'],
['864587','潭墘','屏東縣屏東市勝利路224號226號'],
['864613','延和','新北市土城區平和里延和路106號'],
['864808','城北','新竹市北區城北街43號'],
['864886','假日','桃園市桃園區大有路560號1樓'],
['864897','新年','新北市新莊區豐年街50巷1號1樓、豐年街54號1樓'],
['865100','新北平','台中市北區北平路二段96號'],
['865269','議會','新北市板橋區莊敬路60號'],
['865362','師大','台北市大安區師大路87號'],
['865384','新五廊','台中市西區民生路155號一樓'],
['865421','博正','高雄市左營區忠言路174號'],
['865535','北門','台南市東區北門路一段310號、312號'],
['865694','晶華','台北市中山區林森北路262號'],
['865823','后綜','台中市后里區甲后路一段349、351號1樓'],
['865834','中福','台北市中山區民生東路二段113號'],
['866158','新屋','桃園市新屋區新生里12鄰中山路367號369號371號'],
['866310','蓮吉','花蓮縣吉安鄉中山路三段423號'],
['870272','新銀','台南市新營區中山路140號1樓'],
['870401','水景','台中市北屯區東山路一段212號'],
['870504','道生','台北市信義區新仁里東興路57號'],
['870766','三義','苗栗縣三義鄉中正路118號'],
['870870','長旺','雲林縣東勢鄉東勢東路84號'],
['870917','觀園','桃園市大園區大觀路604號606號'],
['871079','機場','桃園市大園區三民路二段110號112號'],
['871345','英巧','嘉義縣民雄鄉西安村西安路37號.39號1樓'],
['871482','統吉','新北市蘆洲區永平街32巷12弄1號'],
['871596','玉山','台南市永康區永明街97號'],
['871714','隆田','台南市官田區隆田里14鄰文化街130號'],
['871725','水上','嘉義縣水上鄉中興路378號380號'],
['871747','聖賢','台南市北區大豐里文賢路315號'],
['871828','新建','高雄市鹽埕區建國四路175號'],
['871839','崙背','雲林縣崙背鄉南光路3號'],
['871976','光春','新竹縣竹東鎮長春路三段253號'],
['872005','山頂','高雄市大寮區內厝路219號'],
['872061','孟揚','新北市永和區林森路62號'],
['872108','花旗','新北市新莊區中港路132巷26號'],
['872382','蓮美','花蓮縣花蓮市中美路209號'],
['872441','千群','新北市板橋區東丘里民享街53號'],
['872522','興平','雲林縣西螺鎮中興里延平路418號420號'],
['872599','東航','台東縣台東市民生里更生路270號1F'],
['872832','華岡','台北市士林區光華路26巷7-1號'],
['872957','樂業','台中市東區樂業路259號'],
['873020','菁英','苗栗縣大湖鄉明湖村中正路107號'],
['873215','龍邦','苗栗縣三義鄉勝興村水美街315之8號9號'],
['873385','蓮嘉','花蓮縣新城鄉嘉里村嘉里路153號155號157號1樓'],
['873400','民樂','雲林縣北港鎮華勝里28鄰民樂路39號'],
['874230','林森','台北市中山區林森北路500號'],
['874252','華山','台北市中正區忠孝東路一段138號'],
['874296','益民','台中市大里區東興里10鄰大明路238號'],
['874399','大橋','台南市永康區大橋里中華路747號1樓、中華西街285號1樓'],
['874458','隆安','台中市西屯區大隆路56號1樓'],
['874573','致遠','台北市北投區石牌路一段126號'],
['874757','市醫','台南市東區崇德路685號687號'],
['875060','清茂','新北市三重區成功路106號之2'],
['875093','合作','台中市北區自強一街1號'],
['875369','彰和','彰化縣彰化市民族路163號'],
['875484','站行','桃園市中壢區新興路162號'],
['875602','賢明','高雄市前鎮區竹內里賢明路3號5號'],
['875646','民自','新北市中和區冠穗里民享街38號38之1號'],
['880073','太魯閣','花蓮縣秀林鄉富世村富世路152號152-1號'],
['880165','那菝','台南市新化區那菝林241號'],
['880349','里港','屏東縣里港鄉永春村中山路46號'],
['880394','泰毅','高雄市旗山區太平里旗南一路121號'],
['880567','福懋','雲林縣斗六市石榴路196之1號'],
['880671','志學','花蓮縣壽豐鄉志學村7鄰中山路三段6號'],
['880718','清中','台中市清水區北寧里董公街56號'],
['880811','騰揮','台南市歸仁區中正南路一段110號'],
['880822','大峰','台中市大里區大峰路167號'],
['880833','真誠','新北市深坑區北深路三段263號'],
['881308','超順','台南市學甲區中正路143號'],
['881386','快來','雲林縣麥寮鄉橋頭村橋頭路234號'],
['881663','宜昌','台中市太平區宜昌路400號'],
['881685','校和','高雄市楠梓區軍校路658號'],
['881814','水豐','台中市豐原區鐮村路462號'],
['881940','新坡','桃園市觀音區中山路二段663號'],
['881951','鳳林','花蓮縣鳳林鎮鳳禮里中正路二段143號145號'],
['882079','龍寶','南投縣水里鄉民權路170號'],
['882080','慶竹','苗栗縣竹南鎮民族街82號民權路47號'],
['882138','興南','嘉義縣民雄鄉興南村15鄰頭橋557之43、557之45、557之46號1樓'],
['882172','國僑','桃園市八德區建國路1075號'],
['882219','南彎','屏東縣恆春鎮南灣里南灣路122號'],
['882404','文福','桃園市桃園區文中路747號'],
['882482','科建','台北市大安區建國南路一段28號30號'],
['882552','慶安','台南市西港區慶安里新興街25-2號'],
['882563','通霄','苗栗縣通霄鎮中正路19號'],
['882644','義成','宜蘭縣冬山鄉義成路三段2號1樓永興路一段452號1樓'],
['882655','南方澳','宜蘭縣蘇澳鎮江夏路27號'],
['882792','晏揚','台北市內湖區康寧路三段99巷14號康寧路三段99巷12弄2號'],
['882921','金亮','金門縣金城鎮民權路73號1F2F75號1F2F光前路85-2號1F85-3號1F'],
['883223','松饒','台北市松山區慈祐里八德路四段767號769號'],
['883256','總安','台南市安南區安和路四段9號'],
['883278','家家福','屏東縣春日鄉七佳村自強一路14號'],
['883315','飛利浦','新竹縣竹北市中華路548號550號'],
['883326','新豐民','台中市豐原區三民路93號1樓'],
['883544','金恩','台北市文山區指南路二段149號'],
['883728','統友','新北市樹林區中山路一段86號'],
['883762','新香珍','彰化縣福興鄉彰水路56號58號60號'],
['883898','本原','台南市安南區海佃路四段2號'],
['883902','豐洲','台中市神岡區五權路63號'],
['883913','新豐田','台中市豐原區豐南街145號'],
['883924','上北可','新北市土城區明德路一段232號'],
['885115','新進','台南市新營區中正路33之14號15號'],
['885609','萬芳','台北市文山區萬安街23號、25號、27號1樓'],
['885698','民光','新北市永和區中正路166號'],
['885997','千福','台南市中西區大涼里中華西路二段36號'],
['886059','東崙','台北市中山區八德路二段282號'],
['886222','桂林','台北市萬華區桂林路156號158號160號'],
['886646','正同','桃園市龍潭區中正里15鄰中正路472號474號'],
['887177','民生','彰化縣彰化市華山路27號'],
['888099','東漢','台東縣台東市正氣北路182號'],
['888158','明益','新北市三重區忠孝路三段61號'],
['888549','葉大','彰化縣大村鄉學府路168號'],
['890036','葫蘆墩','台中市豐原區水源路127-1號'],
['890184','神州','新北市八里區龍米路一段113號'],
['890483','新霧峰','台中市霧峰區中正路916號'],
['890601','水碓','新北市五股區水碓路14號1樓、16巷2號1樓'],
['890634','觀林','新北市林口區林口路78號、82號1樓'],
['890704','立新','台中市大里區立仁路142號'],
['890900','福志','台北市士林區雨農路25號'],
['890944','清泉崗','台中市沙鹿區中清路六段259號'],
['890999','佳怡','宜蘭縣員山鄉員山路一段186號'],
['891006','潤安','新北市汐止區龍安路32號'],
['891132','丹聯','台中市沙鹿區中山路田尾巷3號4號5號'],
['891176','靜中','台北市大同區寧夏路71號73號'],
['891280','順興','新北市樹林區東興街41號'],
['891420','慈濟','花蓮縣花蓮市中央路三段808號810號'],
['891501','龍祥','台中市龍井區沙田路四段636號'],
['891682','豐碩','台中市大雅區中清路四段46號'],
['891730','佑容','新北市板橋區五權里五權街49號51號'],
['891914','茂陽','台中市豐原區南陽路299之8號299之9號'],
['892032','儷新','新北市新莊區新樹路451號'],
['892179','鈺華','台南市永康區崑南里37鄰大仁街220號'],
['892308','英明','高雄市苓雅區英明路190號1樓'],
['892320','大崗','桃園市龜山區大崗里17鄰大湖41之2號'],
['892375','鼎復','高雄市三民區鼎山街566-3號'],
['892560','埔鹽','彰化縣埔鹽鄉彰水路二段36號'],
['892571','天人菊','澎湖縣馬公市中央里仁愛路69號'],
['892962','都蘭','台東縣東河鄉都蘭村都蘭155樓157號1樓'],
['892984','觀昌','桃園市觀音區中山路9巷19號1樓中山路21號23號1樓'],
['892995','裕達','桃園市平鎮區育達路160號'],
['893046','榮晉','台中市潭子區頭張路二段2號'],
['893150','寶利旺','台中市后里區三豐路三段887號1樓'],
['893231','嘟嘟','台中市北區興進路60號'],
['893312','強民','高雄市小港區小港路182號'],
['893345','新仁華','台中市大里區仁化路460.462號'],
['893448','采旺','新北市新莊區天祥街74號'],
['893596','台紙','台中市大肚區沙田路二段645號'],
['893655','埔中','新竹縣新埔鎮中正路617號619號621號'],
['893725','京泰','台中市豐原區成功路195號.西勢路98號'],
['893792','永復','台南市永康區復華里復華一街2號'],
['893840','蘆山','桃園市蘆竹區中山路152號154號156號一樓'],
['893873','文興','新北市三重區文化南路7號'],
['893895','瑞發','宜蘭縣礁溪鄉德陽路65號'],
['894315','龍巳','南投縣南投市東山路408號'],
['894359','辛亥','台北市大安區辛亥路二段57號'],
['894407','立興','台南市南區灣裡路265號'],
['894418','惠祥','桃園市中壢區榮安一街293號'],
['895020','建南','台北市大安區建國南路二段151巷6之8號'],
['895710','富興','新北市中和區中興里復興路277-1號279號'],
['895880','新立寧','高雄市三民區自立一路287號289號291號1樓'],
['896045','斗六','雲林縣斗六市大同路41號'],
['896067','統聯','台北市中正區忠孝東路二段130-2號130-3號'],
['896160','福芝','台北市士林區福國路94號'],
['896447','福百','新北市汐止區福德一路161號163號1樓'],
['896458','耀港','台北市南港區研究院路一段99號1樓之14'],
['897864','進益','新北市汐止區大同路二段314號'],
['897886','森鴻','高雄市岡山區大德一路160號'],
['898351','南崗','南投縣南投市民族路515號及南崗一路387號'],
['900072','東海岸','花蓮縣吉安鄉海岸路252號254號1樓'],
['900119','過溝','嘉義縣布袋鎮中安里中厝11號1樓'],
['900175','福茂','台中市西屯區西屯路三段148-30號'],
['900359','后東','台中市后里區甲后路一段101號1樓'],
['900429','金寶','新北市淡水區中正路169號'],
['900430','雙喜','台中市大雅區中山北路167號'],
['900614','新鹿谷','南投縣鹿谷鄉仁義路148號'],
['900636','德福','台北市內湖區成功路四段30巷27號29號31號'],
['900762','西衛','澎湖縣馬公市光榮里光復路297號'],
['900795','白沙','澎湖縣白沙鄉赤崁村20鄰大赤崁351號1樓'],
['900898','龍津','台中市龍井區三德里中央路二段4號'],
['900924','頂華','新北市三重區頂崁街189號'],
['901260','萬全','新北市鶯歌區鶯桃路660號1樓鶯桃路658巷1號1樓'],
['901293','立仁','台北市大安區安和路二段74巷1號'],
['901363','秀景','新北市中和區成功路115號117號'],
['901466','喜樹','台南市南區喜東里10鄰明興路732號'],
['901525','紅億','台中市太平區光興路572號576號'],
['901684','馬光','雲林縣土庫鎮南平里馬光路69號'],
['901710','偉嘉','新北市板橋區文化路一段270巷3弄2號、4號1樓'],
['901776','東東','南投縣埔里鎮忠孝路138-140號'],
['901802','嘉福','桃園市大溪區員林路二段359之1號'],
['901846','敦煌','台中市北屯區敦化路一段473號1樓'],
['901891','新澎湖','澎湖縣馬公市重慶里民權路98號'],
['902034','景旭','桃園市蘆竹區大新路852號854號之1樓'],
['902159','詠文','台南市永康區網寮里6鄰永二街202號'],
['902229','寶來','高雄市六龜區寶來里中正路84號86號'],
['902230','中洋子','嘉義縣新港鄉中洋村後厝子1-33號'],
['902333','雲崗','高雄市左營區明華一路236號'],
['902425','鳳東','高雄市鳳山區和德里中山路63號'],
['902469','璞石閣','花蓮縣玉里鎮中山路一段96號'],
['902562','佳軒','南投縣魚池鄉魚池街350號'],
['902735','如龍','高雄市三民區九如一路446號448號臥龍路67號'],
['902757','華生','台中市西區民生路517號'],
['902953','松旺','新北市中和區中山路三段108號'],
['903152','後壁','台南市後壁區後壁里後壁71號1樓'],
['903255','墩隆','台中市西屯區大墩路966號1樓'],
['903288','京展','台中市豐原區中正路858號1樓'],
['903303','上楓','台中市大雅區民生路三段523號'],
['903439','七股','台南市七股區七股里14鄰154-1號'],
['903484','政群','桃園市中壢區中園路二段138號'],
['903646','雙溪','新北市雙溪區自強路7號'],
['903794','南州','屏東縣南州鄉溪南村三民路171號'],
['903831','日南','台中市大甲區日南里青年路130號'],
['903901','新永光','高雄市旗山區南洲里旗南二路91之1號'],
['904018','財春','桃園市龜山區振興路636號638號'],
['904214','埔豐','屏東縣內埔鄉豐田村中正路291號'],
['905527','權興','台中市南屯區五權西路二段62號'],
['905963','保正','台南市仁德區中正路一段529號'],
['906209','樂得','台北市松山區復興北路35號'],
['906335','鳳曹','高雄市鳳山區曹公里曹公路59號'],
['906748','同仁','新北市新店區民權路96號'],
['906841','尊爵','新北市汐止區伯爵街32號'],
['908320','詠德','台中市梧棲區大智路二段385號'],
['909080','大維','台中市梧棲區四維路73、75號'],
['909149','萬文','台中市南屯區黎明路一段1033號'],
['909194','揚揚','高雄市前鎮區民權里鄭和路67號1F'],
['909323','嘉工','嘉義市東區彌陀路240號'],
['909518','翠峰','高雄市左營區翠峰路34號36號'],
['909552','員家','彰化縣員林市中正路75號'],
['909574','石泉','澎湖縣馬公市石泉里1-300號'],
['910116','煥日','苗栗縣頭份市新華里中正一路554號556號'],
['910323','好萊富','台南市新營區南紙里太子路191號'],
['910334','清新','台南市新化區武安里中正路321號'],
['910437','橫山','新竹縣橫山鄉中豐路二段122號124號1樓'],
['910552','那魯灣','新北市烏來區烏來里溫泉街80號'],
['910677','吉春','屏東縣恆春鎮山腳里環城南路60號'],
['910688','糧驛','新北市板橋區德翠里龍泉街93號、95號1樓'],
['910703','源威','新竹縣湖口鄉光華路666號1F'],
['910736','百達','台中市大雅區中清路三段721號'],
['910806','三立','新竹縣湖口鄉湖鏡村八德路一段718號'],
['910817','金磚','桃園市平鎮區新富里新富二街18號20號22號'],
['910828','中庄','嘉義縣水上鄉中庄村69號'],
['910965','新蓮信','花蓮縣花蓮市中美路186號'],
['910976','庭園','台南市永康區埔園里龍國街77號'],
['910998','逢運','台中市北屯區雷中街95號'],
['911108','新林眾','高雄市旗山區延平一路78-1號'],
['911290','頂橋','台中市南區興大路338號340號'],
['911555','德新','高雄市前鎮區仁愛里新衙路83號85號'],
['911636','興壇','高雄市美濃區中壇里忠孝路一段1號'],
['911647','白沙屯','苗栗縣通霄鎮白東里白東100號'],
['911854','旗鳳','高雄市燕巢區鳳雄里鳳旗路167號169號'],
['911876','新關中','新竹縣關西鎮中興路17號'],
['912097','安富','台南市安南區安富街341、343、345號'],
['912145','昶玖','高雄市鼓山區九如四路927號929號931號1樓'],
['912282','保鑽','新北市永和區潭墘里安樂路138號140號'],
['912352','奇采','桃園市中壢區興仁路三段115號1樓'],
['912606','矽品','台中市潭子區大豐路三段188號190號'],
['912617','情友','新竹縣寶山鄉雙溪村寶新路一段2號'],
['912639','嘉達','嘉義市西區保安里四維路18鄰302號'],
['912732','模範','台中市西區模範街34巷1號'],
['912798','嘉禎','嘉義縣新港鄉菜公村7鄰菜公厝64號附6'],
['912891','霞關','新北市淡水區淡金路59-61號B1'],
['912972','慈勝','花蓮縣吉安鄉自強路52號'],
['913012','長陽','桃園市桃園區長沙街90號1樓'],
['913067','廣昌','高雄市楠梓區廣昌里廣昌街140號'],
['913193','正美','高雄市美濃區泰安里中正路一段21號23號'],
['913229','中營','南投縣南投市中華路130號'],
['913274','彰醫','彰化縣埔心鄉舊館村中興路1號'],
['913300','杰昇','宜蘭縣五結鄉二結路107號1樓'],
['913355','新國姓','南投縣國姓鄉國姓村中興路301號'],
['913540','梅獅','桃園市楊梅區瑞塘里梅獅路二段231號'],
['913621','馨瑩','台北市內湖區內湖路一段91巷2號'],
['913643','福明','台中市東區進化路170號1樓'],
['914037','豐興','新竹縣新豐鄉建興路一段128號'],
['914141','東定','台東縣台東市豐田里中興路四段406號'],
['914347','興達','高雄市茄萣區茄萣路一段350號'],
['915122','南崁','桃園市蘆竹區南崁路158號1樓'],
['915270','復旦','台北市松山區敦化南路一段5號1樓'],
['916284','領袖','新北市蘆洲區集賢路224巷60號62號'],
['916402','達家','高雄市前鎮區草衙里草衙二路407號409號411號1樓'],
['916468','武林','新北市樹林區光華街2號4號6號'],
['916538','金紅','新北市淡水區淡金路三段2號2樓'],
['920032','千久','新竹市東區民主路154號156號'],
['920216','翊銘','新竹市東區新莊街182號186號'],
['920227','祥佑','桃園市桃園區寶慶路176號'],
['920249','坪林','新北市坪林區北宜路八段138號140號1樓'],
['920320','仁禮','花蓮縣吉安鄉南埔八街223號'],
['920342','讚蓮','花蓮縣花蓮市富吉路2號'],
['920401','玉光','屏東縣佳冬鄉玉光村中山路67號69號1樓'],
['920478','山好','雲林縣斗六市崙峰里仁義路52號1樓'],
['920489','好家庭','雲林縣斗六市榴中里工業路69號'],
['920711','伸港','彰化縣伸港鄉中山路190號192號'],
['920906','開立','桃園市平鎮區新光路19號21號23號1樓'],
['920962','富先','桃園市楊梅區萬大路111號113號1樓'],
['921013','大坑','台中市北屯區橫坑巷28-1號'],
['921116','鄉林','台中市南屯區大業路177號'],
['921149','登福','新北市五股區登林路76之3號'],
['921161','東芳','彰化縣彰化市東芳里永芳路199號'],
['921172','家恩','高雄市仁武區中華路46號'],
['921183','蘇澳港','宜蘭縣蘇澳鎮蘇東中路4號'],
['921231','東京','台東縣台東市卑南里更生北路196號198號'],
['921242','嘉港','嘉義縣新港鄉福德路116號116-1號'],
['921297','萬鴻','宜蘭縣員山鄉員山路一段303號'],
['921518','逢安','台南市安南區海西里海中街73號'],
['921633','大信','台北市大安區信義路三段33號'],
['921655','南鯤鯓','台南市北門區鯤江里841-1號'],
['921714','西盛','新北市新莊區民安西路113號之1'],
['921769','通館','苗栗縣通霄鎮通西里中山路10號'],
['921770','昌興','台中市清水區新興路238號文昌街12-1號'],
['921976','龍五','新北市五股區凌雲路一段136號'],
['921998','緯中','新北市板橋區中正路21號23號'],
['922027','春流','雲林縣斗六市梅林里梅林路446號1樓'],
['922131','香雅','新北市板橋區南雅西路二段297號299號'],
['922201','文光','澎湖縣馬公市光榮里三多路338號'],
['922245','創新','彰化縣鹿港鎮順興里復興路595號1樓'],
['922267','上德','高雄市前鎮區草衙里草衙二路299號299-1號'],
['922290','和育','南投縣竹山鎮大智路57號'],
['922304','新豐興','台中市豐原區東勢里中興路57號'],
['922348','新台','新北市五股區五工六路14號'],
['922474','八角店','桃園市蘆竹區大竹路5號'],
['922485','比利','桃園市平鎮區上海路161號'],
['922496','明仁','高雄市三民區鼎泰里明仁路8號'],
['922511','美溪','彰化縣溪湖鎮大溪路二段451號'],
['922555','龍潭友達','桃園市龍潭區三和里新和路1號'],
['922566','新竹友達','新竹市東區科學園區力行二路1號'],
['922577','友達五','新竹市東區力行路23號6樓'],
['922625','環福','桃園市中壢區普忠路213號'],
['922670','詠信','台南市永康區復華七街68號'],
['922751','源泰','新竹縣湖口鄉中興街172號174號176號'],
['922809','鶴鳴','彰化縣秀水鄉鶴鳴村彰鹿路362號'],
['922821','永大春','台南市永康區中山北路431號'],
['922898','新大村','彰化縣大村鄉中正西路331號1樓'],
['923019','稻香','花蓮縣吉安鄉吉興路二段46號48號1樓'],
['923020','嘉賓','嘉義市西區新西里垂楊路611號'],
['923134','統軒','花蓮縣花蓮市公園路7-1號、7-2號1樓'],
['923167','大坪','苗栗縣造橋鄉大西一街100號1樓'],
['923226','鹿家','新竹縣竹北市自強南路136號'],
['923293','瑞繐','花蓮縣瑞穗鄉中山路一段17號19號'],
['923307','光園','台中市東區東光園路142號'],
['923466','豐億','南投縣南投市彰南路一段573號1樓'],
['923547','南藝','台南市官田區大崎里66號'],
['923558','新石岡','台中市石岡區明德路118號'],
['923569','庚林','桃園市龜山區頂湖路123號B2'],
['923765','見晴園','南投縣仁愛鄉大同村定遠新村路18-1號'],
['923787','圓鴻','宜蘭縣宜蘭市慈安路40號'],
['923835','館南','苗栗縣公館鄉通明街68號'],
['923857','鑫泰山','屏東縣高樹鄉泰山村產業路73號'],
['923868','安新','台南市安南區長溪路三段399號1樓'],
['924528','楊陳','桃園市楊梅區環東路497號499號1樓'],
['924573','嶺頂','桃園市龜山區萬壽路二段6巷35號'],
['924654','士香','桃園市大溪區員林路一段228號'],
['924665','國和','新北市板橋區和平路29號'],
['924757','信利','新北市土城區興城路96巷4號'],
['924850','栗林','台中市潭子區祥和路169號171號'],
['924919','學英','新竹市東區學府路37號'],
['924986','明光','桃園市八德區中華路157號'],
['928357','吉安','台北市中山區吉林路365號367號農安街137號'],
['928368','豐勝','基隆市中正區中正路322號1樓'],
['928531','振華','台北市北投區石牌路二段80號82號'],
['928612','大港埔','高雄市新興區東坡里大同一路81號83號'],
['928829','埔園','台南市永康區中山路90號'],
['929006','欣旺','台北市中山區北安路602之1號1樓604號1樓606號1樓'],
['929028','大富','高雄市左營區大順一路278號280號'],
['929187','泰鑫','新竹縣竹北市新泰路31號一樓'],
['930062','建泰','高雄市鳳山區誠義路2號'],
['930280','嘉融','宜蘭縣礁溪鄉吳沙村礁溪路一段142號'],
['930497','合豐','嘉義縣中埔鄉中埔村169號1樓'],
['930545','新台澎','澎湖縣馬公市中正路85號'],
['930659','學興','屏東縣內埔鄉和興村學人路590.592號1樓'],
['930660','宏華','高雄市小港區漢民路829號831號1樓'],
['930796','同發','台南市安平區安北路170-3號1樓'],
['930925','高安','桃園市平鎮區民族路三段95號'],
['930981','龍馬','新北市永和區文化路188號'],
['931054','山佳','新北市樹林區中山路三段85號87號'],
['931168','社寮','南投縣竹山鎮集山路一段2051號'],
['931179','太子哈佛','彰化縣彰化市泰和中街72號'],
['931180','常春藤','南投縣南投市工業路33號'],
['931238','薪世麥','彰化縣花壇鄉長沙村彰員路二段550號552號'],
['931272','六發','台南市歸仁區六甲里中正南路一段1018號1020號'],
['931294','新墩興','台中市南屯區東興路二段98號1樓'],
['931386','鹽行','台南市永康區鹽洲里鹽洲二街83號'],
['931423','巧竹','台中市清水區海濱里臨港路五段828、830號1樓'],
['931456','德勇','桃園市八德區大勇里忠勇街365號'],
['931478','麻新','台南市麻豆區中正路289號'],
['931559','德發','台南市仁德區中正路三段42號'],
['931618','金順利','彰化縣埤頭鄉和豐村斗苑東路87號89號'],
['931700','智富','彰化縣彰化市萬安里長順街170號'],
['931825','尖豐','苗栗縣頭份市尖下里尖豐路316號1樓、320巷2、6號1樓'],
['931836','上營','台南市下營區中營里1286號'],
['931928','冬山','宜蘭縣冬山鄉冬山路一段984號'],
['932002','兆詠','彰化縣彰化市台鳳里一德南路252號'],
['932105','山腳','苗栗縣苑裡鎮山腳里七鄰山腳157號'],
['932116','永裕','宜蘭縣礁溪鄉中山路二段204號1樓'],
['932150','養生村','桃園市龜山區長青路2號A棟'],
['932172','路園','高雄市路竹區下坑里太平路342-2號'],
['932183','祥園','新竹市香山區牛埔北路50號'],
['932194','秀中','彰化縣秀水鄉安東村中山路251號'],
['932367','埔慶','南投縣埔里鎮中山路三段168、170號1樓'],
['932437','大美','雲林縣莿桐鄉大美村大美53號1樓'],
['932714','安佃','台南市安南區海佃路四段548號1樓'],
['932851','武仁','新北市泰山區仁愛路100巷26號28號30號'],
['932862','福盛','新竹市北區鐵道路三段2號1樓'],
['932884','興農','台南市善化區興農路4號1樓'],
['932965','新統興','高雄市三民區黃興路151號'],
['932976','鼎新','高雄市三民區鼎新路82號86號88號1樓'],
['932998','冠美','台東縣台東市豐榮里仁昌街148號'],
['933016','苙佑','桃園市楊梅區梅高路133號'],
['933050','埔頂','桃園市大溪區仁愛里埔頂路一段468號'],
['933164','淇丞','苗栗縣頭份市建國路二段128號'],
['933223','高美祿','台中市清水區高美路190號1樓'],
['933245','頭前溪','屏東縣屏東市前進里清進路702號1樓'],
['934466','車城','屏東縣車城鄉福安村中山路74號76號1樓'],
['934514','蘭陽','宜蘭縣宜蘭市中山路二段101號1樓'],
['934606','三暉','新北市樹林區樹福里復興路1號'],
['934684','高樹','屏東縣高樹鄉興中路193號195號1樓'],
['934695','夜市','桃園市中壢區中央西路二段125號'],
['934732','國平','台南市安平區平通里國平路381號'],
['934776','光華','新北市新莊區民安西路388、388-1、390、390-1號'],
['935089','福神','桃園市中壢區福德路79號81號'],
['935883','德賢','高雄市楠梓區翠屏里德賢路594號596號'],
['936484','武德','台南市中西區青年路134號'],
['940058','國豐','桃園市桃園區國豐六街25號'],
['940092','詠旭','南投縣南投市彰南路一段1031-2號1樓'],
['940106','世紀廣場','桃園市中壢區興南里新生路182號'],
['940254','怡安','台南市安南區安和路二段27號之2'],
['940472','尚武','台東縣大武鄉尚武村環港路3號'],
['940483','金典','台中市西區健行路1046、1046-1、1046-2號1樓'],
['940807','招英','屏東縣高樹鄉南興路74之3號'],
['941028','新民高中','台中市北區金龍里三民路三段289號'],
['941039','新民國','台中市北區金龍里三民路三段289號'],
['941062','東江','台南市永康區尚頂里23鄰南台街43號1樓'],
['941121','員崠','新竹縣竹東鎮東峰路336號'],
['941132','錦坎','桃園市蘆竹區南崁路一段76號78號'],
['941198','正修','高雄市鳥松區鳥松里澄清路840號'],
['941202','澎技','澎湖縣馬公市朝陽里三多路45號'],
['941338','吉富','桃園市八德區白鷺里永豐南路72號'],
['941419','新憲','台南市新營區埤寮里中正路530號'],
['941567','佳宏','新北市樹林區太平路150巷1號'],
['941660','中圳','彰化縣北斗鎮中和里斗中路319號'],
['941741','瑞峰','南投縣水里鄉北埔村中山路一段540號'],
['941752','仁冠','桃園市大溪區仁和路二段319號321號'],
['941833','井垵','澎湖縣馬公市井垵里1-18號'],
['941914','新親仁','新竹市東區親仁里仁愛街30號1樓'],
['941936','高長','台南市新市區新和里仁愛街169號171號'],
['942032','園山','桃園市大園區民族街1號'],
['942102','金沅','桃園市平鎮區東勢里金陵路五段255號'],
['942113','茗安','桃園市八德區陸光街45號'],
['942180','薇豐','屏東縣屏東市大連里豐年街1號'],
['942227','梅林','嘉義縣大林鎮忠孝路713號715號1樓'],
['942283','雅興','台中市大雅區雅潭路四段81號'],
['942364','新裕龍','苗栗縣後龍鎮中華路52-8號'],
['942401','楊民','桃園市楊梅區三民北路177號'],
['942478','新金樂','基隆市安樂區麥金路427號'],
['942515','御成','新北市三峽區國光街35號'],
['942548','中洲','台南市仁德區中洲里中洲路661號663號1樓'],
['942607','烏山頭','台南市官田區湖山里98-4號98-5號'],
['942652','六分寮','台南市善化區田寮里六分寮74-1號74-2號'],
['942722','新羅福','台北市中正區羅斯福路三段80號82號'],
['942755','翔富','高雄市鳳山區文德里濱山街12號1樓'],
['942777','里中','屏東縣里港鄉三部村三和路119-1號'],
['942869','竹田','屏東縣竹田鄉中正路84號86號'],
['943002','科工','台南市安南區鹽田里鹽田路2號'],
['943091','國安國宅','台中市西屯區國安一路208巷1號'],
['943208','仁灣','台南市永康區大仁街11巷1號'],
['943367','雲南','雲林縣斗南鎮中興路160號'],
['943390','校友會館','台中市西屯區台灣大道四段1727號1樓'],
['943600','新竹延平','新竹市香山區延平路二段82號84號'],
['943725','長勝','花蓮縣花蓮市中美路83-1號83-2號'],
['943747','和心','雲林縣西螺鎮河南里埔心路113-3號'],
['943851','直興','台中市豐原區水源路695號'],
['943987','富鄉','花蓮縣富里鄉中山路167號'],
['944005','祥壹','嘉義縣太保市祥和一路東段29號'],
['944016','奮起湖','嘉義縣竹崎鄉中和村12鄰奮起湖178-1號'],
['944197','華愛','桃園市中壢區華美一路132號136號1樓'],
['944245','潭寶','台中市潭子區潭興路三段51號'],
['944360','月美','高雄市杉林區月眉里清水路46號46號之1.48號1樓'],
['944382','嘉崎','嘉義縣竹崎鄉中山路111號'],
['944418','詠珊','台中市梧棲區大智路一段1017號1樓'],
['944544','東懋','桃園市大園區和平西路一段272號274號'],
['944555','鈺善','台南市白河區昇安里1鄰三間厝2-56號'],
['944566','福音','桃園市觀音區新生路1467之1號1樓五福三街83號1樓'],
['944577','本興','台南市安南區公學路四段180號'],
['944658','奇勝','台南市仁德區新田里勝利路139號'],
['944717','耀康','桃園市中壢區溪洲街267巷1號一樓'],
['946230','京都','台北市中山區林森北路411號'],
['946528','南谷','新北市中和區中和路257號1樓'],
['947336','新龍','新北市新莊區光明里民安西路232號'],
['947679','嘉高','嘉義市西區北港路1062號'],
['947912','祥發','台南市東區裕豐街187號189號191號1樓'],
['948649','明德','台北市北投區明德路114號'],
['948650','金凱旋','桃園市桃園區壽昌街20巷45號47號'],
['950170','承軒','台中市神岡區民生路48之7號8號9號'],
['950273','好富','台南市東區富強里裕農路320號'],
['950284','新南庄','苗栗縣南庄鄉西村中正路7號9號1樓'],
['950295','松強','台中市北屯區松安里崇德六路一段47號'],
['950321','弘新','台中市梧棲區永興路一段112號'],
['950376','南竿','連江縣南竿鄉清水村100號'],
['950387','溪埔','高雄市大樹區溪埔里溪埔路369號370號'],
['950435','孝忠','新北市中和區忠孝街37巷2號'],
['950480','北岡山','高雄市岡山區灣裡里岡山北路150號'],
['950561','竹山大智','南投縣竹山鎮中山里自強路176號'],
['950583','東崎','彰化縣鹿港鎮東崎里彰鹿路五段7號'],
['950686','東石','嘉義縣東石鄉永屯村35附18號'],
['950723','華廈','花蓮縣花蓮市民享里府前路638號640號'],
['950745','漢東','新北市板橋區漢生東路309號'],
['950848','友井','屏東縣潮州鎮三共里北門路2號6號1樓'],
['950859','昱昇','屏東縣車城鄉溫泉村溫泉路125號'],
['950860','育北','雲林縣斗六市明德北路一段110號'],
['950907','三靖','新北市鶯歌區三鶯路52號一樓'],
['950952','六腳','嘉義縣六腳鄉蘇厝村蘇厝寮153-6號'],
['950963','雅典','台中市南區三民西路377號西川一路1號'],
['950974','立東','台南市東區東門路三段220號'],
['951003','深美','基隆市信義區深美街196號'],
['951036','蘆坎','桃園市蘆竹區南崁里南華一街142號一樓'],
['951069','丰瑞','台中市北屯區四民里四平路563號'],
['951070','新嘉基','嘉義市東區頂庄里忠孝路650號(嘉義基督教醫院門診大樓外)'],
['951106','漁翁','澎湖縣西嶼鄉外垵村113號'],
['951195','榮鑫','台北市中山區建國北路三段89號91號1樓'],
['951265','保祥','嘉義縣太保市祥和三路東段226號'],
['951298','后寶','台中市后里區三豐路三段415.417號'],
['951313','福勝','新北市中和區福祥路156號158號'],
['951405','安河','台中市西屯區河南路二段14號'],
['951438','保順','新北市永和區保順路39號及保順路37巷2號'],
['951483','雋鈺','台南市永康區西灣里永華路157號'],
['951564','壯圍','宜蘭縣壯圍鄉壯五路143之3號'],
['951586','萳陽','台中市豐原區南陽路480號'],
['951597','興美','桃園市中壢區興國路85號87號一樓'],
['951601','嘉文','嘉義市東區盧厝里文雅街211號'],
['951612','豪榮','苗栗縣苗栗市南勢里豪榮1號'],
['951678','里客','新竹市東區民族路7號1樓'],
['951704','億財富','屏東縣東港鎮新勝里光復路二段77號1樓'],
['951737','大安港','台中市大甲區大安港路118號'],
['951760','將富','台南市將軍區將富里49之八號'],
['951782','文自','高雄市左營區菜公里文自路512-1號'],
['951863','龍詮','苗栗縣竹南鎮山佳里龍山路三段305號'],
['951874','牛墟','台南市善化區什乃里什乃190號'],
['951922','麥鄉','雲林縣麥寮鄉中興路78-3號'],
['951966','仁伯','台南市仁德區後壁里德安路188號'],
['952062','和卿','彰化縣和美鎮和南里和卿路193號'],
['952143','廣文','桃園市平鎮區復興里文化街241號'],
['952246','潭豐','台中市潭子區崇德路四段250之1號'],
['952279','竹盈','桃園市蘆竹區大竹里大新路133號1-3樓'],
['952316','光大國宅','台中市北區文莊里日興街180號1樓'],
['952327','蘆航','桃園市蘆竹區南興里南昌路18號1樓'],
['952349','永茂','雲林縣麥寮鄉中興村豐安路951號1樓'],
['952350','鹿秀','彰化縣鹿港鎮鹿工路6號'],
['952512','馬港','連江縣南竿鄉馬祖村中山路58號60號'],
['952523','北竿','連江縣北竿鄉塘岐村中山路191號193號195號'],
['952545','崙多','雲林縣崙背鄉東明村正義路194號'],
['952590','溪旺','嘉義縣溪口鄉溪西村中正路8鄰229-1號'],
['952615','新潭美','台北市內湖區新明路425號427號'],
['952626','苗碩','苗栗縣苗栗市維新里新東街219號'],
['952707','新龍鄉','桃園市龍潭區民族路168號170號172號1樓'],
['952741','元昌','高雄市楠梓區國昌里德民路900號902號'],
['952822','仁馨','高雄市梓官區梓義里中崙路287號'],
['952833','東河','台東縣東河鄉東河村南東河263號1樓'],
['952969','重和','高雄市左營區福山里自由四路171號'],
['952981','瑋特','桃園市平鎮區延平路三段246號248號一樓'],
['953065','雄鎮','高雄市前鎮區東一街7號'],
['953087','萬板','新北市板橋區莒光路221號223號'],
['953098','新春社','台中市南屯區永春南路136號138號'],
['953272','田馨','苗栗縣苑裡鎮田心里田心段36之3號'],
['953319','雙祥','新北市雙溪區雙溪村太平路65號67號'],
['953342','菁埔','台中市清水區中央北路1號'],
['953445','虎大','雲林縣虎尾鎮工專路156號'],
['953478','新世界','新竹市北區中正路121號'],
['953489','宏橋','新竹縣湖口鄉工業一路7號7-1號7-2號'],
['953629','群茂','彰化縣二林鎮斗苑路四段159號'],
['953663','青蘋果','新北市板橋區中山路二段531巷17弄20號'],
['953696','盟創','新竹縣寶山鄉創新二路6號'],
['953744','管嶼','彰化縣福興鄉沿海路三段69號'],
['953847','保新','嘉義縣太保市舊埤里1鄰新埤5-16號'],
['953869','牛潮埔','高雄市鳳山區鎮北里鳳北路60之17號'],
['953870','盧興','桃園市蘆竹區內展里長興路三段231號1樓'],
['953881','鹿棋','彰化縣鹿港鎮溝墘里鹿和路三段438號'],
['953917','瑞員','桃園市大溪區員林路三段157號1樓'],
['953928','俊龍','新北市樹林區三俊街96號1樓'],
['954138','豐原道','台中市豐原區水源路307號'],
['954183','麻善','台南市麻豆區晉江里民權路10-1號'],
['954208','米奇','高雄市大寮區大寮里大寮路903號'],
['954297','新古坑','雲林縣古坑鄉中山路201號'],
['954378','維洲','高雄市岡山區本洲里本洲路350-5號'],
['954389','彩豐','台中市后里區三豐路五段551號1樓'],
['954415','合心','南投縣名間鄉中山村彰南路218-32號'],
['954437','祥祐','花蓮縣新城鄉順安村北三棧119之6號'],
['954448','新新復','台南市新營區新進路二段466號'],
['954459','新百川','彰化縣員林市莒光路379號'],
['954530','蕙馨','高雄市阿蓮區阿蓮里中正路188-8號'],
['954574','東樂','台東縣台東市山西路一段330號'],
['954585','樹王','台中市大里區文心南路1252號'],
['954596','登瀛','南投縣草屯鎮新庄里博愛路1012號'],
['954622','新屋中華','桃園市新屋區中華路357號1樓'],
['954666','湖慧','高雄市湖內區中山路一段540-1號'],
['954699','義展','桃園市八德區義勇街151號151-1號1樓'],
['954758','薰衣草','台中市新社區協中街169之1號'],
['954781','安招','高雄市燕巢區安招里安東街380號'],
['954792','鎮欣','台中市沙鹿區北勢里鎮南路二段368號'],
['956260','寧波','台北市中正區寧波西街3號'],
['956341','金旦','新北市淡水區淡金路三段254號256號258號'],
['956581','錦中','台中市北區三民路三段258號'],
['956662','城運','新北市土城區承天路10號、10-1號1樓'],
['956673','榮金','台北市中山區龍江路384巷1號384巷3號'],
['956732','錦北','台北市中山區錦州街8號'],
['956743','華經','台北市內湖區行忠路30號'],
['956835','福臨','新北市五股區工商路150號152號'],
['957034','新壢揚','桃園市中壢區中山路138號'],
['957285','吉忠','台北市大安區延吉街72號'],
['957333','天龍','新北市三重區龍門路217號219號221號'],
['957355','莊成','新北市新莊區化成路354號'],
['957366','新文','台北市士林區文昌路64號'],
['957377','龍行','桃園市桃園區力行路156號1樓'],
['957768','光峰','桃園市龜山區楓樹里光峰路296號298號一樓'],
['957931','逢盛','台中市西屯區福星路330號華夏巷東一弄22號1樓'],
['958107','撫順','台北市中山區中山北路三段23-6號'],
['958277','進德','台中市東區自由路三段226號及進德路77號'],
['958440','港瑞','高雄市小港區小港里小港路77號'],
['958635','富登','雲林縣麥寮鄉仁德東路577號1樓'],
['958691','佑民','南投縣草屯鎮太平路一段221號'],
['958831','墩南','台中市南屯區南屯路二段210、212號1樓'],
['958901','寶中','新北市新店區寶慶街66號'],
['958956','東福','新竹縣竹東鎮中豐路二段245號'],
['959122','豐安','台北市大安區東豐街9號'],
['959155','信中','台北市大安區信義路三段99號1樓'],
['959177','如意','花蓮縣花蓮市中美路37號'],
['959292','智慧','新北市汐止區大同路二段281號'],
['959328','綠雅','新北市三峽區文化路122號'],
['959340','奇晉','台中市神岡區豐洲路469號1樓'],
['960029','仁勇','高雄市鹽埕區大公路二號'],
['960133','亞新','高雄市楠梓區樂群路76號'],
['960166','蘆樂','新北市蘆洲區長樂路55號1樓'],
['960513','至善天下','台北市士林區至善路二段264號'],
['960535','輔大','新北市新莊區中正路516-1號'],
['960731','寶盛','高雄市三民區覺民路579號'],
['960753','富邦','台北市北投區實踐街22號24號'],
['960764','瑞正','高雄市前鎮區瑞興里瑞北路157號159號'],
['960775','草山','台北市士林區格致路28號'],
['961000','惠安','台北市信義區惠安里吳興街520號1樓'],
['961778','淡欣','新北市淡水區水源街二段104號'],
['961941','秀工','彰化縣秀水鄉彰水路二段795-1號'],
['962209','新豪美','台北市北投區文林北路98號100號'],
['962313','坤海','基隆市信義區東明路69號1樓'],
['962335','權中','宜蘭縣羅東鎮民權路177號'],
['962346','仙岩','台北市文山區仙岩路18號18-118號18-2號1樓'],
['962380','大五股','新北市五股區成泰路二段81號'],
['962483','石捷','台北市北投區石牌路二段8號'],
['962542','大龍','台北市大同區昌吉街72號74號76號及蘭州街135號'],
['962586','平安','新北市三重區正義北路51號'],
['962715','台麗','台中市西區五權路119號1樓、中山路493號1樓'],
['962771','吉吉好','台南市東區崇德路670號'],
['962863','卓易','台南市北區大豐里27鄰中華北路一段143號'],
['962977','新庄子','新竹縣新豐鄉建興路二段752號1樓'],
['962988','神林','台中市大雅區神林南路144號'],
['963017','合家宜','屏東縣屏東市三山里海豐街7-12號1樓'],
['963062','景雄','雲林縣斗六市虎溪里西平路521號'],
['963073','龍坑','苗栗縣後龍鎮龍坑里16鄰156號之10'],
['963187','晟乾','苗栗縣竹南鎮仁愛路902號'],
['963305','義村','台北市大安區忠孝東路三段160號'],
['963327','冠吾','桃園市桃園區中正路455號'],
['963349','政德','高雄市左營區政德路130號132號1F'],
['963350','龍翔','桃園市中壢區普義路175號175之1號'],
['963556','興貿','台北市信義區景新里莊敬路178巷2號'],
['963567','埔昇','新北市深坑區埔新街63號65號1樓'],
['963626','家權','桃園市中壢區民權路二段98號'],
['965057','長溪','台南市安南區安慶里長溪路一段307號'],
['965105','淵安','台南市安南區海佃路三段163號'],
['965220','輔明','新北市新莊區中正路514巷99號'],
['965231','程香','高雄市岡山區後紅里大仁南路133號'],
['965264','裕平','台南市東區關聖里裕信路177號1樓'],
['965312','文嶺','台中市南屯區嶺東路806號'],
['965345','小腳腿','台南市柳營區重溪里義士路一段938號'],
['965552','麟洛','屏東縣麟洛鄉麟趾村中山路519-5號'],
['965563','昇沅','彰化縣福興鄉福南村沿海路四段750號'],
['965600','麻中','台南市麻豆區南勢里南勢36-205號'],
['965611','遠德','台南市新化區北勢里中正路1211號'],
['965758','龍美','桃園市龍潭區民豐路3號4號5號1樓'],
['965909','永聖','宜蘭縣礁溪鄉大忠村大忠路120、122號1樓'],
['965932','飛鳳','新竹縣芎林鄉富林路二段556號'],
['966038','景碩一廠','桃園市新屋區中華路1245號3樓'],
['966061','車讚','台南市關廟區北花里中正路517號'],
['966072','台化','彰化縣彰化市復興里中山路三段306號'],
['966083','景碩新廠','桃園市新屋區中華路810號1樓'],
['966164','中興醫','台北市大同區鄭州路145號B1'],
['966175','中台禾豐','台中市北屯區太原路三段1505號'],
['966212','鹽新','台南市鹽水區橋南里忠孝路93號'],
['966290','安安','台南市安南區安明路四段260-70號'],
['966533','旗盟','高雄市旗山區大德里延平一路710-1號'],
['966577','新員高','彰化縣溪湖鎮員鹿路一段101號'],
['966603','興林','新北市林口區南勢村南勢街278號280號'],
['966739','德安一','花蓮縣花蓮市德安一街307號'],
['966810','永源村','台中市新社區東山街88-29號30號'],
['966865','新湖中','新竹縣湖口鄉中正村中正路二段235號'],
['966898','維中','新北市五股區四維路120號'],
['966902','久昌','高雄市楠梓區久昌里盛昌街26號28號'],
['966913','后冠','台中市后里區民生路1號'],
['966935','彰興','彰化縣埤頭鄉興農村彰水路四段168號1樓'],
['966957','仁大','台南市仁德區太子里太子路120號122號'],
['966980','北嶺','高雄市路竹區北嶺里中山南路221號'],
['966991','鹽信','台南市永康區正南一街148號'],
['967019','大員山','彰化縣員林市中山路一段300號'],
['967020','新塭','嘉義縣布袋鎮復興里12鄰新塭147-3號'],
['967086','二鎮','台南市官田區二區里工社西街25巷81號'],
['967101','蘆揚','新北市蘆洲區民生街30號'],
['967145','高山頂','桃園市楊梅區幼獅路二段297-1號'],
['967260','大埔美','嘉義縣大林鎮過溪里過溪1號'],
['967282','新高湖','新竹縣新豐鄉新興路403號1樓'],
['967318','博元','嘉義市西區博愛路二段572號'],
['967352','育成','台中市霧峰區樹仁路161-1及161-2號'],
['967400','鹿寶','彰化縣鹿港鎮彰頂路17號'],
['967422','逢喜','台中市西屯區逢甲路247號'],
['967503','正港','高雄市梓官區智蚵里中正路186號'],
['967525','新林內','雲林縣林內鄉中正路373號375號'],
['967558','富翔','花蓮縣吉安鄉東昌村海岸路77號'],
['967569','新光德','台中市烏日區信義街162號1樓'],
['967570','永愛','台南市永康區北灣里文賢街80-1號'],
['967581','保華','台南市仁德區成功里崇德路88號'],
['967606','東敏','高雄市湖內區湖東里東方路103-1號103-2號'],
['967673','桂田','台南市永康區鹽行里新行街251號一樓'],
['967709','甜園','台中市潭子區豐栗路9號'],
['967776','新亞大','台中市霧峰區中正路473號475號'],
['967891','虎尾寮','台南市仁德區仁德里文德路157號'],
['967927','榮泉','台中市烏日區中山路三段1007號'],
['967938','新正賢','台南市仁德區保安里中正路一段209號'],
['967950','亞洲一店','台中市霧峰區柳豐路500號'],
['967983','弘龍','新北市五股區工商路16號'],
['968023','采鋺','新北市林口區文化三路一段368號'],
['968078','新南王','台東縣台東市更生北路675號677號'],
['968089','新僑中','新北市板橋區僑中一街124巷3弄3號'],
['968104','華平','台南市安平區健康路三段242號'],
['968115','北英','雲林縣北港鎮華勝里華勝路212號'],
['968137','觀喜','桃園市觀音區中山路一段1159號之1號'],
['968229','福懋科','雲林縣斗六市河南街319號'],
['968263','新曾文','台南市麻豆區東角里興中路177號179號'],
['968458','赤東','高雄市梓官區赤東里赤崁南路95號95-1號1F'],
['968506','龍舟','彰化縣福興鄉福興村龍舟路15號'],
['968517','雅勝','台中市大雅區雅潭路四段491號'],
['968528','永在','台中市大甲區日南里黎明路3之21號1樓'],
['968551','新蓮盈','花蓮縣吉安鄉建國路二段285號1F'],
['968610','順心','彰化縣埔心鄉中山路145號147號149號'],
['968665','安榮','雲林縣崙背鄉豐榮村1鄰豐榮32之3號'],
['968757','荖濃','高雄市六龜區荖濃里南橫路45號1F'],
['968780','鯤鯓','台南市南區南都里鯤鯓路20號'],
['968791','成合','新北市板橋區金門街40號'],
['968816','星光','雲林縣西螺鎮公正路15號'],
['968850','姐妹','花蓮縣吉安鄉吉安路五段262之1號1F'],
['968919','楊崧','桃園市平鎮區復旦路二段123-5;123-6號1樓'],
['969026','東英','台中市東區自由路四段339號'],
['969037','伊達邵','南投縣魚池鄉日月村義勇街89號'],
['969060','麥豐','雲林縣麥寮鄉新興路27之5號'],
['970059','新沙美','金門縣金沙鎮汶沙里國中路2號'],
['970071','成貞','台東縣台東市豐年里中興路三段399號1樓'],
['970174','鈺廣','台南市永康區大灣里民族路409號一樓'],
['970233','宣宏','宜蘭縣羅東鎮復興路二段257號'],
['970255','欣奇','台南市新營區新東里東興路236號'],
['970266','新凱','台南市新市區社內里12之5號'],
['970299','柯達','高雄市美濃區中正路二段819號821號1樓'],
['970358','麻學','台南市麻豆區大山里8鄰大山腳1之80號'],
['970369','水門','屏東縣內埔鄉水門村忠孝路289號'],
['970451','世界先進','新竹市東區力行路9號2樓'],
['970462','新宏昌','高雄市楠梓區裕昌里右昌街468號1樓'],
['970509','嘉大','嘉義縣民雄鄉文隆村鴨母水土1-92號'],
['970510','富嘉','南投縣仁愛鄉仁和路223-1號'],
['970565','中湖','台中市大里區中興路一段292之11及292之12號'],
['970624','龍侑','桃園市平鎮區龍德路8號1樓;龍福路1號1樓'],
['970657','大木康榔','嘉義縣朴子市大鄉里1鄰大(木康)榔179之4號'],
['970679','朴中','嘉義縣朴子市博厚里開元路282號'],
['970691','金佳旺','彰化縣社頭鄉中山路一段516號'],
['970738','慶龍','基隆市仁愛區南榮路187號1樓'],
['970749','鑫長安','台北市中山區長安東路一段53巷1之3號'],
['970761','沅興','高雄市三民區正興里正興路121號123號'],
['970808','潭春','台中市潭子區東寶里大豐路二段1號1樓'],
['970820','金寧','金門縣金寧鄉環島北路一段711號'],
['970901','信醫','台北市信義區吳興街346號348號'],
['970945','新旗聖','高雄市旗津區中洲二路83號85號'],
['971018','關聖','台南市關廟區南雄路一段471號'],
['971041','大衛','台中市大里區國中路276號'],
['971085','先鋒','高雄市左營區介壽路247號249號1樓'],
['971096','晟業','雲林縣斗六市萬年路592號'],
['971100','百義','新北市三重區仁義街232號'],
['971144','新永寧','新北市土城區中央路三段191之1號及永寧路1號3號'],
['971155','鹿正','彰化縣鹿港鎮中正路556號'],
['971188','大洲','台中市神岡區大洲路299之1號'],
['971199','新竹塘','彰化縣竹塘鄉竹五路臨2號'],
['971328','鑫工和','台中市西屯區協和里工業區三十八路30號1樓'],
['971339','桂德','高雄市小港區桂林里中安路428號'],
['971351','東寧','屏東縣九如鄉東寧村東寧路225號1樓'],
['971410','鈺田','苗栗縣苑裡鎮山柑里2-2號'],
['971465','善營','台南市善化區小新里成功路173之1號'],
['971476','鹿維','台中市沙鹿區北勢東路330號'],
['971487','新吉','台南市安定區新吉里新吉126之12_126之13號'],
['971535','祿靖','彰化縣永靖鄉中山路二段435號437號'],
['971557','翔盛','高雄市鳥松區水土埔里神農路479號'],
['971568','後安','雲林縣麥寮鄉後安村後安路201之13號'],
['971616','新長明','桃園市龜山區復興一路62號1樓'],
['971627','彰苑','彰化縣北斗鎮斗苑路二段298之2號'],
['971672','鑫太原','台北市大同區太原路40號42號44號'],
['971731','和鎮','彰化縣和美鎮和線路323號'],
['971742','東泓','台中市東區東門里東門路140號'],
['971775','和醫','新北市中和區中正路291號B1'],
['971867','鑫東一','台北市中山區一江街11號13號'],
['971926','鈺英','台中市大甲區育英路283號'],
['971959','保屏','台中市沙鹿區向上路七段132號'],
['971971','新政','台中市大甲區信義路193號'],
['972114','寶宏','雲林縣斗南鎮文昌路99號'],
['972125','嘉英','嘉義市東區荖藤里忠孝北街206號'],
['972170','鹿慶','彰化縣鹿港鎮慶安街116號'],
['972262','煙波','新竹市東區明湖路967號1樓'],
['972273','博鑫','新北市鶯歌區中正三路283-1號283-2號1樓'],
['972309','展欣','高雄市茄萣區嘉安里仁愛路三段120號'],
['972310','忠湖','桃園市龜山區忠義路二段630號'],
['972321','鑫杭','台北市中正區杭州南路一段23號'],
['972505','崙中','雲林縣崙背鄉南陽村中山路489號'],
['972516','新旗美','高雄市旗山區東平里延平二路136號'],
['972594','長星','台北市大安區基隆路三段85號'],
['972608','紹福','桃園市龍潭區五福街210號'],
['972620','新竹崎','嘉義縣竹崎鄉和平村田寮段98號'],
['972697','五房','屏東縣新園鄉五房村五房路721號1樓'],
['972701','新冠林','嘉義縣大林鎮新興街113號'],
['972778','松運','台北市中山區松江路101號'],
['972804','小瑞士','南投縣仁愛鄉定遠新村28號'],
['972918','皇后','新北市淡水區新春街87號'],
['972929','新豐寶','台中市豐原區中山路143-2號1樓'],
['973014','新運河','台南市中西區府前路二段239號1樓'],
['973036','新友達','桃園市龍潭區三和里新和路1號B棟7樓'],
['973117','巨漢','高雄市左營區新下里新莊一路350號'],
['975054','興芳','台北市文山區興光里興隆路三段173、175號'],
['975331','樹園','新北市樹林區佳園路一段52號1樓'],
['975456','興榮','新北市中和區福南里21鄰興南路二段90號1樓'],
['975951','華雙','台北市萬華區環河南路二段252號1樓環河南路二段250巷1號1樓'],
['975973','禾光','台北市大安區和平東路二段63號1樓'],
['976389','新大興','桃園市桃園區大興西路二段253號1樓'],
['976688','正國','新竹市北區中正路286之1號一樓'],
['977061','大鵬','台中市西屯區長安路二段125號'],
['977142','源遠','基隆市暖暖區源遠路294號296號298號1樓'],
['977290','圓慶','台北市大同區南京西路127號'],
['977371','田中','彰化縣田中鎮福安路144號146號'],
['977418','宜泰','宜蘭縣羅東鎮公園路100號1樓'],
['977500','逢仁','台中市西屯區青海路二段262號'],
['977636','新圓山','新北市五股區成泰路一段191號、193號'],
['977706','豐登','南投縣埔里鎮枇杷里中正路183-23號'],
['977991','蜜鄰','桃園市桃園區龍壽街96號98號'],
['978101','欣東旺','台東縣成功鎮中華路74號76號1樓'],
['978260','泰雅','花蓮縣秀林鄉和平村和平街156號'],
['978293','鰲峰','台中市清水區鰲峰路22號'],
['978374','新庄','台中市龍井區台灣大道五段232號236號1樓'],
['978525','附工','彰化縣彰化市工校街21號'],
['978558','慶國','台南市安平區慶平路531號'],
['978606','昇庚','新北市永和區永貞路182號184號'],
['978617','新德化','台中市北區德化街660號'],
['978628','林坊','台北市南港區東新街80巷1號108巷2弄30號'],
['978640','泰股','新北市五股區成泰路三段577巷24號'],
['979089','柴山','高雄市鼓山區鼓山三路49號51號'],
['980034','嘉永','嘉義市西區育英里民生南路129號131號1樓'],
['980045','于滿','雲林縣斗南鎮延平路二段581號1樓'],
['980090','新燕','新北市新店區新烏路二段382號384號1樓'],
['980137','鑫盈佳','花蓮縣花蓮市林森路258號1樓'],
['980207','新堤','台中市大里區立德里甲堤南路71號'],
['980252','鳳頂','高雄市鳳山區過埤里鳳頂路285號1樓'],
['980296','大目降','台南市新化區正新路233號'],
['980322','墩正','台中市南屯區溝墘里大墩十一街330號1樓'],
['980702','月光山','高雄市美濃區泰安里泰安路59號'],
['980735','鑫旭升','新竹市東區東南街98號1樓'],
['980805','新展盛','新北市新莊區西盛街325號327號1樓'],
['980816','億承','台中市清水區民和路二段195號'],
['980827','得意','苗栗縣頭份市蟠桃里德義路13鄰81號'],
['980838','新雙新','台南市新市區永就里中山路227號1樓'],
['980908','嘉保','嘉義縣太保市麻寮里北港路二段511號'],
['981015','新甲仙','高雄市甲仙區西安里文化路56號58號1樓'],
['981093','新光和','高雄市前鎮區鄭和南路307號309號'],
['981107','新港坪','嘉義市西區玉山路203號'],
['981196','豐肚','台中市大肚區社腳里沙田路一段916號'],
['981211','新景有','高雄市苓雅區福德三路170號1樓'],
['981222','和社','南投縣信義鄉同和巷8號1樓'],
['981325','后糖','台中市后里區甲后路二段363號'],
['981347','巧立','新北市淡水區北新路184巷57號59號1樓'],
['981392','湯圍','宜蘭縣礁溪鄉礁溪路五段51號'],
['981509','益慶','高雄市大寮區河堤路一段139號'],
['981598','金豪','金門縣金城鎮西海路三段1號3號5號1樓'],
['981602','豐平','台南市安平區平豐路430號1樓'],
['981624','新嘉院','嘉義市東區忠孝路539號1樓(嘉義基督教醫院住院大樓內)'],
['981657','豐尚','台中市豐原區豐勢路二段680號一樓'],
['981738','鑫花蓮','花蓮縣花蓮市中正路383號385號'],
['981820','鑫明莊','高雄市新興區六合二路24號'],
['981901','宏泰','台北市信義區松仁路91-1號1樓'],
['981923','糖廉','彰化縣和美鎮糖友一街2號'],
['981990','全茂','新北市中和區連城路469巷9號11號'],
['982052','屏科大','屏東縣內埔鄉中林村中林路1號3號1樓'],
['982063','正神','桃園市中壢區成章一街10號12號1樓2樓'],
['982096','新朝琴','台南市鹽水區岸內里朝琴路143號1樓'],
['982188','新兆軒','嘉義縣水上鄉民生村忠孝街149號151號'],
['982214','鑫華夏','桃園市龜山區文化二路28-1號28-2號28-3號1樓'],
['982225','慶樹','台中市南區樹德里大慶街二段36號'],
['982236','新府緯','台南市南區西門路一段553號1樓'],
['982281','新苗中','苗栗縣苗栗市府前路120號'],
['982328','長虹','新北市鶯歌區鶯桃路432號1樓'],
['982339','欣谷關','台中市和平區東關路一段135-2號1樓'],
['982351','鑫和睦','台中市神岡區神清路260號262號264號266號268號及福成路56-1號'],
['982373','好修','彰化縣埔鹽鄉員鹿路二段95號'],
['982432','新莿桐','雲林縣莿桐鄉莿桐村中正路62-2號'],
['982454','新嘉家','嘉義市東區宣信里和平路103號1樓'],
['982502','欣福誠','高雄市鳳山區五福里五甲三路75號77號1樓'],
['982557','駿躍','桃園市楊梅區環南路132號1樓'],
['982579','新觀和','新北市板橋區大觀路二段55號57號1樓'],
['982627','新福圓','新北市新莊區五工三路93號1樓'],
['982650','宜梧','雲林縣口湖鄉梧南村光明路31號1樓'],
['982694','三福','高雄市仁武區仁武里中正路175號1樓'],
['982890','欣富晟','桃園市觀音區草漯里大觀路二段312-1號'],
['985143','華亞文化','桃園市龜山區文化一路86之55號'],
['985545','鑫強','新北市三重區自強路三段30號32號'],
['985604','淡江','新北市淡水區學府路207號'],
['985671','利客來','新北市五股區成泰路三段419號'],
['985707','瑞鑫','台北市內湖區瑞光路580號'],
['985796','海寶','新竹市北區海濱里榮濱路1號'],
['985822','國民','台南市南區國民路152號1樓'],
['985877','金鋒','桃園市中壢區金鋒四街50巷2號1樓'],
['987736','知本','台東縣台東市建興里知本路四段2號'],
['987747','蓮成','花蓮縣花蓮市中華路283之1號'],
['987769','工林','新北市林口區工六路76號'],
['987806','馬公','澎湖縣馬公市光復路59號'],
['987862','昇宏','桃園市桃園區大業路二段111號1樓之2'],
['987909','來鑫','新北市烏來區新烏路五段160號162號'],
['987910','維瀚','桃園市桃園區中埔六街36號1樓'],
['987976','廣智','桃園市龜山區復興一路392-1號'],
['988038','世豊','新竹縣新豐鄉建興路一段173號175號一樓'],
['988061','東風','台中市龍井區遠東街3號'],
['988223','新郡安','台南市安南區溪北里安和路一段105號1樓'],
['988267','松豪','台中市北屯區四平路218號'],
['988278','內柵','桃園市大溪區康莊路三段20號'],
['988289','桃金','桃園市桃園區金門二街83號及93號1樓'],
['988337','湖安','新竹縣湖口鄉光復東路395號1樓'],
['989086','仁五','基隆市仁愛區仁五路63號1樓'],
['990042','新海成','台南市北區海安路三段2號1樓'],
['990053','新安康','台北市文山區木柵路二段88號90號1樓興隆路四段26號'],
['990075','東科','台南市新市區三舍里大順三路125號1樓'],
['990097','新上緯','高雄市岡山區嘉興里嘉興路340號'],
['990134','興安邦','高雄市三民區安邦里察哈爾二街83號1樓.85號1樓'],
['990156','新佳忠','台南市佳里區安西里忠孝路212號1樓'],
['990167','新下營','台南市下營區下營里中山路一段46號48號1樓'],
['990204','聯合報','新北市汐止區大同路一段369號1樓'],
['990237','農神','高雄市鼓山區龍子里神農路183號185號1樓'],
['990248','旭豐','嘉義市東區溪興街107號109號1樓'],
['990352','松禾','台北市松山區塔悠路31號33號'],
['990396','鑫斗商','雲林縣斗六市中華路207號209號1樓'],
['990400','金平','桃園市平鎮區東勢里金陵路四段485號1樓'],
['990422','友達電','桃園市龜山區華亞二路189號B1'],
['990466','凱瑄','雲林縣斗南鎮西岐里大同路135號1樓'],
['990639','新吉麗','新北市蘆洲區中山一路204號1樓'],
['990662','興仁','高雄市鳳山區興仁里五甲一路204號206號1樓'],
['990732','文衡','高雄市鳳山區文衡里八德路305號1樓'],
['990835','新靜修','彰化縣員林市靜修路77號之4'],
['990868','新潮','屏東縣潮州鎮新榮里中山路121號123號1樓'],
['990879','大武崙','基隆市安樂區基金一路381號383號1樓'],
['990880','晨希','新竹縣湖口鄉榮光路617號'],
['990905','康樂','台南市中西區安海里康樂街223號1樓'],
['991089','芎林','新竹縣芎林鄉文山路529號531號1樓'],
['991115','羅義','宜蘭縣冬山鄉義成路三段361號363號1樓'],
['991159','天星','台中市北屯區東山路二段77之8、77之9、77之10號1樓'],
['991160','新勝利','彰化縣和美鎮鹿和路六段402之2號'],
['991285','正文','高雄市苓雅區正大里建國一路125號125-1號1樓'],
['991296','展宏','苗栗縣竹南鎮中華路169號171號1樓'],
['991300','瑞家','桃園市桃園區三民路三段84號86號1樓'],
['991333','新明','新北市新店區光明街140號'],
['991458','八里','新北市八里區中山路二段343號1樓'],
['991506','新勝','新竹市東區東光路75號1樓'],
['991562','中華電','台北市中正區信義路一段21-3號B1樓'],
['991573','觀音','高雄市大社區大新路111號金龍路316號318號'],
['991584','威克','台北市中山區南京東路三段208號1樓'],
['991595','新中華','桃園市中壢區中華路二段328號'],
['991654','仁仁','新北市三重區仁愛街50號'],
['991665','富岡','台東縣台東市富岡里吉林路二段668號1樓'],
['991805','聯華','台中市中區公園路13號'],
['991838','家和','彰化縣員林市大饒里員集路二段216號'],
['991850','長鴻','台北市內湖區大湖山莊街219巷6號8號1樓'],
['991920','廣濟','雲林縣古坑鄉東和村廣濟路78號78之1號'],
['991975','青河','台中市北屯區青島路三段155號1樓'],
['992026','壽元','屏東縣南州鄉壽元村勝利路5-15號1樓'],
['992060','大鵬灣','屏東縣東港鎮船頭里船頭路26-33號26-35號1樓'],
['992130','漢中','台北市萬華區漢中街185號187號'],
['992141','鹿草','嘉義縣鹿草鄉西井村20鄰鹿草路215、217號1樓'],
['992211','江園','桃園市大園區中正東路三段620號'],
['992222','豐勇','台中市豐原區三豐路一段155.157.159號1樓'],
['992336','德倫','台北市大同區承德路三段240號242號1樓'],
['992358','港區','台中市梧棲區安仁里文化路二段2鄰55號1樓'],
['992381','福通','台北市士林區大南路400號402號1樓'],
['992462','富有','桃園市桃園區富國路656號'],
['992510','台茂城堡店','桃園市蘆竹區南崁路一段112號2樓'],
['992576','樹安','新北市樹林區大安路530號1樓'],
['992598','麗金','新北市永和區成功路一段85號1樓'],
['992738','汶興','桃園市龜山區頂興路31-1號1樓'],
['992761','永芳','高雄市大寮區永芳里萬丹路630號'],
['992783','博愛','彰化縣彰化市光南里南校街132及130之1號1樓'],
['992808','熱天','台中市北屯區天津路四段68號1樓'],
['992831','星寶','桃園市桃園區大業路一段426號1樓'],
['992945','社中','台北市士林區社中街320號322號1樓'],
['992967','酒泉','台北市大同區重慶北路三段258、260、262號1樓'],
['993018','新象','台中市北屯區中清路二段776號778號'],
['993041','松高','台北市信義區基隆路一段141號1樓'],
['993052','埔佑','南投縣埔里鎮中華路116號1樓'],
['993085','苗豐','苗栗縣苗栗市為公路167-1號'],
['993096','精田','台中市南屯區黎明路一段142號'],
['993177','永久','高雄市旗山區延平一路446號1樓'],
['993203','中銘','南投縣埔里鎮西安路一段104號'],
['993317','德文','高雄市鳳山區文山里八德路197號'],
['993351','雙永','台南市永康區永大一路60號1樓'],
['993384','樹谷','台南市新市區中心路2號1樓'],
['993476','潤昌','宜蘭縣羅東鎮中山路四段197號199號'],
['993498','豐慶','台中市西屯區甘肅路一段196號及198號1樓'],
['993502','航竹','桃園市蘆竹區大竹路408號1樓'],
['993513','聖博','宜蘭縣羅東鎮南昌街53巷6之3號1樓'],
['993649','和信醫','台北市北投區立德路125號1樓'],
['993708','精中','台中市太平區太平一街220號'],
['993786','揚明','新竹市東區新安路7號1樓'],
['993812','巨峰','彰化縣彰化市天祥路359號'],
['993823','宇勝','彰化縣彰化市崙平里崙平北路22號'],
['993867','鶯育','新北市鶯歌區南雅路34號36號1樓'],
['996110','鑫大孝','台北市中正區黎明里重慶南路一段1-1號一樓'],
['996121','連豐','新北市新店區大豐路12號'],
['996154','鳳翔','台北市大安區忠孝東路四段216巷68號'],
['996202','聖運','新北市土城區明德路二段157.159號'],
['996291','萬寶','台中市北屯區中清路二段567號一樓'],
['996349','長青','高雄市鳥松區大智路5號7號1樓'],
['996372','鑫武昌','台北市萬華區武昌街二段57號1樓'],
['996475','德僑','桃園市八德區豐德路31號1樓'],
['996523','篷萊','台北市大同區寧夏路131-1號'],
['996589','海新','高雄市鳳山區國隆里新富路590巷13號15號'],
['996741','元大','台北市中山區遼寧街110號1樓'],
['996752','新豐功','台中市南屯區豐樂里永春東路860號'],
['996903','百和','新北市新店區中正路306號308號1樓'],
['996969','天勝','新北市三重區仁愛街687、689號1樓'],
['997537','蘇中','宜蘭縣蘇澳鎮中山路一段263號'],
['997571','聚鑫','台北市士林區延平北路六段350號350之1號1樓'],
['997618','壽比','屏東縣內埔鄉老埤村壽比路348號'],
['997652','東捷','台東縣台東市豐榮里豐盛路1號'],
['997836','鎮安','彰化縣大村鄉大溪路7-4號1樓'],
['997847','沐庭','新竹縣竹北市光明六路106號1樓'],
['997870','泰昌','桃園市桃園區泰昌三街51之6號'],
['997973','通宏','苗栗縣通霄鎮通西里中正路83之5號'],
['997995','瓏埔','台南市永康區龍埔街108號'],
['998080','七崁','雲林縣西螺鎮建興路163號1樓'],
['998091','傳生','高雄市阿蓮區中正路407號'],
['998116','元東','雲林縣元長鄉下寮村東興路28號1樓']
  ];
  const filteredStores = useMemo(() => {
    return STORES_RAW.filter(s => {
      const city = (s[2].match(CITY_RE)||['',''])[1];
      const cityOk = !storeCity || city === storeCity;
      const searchOk = !storeSearch || s[1].includes(storeSearch) || s[2].includes(storeSearch);
      return cityOk && searchOk;
    }).slice(0,30).map(s => ({
      id: s[0],
      name: s[1],
      address: s[2],
      city: (s[2].match(CITY_RE)||['',''])[1] || '其他'
    }));
  }, [storeSearch, storeCity]);

  if (orderDone) {
    const orderId = 'HC' + Date.now().toString().slice(-8);
    return (
      <div style={{ padding:'40px 16px 90px', textAlign:'center' }}>
        <div style={{ fontSize:80, marginBottom:20 }}>✅</div>
        <div style={{ fontSize:24, fontWeight:900, color:C.success, marginBottom:8 }}>訂單成立！</div>
        <div style={{ fontSize:14, color:C.textS, marginBottom:4 }}>訂單編號：{orderId}</div>
        <div style={{ ...S.card, marginTop:20, marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:14 }}>📦 取貨資訊</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { emoji:'🏪', label:'取貨門市', val:orderForm.storeName||'台中中港門市' },
              { emoji:'👤', label:'取貨人', val:orderForm.name },
              { emoji:'📱', label:'聯絡電話', val:orderForm.phone },
              { emoji:'💰', label:'付款方式', val:'取貨付款（現金/悠遊卡）' },
              { emoji:'⏱️', label:'預計到店', val:'3-5個工作天' },
              { emoji:'💵', label:'應付金額', val:`NT$ ${total.toLocaleString()}` },
            ].map(i=>(
              <div key={i.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.borderL}` }}>
                <span style={{ fontSize:13, color:C.textS }}>{i.emoji} {i.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{i.val}</span>
              </div>
            ))}
          </div>
          <div style={{ background:'#FFF3CD', borderRadius:10, padding:'10px 14px', marginTop:12 }}>
            <div style={{ fontSize:12, color:'#856404' }}>📱 到貨後將以簡訊通知您到 {orderForm.storeName||'台中中港門市'} 取貨，請記得攜帶身分證件。</div>
          </div>
        </div>
        <button onClick={()=>{ setState(s=>({...s, cart:[], page:'home'})); setOrderDone(false); }} style={S.btn('primary')}>返回首頁</button>
      </div>
    );
  }

  if (checkoutStep === 'store') {
    return (
      <div style={{ padding:'0 16px 90px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 0 16px' }}>
          <button onClick={()=>setCheckoutStep('info')} style={{ background:C.borderL, border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
          <div style={{ fontSize:18, fontWeight:800 }}>🏪 選擇7-11門市</div>
        </div>
        <div style={{ marginBottom:12 }}>
          <select value={storeCity} onChange={e=>{setStoreCity(e.target.value);setStoreSearch('');}} style={{ width:'100%', border:`2px solid ${C.border}`, borderRadius:12, padding:'11px 14px', fontSize:15, outline:'none', color:C.text, background:C.surface, marginBottom:10 }}>
            <option value="">🗺️ 選擇縣市（全台）</option>
            {['台北市','新北市','桃園市','台中市','台南市','高雄市','基隆市','新竹市','新竹縣','苗栗縣','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','屏東縣','宜蘭縣','花蓮縣','台東縣','澎湖縣'].map(c=>(
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', padding:'0 14px' }}>
            <span>🔍</span>
            <input value={storeSearch} onChange={e=>setStoreSearch(e.target.value)} placeholder="搜尋門市名稱或地址..." style={{ flex:1, background:'none', border:'none', padding:'12px 10px', fontSize:14, outline:'none' }} />
            {storeSearch && <button onClick={()=>setStoreSearch('')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:C.textL }}>✕</button>}
          </div>
        </div>
        {!storeCity && !storeSearch && (
          <div style={{ textAlign:'center', padding:'30px 16px', color:C.textS }}>
            <div style={{ fontSize:40, marginBottom:8 }}>🏪</div>
            <div style={{ fontSize:15, fontWeight:700 }}>全台 7,109 家門市</div>
            <div style={{ fontSize:13, marginTop:4 }}>請先選擇縣市，或直接搜尋門市名稱</div>
          </div>
        )}
        {filteredStores.map(s=>(
          <div key={s.id} onClick={()=>{ setOrderForm(f=>({...f, storeId:s.id, storeName:s.name, storeAddress:s.address})); setCheckoutStep('confirm'); }} style={{ ...S.card, marginBottom:10, cursor:'pointer', display:'flex', gap:14, alignItems:'center', border:orderForm.storeId===s.id?`2px solid ${C.primary}`:undefined }}>
            <div style={{ fontSize:30 }}>🏪</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800 }}>{s.name}</div>
              <div style={{ fontSize:12, color:C.textS }}>{s.address}</div>
              <Badge color={C.primary}>{s.city}</Badge>
            </div>
            <div style={{ color: orderForm.storeId===s.id ? C.primary : C.textL, fontSize:20 }}>{orderForm.storeId===s.id?'✅':'›'}</div>
          </div>
        ))}
        {(storeCity || storeSearch) && filteredStores.length === 0 && (
          <div style={{ textAlign:'center', padding:'30px', color:C.textS }}>查無符合門市，請換個關鍵字試試</div>
        )}
        {(storeCity || storeSearch) && filteredStores.length === 30 && (
          <div style={{ textAlign:'center', padding:'12px', color:C.textS, fontSize:12 }}>顯示前30筆，請輸入更精確的關鍵字縮小範圍</div>
        )}
      </div>
    );
  }

  if (checkoutStep === 'info') {
    return (
      <div style={{ padding:'0 16px 90px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 0 16px' }}>
          <button onClick={()=>setCheckoutStep('cart')} style={{ background:C.borderL, border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
          <div style={{ fontSize:18, fontWeight:800 }}>填寫取貨資訊</div>
        </div>
        <div style={{ ...S.card, marginBottom:16 }}>
          {[
            { key:'name', label:'取貨人姓名', placeholder:'真實姓名' },
            { key:'phone', label:'聯絡電話', placeholder:'手機號碼' },
          ].map(f=>(
            <div key={f.key} style={{ marginBottom:16 }}>
              <label style={{ fontSize:14, fontWeight:700, color:C.text, display:'block', marginBottom:6 }}>{f.label}</label>
              <input value={orderForm[f.key]} onChange={e=>setOrderForm(v=>({...v,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ width:'100%', border:`2px solid ${C.border}`, borderRadius:12, padding:'12px 16px', fontSize:16, outline:'none', color:C.text, boxSizing:'border-box', background:C.bg }} />
            </div>
          ))}
        </div>
        <button onClick={()=>{
          if(!orderForm.name.trim()){alert('請填寫取貨人姓名');return;}
          if(!orderForm.phone.trim()||!orderForm.phone.match(/^09\d{8}$/)){alert('請輸入正確手機號碼（09xxxxxxxx）');return;}
          setCheckoutStep('store');
        }} style={S.btn('primary')}>下一步：選擇取貨門市</button>
      </div>
    );
  }

  if (checkoutStep === 'confirm') {
    return (
      <div style={{ padding:'0 16px 90px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 0 16px' }}>
          <button onClick={()=>setCheckoutStep('store')} style={{ background:C.borderL, border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
          <div style={{ fontSize:18, fontWeight:800 }}>確認訂單</div>
        </div>
        <div style={{ ...S.card, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>📋 訂單明細</div>
          {state.cart.map(i=>(
            <div key={i.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.borderL}` }}>
              <span style={{ fontSize:14 }}>{i.emoji} {i.name} ×{i.qty}</span>
              <span style={{ fontSize:14, fontWeight:700 }}>NT$ {(i.price*i.qty).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', fontWeight:800, fontSize:16 }}>
            <span>合計（{itemCount}件）</span>
            <span style={{ color:C.primary }}>NT$ {total.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>📦 取貨資訊</div>
          {[
            { label:'取貨人', val:orderForm.name },
            { label:'電話', val:orderForm.phone },
            { label:'取貨門市', val:orderForm.storeName || '（請先選擇門市）' },
            { label:'門市地址', val:orderForm.storeAddress || '' },
            { label:'付款方式', val:'取貨付款（現金/悠遊卡）' },
          ].map(i=>i.val&&(
            <div key={i.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.borderL}` }}>
              <span style={{ fontSize:13, color:C.textS }}>{i.label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{i.val}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'#FFF3CD', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ fontSize:13, color:'#856404', lineHeight:1.7 }}>📱 訂單確認後，貨品將在3-5個工作天送達您選擇的7-11門市，到貨後以簡訊通知取貨，請攜帶手機及身分證件。</div>
        </div>
        {!orderForm.storeId && <div style={{ color:C.danger, fontSize:13, fontWeight:600, marginBottom:12, textAlign:'center' }}>⚠️ 請先選擇7-11門市</div>}
        <button onClick={async ()=>{
          if(!orderForm.storeId){setCheckoutStep('store');return;}
          // Save to Supabase
          await saveOrder(user?.id || null, {
            name: orderForm.name, phone: orderForm.phone,
            storeId: orderForm.storeId, storeName: orderForm.storeName||orderForm.store,
            storeAddress: orderForm.storeAddress,
            itemCount: state.cart.reduce((s,i)=>s+i.qty,0),
            total: state.cart.reduce((s,i)=>s+i.price*i.qty,0),
            items: state.cart.map(i=>({name:i.name,qty:i.qty,price:i.price})),
          });
          setOrderDone(true);
        }} style={S.btn('accent')}>✅ 確認送出訂單</button>
        <button onClick={()=>setCheckoutStep('store')} style={{ ...S.btn('outline'), marginTop:8 }}>更改取貨門市</button>
      </div>
    );
  }

  // Cart main view
  return (
    <div style={{ padding:'0 16px 90px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 0 16px' }}>
        <button onClick={()=>setState(s=>({...s,subpage:null}))} style={{ background:C.borderL, border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
        <div style={{ fontSize:18, fontWeight:800 }}>🛒 購物車（{itemCount}件）</div>
      </div>

      {state.cart.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:60, marginBottom:16 }}>🛒</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.textS }}>購物車是空的</div>
          <button onClick={()=>setState(s=>({...s,subpage:null}))} style={{ ...S.btn('primary'), marginTop:20 }}>去逛逛商城</button>
        </div>
      ) : (
        <>
          {state.cart.map(item => (
            <div key={item.id} style={{ ...S.card, marginBottom:12, display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ fontSize:40 }}>{item.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{item.name}</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.primary, marginTop:4 }}>NT$ {item.price.toLocaleString()}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={()=>{
                  setState(s=>({ ...s, cart: s.cart.map(c=>c.id===item.id?{...c,qty:Math.max(0,c.qty-1)}:c).filter(c=>c.qty>0) }));
                }} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:'#fff', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:C.primary }}>−</button>
                <span style={{ fontSize:16, fontWeight:800, minWidth:24, textAlign:'center' }}>{item.qty}</span>
                <button onClick={()=>{
                  setState(s=>({ ...s, cart: s.cart.map(c=>c.id===item.id?{...c,qty:c.qty+1}:c) }));
                }} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.primary, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff' }}>＋</button>
              </div>
            </div>
          ))}

          <div style={{ ...S.card, border:`2px solid ${C.primary}`, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:14, color:C.textS }}>商品總計（{itemCount}件）</span>
              <span style={{ fontSize:16, fontWeight:800, color:C.primary }}>NT$ {total.toLocaleString()}</span>
            </div>
            <Divider />
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input placeholder="輸入優惠碼" style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, outline:'none' }} />
              <button style={{ background:C.borderL, border:'none', borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:700, cursor:'pointer' }}>套用</button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14, color:C.textS }}>📦 配送方式：</span>
              <span style={{ fontSize:14, fontWeight:700 }}>7-11超商取貨付款</span>
              <Badge color={C.success}>免運費</Badge>
            </div>
          </div>

          <button onClick={()=>setCheckoutStep('info')} style={S.btn('accent')}>
            前往結帳 NT$ {total.toLocaleString()}
          </button>
        </>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 個人中心頁 Profile Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── 訂單歷史組件 (真實 Supabase 數據) ──────────────────────
function OrderHistory({ userId, onGoMall }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    import('./lib/supabase.js').then(({ supabase }) => {
      supabase.from('orders')
        .select('order_no, created_at, order_status, total_amount, items_json, store_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          setOrders(data || []);
          setLoading(false);
        });
    }).catch(() => setLoading(false));
  }, [userId]);

  const statusColor = (s) => ({
    '待確認':C.warning,'待出貨':C.info,'配送中':C.primary,
    '可取貨':C.success,'已取貨':C.textL,'取貨逾期':C.danger,'已取消':C.textL
  }[s] || C.textS);

  const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('zh-TW') : '';

  return (
    <div style={{ ...S.card, marginBottom:16 }}>
      <SectionHeader title="我的訂單" sub="最近訂購記錄" />
      {loading ? (
        <div style={{ textAlign:'center', padding:'20px', color:C.textS, fontSize:14 }}>載入中...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'24px', color:C.textS }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🛍️</div>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:6 }}>還沒有訂單記錄</div>
          <div style={{ fontSize:12, color:C.textS, marginBottom:12 }}>去商城選購您需要的保健品</div>
          <button onClick={onGoMall} style={{ ...S.btn('primary'), width:'auto', padding:'8px 20px', fontSize:13 }}>前往商城</button>
        </div>
      ) : orders.map((o, i) => (
        <div key={o.order_no} style={{ padding:'12px 0', borderBottom: i < orders.length-1 ? `1px solid ${C.borderL}` : 'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:12, color:C.textS }}>{formatDate(o.created_at)} · {o.order_no}</span>
            <span style={{ background:statusColor(o.order_status)+'22', color:statusColor(o.order_status), fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>{o.order_status}</span>
          </div>
          <div style={{ fontSize:13, color:C.textS, marginBottom:2 }}>📦 {o.store_name}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:12, color:C.textS }}>
              {(o.items_json||[]).slice(0,2).map(it=>`${it.name}×${it.qty}`).join('、')}
              {(o.items_json||[]).length > 2 && ` 等${o.items_json.length}件`}
            </div>
            <div style={{ fontSize:14, fontWeight:800, color:C.primary }}>NT$ {Number(o.total_amount).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfilePage({ state, setState, user, requireLogin, onLogout }) {
  const lvl = user ? getMemberLevel(user.points||0) : null;
  const pts = user ? (user.points||0) : 0;
  const nextLvl = user ? MEMBER_LEVELS.find(l=>l.min>pts) : null;
  const progressPct = nextLvl ? Math.min(100,Math.round((pts - lvl.min)/(nextLvl.min-lvl.min)*100)) : 100;

  // Not logged in — show login prompt
  if (!user) return (
    <div style={{ padding:'0 16px 90px' }}>
      <div style={{ background:`linear-gradient(145deg,${C.primary},${C.primaryL})`, margin:'0 -16px', padding:'50px 24px 60px', borderRadius:'0 0 28px 28px', textAlign:'center' }}>
        <div style={{ fontSize:72, marginBottom:12 }}>👤</div>
        <div style={{ color:'#fff', fontSize:22, fontWeight:900, marginBottom:6 }}>登入帳號</div>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:14, marginBottom:24, lineHeight:1.7 }}>登入後享有 AI 健康分析<br/>日記記錄、家人管理等完整功能</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={()=>requireLogin('register')} style={{ background:`linear-gradient(135deg,${C.accent},${C.accentL})`, border:'none', borderRadius:14, padding:'13px 24px', color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer' }}>🌱 免費注冊</button>
          <button onClick={()=>requireLogin('login')} style={{ background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.5)', borderRadius:14, padding:'13px 24px', color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer' }}>登入</button>
        </div>
      </div>
      {/* Benefits preview */}
      <div style={{ marginTop:20 }}>
        <div style={{ fontSize:16, fontWeight:800, marginBottom:12, color:C.text }}>🎁 注冊即享好禮</div>
        {[{emoji:'💰',title:'200 積分',sub:'可折抵購物，每 100 積分抵 10 元'},{emoji:'🏷️',title:'首單 9 折券',sub:'第一筆訂單立即享九折優惠'},{emoji:'🤖',title:'AI 體檢解讀',sub:'上傳報告立即獲得白話分析'},{emoji:'📓',title:'健康日記',sub:'記錄每日身心狀態與趨勢'}].map((b,i)=>(
          <div key={i} style={{ ...S.card, marginBottom:10, display:'flex', gap:14, alignItems:'center' }}>
            <span style={{ fontSize:30 }}>{b.emoji}</span>
            <div><div style={{ fontSize:15, fontWeight:700 }}>{b.title}</div><div style={{ fontSize:12, color:C.textS, marginTop:2 }}>{b.sub}</div></div>
          </div>
        ))}
        <button onClick={()=>requireLogin('register')} style={{ ...S.btn('primary'), marginTop:8 }}>立即免費注冊 →</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'0 16px 90px' }}>
      {/* Profile Header */}
      <div style={{ background:`linear-gradient(145deg,${C.primary},${C.primaryL})`, margin:'0 -16px', padding:'30px 20px 36px', borderRadius:'0 0 28px 28px' }}>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ width:72, height:72, background:'rgba(255,255,255,0.2)', borderRadius:99, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>😊</div>
          <div>
            <div style={{ color:'#fff', fontSize:20, fontWeight:900 }}>{user.nickname}</div>
            <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13 }}>📱 {user.phone} · 加入：{user.joinDate}</div>
            <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
              <span style={{ fontSize:16 }}>{lvl.badge}</span>
              <Badge color={C.accentL}>{lvl.label}</Badge>
              {user.coupon && <Badge color='#fff'>🏷️ 首單9折</Badge>}
            </div>
          </div>
        </div>
        {/* Points progress */}
        <div style={{ marginTop:16, background:'rgba(255,255,255,0.12)', borderRadius:14, padding:'12px 14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.85)', fontWeight:700 }}>💰 積分：{pts.toLocaleString()}</span>
            {nextLvl && <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>距「{nextLvl.label}」還差 {nextLvl.min - pts} 分</span>}
          </div>
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:99, height:6 }}>
            <div style={{ background:`linear-gradient(90deg,${C.accentL},${C.gold})`, height:'100%', borderRadius:99, width:`${progressPct}%`, transition:'width 0.5s' }} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
          {[{label:'累計訂單',val:user.orders||0},{label:'積分',val:pts.toLocaleString()},{label:'連續記錄',val:(user.streak||0)+'天'}].map(m=>(
            <div key={m.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:14, padding:'12px 8px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff' }}>{m.val}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop:16 }}>
        {/* Health Profile Summary */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:800 }}>👤 個人健康檔案</div>
            <span style={{ fontSize:12, color:C.textS }}>完善資料以獲得更精準推薦</span>
          </div>
          <div style={{ background:C.bg, borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:6 }}>健康檔案尚未填寫</div>
            <div style={{ fontSize:12, color:C.textS, marginBottom:12, lineHeight:1.6 }}>填寫年齡、身高、體重等基本資料<br/>讓 AI 為您提供更個人化的建議</div>
            <button onClick={()=>setState(s=>({...s,page:'records'}))} style={{ ...S.btn('outline'), width:'auto', padding:'8px 20px', fontSize:13 }}>前往健康記錄填寫</button>
          </div>
        </div>

        {/* Order History — real data from Supabase */}
        <OrderHistory userId={user.id} onGoMall={()=>setState(s=>({...s,page:'mall'}))} />

        {/* Settings Menu */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:14 }}>⚙️ 設定與功能</div>
          {[
            { emoji:'📓', label:'健康日記', sub:'查看並新增每日健康記錄', page:'diary' },
            { emoji:'👨‍👩‍👧', label:'家人健康管理', sub:'管理最多5位家人健康檔案', page:'family' },
            { emoji:'💊', label:'用藥提醒設定', sub:'管理您的每日用藥提醒', page:null },
            { emoji:'🔔', label:'LINE推播通知', sub:'健康提醒、促銷資訊', page:null },
            { emoji:'🤝', label:'邀請好友', sub:'邀請LINE好友享優惠', page:null },
            { emoji:'📞', label:'客服聯絡', sub:'LINE客服：@healthguard', page:null },
          ].map((item, i) => (
            <div key={i} onClick={()=>item.page&&setState(s=>({...s,page:item.page}))} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom:i<5?`1px solid ${C.borderL}`:'none', cursor:item.page?'pointer':'default' }}>
              <span style={{ fontSize:24 }}>{item.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{item.label}</div>
                <div style={{ fontSize:12, color:C.textS }}>{item.sub}</div>
              </div>
              <span style={{ color:item.page?C.primary:C.textL }}>{item.page?'›':'—'}</span>
            </div>
          ))}
        </div>

        <div style={{ ...S.card, background:`${C.primary}08`, border:`1px solid ${C.primary}20`, marginBottom:16, textAlign:'center', padding:'16px' }}>
          <div style={{ fontSize:13, color:C.textS, lineHeight:1.7 }}>健康守護平台 v1.0 · 客服LINE：@healthguardtw<br/>週一至週五 09:00-18:00</div>
        </div>

        {/* 積分說明 */}
        <div style={{ ...S.card, marginBottom:16, border:`1px solid ${C.accent}30` }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.accent, marginBottom:10 }}>💰 積分獲取方式</div>
          {[
            {act:'每日登入',pts:'+10'},{act:'完成健康自測',pts:'+50'},{act:'上傳體檢報告',pts:'+80'},
            {act:'連續記錄7天',pts:'+100'},{act:'首次下單',pts:'+150'},{act:'連續記錄30天',pts:'+500'},
          ].map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:i<5?`1px solid ${C.borderL}`:'none' }}>
              <span style={{ fontSize:13, color:C.textS }}>{r.act}</span>
              <span style={{ fontSize:13, fontWeight:800, color:C.accent }}>{r.pts}</span>
            </div>
          ))}
          <div style={{ fontSize:12, color:C.textL, marginTop:8 }}>每 100 積分可折抵 NT$ 10 購物金</div>
        </div>

        <button onClick={onLogout} style={{ ...S.btn('outline'), border:`2px solid ${C.danger}`, color:C.danger, marginBottom:16 }}>
          🚪 登出帳號
        </button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 後台管理頁 Admin Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AdminPage({ setState }) {
  const [adminTab, setAdminTab] = useState('dashboard');

  const revenueData = [
    {month:'10月',rev:28500,orders:32},{month:'11月',rev:35200,orders:41},{month:'12月',rev:52800,orders:63},
    {month:'1月',rev:48200,orders:57},{month:'2月',rev:41600,orders:49},{month:'3月',rev:58400,orders:72},{month:'4月',rev:64200,orders:78},
  ];
  const topProducts = PRODUCTS.slice(0,5).map((p,i)=>({...p, sold:[89,72,65,58,43][i], revenue:[p.price*89,p.price*72,p.price*65,p.price*58,p.price*43][i]}));
  const catData = [
    {name:'心血管',value:32},{name:'骨骼關節',value:18},{name:'抗老化',value:15},
    {name:'血糖管理',value:14},{name:'肝臟保健',value:12},{name:'其他',value:9},
  ];
  const PCOLORS = [C.danger, C.primary, C.accent, C.warning, C.success, C.info];

  const adminTabs = [
    {id:'dashboard',label:'總覽',emoji:'📊'},{id:'orders',label:'訂單',emoji:'📦'},
    {id:'products',label:'商品',emoji:'🛍️'},{id:'users',label:'客戶',emoji:'👥'},
    {id:'health',label:'健康數據',emoji:'❤️'},{id:'marketing',label:'行銷',emoji:'📢'},
  ];

  return (
    <div style={{ paddingBottom:20 }}>
      {/* Admin Header */}
      <div style={{ background:`linear-gradient(145deg,#1A2744,#2C3E6B)`, padding:'20px 16px', borderRadius:'0 0 20px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>健康守護平台</div>
            <div style={{ color:'#fff', fontSize:20, fontWeight:900 }}>後台管理系統</div>
          </div>
          <button onClick={()=>setState(s=>({...s,page:'home',isAdmin:false}))} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'8px 14px', color:'rgba(255,255,255,0.8)', cursor:'pointer', fontSize:13 }}>返回前台</button>
        </div>
        <div style={{ display:'flex', gap:6, overflowX:'auto' }}>
          {adminTabs.map(t=>(
            <button key={t.id} onClick={()=>setAdminTab(t.id)} style={{ whiteSpace:'nowrap', padding:'8px 14px', borderRadius:10, border:'none', background:adminTab===t.id?'rgba(255,255,255,0.2)':'transparent', color:adminTab===t.id?'#fff':'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px 16px 40px' }}>
        {adminTab === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'本月營收', val:'NT$64,200', sub:'+9.9% vs上月', color:C.success, emoji:'💰' },
                { label:'本月訂單', val:'78筆', sub:'+8.3% vs上月', color:C.primary, emoji:'📦' },
                { label:'活躍會員', val:'342人', sub:'+15人 本週', color:C.info, emoji:'👥' },
                { label:'平均客單價', val:'NT$823', sub:'+6.2% vs上月', color:C.accent, emoji:'🛒' },
                { label:'未取貨訂單', val:'12筆', sub:'需追蹤', color:C.warning, emoji:'⚠️' },
                { label:'商品評分', val:'4.75 ⭐', sub:'98%好評率', color:C.gold, emoji:'🌟' },
              ].map(m=>(
                <div key={m.label} style={{ background:C.surface, borderRadius:14, padding:'14px', border:`1px solid ${C.borderL}` }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>{m.emoji}</span>
                    <span style={{ fontSize:11, color:C.textS }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize:22, fontWeight:900, color:m.color }}>{m.val}</div>
                  <div style={{ fontSize:11, color:C.textS, marginTop:3 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Revenue Chart */}
            <div style={{ ...S.card, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>📈 近7個月營收趨勢</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={revenueData} margin={{top:5,right:5,bottom:5,left:-20}}>
                  <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1A6744" stopOpacity={0.4}/><stop offset="95%" stopColor="#1A6744" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderL} />
                  <XAxis dataKey="month" tick={{ fontSize:12 }} />
                  <YAxis tick={{ fontSize:12 }} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={v=>[`NT$ ${v.toLocaleString()}`,'營收']} />
                  <Area type="monotone" dataKey="rev" stroke="#1A6744" fill="url(#revGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Pie */}
            <div style={{ ...S.card, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>📊 商品類別銷售佔比</div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <PieChart width={140} height={140}>
                  <Pie data={catData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                    {catData.map((e,i)=><Cell key={i} fill={PCOLORS[i%PCOLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div style={{ flex:1 }}>
                  {catData.map((d,i)=>(
                    <div key={d.name} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, alignItems:'center' }}>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <div style={{ width:10, height:10, borderRadius:3, background:PCOLORS[i%PCOLORS.length] }} />
                        <span style={{ fontSize:12 }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700 }}>{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {adminTab === 'orders' && (
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto' }}>
              {['全部','待出貨','配送中','可取貨','已取貨','取貨逾期'].map(s=>(
                <button key={s} style={{ whiteSpace:'nowrap', padding:'8px 16px', borderRadius:20, border:`1px solid ${C.border}`, background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>{s}</button>
              ))}
            </div>
            {[
              // 以下為示範數據，正式上線後將從 Supabase 讀取真實訂單
              { id:'HC20240422001', name:'林志明', product:'深海魚油 × 2', total:1780, store:'台中漢口門市', status:'可取貨', time:'2小時前', phone:'0912-xxx-789' },
              { id:'HC20240422002', name:'陳美惠', product:'CoQ10 + 益生菌', total:2260, store:'台中大墩門市', status:'配送中', time:'5小時前', phone:'0923-xxx-456' },
              { id:'HC20240421003', name:'張國雄', product:'NMN高效版 × 1', total:2880, store:'台北忠孝門市', status:'已取貨', time:'昨天', phone:'0933-xxx-123' },
              { id:'HC20240420004', name:'吳淑芬', product:'骨骼配方 × 1', total:720, store:'高雄中正門市', status:'取貨逾期', time:'2天前', phone:'0900-xxx-321' },
            ].map(o=>(
              <div key={o.id} style={{ ...S.card, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:C.textS }}>{o.id} · {o.time}</span>
                  <Badge color={o.status==='可取貨'?C.success:o.status==='配送中'?C.info:o.status==='已取貨'?C.textL:C.danger}>{o.status}</Badge>
                </div>
                <div style={{ fontSize:14, fontWeight:700 }}>{o.name} <span style={{ color:C.textS, fontSize:12, fontWeight:400 }}>· {o.phone}</span></div>
                <div style={{ fontSize:13, color:C.textS, margin:'4px 0' }}>{o.product}</div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:C.textS }}>🏪 {o.store}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:C.primary }}>NT$ {o.total.toLocaleString()}</span>
                </div>
                {o.status==='取貨逾期' && <button style={{ ...S.btn('danger'), padding:'6px 14px', fontSize:12, marginTop:8, background:`${C.danger}`, width:'auto' }}>📱 發送取貨提醒</button>}
              </div>
            ))}
          </div>
        )}

        {adminTab === 'products' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800 }}>商品管理（{PRODUCTS.length}件）</div>
              <button style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryL})`, border:'none', borderRadius:10, padding:'8px 16px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>＋ 新增商品</button>
            </div>
            {topProducts.map(p=>(
              <div key={p.id} style={{ ...S.card, marginBottom:10, display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ fontSize:36 }}>{p.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:C.textS }}>{p.cat} · 庫存{p.stock}件</div>
                  <div style={{ fontSize:11, color:C.textS }}>本月銷售 {p.sold} 件 · 營收 NT${p.revenue.toLocaleString()}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:C.primary }}>NT${p.price.toLocaleString()}</div>
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <button style={{ fontSize:11, padding:'4px 8px', background:`${C.info}15`, color:C.info, border:'none', borderRadius:6, cursor:'pointer' }}>編輯</button>
                    <button style={{ fontSize:11, padding:'4px 8px', background:`${C.warning}15`, color:C.warning, border:'none', borderRadius:6, cursor:'pointer' }}>庫存</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {adminTab === 'users' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'總會員數', val:'342', color:C.primary },
                { label:'本月新增', val:'+28', color:C.success },
                { label:'LINE來源', val:'68%', color:'#06C755' },
                { label:'FB來源', val:'32%', color:'#1877F2' },
              ].map(m=>(
                <div key={m.label} style={{ background:C.surface, borderRadius:14, padding:'14px', textAlign:'center', border:`1px solid ${C.borderL}` }}>
                  <div style={{ fontSize:26, fontWeight:900, color:m.color }}>{m.val}</div>
                  <div style={{ fontSize:12, color:C.textS }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>👥 會員列表</div>
              {[
                { name:'示範用戶', age:55, source:'LINE', orders:3, lastOrder:'2024/04/01', health:'B', status:'活躍' },
                { name:'林志明', age:62, source:'FB', orders:5, lastOrder:'2024/04/20', health:'C', status:'活躍' },
                { name:'陳美惠', age:54, source:'LINE', orders:12, lastOrder:'2024/04/22', health:'A', status:'活躍' },
                { name:'張國雄', age:67, source:'FB', orders:3, lastOrder:'2024/04/21', health:'B', status:'一般' },
              ].map(u=>(
                <div key={u.name} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:`1px solid ${C.borderL}` }}>
                  <div style={{ width:40, height:40, background:`${C.primary}15`, borderRadius:99, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>👤</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>{u.name}</span>
                      <Badge color={u.source==='LINE'?'#06C755':'#1877F2'}>{u.source}</Badge>
                    </div>
                    <div style={{ fontSize:12, color:C.textS }}>{u.age}歲 · {u.orders}筆訂單</div>
                    <div style={{ fontSize:12, color:C.textS }}>最後下單：{u.lastOrder} · 健康等級：{u.health}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'health' && (
          <div>
            <div style={{ ...S.card, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>🏥 用戶健康風險分佈</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
                {[{label:'低風險',val:'38%',color:C.success},{label:'中風險',val:'47%',color:C.warning},{label:'高風險',val:'15%',color:C.danger}].map(m=>(
                  <div key={m.label} style={{ background:`${m.color}15`, borderRadius:12, padding:'12px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:900, color:m.color }}>{m.val}</div>
                    <div style={{ fontSize:11, color:C.textS }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>最常見健康問題 TOP 5</div>
              {[
                {label:'心血管高風險',pct:42,color:C.danger},
                {label:'骨骼關節問題',pct:38,color:'#8E44AD'},
                {label:'睡眠品質差',pct:35,color:C.info},
                {label:'血糖偏高',pct:28,color:C.warning},
                {label:'肝指數異常',pct:22,color:C.success},
              ].map(i=>(
                <div key={i.label} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13 }}>{i.label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:i.color }}>{i.pct}%</span>
                  </div>
                  <RiskBar score={i.pct} max={100} />
                </div>
              ))}
            </div>
            <div style={{ ...S.card }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>🤖 AI推薦效果分析</div>
              <div style={{ fontSize:13, color:C.textS, marginBottom:12 }}>點擊AI推薦產品後購買轉化率</div>
              {[{label:'深海魚油（心血管推薦）',rate:'73%',color:C.success},{label:'CoQ10（疲勞+心血管）',rate:'68%',color:C.primary},{label:'益生菌（腸胃推薦）',rate:'65%',color:C.info},{label:'鈣鎂鋅（骨骼推薦）',rate:'61%',color:'#8E44AD'}].map(i=>(
                <div key={i.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.borderL}` }}>
                  <span style={{ fontSize:13 }}>{i.label}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:i.color }}>{i.rate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'marketing' && (
          <div>
            <div style={{ ...S.card, marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>📱 LINE推播管理</div>
              {[
                { title:'健康知識週報', target:'全體會員（342人）', scheduled:'每週日 09:00', status:'啟用中' },
                { title:'血壓高風險群用戶推廣', target:'心血管高風險（145人）', scheduled:'隔日一次', status:'啟用中' },
                { title:'會員生日優惠', target:'生日當月會員', scheduled:'生日前3天', status:'啟用中' },
                { title:'休眠用戶喚醒', target:'30天未下單（67人）', scheduled:'週三下午', status:'待啟用' },
              ].map(c=>(
                <div key={c.title} style={{ padding:'10px 0', borderBottom:`1px solid ${C.borderL}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:14, fontWeight:700 }}>{c.title}</span>
                    <Badge color={c.status==='啟用中'?C.success:C.textS}>{c.status}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:C.textS }}>目標：{c.target}</div>
                  <div style={{ fontSize:12, color:C.textS }}>時間：{c.scheduled}</div>
                </div>
              ))}
              <button style={{ ...S.btn('primary'), marginTop:12 }}>＋ 新增推播任務</button>
            </div>
            <div style={{ ...S.card }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>🎁 優惠券管理</div>
              {[
                { code:'HEALTH15', disc:'85折', usage:'已用34/100次', exp:'2024/04/30' },
                { code:'NEWMEMBER', disc:'滿1000折100', usage:'已用89/200次', exp:'長期' },
                { code:'BPCARE', disc:'心血管商品9折', usage:'已用12/50次', exp:'2024/05/31' },
              ].map(c=>(
                <div key={c.code} style={{ padding:'10px 0', borderBottom:`1px solid ${C.borderL}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:14, fontWeight:800, color:C.primary }}>{c.code}</span>
                    <Badge color={C.accent}>{c.disc}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:C.textS, marginTop:4 }}>{c.usage} · 效期：{c.exp}</div>
                </div>
              ))}
              <button style={{ ...S.btn('outline'), marginTop:12 }}>＋ 新增優惠券</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 主應用 Main App
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NAV = [
  { id:'home', emoji:'🏠', label:'首頁' },
  { id:'assessment', emoji:'🩺', label:'自測' },
  { id:'records', emoji:'📊', label:'記錄' },
  { id:'mall', emoji:'🛍️', label:'商城' },
  { id:'profile', emoji:'👤', label:'我的' },
];

function HealthPlatform() {
  const [state, setState] = useState({
    page: 'home',
    subpage: null,
    selectedProduct: null,
    assessResults: {},
    examValues: {},
    cart: [],
    isAdmin: false,
    newRecord: null,
    diaryEntries: null,
    familyMembers: null,
  });

  // ── Auth State ──
  const [user, setUser] = useState(null); // null = 未登入
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'
  const [welcomePopup, setWelcomePopup] = useState(null); // user object

  const handleAuthSuccess = (u) => {
    setUser(u);
    setAuthModal(null);
    setWelcomePopup(u);
    // Sync diary + family from DB
    if (u?.id) {
      getDiaryEntries(u.id).then(entries => {
        if (entries.length) setState(s => ({...s, diaryEntries: entries.map(e => ({
          ...e, id: 'db_' + e.id, date: e.entry_date,
          symptoms: e.symptoms || [], bp: e.bp || '', glucose: e.glucose || '',
          water: e.water || 0, food: e.food || '', note: e.note || ''
        }))}));
      });
      getFamilyMembers(u.id).then(members => {
        if (members.length) setState(s => ({...s, familyMembers: members}));
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setState(s=>({...s, page:'home'}));
  };

  const requireLogin = (mode='register') => setAuthModal(mode);

  // 加積分工具
  const addPoints = (pts, reason) => {
    setUser(u => {
      if (!u) return u;
      if (u.id) dbAddPoints(u.id, pts, reason).then(newTotal => {
        if (newTotal) setUser(prev => prev ? {...prev, points: newTotal} : prev);
      });
      return {...u, points:(u.points||0)+pts};
    });
  };

  const renderPage = () => {
    if (state.isAdmin) return <AdminPanel onBack={()=>setState(s=>({...s,isAdmin:false}))} />;

    // Gate check
    if (GATED_PAGES.includes(state.page) && !user) {
      const pageContent = (() => {
        switch(state.page) {
          case 'records': return <RecordsPage state={state} setState={setState} />;
          case 'report': return <ReportPage state={state} setState={setState} />;
          case 'analysis': return <AnalysisPage state={state} setState={setState} />;
          case 'diary': return <DiaryPage state={state} setState={setState} />;
          case 'family': return <FamilyPage state={state} setState={setState} user={user} />;
          default: return <div/>;
        }
      })();
      return (
        <LoginGate pageName={state.page} onLogin={requireLogin}>
          {pageContent}
        </LoginGate>
      );
    }

    switch(state.page) {
      case 'home': return <HomePage state={state} setState={setState} user={user} requireLogin={requireLogin} />;
      case 'assessment': return <AssessmentPage state={state} setState={setState} user={user} requireLogin={requireLogin} addPoints={addPoints} />;
      case 'records': return <RecordsPage state={state} setState={setState} addPoints={addPoints} />;
      case 'report': return <ReportPage state={state} setState={setState} addPoints={addPoints} />;
      case 'analysis': return <AnalysisPage state={state} setState={setState} />;
      case 'mall': return <MallPage state={state} setState={setState} user={user} requireLogin={requireLogin} />;
      case 'profile': return <ProfilePage state={state} setState={setState} user={user} requireLogin={requireLogin} onLogout={handleLogout} />;
      case 'diary': return <DiaryPage state={state} setState={setState} user={user} addPoints={addPoints} />;
      case 'family': return <FamilyPage state={state} setState={setState} user={user} />;
      default: return <HomePage state={state} setState={setState} user={user} requireLogin={requireLogin} />;
    }
  };

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background: #F5EFE2; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.primary}50; border-radius:3px; }
      `}</style>

      {/* Admin Entry */}
      {!state.isAdmin && (
        <div style={{ position:'fixed', top:12, right:12, zIndex:999, display:'flex', gap:6 }}>
          {user ? (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ background:'rgba(255,255,255,0.95)', border:`1px solid ${C.primary}30`, borderRadius:10, padding:'5px 10px', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }} onClick={()=>setState(s=>({...s,page:'profile'}))}>
                <span style={{ fontSize:14 }}>{getMemberLevel(user.points||0).badge}</span>
                <span style={{ fontSize:11, fontWeight:800, color:C.primary }}>{user.nickname}</span>
                <span style={{ fontSize:11, color:C.accent, fontWeight:700 }}>💰{(user.points||0)}</span>
              </div>
              <button onClick={()=>setState(s=>({...s,isAdmin:true}))} style={{ background:'rgba(26,44,116,0.9)', border:'none', borderRadius:10, padding:'6px 12px', color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:700, cursor:'pointer' }}>⚙️</button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>setAuthModal('register')} style={{ background:`linear-gradient(135deg,${C.accent},${C.accentL})`, border:'none', borderRadius:10, padding:'6px 12px', color:'#fff', fontSize:11, fontWeight:800, cursor:'pointer' }}>🌱 免費注冊</button>
              <button onClick={()=>setAuthModal('login')} style={{ background:'rgba(255,255,255,0.95)', border:`1px solid ${C.border}`, borderRadius:10, padding:'6px 12px', color:C.primary, fontSize:11, fontWeight:700, cursor:'pointer' }}>登入</button>
              <button onClick={()=>setState(s=>({...s,isAdmin:true}))} style={{ background:'rgba(26,44,116,0.9)', border:'none', borderRadius:10, padding:'6px 12px', color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:700, cursor:'pointer' }}>⚙️</button>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal */}
      {authModal && <AuthModal mode={authModal} onClose={()=>setAuthModal(null)} onSuccess={handleAuthSuccess} />}

      {/* Welcome Popup */}
      {welcomePopup && <WelcomePopup user={welcomePopup} onClose={()=>setWelcomePopup(null)} />}

      {/* Page Content */}
      <div style={{ paddingTop:0 }}>
        {renderPage()}
      </div>

      {/* Bottom Navigation */}
      {!state.isAdmin && (
        <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(16px)', borderTop:`1px solid ${C.borderL}`, display:'flex', zIndex:100, boxShadow:'0 -4px 20px rgba(0,0,0,0.08)' }}>
          {NAV.map(n => {
            const active = state.page === n.id || (n.id==='mall' && ['mall'].includes(state.page));
            const cartCount = n.id==='mall' ? state.cart.reduce((s,i)=>s+i.qty,0) : 0;
            return (
              <button key={n.id} onClick={()=>setState(s=>({...s,page:n.id,subpage:null,selectedProduct:null}))} style={{ flex:1, padding:'10px 4px 14px', border:'none', background:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer', position:'relative' }}>
                {cartCount > 0 && <span style={{ position:'absolute', top:6, right:'30%', background:C.danger, color:'#fff', fontSize:11, fontWeight:800, borderRadius:99, width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</span>}
                <span style={{ fontSize:22, filter: active ? 'none' : 'grayscale(40%)' }}>{n.emoji}</span>
                <span style={{ fontSize:10, fontWeight:700, color:active?C.primary:C.textL }}>{n.label}</span>
                {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:24, height:3, background:C.primary, borderRadius:'0 0 3px 3px' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HealthPlatform;
