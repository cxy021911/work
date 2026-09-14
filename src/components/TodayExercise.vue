<template>
  <section class="workbench" :class="{ 'is-loading': loading }">
    <div class="page-head">
      <div>
        <h1 class="page-title">今日锻炼</h1>
        <p class="page-subtitle">{{ todayText }} · 今日 {{ planList.length }} 项 · 已完成 {{ doneCount }} 项</p>
      </div>
      <button class="ghost-btn" type="button" :disabled="loading" @click="loadAllData">
        <el-icon :size="15" :class="{ 'is-spinning': loading }"><Refresh /></el-icon>
        <span>{{ loading ? '刷新中…' : '刷新' }}</span>
      </button>
    </div>

    <!-- 今日锻炼计划 -->
    <div class="list-panel plan-panel">
      <div class="panel-head">
        <div class="panel-title">
          <span class="title-dot dot-today"></span>
          <span>今日锻炼计划</span>
          <span class="count-badge">{{ planList.length }}</span>
        </div>
        <span class="panel-hint">从下方动作库勾选，加入今天要练的项目</span>
      </div>

      <!-- 完成进度条 -->
      <div v-if="planList.length > 0" class="today-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <span class="progress-text">{{ doneCount }}/{{ planList.length }} · {{ progressPct }}%</span>
      </div>

      <ul class="task-list">
        <li v-for="item in planList" :key="item.id" class="task-item plan-item" :class="{ 'plan-done': item.finish === 1 }">
          <label class="check-wrap">
            <input :checked="item.finish === 1" type="checkbox" class="check-box" @change="toggleFinish(item)" />
            <span class="check-mark">
              <el-icon :size="12"><Check /></el-icon>
            </span>
          </label>
          <div class="item-main">
            <div class="item-title">
              <span class="action-name">{{ item.name }}</span>
              <span class="cat-tag" :class="item.category === 'strength' ? 'cat-strength' : 'cat-cardio'">
                {{ item.category === 'strength' ? '力量' : '有氧' }}
              </span>
            </div>
            <div class="item-meta">
              <span>建议 {{ item.durationMin }} 分钟</span>
              <span class="item-cal">约 {{ item.calories }} 千卡</span>
              <span class="sets-ctl">
                <button class="sets-btn" type="button" @click="changeSets(item, -1)">−</button>
                <span class="sets-num" :class="{ 'sets-1': (item.sets || 3) === 1 }">{{ item.sets || 3 }}组{{ item.reps ? '×' + item.reps + '次' : '' }}</span>
                <button class="sets-btn" type="button" @click="changeSets(item, 1)">＋</button>
              </span>
              <span v-if="item.finish === 1" class="done-tag">已完成</span>
            </div>
          </div>
          <button class="video-btn" type="button" title="动作指导" @click="openVideo(item)">
            <el-icon :size="15"><VideoPlay /></el-icon>
            <span>指导</span>
          </button>
          <button
            class="del-btn"
            type="button"
            title="移除"
            :disabled="deletingIds.has(item.id)"
            @click="removePlanItem(item.id)"
          >
            <el-icon :size="15"><Delete /></el-icon>
          </button>
        </li>
        <li v-if="planList.length === 0" class="empty-state">
          <div class="empty-icon"><el-icon :size="24"><AlarmClock /></el-icon></div>
          <span>今天还没安排锻炼</span>
          <span class="empty-hint">去「锻炼计划」一键生成，或在下方动作库勾选加入</span>
        </li>
      </ul>
    </div>

    <!-- 未完成顺延提醒 -->
    <div v-if="pendingList.length > 0" class="rollover-bar">
      <div class="rollover-icon"><el-icon :size="16"><AlarmClock /></el-icon></div>
      <div class="rollover-text">
        <span class="rollover-title">有 {{ pendingList.length }} 项训练未完成</span>
        <span class="rollover-sub">{{ pendingDatesText }}，一键顺延到今天继续练</span>
      </div>
      <button class="rollover-btn" type="button" :disabled="rolling" @click="doRollover">
        {{ rolling ? '顺延中…' : '顺延到今天' }}
      </button>
    </div>

    <!-- 器械动作库 -->
    <div class="list-panel">
      <div class="panel-head">
        <div class="panel-title">
          <span class="title-dot dot-lib"></span>
          <span>器械动作库</span>
          <span class="count-badge">{{ actionList.length }}</span>
        </div>
        <button v-if="selectedCount > 0" class="primary-btn primary-btn-sm" type="button" @click="saveTodayPlan">
          <el-icon :size="14"><Plus /></el-icon>
          <span>加入今日计划（{{ selectedCount }}）</span>
        </button>
        <span v-else class="panel-hint">勾选动作 → 加入今日计划</span>
      </div>

      <!-- 搜索框 + 分类筛选 -->
      <div class="lib-search-row">
        <div class="search-box">
          <el-icon :size="16" class="search-ico"><Search /></el-icon>
          <input
            v-model="keyword"
            class="search-input"
            type="text"
            placeholder="搜索动作，如：深蹲、卧推、有氧…"
          />
          <button v-if="keyword" class="search-clear" type="button" @click="keyword = ''">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
        <span class="lib-count">匹配 {{ filteredActions.length }} 个</span>
      </div>
      <div class="lib-toolbar">
        <div class="lib-filter">
          <button v-for="f in libFilters" :key="f.value" type="button"
                  class="filter-pill" :class="{ 'filter-active': libFilter === f.value }"
                  @click="libFilter = f.value">{{ f.label }}</button>
        </div>
      </div>

      <div class="action-grid">
        <div v-for="a in filteredActions" :key="a.id" class="action-card" :class="{ 'action-selected': selectedIds.has(a.id) }">
          <div class="action-head">
            <span class="action-cat" :class="a.category === 'strength' ? 'cat-strength' : 'cat-cardio'">
              {{ topicText(a.topic) }}
            </span>
            <label class="check-wrap check-wrap-sm" title="加入今日计划">
              <input :checked="selectedIds.has(a.id)" type="checkbox" class="check-box" @change="toggleSelect(a.id)" />
              <span class="check-mark check-mark-sm">
                <el-icon :size="12"><Check /></el-icon>
              </span>
            </label>
          </div>
          <div class="action-name-lg">{{ a.name }}</div>
          <div class="action-meta">
            <span class="level-tag" :class="`lvl-${a.level}`">{{ levelText(a.level) }}</span>
            <span><el-icon :size="13"><Timer /></el-icon> {{ a.durationMin }} 分钟</span>
            <span><el-icon :size="13"><Lightning /></el-icon> {{ a.calories }} 千卡</span>
            <span class="sets-tag">{{ a.defaultSets || 3 }}组{{ a.reps ? '×' + a.reps + '次' : '·' + a.durationMin + '分钟' }}</span>
          </div>
          <button v-if="a.videoUrl" class="video-btn video-btn-block" type="button" @click="openVideo(a)">
            <el-icon :size="15"><VideoPlay /></el-icon>
            <span>看视频指导</span>
          </button>
          <button v-else class="video-btn video-btn-block video-none" type="button" @click="openVideo(a)">
            <el-icon :size="15"><Document /></el-icon>
            <span>暂无视频 · 看文字要领</span>
          </button>
        </div>
        <div v-if="filteredActions.length === 0" class="empty-state lib-empty">
          <el-icon :size="26"><Search /></el-icon>
          <span>没有匹配的动作，换个关键词或分类试试</span>
        </div>
      </div>
    </div>

    <!-- 视频/要领弹窗 -->
    <el-dialog v-model="videoVisible" :title="currentAction ? currentAction.name + ' · 动作指导' : '动作指导'" width="680px" class="video-dialog" destroy-on-close>
      <div class="video-guide" v-if="currentAction">
        <div v-if="currentAction.videoUrl" class="video-box">
          <video :src="currentAction.videoUrl" controls autoplay playsinline class="guide-video"></video>
        </div>
        <div v-else class="video-box no-video-box">
          <div class="no-video-icon"><el-icon :size="28"><VideoCameraFilled /></el-icon></div>
          <div class="no-video-text">该动作暂无视频指导</div>
          <div class="no-video-sub">先按文字要领练习，视频后续补充</div>
        </div>
        <div class="tips-box">
          <div class="tips-title">
            <el-icon :size="16"><Document /></el-icon>
            <span>动作要领</span>
          </div>
          <ul class="tips-list">
            <li v-for="(tip, i) in tipsLines" :key="i">
              <span class="tip-num">{{ i + 1 }}</span>
              <span>{{ tip }}</span>
            </li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Plus, Delete, Timer, Lightning, AlarmClock,
  VideoPlay, Check, Document, VideoCameraFilled, Search, Close
} from '@element-plus/icons-vue'
import {
  getActionList, getPlanList, savePlan as reqSavePlan, finishPlan as reqFinishPlan,
  deletePlan as reqDeletePlan, updatePlanSets as reqUpdateSets,
  getPendingPlan, rolloverPlan
} from '../api/exercise'

