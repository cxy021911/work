<template>
  <section class="workbench" :class="{ 'is-loading': loading }">
    <div class="page-head">
      <div>
        <h1 class="page-title">锻炼计划</h1>
        <p class="page-subtitle">选择类型与周期，一键生成确定性训练计划 · 今日训练请到「今日锻炼」</p>
      </div>
      <button class="ghost-btn" type="button" :disabled="loading" @click="loadBase">
        <el-icon :size="15" :class="{ 'is-spinning': loading }"><Refresh /></el-icon>
        <span>{{ loading ? '刷新中…' : '刷新' }}</span>
      </button>
    </div>

    <!-- 训练计划生成器 -->
    <div class="list-panel plan-gen-panel">
      <div class="panel-head">
        <div class="panel-title">
          <span class="title-dot dot-gen"></span>
          <span>训练计划生成器</span>
        </div>
        <span class="panel-hint">选类型和周期，一键生成确定性训练计划</span>
      </div>
      <div class="gen-body">
        <div class="gen-row">
          <span class="gen-label">计划类型</span>
          <div class="type-pills">
            <button v-for="t in planTypes" :key="t.value" type="button"
                    class="type-pill" :class="{ 'pill-active': genType === t.value }"
                    @click="genType = t.value">
              {{ t.label }}
            </button>
          </div>
        </div>
        <div class="gen-row">
          <span class="gen-label">周期设置</span>
          <div class="gen-opts">
            <button v-for="d in [7, 21]" :key="d" type="button"
                    class="day-pill" :class="{ 'pill-active': genDays === d }"
                    @click="switchDays(d)">{{ d }}天</button>
            <input v-model="genStartDate" class="form-input form-date" type="date" @change="loadCycle" />
            <select v-if="genType === 'single'" v-model="genFocus" class="form-select gen-focus">
              <option value="cardio">心肺</option>
              <option value="legs">下肢</option>
              <option value="chest">胸</option>
              <option value="back">背</option>
              <option value="shoulders">肩</option>
              <option value="arms">手臂</option>
              <option value="core">核心</option>
            </select>
          </div>
        </div>
        <div class="gen-actions">
          <button class="primary-btn" type="button" :disabled="generating" @click="generatePlan">
            <el-icon :size="15"><MagicStick /></el-icon>
            <span>{{ generating ? '生成中…' : (genType === 'custom' ? '开始自定义编辑' : '生成' + genDays + '天计划') }}</span>
          </button>
          <button v-if="customMode" class="ghost-btn" type="button" @click="exitCustom">
            <span>退出自定义</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 周期计划视图 -->
    <div v-if="planDays.length > 0" class="list-panel cycle-panel">
      <div class="panel-head">
        <div class="panel-title">
          <span class="title-dot dot-cycle"></span>
          <span>{{ cycleTitle }}</span>
          <span class="count-badge">{{ planDays.length }} 天</span>
        </div>
        <div class="cycle-legend">
          <span class="legend-item"><i class="lg-dot lg-done"></i>已完成</span>
          <span class="legend-item"><i class="lg-dot lg-rest"></i>休息日</span>
        </div>
      </div>
      <div class="cycle-grid">
        <div v-for="day in planDays" :key="day.date" class="cycle-card" :class="{ 'cycle-rest': day.isRest }">
          <div class="cycle-head">
            <div class="cycle-date">
              <span class="cycle-week">{{ day.week }}</span>
              <span class="cycle-day">{{ day.date.slice(5) }}</span>
            </div>
            <span class="cycle-title" :class="{ 'rest-title': day.isRest }">{{ day.title }}</span>
          </div>
          <div class="cycle-body">
            <template v-if="day.isRest">
              <div class="rest-tip">
                <el-icon :size="16"><Coffee /></el-icon>
                <span>休息日 · 充分恢复</span>
              </div>
            </template>
            <template v-else>
              <div v-for="item in day.items" :key="item.id" class="cycle-action"
                   :class="{ 'act-done': item.finish === 1 }">
                <label class="check-wrap check-wrap-xs">
                  <input :checked="item.finish === 1" type="checkbox" class="check-box" @change="toggleFinish(item)" />
                  <span class="check-mark check-mark-xs">
                    <el-icon :size="10"><Check /></el-icon>
                  </span>
                </label>
                <span class="cyc-name">{{ item.name }}</span>
                <span class="sets-ctl sets-ctl-xs">
                  <button class="sets-btn sets-btn-xs" type="button" @click="changeSets(item, -1)">−</button>
                  <span class="sets-num sets-num-xs" :class="{ 'sets-1': (item.sets || 3) === 1 }">{{ item.sets || 3 }}组{{ item.reps ? '×' + item.reps + '次' : '' }}</span>
                  <button class="sets-btn sets-btn-xs" type="button" @click="changeSets(item, 1)">＋</button>
                </span>
                <span class="cyc-cal">{{ item.calories }}kcal</span>
                <button class="cyc-video" type="button" title="动作指导" @click="openVideo(item)">
                  <el-icon :size="13"><VideoPlay /></el-icon>
                </button>
              </div>
              <div v-if="day.items.length === 0" class="cyc-empty">未安排</div>
            </template>
          </div>
          <button v-if="customMode" class="cyc-edit" type="button" @click="openDayEdit(day)">
            <el-icon :size="13"><EditPen /></el-icon>
            <span>编辑当天</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 空提示 -->
    <div v-else class="list-panel empty-panel">
      <div class="empty-state">
        <el-icon :size="28"><MagicStick /></el-icon>
        <span>选择上方类型和周期，生成你的训练计划</span>
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

    <!-- 自定义编辑当天弹窗 -->
    <el-dialog v-model="editVisible" :title="'编辑 · ' + (editingDay ? editingDay.date + ' ' + editingDay.week : '')" width="420px" class="video-dialog" destroy-on-close>
      <div class="day-edit" v-if="editingDay">
        <div class="edit-hint">勾选动作作为该天的训练安排，保存后覆盖当天</div>
        <div class="edit-list">
          <label v-for="a in actionList" :key="a.id" class="edit-item"
                 :class="{ 'edit-checked': daySelectedIds.has(a.id) }">
            <input type="checkbox" class="edit-check" :checked="daySelectedIds.has(a.id)" @change="toggleDaySelect(a.id)" />
            <span class="edit-name">{{ a.name }}</span>
            <span class="edit-cat" :class="a.category === 'strength' ? 'cat-strength' : 'cat-cardio'">{{ topicText(a.topic) }}</span>
            <span class="edit-sets">{{ a.defaultSets || 3 }}组{{ a.reps ? '×' + a.reps + '次' : '' }}</span>
          </label>
        </div>
      </div>
      <template #footer>
        <button class="ghost-btn" type="button" @click="editVisible = false">取消</button>
        <button class="primary-btn" type="button" @click="saveDayEdit">
          <el-icon :size="14"><Check /></el-icon>
          <span>保存当天</span>
        </button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, EditPen, VideoPlay, Check, Document, MagicStick, Coffee, VideoCameraFilled
} from '@element-plus/icons-vue'
import {
  getActionList, getPlanList, savePlan as reqSavePlan,
  finishPlan as reqFinishPlan, generatePlan as reqGeneratePlan, updatePlanSets as reqUpdateSets
} from '../api/exercise'

