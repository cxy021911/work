<template>
<section class="workbench" :class="{ 'is-loading': loading }">
    <div class="page-head">
      <div>
        <h1 class="page-title">未来工作计划</h1>
        <p class="page-subtitle">{{ todayText }} · 共 {{ totalCount }} 个目标</p>
      </div>
      <button class="ghost-btn" type="button" @click="loadAllData">
        <el-icon :size="15"><Refresh /></el-icon>
        <span>刷新</span>
      </button>
    </div>

    <div class="stat-grid">
      <div
        v-for="item in statList"
        :key="item.key"
        class="stat-card"
        :class="`tone-${item.key}`"
      >
        <div class="stat-icon">
          <el-icon :size="18"><component :is="statIcon(item.key)" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ formatStat(item.key, item.value) }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="add-panel">
      <div class="add-icon">
        <el-icon :size="17"><EditPen /></el-icon>
      </div>
      <input
        v-model="taskText"
        class="task-input"
        placeholder="输入未来工作计划目标"
        @keyup.enter="addPlan"
      />
      <el-date-picker
        v-model="taskDate"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="选择目标日期"
        class="task-date-picker"
      />
      <button class="primary-btn" type="button" @click="addPlan">
        <el-icon :size="15"><Plus /></el-icon>
        <span>添加目标</span>
      </button>
    </div>

    <div class="columns">
      <div class="task-panel">
        <div class="panel-head">
          <div class="panel-title">
            <span class="title-dot dot-pending"></span>
            <span>待完成目标</span>
            <span class="count-badge count-pending">{{ unFinishList.length }}</span>
          </div>
        </div>
        <ul class="task-list">
          <li v-for="todo in unFinishList" :key="todo.id" class="task-item" @click="openCountdown(todo)">
            <label class="check-wrap" @click.stop>
              <input
                v-model="todo.finish"
                type="checkbox"
                class="check-box"
                @change="changeStatus(todo)"
              />
              <span class="check-mark">
                <el-icon :size="12"><Check /></el-icon>
              </span>
            </label>
            <span class="task-text">{{ todo.taskTitle }}</span>
            <span class="task-date-badge" :class="dateBadgeClass(todo.taskDate)">
              {{ formatTaskDate(todo.taskDate) }}
              <span class="task-days">{{ countdownText(todo.taskDate) }}</span>
            </span>
            <button class="del-btn" type="button" title="删除" @click.stop="deletePlanItem(todo.id)">
              <el-icon :size="15"><Delete /></el-icon>
            </button>
          </li>
          <li v-if="unFinishList.length === 0" class="empty-state">
            <div class="empty-icon"><el-icon :size="24"><Checked /></el-icon></div>
            <span>暂无待办任务</span>
          </li>
        </ul>
      </div>

      <div class="task-panel">
        <div class="panel-head">
          <div class="panel-title">
            <span class="title-dot dot-done"></span>
            <span>已完成目标</span>
            <span class="count-badge count-done">{{ finishList.length }}</span>
          </div>
        </div>
        <ul class="task-list">
          <li v-for="todo in finishList" :key="todo.id" class="task-item finish-item" @click="openCountdown(todo)">
            <label class="check-wrap" @click.stop>
              <input
                v-model="todo.finish"
                type="checkbox"
                class="check-box"
                @change="changeStatus(todo)"
              />
              <span class="check-mark">
                <el-icon :size="12"><Check /></el-icon>
              </span>
            </label>
            <span class="task-text">{{ todo.taskTitle }}</span>
            <span class="task-date-badge" :class="dateBadgeClass(todo.taskDate)">
              {{ formatTaskDate(todo.taskDate) }}
              <span class="task-days">{{ countdownText(todo.taskDate) }}</span>
            </span>
            <button class="del-btn" type="button" title="删除" @click.stop="deletePlanItem(todo.id)">
              <el-icon :size="15"><Delete /></el-icon>
            </button>
          </li>
          <li v-if="finishList.length === 0" class="empty-state">
            <div class="empty-icon"><el-icon :size="24"><CircleCheck /></el-icon></div>
            <span>暂无已完成任务</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <el-dialog
    v-model="countdownVisible"
    width="340px"
    :show-close="false"
    align-center
    class="countdown-dialog"
  >
    <div class="cd-card">
      <div class="cd-head">
        <span class="cd-label">距离目标日期</span>
        <span class="cd-title">{{ activeTask?.taskTitle }}</span>
      </div>
      <div class="cd-ring-wrap">
        <svg class="cd-ring" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#22d3ee"/>
              <stop offset="100%" stop-color="#2563eb"/>
            </linearGradient>
          </defs>
          <circle class="cd-ring-track" cx="60" cy="60" r="52"/>
          <circle
            class="cd-ring-bar"
            cx="60" cy="60" r="52"
            :stroke-dasharray="ringLen"
            :stroke-dashoffset="ringOffset"
          />
        </svg>
        <div class="cd-ring-center">
          <span class="cd-num">{{ countdownDays }}</span>
          <span class="cd-unit">天</span>
        </div>
      </div>
      <div class="cd-status">{{ countdownStatusText }}</div>
      <div class="cd-meta">
        <div class="cd-meta-item">
          <span class="cd-meta-label">目标日期</span>
          <span class="cd-meta-value">{{ formatTaskDate(activeTask?.taskDate) }}</span>
        </div>
        <div class="cd-meta-sep"></div>
        <div class="cd-meta-item">
          <span class="cd-meta-label">今天</span>
          <span class="cd-meta-value">{{ todayText }}</span>
        </div>
      </div>
    </div>
    <button class="cd-close" type="button" @click="countdownVisible = false">关 闭</button>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {Refresh,EditPen,Plus,Check,Delete,Checked,CircleCheck,AlarmClock,Files,TrendCharts,DataBoard} from '@element-plus/icons-vue'
