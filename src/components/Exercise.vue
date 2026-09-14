<template>
  <section class="workbench" :class="{ 'is-loading': loading }">
    <div class="page-head">
      <div>
        <h1 class="page-title">锻炼记录</h1>
        <p class="page-subtitle">{{ todayText }} · 累计 {{ totalCount }} 次锻炼</p>
      </div>
      <button class="ghost-btn" type="button" :disabled="loading" @click="loadAllData">
        <el-icon :size="15" :class="{ 'is-spinning': loading }"><Refresh /></el-icon>
        <span>{{ loading ? '刷新中…' : '刷新' }}</span>
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card tone-count">
        <div class="stat-icon"><el-icon :size="18"><Files /></el-icon></div>
        <div class="stat-body">
          <div class="stat-value">{{ stat.totalCount }}</div>
          <div class="stat-label">累计次数</div>
        </div>
      </div>
      <div class="stat-card tone-minutes">
        <div class="stat-icon"><el-icon :size="18"><Timer /></el-icon></div>
        <div class="stat-body">
          <div class="stat-value">{{ stat.totalMinutes }}</div>
          <div class="stat-label">累计时长(分钟)</div>
        </div>
      </div>
      <div class="stat-card tone-calories">
        <div class="stat-icon"><el-icon :size="18"><Lightning /></el-icon></div>
        <div class="stat-body">
          <div class="stat-value">{{ stat.totalCalories }}</div>
          <div class="stat-label">消耗千卡</div>
        </div>
      </div>
      <div class="stat-card tone-week">
        <div class="stat-icon"><el-icon :size="18"><Calendar /></el-icon></div>
        <div class="stat-body">
          <div class="stat-value">{{ stat.weekCount }}</div>
          <div class="stat-label">本周锻炼(次)</div>
        </div>
      </div>
    </div>

    <!-- 锻炼日历热力图 -->
    <div class="list-panel heatmap-panel">
      <div class="panel-head">
        <div class="panel-title">
          <span class="title-dot dot-heat"></span>
          <span>锻炼日历</span>
          <span class="count-badge">近 {{ heatDays }} 天</span>
        </div>
        <span class="panel-hint">颜色越深，当天锻炼越多</span>
      </div>
      <div class="heatmap-wrap">
        <div class="heatmap-cols">
          <div class="heat-col" v-for="(week, wi) in heatWeeks" :key="wi">
            <div v-for="day in week" :key="day.date" class="heat-cell"
                 :class="heatClass(day)" :title="day.date + '：' + (day.count > 0 ? day.count + '次 · ' + day.minutes + '分钟' : '未锻炼')"></div>
          </div>
        </div>
        <div class="heat-legend">
          <span>少</span>
          <i class="heat-l hl-0"></i><i class="heat-l hl-1"></i><i class="heat-l hl-2"></i><i class="heat-l hl-3"></i><i class="heat-l hl-4"></i>
          <span>多</span>
        </div>
      </div>
    </div>

    <!-- 添加面板 -->
    <div class="add-panel">
      <div class="add-icon">
        <el-icon :size="17"><EditPen /></el-icon>
      </div>
      <select v-model="form.exerciseType" class="form-select">
        <option disabled value="">类型</option>
        <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
      </select>
      <input v-model.number="form.durationMinutes" class="form-input form-input-sm" type="number" min="1" placeholder="时长(分钟)" />
      <input v-model.number="form.calories" class="form-input form-input-sm" type="number" min="0" placeholder="消耗千卡" />
      <select v-model="form.intensity" class="form-select form-select-sm">
        <option disabled value="">强度</option>
        <option value="低">低</option>
        <option value="中">中</option>
        <option value="高">高</option>
      </select>
      <input v-model="form.exerciseDate" class="form-input form-date" type="date" />
      <button class="primary-btn" type="button" :disabled="submitting" @click="addRecord">
        <el-icon :size="15"><Plus /></el-icon>
        <span>添加</span>
      </button>
    </div>
    <div class="add-panel note-row">
      <input v-model="form.note" class="task-input" placeholder="备注（可选）：跑步5公里 / 哑铃训练…" @keyup.enter="addRecord" />
    </div>

    <!-- 历史记录（按日期分组） -->
    <div v-for="group in groupedList" :key="group.date" class="list-panel">
      <div class="panel-head">
        <div class="panel-title">
          <span class="title-dot" :class="group.isToday ? 'dot-today' : 'dot-past'"></span>
          <span>{{ group.label }}</span>
          <span class="count-badge">{{ group.items.length }}</span>
        </div>
      </div>
      <ul class="task-list">
        <li v-for="item in group.items" :key="item.id" class="task-item">
          <span class="type-badge" :class="`type-${item.exerciseType}`">{{ item.exerciseType }}</span>
          <div class="item-main">
            <div class="item-title">
              <span>{{ item.durationMinutes }} 分钟</span>
              <span class="item-cal">{{ item.calories }} 千卡</span>
              <span class="intensity-tag" :class="`int-${item.intensity}`">{{ item.intensity }}</span>
            </div>
            <div v-if="item.note" class="item-note">{{ item.note }}</div>
          </div>
          <button class="del-btn" type="button" title="删除" @click="deleteRecord(item.id)">
            <el-icon :size="15"><Delete /></el-icon>
          </button>
        </li>
        <li v-if="group.items.length === 0" class="empty-state">
          <div class="empty-icon"><el-icon :size="24"><Checked /></el-icon></div>
          <span>暂无记录</span>
        </li>
      </ul>
    </div>

    <div v-if="list.length === 0 && !loading" class="empty-state page-empty">
      <div class="empty-icon"><el-icon :size="24"><Trophy /></el-icon></div>
      <span>还没有锻炼记录</span>
      <span class="empty-hint">从今天开始，记录每一次训练吧</span>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { EditPen, Plus, Delete, Checked, Files, Timer, Lightning, Calendar, Trophy } from '@element-plus/icons-vue'