const actionList = ref([])
const loading = ref(false)

const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()

// ===== 训练计划生成器 =====
const planTypes = [
  { value: 'low', label: '低强度' },
  { value: 'medium', label: '中强度' },
  { value: 'high', label: '高强度' },
  { value: 'single', label: '单项训练' },
  { value: 'strength', label: '力量分化' },
  { value: 'custom', label: '自定义' }
]
const genType = ref('medium')
const genDays = ref(7)
const genStartDate = ref(today)
const genFocus = ref('cardio')
const generating = ref(false)
const planDays = ref([])
const customMode = ref(false)

const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const cycleTitle = computed(() => {
  if (planDays.value.length === 0) return ''
  const start = planDays.value[0].date
  const end = planDays.value[planDays.value.length - 1].date
  const t = planTypes.find(x => x.value === genType.value)
  return `${t ? t.label : ''}训练计划 · ${start} ~ ${end}`
})

const topicText = t => ({
  cardio: '心肺', chest: '胸', back: '背', legs: '腿',
  shoulders: '肩', arms: '手臂', core: '核心', stretch: '拉伸'
}[t] || t || '综合')

const switchDays = d => {
  genDays.value = d
  loadCycle()
}

// ===== 生成计划 =====
const generatePlan = async () => {
  if (genType.value === 'custom') {
    customMode.value = true
    await buildEmptyDays()
    return
  }
  if (generating.value) return
  generating.value = true
  try {
    await reqGeneratePlan({
      type: genType.value,
      days: genDays.value,
      startDate: genStartDate.value,
      focus: genType.value === 'single' ? genFocus.value : undefined
    })
    customMode.value = false
    await loadCycle()
    ElMessage.success('训练计划已生成')
  } catch (err) {
    console.error('生成计划失败', err)
  } finally {
    generating.value = false
  }
}

// 按周期逐天拉取计划
const loadCycle = async () => {
  const days = []
  const start = new Date(genStartDate.value + 'T00:00:00')
  for (let i = 0; i < genDays.value; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const res = await getPlanList({ date: ds }).catch(() => null)
    const items = res?.data || []
    days.push({
      date: ds,
      week: weekNames[d.getDay()],
      title: '',
      items,
      isRest: items.length === 0
    })
  }
  planDays.value = days
}