import {
  getPlanList,
  addPlan as reqAddPlan,
  changePlanStatus as reqChangePlanStatus,
  deletePlan as reqDeletePlan
} from '../api/plan'

const statList = ref([])
const todoList = ref([])
const taskText = ref('')
const taskDate = ref(todayStr())
const loading = ref(false)

const todayText = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
})

function pad(n) {
  return String(n).padStart(2, '0')
}
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 只显示未来任务：已过（<0）和今天（=0）都过滤掉；未设置日期的保留
const isFuture = item => {
  const d = diffDays(item.taskDate)
  return d === null || d > 0
}
const unFinishList = computed(() => todoList.value.filter(item => !item.finish && isFuture(item)))
const finishList = computed(() => todoList.value.filter(item => item.finish))
const totalCount = computed(() => unFinishList.value.length)

const statIcon = key => ({
  total: 'Files',
  unfinish: 'AlarmClock',
  finish: 'CircleCheck',
  rate: 'TrendCharts'
}[key] || 'DataBoard')

const formatStat = (key, value) => (key === 'rate' ? `${value}%` : value)

// 计算目标日期距离今天的天数（正=未来，0=今天，负=已过）
const diffDays = dateStr => {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target - today0) / 86400000)
}

const formatTaskDate = dateStr => {
  if (!dateStr) return '未设置日期'
  const [y, m, d] = dateStr.split('-')
  return `${m}月${d}日`
}

const countdownText = dateStr => {
  const days = diffDays(dateStr)
  if (days === null) return ''
  if (days > 0) return `还有${days}天`
  if (days === 0) return '就是今天'
  return `已过${-days}天`
}

const dateBadgeClass = dateStr => {
  const days = diffDays(dateStr)
  if (days === null) return 'badge-none'
  if (days > 0) return 'badge-future'
  if (days === 0) return 'badge-today'
  return 'badge-past'
}

const loadAllData = async () => {
  loading.value = true
  const todoRes = await Promise.allSettled([getPlanList()])
  todoList.value = todoRes[0].status === 'fulfilled' && todoRes[0].value?.data ? todoRes[0].value.data : []
  if (todoRes[0].status === 'rejected') console.error('计划列表加载失败', todoRes[0].reason)
  buildStat()
  loading.value = false
}