const actionList = ref([])
const planList = ref([])
const loading = ref(false)
const deletingIds = ref(new Set())
const pendingList = ref([])
const rolling = ref(false)

const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
const todayText = computed(() => {
  const d = new Date()
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${today} ${week}`
})

const doneCount = computed(() => planList.value.filter(i => i.finish === 1).length)
const progressPct = computed(() => planList.value.length === 0 ? 0 : Math.round(doneCount.value / planList.value.length * 100))

const topicText = t => ({
  cardio: '心肺', chest: '胸', back: '背', legs: '腿',
  shoulders: '肩', arms: '手臂', core: '核心', stretch: '拉伸'
}[t] || t || '综合')
const topicNameMap = {
  cardio: ['心肺', '有氧'], chest: ['胸'], back: ['背'], legs: ['腿', '下肢'],
  shoulders: ['肩'], arms: ['手臂', '臂'], core: ['核心'], stretch: ['拉伸', '放松']
}
const levelText = l => ({ low: '低强度', medium: '中强度', high: '高强度' }[l] || '中')

// ===== 动作库搜索 + 分类筛选 =====
const keyword = ref('')
const libFilter = ref('all')
const libFilters = [
  { value: 'all', label: '全部' },
  { value: 'cardio', label: '有氧' },
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背' },
  { value: 'legs', label: '腿' },
  { value: 'shoulders', label: '肩' },
  { value: 'arms', label: '手臂' },
  { value: 'core', label: '核心' },
  { value: 'stretch', label: '拉伸' }
]
const filteredActions = computed(() => {
  let list = actionList.value
  if (libFilter.value !== 'all') list = list.filter(a => a.topic === libFilter.value)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(a => {
      const names = topicNameMap[a.topic] || []
      const hay = [a.name, topicText(a.topic), levelText(a.level), ...names].join(' ').toLowerCase()
      return hay.includes(kw)
    })
  }
  return list
})

// ===== 动作库多选 =====
const selectedIds = ref(new Set())
const selectedCount = computed(() => selectedIds.value.size)
const toggleSelect = id => {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
}

// ===== 视频/要领弹窗 =====
const videoVisible = ref(false)
const currentAction = ref(null)
const tipsLines = computed(() => {
  if (!currentAction.value || !currentAction.value.tips) return []
  return currentAction.value.tips.split('\n').filter(t => t.trim())
})
const openVideo = item => {
  if (!item.videoUrl) ElMessage.info('该动作暂无视频指导，可先查看文字要领')
  currentAction.value = item
  videoVisible.value = true
}

// ===== 数据加载 =====
const loadAllData = async () => {
  loading.value = true
  const [actionRes, planRes, pendingRes] = await Promise.allSettled([
    getActionList(),
    getPlanList({ date: today }),
    getPendingPlan()
  ])
  if (actionRes.status === 'fulfilled' && actionRes.value?.data) actionList.value = actionRes.value.data
  if (planRes.status === 'fulfilled' && planRes.value?.data) planList.value = planRes.value.data
  if (pendingRes.status === 'fulfilled' && pendingRes.value?.data) {
    pendingList.value = pendingRes.value.data.filter(p => p.planDate < today)
  }
  if (actionRes.status === 'rejected') console.error('动作库加载失败', actionRes.reason)
  if (planRes.status === 'rejected') console.error('今日计划加载失败', planRes.reason)
  if (pendingRes.status === 'rejected') console.error('未完成计划加载失败', pendingRes.reason)
  loading.value = false
}

const saveTodayPlan = async () => {
  if (selectedIds.value.size === 0) return
  try {
    // savePlan 为覆盖当日：合并已有动作与新勾选动作
    const merged = new Set(planList.value.map(i => i.actionId))
    selectedIds.value.forEach(id => merged.add(id))
    await reqSavePlan({ date: today, actionIds: [...merged] })
    selectedIds.value = new Set()
    await loadAllData()
    ElMessage.success('已加入今日计划')
  } catch (err) {
    console.error('保存今日计划失败', err)
  }
}

const toggleFinish = async item => {
  try {
    await reqFinishPlan({ id: item.id, finish: item.finish === 1 ? 0 : 1 })
    await loadAllData()
    checkAllDone()
  } catch (err) {
    console.error('更新计划状态失败', err)
  }
}

const removePlanItem = async id => {
  if (deletingIds.value.has(id)) return
  deletingIds.value.add(id)
  try {
    await reqDeletePlan(id)
    await loadAllData()
  } catch (err) {
    console.error('移除计划项失败', err)
  } finally {
    deletingIds.value.delete(id)
  }
}

const changeSets = async (item, delta) => {
  const next = (item.sets || 3) + delta
  if (next < 1 || next > 20) return
  item.sets = next
  try {
    await reqUpdateSets({ id: item.id, sets: next })
  } catch (err) {
    item.sets -= delta
    console.error('更新组数失败', err)
  }
}

const pendingDatesText = computed(() => {
  const dates = [...new Set(pendingList.value.map(p => p.planDate))].sort()
  return dates.map(d => d.slice(5).replace('-', '月') + '日').join('、')
})

const doRollover = async () => {
  if (rolling.value || pendingList.value.length === 0) return
  rolling.value = true
  try {
    const dates = [...new Set(pendingList.value.map(p => p.planDate))]
    let total = 0
    for (const d of dates) {
      const res = await rolloverPlan({ fromDate: d, toDate: today })
      total += res?.data || 0
    }
    await loadAllData()
    if (total > 0) ElMessage.success(`已顺延 ${total} 项训练到今天`)
    else ElMessage.info('今天的计划里已有这些训练，无需重复顺延')
  } catch (err) {
    console.error('顺延失败', err)
  } finally {
    rolling.value = false
  }
}

const checkAllDone = () => {
  if (planList.value.length > 0 && planList.value.every(i => i.finish === 1)) {
    ElMessageBox.alert('今日训练计划已全部完成，继续保持！', '训练完成', { confirmButtonText: '太棒了', type: 'success' })
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
.primary-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 16px;
  border: none; border-radius: 9px; background: linear-gradient(135deg,#2563eb,#3b82f6);
  color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
  box-shadow: 0 2px 8px rgba(37,99,235,0.3); transition: all 0.15s ease;
}
.primary-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
.primary-btn-sm { height: 30px; padding: 0 12px; font-size: 12px; }

.list-panel { min-width: 0; padding: 18px; margin-bottom: 16px; background: #fff; border: 1px solid #e5ebf7; border-radius: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.05); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 12px; margin-bottom: 6px; border-bottom: 1px solid #edf0f3; flex-wrap: wrap; }
.panel-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #0f172a; }
.panel-hint { font-size: 12px; color: #94a3b8; }
.title-dot { width: 9px; height: 9px; border-radius: 50%; }
.dot-today { background: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
.dot-lib { background: linear-gradient(135deg,#7c3aed,#a78bfa); box-shadow: 0 0 0 3px rgba(124,58,237,0.16); }
.count-badge { min-width: 22px; height: 20px; padding: 0 7px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-size: 12px; font-weight: 600; background: #eef4ff; color: #2563eb; }

.today-progress { display: flex; align-items: center; gap: 12px; padding: 12px 2px 4px; }
.progress-track { flex: 1; height: 8px; border-radius: 999px; background: #e8eefb; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#2563eb,#60a5fa); transition: width 0.35s ease; }
.progress-text { font-size: 12px; font-weight: 700; color: #2563eb; font-variant-numeric: tabular-nums; white-space: nowrap; }

.task-list { min-height: 60px; }
.task-item { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 10px; margin: 0 -10px; border-bottom: 1px solid #f1f5f9; border-radius: 10px; transition: background 0.15s ease; }
.task-item:hover { background: #f0f5ff; }
.plan-panel { background: linear-gradient(160deg,#ffffff,#f3f7ff); border-color: #d5e3fb; }
.plan-done { opacity: 0.75; }
.item-main { flex: 1; min-width: 0; }
.item-title { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #334155; }
.item-meta { display: flex; align-items: center; gap: 10px; margin-top: 3px; font-size: 12px; color: #94a3b8; flex-wrap: wrap; }
.item-cal { font-size: 13px; color: #94a3b8; font-variant-numeric: tabular-nums; }
.action-name { font-weight: 600; color: #0f172a; }
.done-tag { height: 18px; padding: 0 8px; display: inline-flex; align-items: center; border-radius: 999px; font-size: 11px; font-weight: 600; background: #d1fae5; color: #047857; }
.del-btn { width: 30px; height: 30px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 8px; background: transparent; color: #94a3b8; transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease; }
.del-btn:hover:not(:disabled) { background: #fef2f2; color: #dc2626; transform: scale(1.06); }

.check-wrap { position: relative; display: inline-flex; flex: 0 0 auto; cursor: pointer; }
.check-wrap-sm { transform: scale(0.9); }
.check-box { position: absolute; opacity: 0; pointer-events: none; }
.check-mark {
  width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;
  border: 1.5px solid #cbd5e1; border-radius: 6px; background: #fff; color: transparent;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.check-mark-sm { width: 22px; height: 22px; border-radius: 7px; }
.check-box:checked + .check-mark { background: #2563eb; border-color: #2563eb; color: #fff; }

.video-btn {
  flex: 0 0 auto; height: 30px; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid #c7d7f5; border-radius: 8px; background: #f0f5ff; color: #2563eb;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease;
}
.video-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; box-shadow: 0 3px 8px rgba(37,99,235,0.3); }
.video-btn-block { width: 100%; height: 34px; justify-content: center; margin-top: 4px; }
.video-none { border-style: dashed; color: #64748b; background: #f8fafc; border-color: #dbe2ea; }
.video-none:hover { background: #64748b; border-color: #64748b; color: #fff; }

/* 搜索框 */
.lib-search-row { display: flex; align-items: center; gap: 12px; padding-top: 14px; }
.search-box {
  position: relative; flex: 1; max-width: 360px; display: flex; align-items: center;
}
.search-ico { position: absolute; left: 12px; color: #94a3b8; pointer-events: none; }
.search-input {
  width: 100%; height: 38px; padding: 0 36px 0 36px;
  border: 1px solid #dbe4f5; border-radius: 10px; background: #f8fafc;
  color: #0f172a; font-size: 14px; outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.search-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
.search-input::placeholder { color: #94a3b8; }
.search-clear {
  position: absolute; right: 8px; width: 22px; height: 22px; display: inline-flex;
  align-items: center; justify-content: center; border: none; border-radius: 50%;
  background: #e2e8f0; color: #64748b; cursor: pointer;
}
.search-clear:hover { background: #cbd5e1; color: #334155; }
.lib-count { font-size: 12px; color: #94a3b8; white-space: nowrap; }

.lib-toolbar { display: flex; align-items: center; gap: 10px; padding-top: 10px; flex-wrap: wrap; }
.lib-filter { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-pill {
  height: 28px; padding: 0 12px; border: 1px solid #e3ecfa; border-radius: 999px;
  background: #fff; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.15s ease;
}
.filter-pill:hover { border-color: #2563eb; color: #2563eb; }
.filter-active { background: #2563eb; border-color: #2563eb; color: #fff; }
.action-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; padding-top: 12px; }
.action-card {
  padding: 14px; background: linear-gradient(160deg,#fbfdff,#f1f6ff);
  border: 1px solid #e3ecfa; border-radius: 14px; transition: all 0.18s ease;
}
.action-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.12); }
.action-selected { border-color: #2563eb; background: linear-gradient(160deg,#f0f6ff,#e4edff); box-shadow: 0 4px 14px rgba(37,99,235,0.16); }
.action-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.action-cat { height: 20px; padding: 0 8px; display: inline-flex; align-items: center; border-radius: 999px; font-size: 11px; font-weight: 600; }
.cat-cardio { background: #e0f2fe; color: #0369a1; }
.cat-strength { background: #ede9fe; color: #6d28d9; }
.cat-tag { height: 18px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; font-size: 11px; font-weight: 600; }
.action-name-lg { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
.action-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #64748b; margin-bottom: 10px; flex-wrap: wrap; }
.action-meta span { display: inline-flex; align-items: center; gap: 4px; }
.level-tag { height: 18px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; font-size: 11px; font-weight: 600; }
.lvl-low { background: #f1f5f9; color: #64748b; }
.lvl-medium { background: #eef4ff; color: #2563eb; }
.lvl-high { background: #fee2e2; color: #dc2626; }
.lib-empty { grid-column: 1 / -1; }
.sets-tag { height: 18px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; font-size: 11px; font-weight: 600; background: #eef4ff; color: #2563eb; }
.sets-ctl { display: inline-flex; align-items: center; gap: 3px; }
.sets-btn {
  width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid #c7d7f5; border-radius: 5px; background: #fff; color: #2563eb;
  font-size: 12px; font-weight: 700; line-height: 1; cursor: pointer; transition: all 0.13s ease; padding: 0;
}
.sets-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.sets-num { min-width: 28px; text-align: center; font-size: 12px; font-weight: 700; color: #334155; font-variant-numeric: tabular-nums; }
.sets-num.sets-1 { color: #94a3b8; }

.rollover-bar {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin-bottom: 12px;
  background: linear-gradient(120deg,#fffbeb,#fef3c7); border: 1px solid #fde68a; border-radius: 14px;
}
.rollover-icon { width: 32px; height: 32px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: #fef3c7; color: #b45309; }
.rollover-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.rollover-title { font-size: 14px; font-weight: 700; color: #92400e; }
.rollover-sub { font-size: 12px; color: #a16207; }
.rollover-btn {
  flex: 0 0 auto; height: 32px; padding: 0 16px; border: none; border-radius: 9px;
  background: linear-gradient(135deg,#f59e0b,#fbbf24); color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; box-shadow: 0 2px 8px rgba(245,158,11,0.35); transition: all 0.15s ease;
}
.rollover-btn:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
.rollover-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.video-dialog :deep(.el-dialog) { border-radius: 16px; overflow: hidden; }
.video-dialog :deep(.el-dialog__header) { padding: 18px 22px 10px; margin-right: 0; font-weight: 700; }
.video-guide { display: flex; gap: 18px; padding: 4px 2px 6px; }
.video-box { flex: 1 1 58%; min-width: 0; }
.guide-video { width: 100%; border-radius: 12px; background: #0f172a; display: block; aspect-ratio: 16/9; object-fit: cover; }
.no-video-box {
  aspect-ratio: 16/9; border-radius: 12px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(160deg,#f1f5f9,#e2e8f0); color: #64748b;
}
.no-video-icon { color: #94a3b8; }
.no-video-text { font-size: 15px; font-weight: 600; color: #475569; }
.no-video-sub { font-size: 12px; color: #94a3b8; }
.tips-box { flex: 1 1 42%; min-width: 0; padding: 14px; background: #f6f9ff; border: 1px solid #e3ecfa; border-radius: 12px; }
.tips-title { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
.tips-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.tips-list li { display: flex; gap: 8px; font-size: 13px; line-height: 1.55; color: #334155; }
.tip-num {
  flex: 0 0 auto; width: 18px; height: 18px; margin-top: 1px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #2563eb; color: #fff; font-size: 11px; font-weight: 700;
}
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 100px; color: #94a3b8; font-size: 13px; }
.empty-icon { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(135deg,#eff6ff,#d1fae5); color: #3b82f6; margin-bottom: 2px; }
.empty-hint { font-size: 12px; color: #cbd5e1; }

@media (max-width: 720px) {
  .video-guide { flex-direction: column; }
  .action-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .search-box { max-width: none; }
  .lib-search-row { flex-wrap: wrap; }
}
</style>
