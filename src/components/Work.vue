<template>
  <!--标签导航路径固定 /work、/plan -->
<section class="workbench" :class="{ 'is-loading': loading }">
    <div class="page-head">
      <div>
        <h1 class="page-title">今日工作台</h1>
        <p class="page-subtitle">{{ todayText }} · 共 {{ totalCount }} 个目标</p>
      </div>
      <button class="ghost-btn" type="button" :disabled="loading" @click="loadAllData">
        <el-icon :size="15" :class="{ 'is-spinning': loading }"><Refresh /></el-icon>
        <span>{{ loading ? '刷新中…' : '刷新' }}</span>
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
        placeholder="输入今天要完成的工作目标"
        @keyup.enter="addTask"
        @keyup.esc="taskText = ''"
      />
      <button class="primary-btn" type="button" :disabled="submitting" @click="addTask">
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
          <li v-for="todo in unFinishList" :key="todo.id" class="task-item">
            <label class="check-wrap">
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
            <button class="del-btn" type="button" title="删除" @click="deleteTask(todo.id)">
              <el-icon :size="15"><Delete /></el-icon>
            </button>
          </li>
          <li v-if="unFinishList.length === 0" class="empty-state">
            <div class="empty-icon"><el-icon :size="24"><Checked /></el-icon></div>
            <span>暂无待办任务</span>
            <span class="empty-hint">点击上方输入框，添加今天的目标</span>
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
          <li v-for="todo in finishList" :key="todo.id" class="task-item finish-item">
            <label class="check-wrap">
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
            <button class="del-btn" type="button" title="删除" @click="deleteTask(todo.id)">
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
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {Refresh,EditPen,Plus,Check,Delete,Checked,CircleCheck,AlarmClock,Files,TrendCharts,DataBoard} from '@element-plus/icons-vue'
import {
  getTodoList,
  getWorkStat,
  addTask as reqAddTask,
  changeTaskStatus as reqChangeStatus,
  deleteTask as reqDeleteTask
} from '../api/workbench'

const statList = ref([])
const todoList = ref([])
const taskText = ref('')
const loading = ref(false)
const submitting = ref(false)

const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
const todayText = new Date().toLocaleDateString('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
})

const unFinishList = computed(() => todoList.value.filter(item => !item.finish))
const finishList = computed(() => todoList.value.filter(item => item.finish))
const totalCount = computed(() => todoList.value.length)

const statIcon = key => ({
  total: 'Files',
  unfinish: 'AlarmClock',
  finish: 'CircleCheck',
  rate: 'TrendCharts'
}[key] || 'DataBoard')

const formatStat = (key, value) => (key === 'rate' ? `${value}%` : value)

const loadAllData = async () => {
  loading.value = true
  const [statRes, todoRes] = await Promise.allSettled([getWorkStat(), getTodoList()])
  statList.value = statRes.status === 'fulfilled' && statRes.value?.data ? statRes.value.data : []
  todoList.value = todoRes.status === 'fulfilled' && todoRes.value?.data ? todoRes.value.data : []
  if (statRes.status === 'rejected') console.error('统计数据加载失败', statRes.reason)
  if (todoRes.status === 'rejected') console.error('任务列表加载失败', todoRes.reason)
  loading.value = false
}

const addTask = async () => {
  const text = taskText.value.trim()
  if (!text || submitting.value) return
  submitting.value = true
  try {
    await reqAddTask({
      taskTitle: text,
      finish: false,
      taskDate: today
    })
    taskText.value = ''
    await loadAllData()
  } catch (err) {
    console.error('新增任务失败', err)
  } finally {
    submitting.value = false
  }
}

const changeStatus = async row => {
  try {
    await reqChangeStatus({
      id: row.id,
      taskTitle: row.taskTitle,
      finish: row.finish,
      taskDate: today
    })
    await loadAllData()
  } catch (err) {
    console.error('状态修改失败', err)
  }
}

const deleteTask = async id => {
  try {
    await reqDeleteTask(id)
    await loadAllData()
  } catch (err) {
    console.error('删除任务失败', err)
  }
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
.is-spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
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
  transition: background 0.15s ease, transform 0.15s ease;
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
.check-box:focus-visible + .check-mark {
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.2);
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
.empty-hint {
  font-size: 12px;
  color: #cbd5e1;
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