const buildStat = () => {
  const total = unFinishList.value.length
  const finish = finishList.value.length
  const rate = total === 0 ? 0 : Math.round((finish / total) * 100)
  statList.value = [
    { key: 'total', label: '全部', value: total },
    { key: 'unfinish', label: '未完成', value: total },
    { key: 'finish', label: '已完成', value: finish },
    { key: 'rate', label: '完成率', value: rate }
  ]
}

const addPlan = async () => {
  const text = taskText.value.trim()
  if (!text) return
  try {
    await reqAddPlan({
      taskTitle: text,
      taskDate: taskDate.value || todayStr()
    })
    taskText.value = ''
    taskDate.value = todayStr()
    await loadAllData()
  } catch (err) {
    console.error('新增计划失败', err)
  }
}

const changeStatus = async row => {
  try {
    await reqChangePlanStatus({
      id: row.id,
      taskTitle: row.taskTitle,
      finish: row.finish,
      taskDate: row.taskDate
    })
    await loadAllData()
  } catch (err) {
    console.error('修改计划状态失败', err)
  }
}

const deletePlanItem = async id => {
  try {
    await reqDeletePlan(id)
    await loadAllData()
  } catch (err) {
    console.error('删除计划失败', err)
  }
}

// 倒数日弹窗
const countdownVisible = ref(false)
const activeTask = ref(null)
const countdownDays = computed(() => diffDays(activeTask.value?.taskDate))
const RING_R = 52
const RING_LEN = 2 * Math.PI * RING_R
const ringLen = RING_LEN.toFixed(2)

const ringOffset = computed(() => {
  const d = countdownDays.value
  const t = activeTask.value
  if (d === null || d <= 0) return 0
  // 总跨度 = 目标日期 - 创建日期（取整数天），进度 = 剩余天数 / 总跨度
  let totalDays = d
  if (t?.createTime) {
    const create = new Date(t.createTime)
    const target = new Date(t.taskDate + 'T00:00:00')
    const span = Math.round((target - create) / 86400000)
    if (span > 0) totalDays = span
  }
  const progress = Math.min(1, d / totalDays)
  return (RING_LEN * (1 - progress)).toFixed(2)
})

const countdownStatusText = computed(() => {
  const d = countdownDays.value
  if (d === null) return '未设置目标日期'
  if (d > 0) return `距离目标还有 ${d} 天`
  if (d === 0) return '目标就是今天，冲！'
  return `目标已过去 ${-d} 天`
})
const openCountdown = todo => {
  activeTask.value = todo
  countdownVisible.value = true
}

onMounted(() => loadAllData())
</script>

