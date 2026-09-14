<template>
<section class="test-page">
    <div class="page-head">
      <div>
        <h1 class="page-title">接口连通性测试</h1>
        <p class="page-subtitle">验证前端与 Spring Boot 后端的联调状态</p>
      </div>
      <button class="ghost-btn" type="button" @click="loadData">
        <el-icon :size="15"><Refresh /></el-icon>
        <span>重新测试</span>
      </button>
    </div>

    <div class="test-card" :class="cardState">
      <div class="status-banner">
        <span class="status-icon">
          <el-icon v-if="loading" :size="20" class="spin"><Loading /></el-icon>
          <el-icon v-else-if="isOk" :size="20"><CircleCheck /></el-icon>
          <el-icon v-else :size="20"><WarningFilled /></el-icon>
        </span>
        <div class="status-copy">
          <div class="status-title">{{ statusText }}</div>
          <div class="status-desc">{{ statusDesc }}</div>
        </div>
      </div>

      <div v-if="resData && isOk" class="fields">
        <div class="field-row">
          <span class="field-label">服务状态</span>
          <span class="field-value">{{ resData.data.serviceStatus }}</span>
        </div>
        <div class="field-row">
          <span class="field-label">服务端口</span>
          <span class="field-value mono">{{ resData.data.serverPort }}</span>
        </div>
        <div class="field-row">
          <span class="field-label">响应码</span>
          <span class="field-value mono">{{ resData.code }}</span>
        </div>
        <div class="field-row">
          <span class="field-label">提示信息</span>
          <span class="field-value">{{ resData.data.tip }}</span>
        </div>
      </div>

      <div v-else-if="errorText" class="fields">
        <div class="notice-text error">{{ errorText }}</div>
      </div>

      <div v-else class="fields">
        <div class="notice-text">
          <el-icon :size="16" class="spin"><Loading /></el-icon>
          <span>正在请求接口...</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTestMsg } from '../api/testApi'

const resData = ref(null)
const loading = ref(true)
const errorText = ref('')

const isOk = computed(() => resData.value && resData.value.code === 200)

const cardState = computed(() => {
  if (loading.value) return 'loading'
  if (isOk.value) return 'ok'
  return 'error'
})

const statusText = computed(() => {
  if (loading.value) return '正在检测'
  if (isOk.value) return '连接正常'
  return '连接异常'
})

const statusDesc = computed(() => {
  if (loading.value) return '正在请求后端服务'
  if (isOk.value) return '后端服务运行正常，接口可以访问'
  return '无法访问后端服务，请确认后端已启动'
})

const loadData = async () => {
  loading.value = true
  errorText.value = ''
  resData.value = null
  try {
    resData.value = await getTestMsg()
    console.log('后端原始数据：', resData.value)
  } catch (err) {
    console.error('接口请求失败', err)
    errorText.value = '接口请求失败，请确认 Spring Boot 后端已启动'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
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
.test-card {
  max-width: 720px;
  background: #fff;
  border: 1px solid #e5ebf7;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
}
.status-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px;
  border-bottom: 1px solid #edf0f3;
}
.status-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.status-copy {
  min-width: 0;
}
.status-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}
.status-desc {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}
.test-card.loading .status-icon {
  background: #eef2ff;
  color: #6366f1;
}
.test-card.ok .status-icon {
  background: linear-gradient(135deg,#dbeafe,#bfdbfe);
  color: #2563eb;
  box-shadow: inset 0 -2px 4px rgba(37,99,235,0.08);
}
.test-card.error .status-icon {
  background: linear-gradient(135deg,#fee2e2,#fecaca);
  color: #dc2626;
}
.fields {
  padding: 8px 24px 16px;
}
.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 46px;
  border-bottom: 1px solid #f1f5f9;
}
.field-row:last-child {
  border-bottom: none;
}
.field-label {
  font-size: 13px;
  color: #94a3b8;
}
.field-value {
  max-width: 70%;
  font-size: 14px;
  color: #0f172a;
  text-align: right;
  overflow-wrap: anywhere;
}
.mono {
  font-family: Consolas, 'Courier New', monospace;
}
.notice-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  color: #64748b;
  font-size: 14px;
}
.notice-text.error {
  color: #b91c1c;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