const buildEmptyDays = async () => {
  const days = []
  const start = new Date(genStartDate.value + 'T00:00:00')
  for (let i = 0; i < genDays.value; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const res = await getPlanList({ date: ds }).catch(() => null)
    days.push({ date: ds, week: weekNames[d.getDay()], title: '自定义', items: res?.data || [], isRest: false })
  }
  planDays.value = days
}

const exitCustom = () => {
  customMode.value = false
  planDays.value = []
}

// ===== 自定义编辑某天 =====
const editVisible = ref(false)
const editingDay = ref(null)
const daySelectedIds = ref(new Set())
const openDayEdit = day => {
  editingDay.value = day
  daySelectedIds.value = new Set(day.items.map(i => i.actionId))
  editVisible.value = true
}
const toggleDaySelect = id => {
  const s = new Set(daySelectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  daySelectedIds.value = s
}
const saveDayEdit = async () => {
  if (!editingDay.value) return
  try {
    await reqSavePlan({ date: editingDay.value.date, actionIds: [...daySelectedIds.value] })
    editVisible.value = false
    await loadCycle()
    ElMessage.success('当天计划已保存')
  } catch (err) {
    console.error('保存当天计划失败', err)
  }
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

// 周期内勾选完成 / 组数
const toggleFinish = async item => {
  try {
    await reqFinishPlan({ id: item.id, finish: item.finish === 1 ? 0 : 1 })
    await loadCycle()
  } catch (err) {
    console.error('更新计划状态失败', err)
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

// 初始：动作库（自定义编辑用）+ 当前周期
const loadBase = async () => {
  loading.value = true
  const [actionRes] = await Promise.allSettled([getActionList(), loadCycle()])
  if (actionRes.status === 'fulfilled' && actionRes.value?.data) actionList.value = actionRes.value.data
  loading.value = false
}

onMounted(() => loadBase())
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
  display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 18px;
  border: none; border-radius: 10px; background: linear-gradient(135deg,#2563eb,#3b82f6);
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 2px 8px rgba(37,99,235,0.3); transition: all 0.15s ease;
}
.primary-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }

.list-panel { min-width: 0; padding: 18px; margin-bottom: 16px; background: #fff; border: 1px solid #e5ebf7; border-radius: 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.05); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 12px; margin-bottom: 6px; border-bottom: 1px solid #edf0f3; flex-wrap: wrap; }
.panel-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #0f172a; }
.panel-hint { font-size: 12px; color: #94a3b8; }
.title-dot { width: 9px; height: 9px; border-radius: 50%; }
.dot-gen { background: linear-gradient(135deg,#0ea5e9,#22d3ee); box-shadow: 0 0 0 3px rgba(14,165,233,0.16); }
.dot-cycle { background: linear-gradient(135deg,#f59e0b,#fbbf24); box-shadow: 0 0 0 3px rgba(245,158,11,0.16); }
.count-badge { min-width: 22px; height: 20px; padding: 0 7px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-size: 12px; font-weight: 600; background: #eef4ff; color: #2563eb; }

.plan-gen-panel { background: linear-gradient(160deg,#ffffff,#effaff); border-color: #c9e6f7; }
.gen-body { display: flex; flex-direction: column; gap: 12px; padding-top: 12px; }
.gen-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.gen-label { flex: 0 0 64px; font-size: 13px; font-weight: 600; color: #475569; }
.type-pills, .gen-opts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.type-pill, .day-pill {
  height: 32px; padding: 0 14px; border: 1px solid #dbe4f5; border-radius: 999px;
  background: #fff; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.15s ease;
}
.type-pill:hover, .day-pill:hover { border-color: #2563eb; color: #2563eb; }
.pill-active { background: linear-gradient(135deg,#2563eb,#3b82f6); border-color: #2563eb; color: #fff; box-shadow: 0 3px 8px rgba(37,99,235,0.3); }
.gen-focus { flex: 0 1 100px; }
.gen-actions { display: flex; gap: 10px; align-items: center; }
.form-input, .form-select {
  height: 38px; padding: 0 12px; border: 1px solid #dbe4e3; border-radius: 10px;
  background: #fff; color: #0f172a; font-size: 14px; outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.form-input:focus, .form-select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.14); }
.form-date { flex: 0 1 140px; }

.cycle-panel { background: linear-gradient(160deg,#ffffff,#fffbef); border-color: #f3e2b8; }
.cycle-legend { display: flex; gap: 14px; font-size: 12px; color: #94a3b8; }
.legend-item { display: inline-flex; align-items: center; gap: 5px; }
.lg-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.lg-done { background: #10b981; }
.lg-rest { background: #94a3b8; }
.cycle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; padding-top: 12px; }
.cycle-card {
  padding: 12px; background: #fff; border: 1px solid #eef0f4; border-radius: 12px;
  transition: all 0.16s ease; position: relative;
}
.cycle-card:hover { box-shadow: 0 6px 16px rgba(15,23,42,0.08); transform: translateY(-2px); }
.cycle-rest { background: linear-gradient(160deg,#fafafa,#f4f4f5); opacity: 0.9; }
.cycle-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.cycle-date { display: flex; flex-direction: column; }
.cycle-week { font-size: 12px; font-weight: 700; color: #2563eb; }
.cycle-day { font-size: 11px; color: #94a3b8; }
.cycle-title { font-size: 12px; font-weight: 600; color: #475569; padding: 3px 8px; background: #f0f5ff; border-radius: 999px; }
.rest-title { background: #f1f5f9; color: #94a3b8; }
.cycle-body { display: flex; flex-direction: column; gap: 6px; min-height: 76px; }
.cycle-action { display: flex; align-items: center; flex-wrap: wrap; row-gap: 3px; column-gap: 7px; padding: 5px 7px; background: #f8fafc; border-radius: 8px; font-size: 13px; }
.act-done { opacity: 0.6; }
.act-done .cyc-name { text-decoration: line-through; color: #94a3b8; }
.cyc-name { flex: 1 1 100%; min-width: 0; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cyc-cal { font-size: 11px; color: #94a3b8; font-variant-numeric: tabular-nums; }
.cyc-video { width: 22px; height: 22px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: #e0f2fe; color: #0369a1; cursor: pointer; transition: all 0.15s ease; }
.cyc-video:hover { background: #2563eb; color: #fff; }
.rest-tip { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
.cyc-empty { font-size: 12px; color: #cbd5e1; }
.cyc-edit { width: 100%; height: 28px; margin-top: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 1px dashed #c7d7f5; border-radius: 8px; background: transparent; color: #2563eb; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
.cyc-edit:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

.check-wrap { position: relative; display: inline-flex; flex: 0 0 auto; cursor: pointer; }
.check-wrap-xs { transform: scale(0.82); }
.check-box { position: absolute; opacity: 0; pointer-events: none; }
.check-mark {
  width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;
  border: 1.5px solid #cbd5e1; border-radius: 6px; background: #fff; color: transparent;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.check-mark-xs { width: 16px; height: 16px; border-radius: 5px; }
.check-box:checked + .check-mark { background: #2563eb; border-color: #2563eb; color: #fff; }

.sets-ctl { display: inline-flex; align-items: center; gap: 3px; }
.sets-btn {
  width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid #c7d7f5; border-radius: 5px; background: #fff; color: #2563eb;
  font-size: 12px; font-weight: 700; line-height: 1; cursor: pointer; transition: all 0.13s ease; padding: 0;
}
.sets-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.sets-num { min-width: 28px; text-align: center; font-size: 12px; font-weight: 700; color: #334155; font-variant-numeric: tabular-nums; }
.sets-num.sets-1 { color: #94a3b8; }
.sets-ctl-xs { transform: scale(0.9); transform-origin: left center; }
.sets-btn-xs { width: 16px; height: 16px; font-size: 11px; }
.sets-num-xs { min-width: 24px; font-size: 11px; }

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
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 120px; color: #94a3b8; font-size: 13px; }
.empty-panel { background: linear-gradient(160deg,#ffffff,#f8fbff); }

.edit-hint { font-size: 12px; color: #94a3b8; margin-bottom: 12px; }
.edit-list { display: flex; flex-direction: column; gap: 8px; max-height: 380px; overflow-y: auto; }
.edit-item {
  display: flex; align-items: center; gap: 10px; padding: 9px 12px;
  border: 1px solid #e5ebf7; border-radius: 10px; cursor: pointer;
  transition: all 0.15s ease; font-size: 14px; color: #334155;
}
.edit-item:hover { background: #f0f5ff; }
.edit-checked { border-color: #2563eb; background: #eef4ff; }
.edit-check { width: 16px; height: 16px; accent-color: #2563eb; }
.edit-name { flex: 1; min-width: 0; font-weight: 600; }
.edit-cat { height: 18px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; font-size: 11px; font-weight: 600; }
.cat-cardio { background: #e0f2fe; color: #0369a1; }
.cat-strength { background: #ede9fe; color: #6d28d9; }
.edit-sets { flex: 0 0 auto; height: 18px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; font-size: 11px; font-weight: 600; background: #eef4ff; color: #2563eb; }

@media (max-width: 720px) {
  .gen-label { flex: 0 0 100%; }
  .video-guide { flex-direction: column; }
}
</style>