<style scoped>
.tab-nav{
  display:flex;
  gap:6px;
  margin-bottom:18px;
  padding:4px;
  background:#e8efff;
  border-radius:14px;
  width:max-content;
  max-width:100%;
  overflow-x:auto;
}
.tab-item{
  padding:9px 18px;
  text-decoration:none;
  color:#5b6b6a;
  font-size:14px;
  font-weight:500;
  border-radius:10px;
  white-space:nowrap;
  transition: all 0.2s ease;
}
.tab-item:hover{
  color:#2563eb;
  background:rgba(255,255,255,0.6);
}
.tab-active{
  color:#fff;
  background:linear-gradient(135deg,#2563eb,#3b82f6);
  box-shadow:0 2px 8px rgba(37,99,235,0.35);
  font-weight:600;
}
.tab-active:hover{
  color:#fff;
  background:linear-gradient(135deg,#2563eb,#3b82f6);
}
.workbench {
  transition: opacity 0.2s ease;
}
.workbench.is-loading {
  opacity: 0.65;
  pointer-events: none;
}
.page-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:18px;
}
.page-title{
  margin:0;
  font-size:24px;
  font-weight:700;
  color:#0f172a;
  letter-spacing:-0.3px;
}
.page-subtitle{
  margin:6px 0 0;
  font-size:14px;
  color:#64748b;
}
.ghost-btn{
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:9px 18px;
  border:1px solid #dbe4f5;
  border-radius:10px;
  background:#fff;
  color:#2563eb;
  font-size:14px;
  font-weight:600;
  cursor:pointer;
  box-shadow:0 1px 3px rgba(15,23,42,0.05);
  transition: all 0.18s ease;
}
.ghost-btn:hover:not(:disabled){
  border-color:#2563eb;
  color:#1d4ed8;
  box-shadow:0 3px 10px rgba(37,99,235,0.18);
  transform:translateY(-1px);
}
.ghost-btn:active:not(:disabled){
  transform:translateY(0);
  box-shadow:0 1px 3px rgba(37,99,235,0.12);
}
.ghost-btn:disabled,
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 96px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e5ebf7;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.stat-card:hover {
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}
.stat-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.tone-total .stat-icon {
  background: linear-gradient(135deg,#e0f2fe,#bae6fd);
  color: #0369a1;
  box-shadow: inset 0 -2px 4px rgba(3,105,161,0.08);
}
.tone-unfinish .stat-icon {
  background: linear-gradient(135deg,#fef3c7,#fde68a);
  color: #b45309;
  box-shadow: inset 0 -2px 4px rgba(180,83,9,0.08);
}
.tone-finish .stat-icon {
  background: linear-gradient(135deg,#d1fae5,#a7f3d0);
  color: #047857;
  box-shadow: inset 0 -2px 4px rgba(4,120,87,0.08);
}
.tone-rate .stat-icon {
  background: linear-gradient(135deg,#e0e7ff,#c7d2fe);
  color: #4338ca;
  box-shadow: inset 0 -2px 4px rgba(67,56,202,0.08);
}
.stat-body {
  min-width: 0;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  letter-spacing:-0.5px;
}
.stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
  font-weight:500;
}
.add-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: linear-gradient(120deg,#f5f8ff,#edf3ff);
  border: 1px solid #dbe7f7;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}
.add-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg,#2563eb,#60a5fa);
  color: #fff;
  box-shadow: 0 2px 6px rgba(37,99,235,0.3);
}
.task-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #dbe4e3;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.task-input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
}
.task-input::placeholder {
  color: #94a3b8;
}
.task-date-picker {
  width: 160px;
}
.task-date-picker :deep(.el-input__wrapper){
  height:40px;
  border-radius:10px;
  box-shadow:0 0 0 1px #dbe4e3 inset;
}
.task-date-picker :deep(.el-input__wrapper.is-focus){
  box-shadow:0 0 0 1px #2563eb inset, 0 0 0 3px rgba(37,99,235,0.14);
}
.primary-btn{
  display:inline-flex;
  align-items:center;
  gap:7px;
  height:40px;
  padding:0 20px;
  border:none;
  border-radius:10px;
  background:linear-gradient(135deg,#2563eb,#3b82f6);
  color:#fff;
  font-size:14px;
  font-weight:600;
  cursor:pointer;
  box-shadow:0 3px 10px rgba(37,99,235,0.35);
  transition: all 0.18s ease;
}
.primary-btn:hover:not(:disabled){
  box-shadow:0 6px 16px rgba(37,99,235,0.42);
  transform:translateY(-1px);
  filter:brightness(1.05);
}
.primary-btn:active:not(:disabled){
  transform:translateY(0);
  box-shadow:0 2px 6px rgba(37,99,235,0.3);
}
.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.task-panel {
  min-width: 0;
  padding: 18px;
  background: #fff;
  border: 1px solid #e5ebf7;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 6px;
  border-bottom: 1px solid #edf0f3;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
.title-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.dot-pending {
  background: #f59e0b;
  box-shadow:0 0 0 3px rgba(245,158,11,0.18);
}
.dot-done {
  background: #10b981;
  box-shadow:0 0 0 3px rgba(16,185,129,0.18);
}
.count-badge {
  min-width: 22px;
  height: 20px;
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.count-pending {
  background: #fef3c7;
  color: #b45309;
}
.count-done {
  background: #d1fae5;
  color: #047857;
}
.task-list {
  min-height: 180px;
}
.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 8px 10px;
  margin: 0 -10px;
  border-bottom: 1px solid #f1f5f9;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.task-item:hover {
  background: #f0f5ff;
}
.check-wrap {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  cursor: pointer;
}
.check-box {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.check-mark {
  width: 21px;
  height: 21px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #cbd5e1;
  border-radius: 7px;
  background: #fff;
  color: transparent;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.check-box:checked + .check-mark {
  background: linear-gradient(135deg,#2563eb,#10b981);
  border-color: #2563eb;
  color: #fff;
  box-shadow:0 2px 6px rgba(37,99,235,0.35);
}
.task-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #334155;
  overflow-wrap: anywhere;
}
.finish-item .task-text {
  color: #94a3b8;
  text-decoration: line-through;
}
.task-date-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: inset 0 -1px 2px rgba(15,23,42,0.04);
}
.task-days {
  opacity: 0.8;
  font-weight: 500;
}
.badge-future {
  background: #e0f2fe;
  color: #0369a1;
}
.badge-today {
  background: #fef3c7;
  color: #b45309;
}
.badge-past {
  background: #fee2e2;
  color: #b91c1c;
}
.badge-none {
  background: #f1f5f9;
  color: #94a3b8;
}
.del-btn {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.del-btn:hover {
  background: #fef2f2;
  color: #dc2626;
  transform:scale(1.06);
}
.del-btn:active {
  background: #fee2e2;
  transform:scale(0.96);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 180px;
  color: #94a3b8;
  font-size: 13px;
}
.empty-icon{
  width:52px;
  height:52px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  background:linear-gradient(135deg,#eff6ff,#d1fae5);
  color:#3b82f6;
  margin-bottom:2px;
}

/* 倒数日弹窗（新设计：白色卡片 + 进度圆环） */
.countdown-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  padding: 0;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
}
.cd-card {
  position: relative;
  padding: 26px 24px 20px;
  text-align: center;
  background: #fff;
}
.cd-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #60a5fa, #2563eb);
}
.cd-head {
  padding-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
}
.cd-label {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: #ecfeff;
  color: #2563eb;
  font-size: 12px;
  letter-spacing: 2px;
  font-weight: 600;
}
.cd-title {
  display: block;
  margin-top: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  overflow-wrap: anywhere;
}
.cd-ring-wrap {
  position: relative;
  width: 168px;
  height: 168px;
  margin: 22px auto 6px;
}
.cd-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.cd-ring-track {
  fill: none;
  stroke: #eef2f7;
  stroke-width: 10;
}
.cd-ring-bar {
  fill: none;
  stroke: url(#ringGrad);
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}
.cd-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  padding-top: 46px;
}
.cd-num {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.cd-unit {
  font-size: 16px;
  font-weight: 600;
  color: #94a3b8;
}
.cd-status {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}
.cd-meta {
  display: flex;
  align-items: stretch;
  margin-top: 18px;
  padding: 14px 0 2px;
  border-top: 1px solid #f1f5f9;
}
.cd-meta-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cd-meta-label {
  font-size: 12px;
  color: #94a3b8;
}
.cd-meta-value {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.cd-meta-sep {
  width: 1px;
  margin: 2px 12px;
  background: #eef2f7;
}
.cd-close {
  width: 100%;
  height: 46px;
  border: none;
  background: #f8fafc;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.cd-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

@media (max-width: 960px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .stat-card {
    gap: 10px;
    padding: 14px;
  }
  .stat-icon {
    width: 38px;
    height: 38px;
  }
  .stat-value {
    font-size: 24px;
  }
  .add-panel {
    flex-wrap: wrap;
  }
  .task-input {
    flex: 1 1 100%;
  }
  .add-panel .primary-btn {
    width: 100%;
    justify-content:center;
  }
  .task-date-picker {
    flex: 1 1 100%;
    width: 100%;
  }
  .columns {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
  .stat-card {
    min-height: 76px;
  }
}
</style>