import { getExerciseList, getExerciseStat, addExercise as reqAdd, deleteExercise as reqDelete, getHeatmap } from '../api/exercise'

const typeOptions = ['跑步', '力量', '有氧', '骑行', '游泳', '瑜伽', '其他']

const list = ref([])
const stat = ref({ totalCount: 0, totalMinutes: 0, totalCalories: 0, weekCount: 0, topTypes: [] })
const loading = ref(false)
const submitting = ref(false)

const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
const todayText = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })

const form = ref({
  exerciseType: '',
  durationMinutes: null,
  calories: null,
  intensity: '',
  exerciseDate: today,
  note: ''
})

const totalCount = computed(() => stat.value.totalCount)
const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// ===== 锻炼日历热力图 =====
const heatDays = 84
const heatData = ref([])
const heatWeeks = computed(() => {
  if (heatData.value.length === 0) return []
  const start = new Date(heatData.value[0].date + 'T00:00:00')
  // 补齐到周日开始
  const padStart = start.getDay()
  const weeks = []
  let week = []
  for (let i = 0; i < padStart; i++) {
    week.push({ date: 'pad-' + i, count: 0, minutes: 0 })
  }
  for (const d of heatData.value) {
    const date = new Date(d.date + 'T00:00:00')
    week.push(d)
    if (date.getDay() === 6) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) weeks.push(week)
  return weeks
})
const heatClass = day => {
  if (day.date.startsWith('pad-')) return 'heat-pad'
  const c = day.count || 0
  if (c === 0) return 'hl-0'
  if (c === 1) return 'hl-1'
  if (c === 2) return 'hl-2'
  if (c === 3) return 'hl-3'
  return 'hl-4'
}

const groupedList = computed(() => {
  const map = new Map()
  for (const item of list.value) {
    const date = item.exerciseDate || ''
    if (!map.has(date)) map.set(date, [])
    map.get(date).push(item)
  }
  const dates = [...map.keys()].sort((a, b) => b.localeCompare(a))
  return dates.map(date => {
    const isToday = date === today
    const d = new Date(date + 'T00:00:00')
    const label = isToday
      ? '今天'
      : `${d.getMonth() + 1}月${d.getDate()}日 ${weekNames[d.getDay()]}`
    return { date, label, isToday, items: map.get(date) }
  })
})

const loadAllData = async () => {
  loading.value = true
  const [statRes, listRes, heatRes] = await Promise.allSettled([
    getExerciseStat(),
    getExerciseList(),
    getHeatmap(heatDays)
  ])
  if (statRes.status === 'fulfilled' && statRes.value?.data) stat.value = statRes.value.data
  if (listRes.status === 'fulfilled' && listRes.value?.data) list.value = listRes.value.data
  if (heatRes.status === 'fulfilled' && heatRes.value?.data) heatData.value = heatRes.value.data
  if (statRes.status === 'rejected') console.error('锻炼统计加载失败', statRes.reason)
  if (listRes.status === 'rejected') console.error('锻炼列表加载失败', listRes.reason)
  if (heatRes.status === 'rejected') console.error('热力图加载失败', heatRes.reason)
  loading.value = false
}

const addRecord = async () => {
  if (submitting.value) return
  if (!form.value.exerciseType) { alert('请选择锻炼类型'); return }
  if (!form.value.durationMinutes || form.value.durationMinutes <= 0) { alert('请输入有效的锻炼时长'); return }
  submitting.value = true
  try {
    await reqAdd({
      exerciseType: form.value.exerciseType,
      durationMinutes: form.value.durationMinutes,
      calories: form.value.calories || 0,
      intensity: form.value.intensity || '中',
      exerciseDate: form.value.exerciseDate || today,
      note: form.value.note.trim()
    })
    form.value.note = ''
    form.value.durationMinutes = null
    form.value.calories = null
    form.value.intensity = ''
    form.value.exerciseDate = today
    await loadAllData()
  } catch (err) {
    console.error('添加失败', err)
  } finally {
    submitting.value = false
  }
}

const deleteRecord = async id => {
  try {
    await reqDelete(id)
    await loadAllData()
  } catch (err) {
    console.error('删除失败', err)
  }
}

onMounted(() => loadAllData())
</script>

<style scoped>
.workbench { transition: opacity 0.2s ease; }
.workbench.is-loading { opacity: 0.65; pointer-events: none; }
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.page-title { margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
.page-subtitle { margin: 6px 0 0; font-size: 14px; color: #64748b; }
.ghost-btn {
  display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px;
  border: 1px solid #dbe4f5; border-radius: 10px; background: #fff;
  color: #2563eb; font-size: 14px; font-weight: 600; cursor: pointer;
  box-shadow: 0 1px 3px rgba(15,23,42,0.05); transition: all 0.18s ease;
}
.ghost-btn:hover:not(:disabled) { border-color: #2563eb; color: #1d4ed8; box-shadow: 0 3px 10px rgba(37,99,235,0.18); transform: translateY(-1px); }
.ghost-btn:disabled, .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.is-spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
.stat-card { display: flex; align-items: center; gap: 14px; min-height: 96px; padding: 18px; background: #fff; border: 1px solid #e5ebf7; border-radius: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.05); transition: box-shadow 0.18s ease, transform 0.18s ease; }
.stat-card:hover { box-shadow: 0 8px 20px rgba(15,23,42,0.08); transform: translateY(-2px); }
.stat-icon { width: 44px; height: 44px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; }
.tone-count .stat-icon { background: linear-gradient(135deg,#e0f2fe,#bae6fd); color: #0369a1; }
.tone-minutes .stat-icon { background: linear-gradient(135deg,#d1fae5,#a7f3d0); color: #047857; }
.tone-calories .stat-icon { background: linear-gradient(135deg,#fef3c7,#fde68a); color: #b45309; }
.tone-week .stat-icon { background: linear-gradient(135deg,#e0e7ff,#c7d2fe); color: #4338ca; }
.stat-body { min-width: 0; }
.stat-value { font-size: 28px; font-weight: 700; color: #0f172a; line-height: 1.2; font-variant-numeric: tabular-nums; letter-spacing: -0.5px; }
.stat-label { margin-top: 4px; font-size: 13px; color: #64748b; font-weight: 500; }

.heatmap-panel { background: linear-gradient(160deg,#ffffff,#f0f7ff); }
.dot-heat { background: linear-gradient(135deg,#10b981,#34d399); box-shadow: 0 0 0 3px rgba(16,185,129,0.16); }
.heatmap-wrap { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; padding-top: 12px; }
.heatmap-cols { display: flex; gap: 3px; overflow-x: auto; padding-bottom: 4px; }
.heat-col { display: flex; flex-direction: column; gap: 3px; }
.heat-cell { width: 13px; height: 13px; border-radius: 3px; flex: 0 0 auto; }
.heat-pad { background: transparent; }
.hl-0 { background: #eef0f4; }
.hl-1 { background: #c7f9cc; }
.hl-2 { background: #7ce38b; }
.hl-3 { background: #34c759; }
.hl-4 { background: #0f9d43; }
.heat-legend { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #94a3b8; flex: 0 0 auto; }
.heat-l { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.add-panel {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px; margin-bottom: 10px;
  background: linear-gradient(120deg,#f5f8ff,#edf3ff); border: 1px solid #dbe7f7;
  border-radius: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.04);
}
.note-row { padding: 10px 16px; }
.add-icon { width: 36px; height: 36px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: linear-gradient(135deg,#2563eb,#60a5fa); color: #fff; box-shadow: 0 2px 6px rgba(37,99,235,0.3); }
.form-input, .form-select {
  height: 38px; padding: 0 12px; border: 1px solid #dbe4e3; border-radius: 10px;
  background: #fff; color: #0f172a; font-size: 14px; outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.form-input:focus, .form-select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.14); }
.form-input { flex: 1 1 110px; min-width: 0; }
.form-input-sm { flex: 0 1 120px; }
.form-select { flex: 0 1 90px; }
.form-select-sm { flex: 0 1 70px; }
.form-date { flex: 0 1 140px; }
.task-input {
  flex: 1; min-width: 0; height: 38px; padding: 0 12px;
  border: 1px solid #dbe4e3; border-radius: 10px; background: #fff;
  color: #0f172a; font-size: 14px; outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.task-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.14); }
.task-input::placeholder { color: #94a3b8; }
.primary-btn {
  display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 18px;
  border: none; border-radius: 10px; background: linear-gradient(135deg,#2563eb,#3b82f6);
  color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
  box-shadow: 0 3px 10px rgba(37,99,235,0.35); transition: all 0.18s ease;
}
.primary-btn:hover:not(:disabled) { box-shadow: 0 6px 16px rgba(37,99,235,0.42); transform: translateY(-1px); filter: brightness(1.05); }

.list-panel { min-width: 0; padding: 18px; margin-bottom: 16px; background: #fff; border: 1px solid #e5ebf7; border-radius: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.05); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 12px; margin-bottom: 6px; border-bottom: 1px solid #edf0f3; flex-wrap: wrap; }
.panel-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #0f172a; }
.title-dot { width: 9px; height: 9px; border-radius: 50%; }
.dot-today { background: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
.dot-past { background: #94a3b8; box-shadow: 0 0 0 3px rgba(148,163,184,0.15); }
.count-badge { min-width: 22px; height: 20px; padding: 0 7px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-size: 12px; font-weight: 600; background: #eef4ff; color: #2563eb; }
.task-list { min-height: 60px; }
.task-item { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 10px; margin: 0 -10px; border-bottom: 1px solid #f1f5f9; border-radius: 10px; transition: background 0.15s ease; }
.task-item:hover { background: #f0f5ff; }
.type-badge {
  flex: 0 0 auto; min-width: 46px; height: 26px; padding: 0 10px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px; font-size: 13px; font-weight: 600;
}
.type-跑步 { background: #e0f2fe; color: #0369a1; }
.type-力量 { background: #fef3c7; color: #b45309; }
.type-有氧 { background: #ede9fe; color: #6d28d9; }
.type-骑行 { background: #d1fae5; color: #047857; }
.type-游泳 { background: #cffafe; color: #0e7490; }
.type-瑜伽 { background: #fce7f3; color: #be185d; }
.type-其他 { background: #f1f5f9; color: #475569; }
.item-main { flex: 1; min-width: 0; }
.item-title { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #334155; }
.item-cal { font-size: 13px; color: #94a3b8; font-variant-numeric: tabular-nums; }
.intensity-tag { flex: 0 0 auto; height: 20px; padding: 0 8px; display: inline-flex; align-items: center; border-radius: 999px; font-size: 12px; font-weight: 600; }
.int-低 { background: #f1f5f9; color: #64748b; }
.int-中 { background: #eef4ff; color: #2563eb; }
.int-高 { background: #fee2e2; color: #dc2626; }
.item-note { margin-top: 3px; font-size: 12px; color: #94a3b8; overflow-wrap: anywhere; }
.del-btn { width: 30px; height: 30px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 8px; background: transparent; color: #94a3b8; transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease; }
.del-btn:hover { background: #fef2f2; color: #dc2626; transform: scale(1.06); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 100px; color: #94a3b8; font-size: 13px; }
.page-empty { min-height: 220px; }
.empty-icon { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(135deg,#eff6ff,#d1fae5); color: #3b82f6; margin-bottom: 2px; }
.empty-hint { font-size: 12px; color: #cbd5e1; }

@media (max-width: 960px) { .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) {
  .stat-grid { gap: 12px; }
  .stat-card { gap: 10px; padding: 14px; }
  .stat-icon { width: 38px; height: 38px; }
  .stat-value { font-size: 24px; }
  .add-panel { flex-wrap: wrap; }
  .form-input, .form-input-sm, .form-select, .form-select-sm, .form-date { flex: 1 1 40%; }
  .add-panel .primary-btn { width: 100%; justify-content: center; }
}
</style>
