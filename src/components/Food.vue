<template>
  <!--标签导航：工作台 / 计划 / 美食 -->
<section class="food-page" :class="{ 'is-loading': loading }">
    <div class="page-head">
      <div>
        <h1 class="page-title">美食食谱</h1>
        <p class="page-subtitle">共 {{ filteredList.length }} 道美食 · 点击卡片查看做法</p>
      </div>
      <button class="ghost-btn" type="button" @click="loadAllData">
        <el-icon :size="15"><Refresh /></el-icon>
        <span>刷新</span>
      </button>
    </div>

    <!-- 菜系筛选 -->
    <div class="type-bar">
      <button
        v-for="t in typeList"
        :key="t"
        class="type-chip"
        :class="{ 'type-active': currentType === t }"
        type="button"
        @click="currentType = t"
      >
        {{ t }}
      </button>
    </div>

    <!-- 美食卡片列表 -->
    <div v-if="filteredList.length" class="food-grid">
      <div
        v-for="item in filteredList"
        :key="item.recipeId"
        class="food-card"
        @click="openDetail(item.recipeId)"
      >
        <div class="food-cover-wrap">
          <img
            v-if="item.coverImg"
            class="food-cover"
            :src="item.coverImg"
            :alt="item.foodName"
            loading="lazy"
          />
          <div v-else class="food-cover food-cover-empty">
            <el-icon :size="32"><Food /></el-icon>
          </div>
          <span class="food-type">{{ item.foodType }}</span>
          <span class="food-diff" :class="`diff-${item.difficulty}`">{{ diffText(item.difficulty) }}</span>
          <span v-if="item.calories" class="food-cal">{{ item.calories }}千卡</span>
        </div>
        <div class="food-body">
          <div class="food-name">{{ item.foodName }}</div>
          <div class="food-recipe-title">{{ item.recipeTitle }}</div>
          <div class="food-meta">
            <span class="meta-item">
              <el-icon :size="13"><Clock /></el-icon>
              {{ item.cookTime }}分钟
            </span>
            <span v-if="item.calories" class="meta-item meta-cal">
              <el-icon :size="13"><Odometer /></el-icon>
              {{ item.calories }}千卡
            </span>
            <span class="meta-item">
              <el-icon :size="13"><User /></el-icon>
              {{ item.author }}
            </span>
          </div>
          <div class="food-ingredients">{{ item.ingredients }}</div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon"><el-icon :size="24"><Food /></el-icon></div>
      <span>{{ loading ? '加载中…' : '暂无美食数据' }}</span>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      width="560px"
      class="food-dialog"
      :close-on-click-modal="true"
    >
      <template #header>
        <div class="dialog-title">
          <span class="dialog-name">{{ detail.foodName }}</span>
          <span class="dialog-type">{{ detail.foodType }}</span>
        </div>
      </template>

      <div v-if="detailLoading" class="detail-tip">
        <el-icon :size="26" class="is-loading"><Loading /></el-icon>
        <span>加载中…</span>
      </div>

      <div v-else-if="detail.recipeId" class="detail-body">
        <img
          v-if="detail.coverImg"
          class="detail-cover"
          :src="detail.coverImg"
          :alt="detail.foodName"
        />
        <div class="detail-meta">
          <span>作者：{{ detail.author }}</span>
          <span>烹饪时长：{{ detail.cookTime }} 分钟</span>
          <span>难度：{{ diffText(detail.difficulty) }}</span>
          <span v-if="detail.calories" class="meta-cal">每份约 {{ detail.calories }} 千卡</span>
        </div>
        <div class="detail-block">
          <div class="detail-block-title">所需食材</div>
          <div class="detail-text">{{ detail.ingredients }}</div>
        </div>
        <div class="detail-block">
          <div class="detail-block-title">做法步骤</div>
          <ol v-if="detail.stepList && detail.stepList.length" class="step-list">
            <li v-for="step in detail.stepList" :key="step.id" class="step-item">
              <span class="step-num">{{ step.stepSort }}</span>
              <span class="step-content">{{ step.stepContent }}</span>
            </li>
          </ol>
          <div v-else class="detail-text">暂无做法步骤</div>
        </div>
      </div>

      <div v-else class="detail-tip">未找到该食谱</div>
    </el-dialog>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Refresh, Clock, User, Food, Loading, Odometer } from '@element-plus/icons-vue'
import { getRecipeList, getRecipeDetail } from '../api/food'

const list = ref([])
const loading = ref(false)
const currentType = ref('全部')

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref({})

// 从列表数据聚合菜系列表（全部 + 去重）
const typeList = computed(() => {
  const types = new Set(list.value.map(item => item.foodType).filter(Boolean))
  return ['全部', ...types]
})

const filteredList = computed(() => {
  if (currentType.value === '全部') return list.value
  return list.value.filter(item => item.foodType === currentType.value)
})

const diffMap = { 1: '简单', 2: '中等', 3: '困难' }
const diffText = d => diffMap[d] || '未知'

const loadAllData = async () => {
  loading.value = true
  try {
    const res = await getRecipeList()
    list.value = res?.data || []
  } catch (err) {
    console.error('食谱列表加载失败', err)
    list.value = []
  } finally {
    loading.value = false
  }
}

const openDetail = async recipeId => {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = {}
  try {
    const res = await getRecipeDetail(recipeId)
    detail.value = res?.data || {}
  } catch (err) {
    console.error('食谱详情加载失败', err)
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => loadAllData())
</script>

<style scoped>
.tab-nav {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
  padding: 4px;
  background: #e8efff;
  border-radius: 14px;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
}
.tab-item {
  padding: 9px 18px;
  text-decoration: none;
  color: #5b6b6a;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.tab-item:hover {
  color: #2563eb;
  background: rgba(255,255,255,0.6);
}
.tab-active {
  color: #fff;
  background: linear-gradient(135deg,#2563eb,#3b82f6);
  box-shadow: 0 2px 8px rgba(37,99,235,0.35);
  font-weight: 600;
}
.tab-active:hover {
  color: #fff;
  background: linear-gradient(135deg,#2563eb,#3b82f6);
}

.food-page {
  transition: opacity 0.2s ease;
}
.food-page.is-loading {
  opacity: 0.65;
  pointer-events: none;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
}
.page-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #64748b;
}
.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border: 1px solid #dbe4f5;
  border-radius: 10px;
  background: #fff;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15,23,42,0.05);
  transition: all 0.18s ease;
}
.ghost-btn:hover:not(:disabled) {
  border-color: #2563eb;
  color: #1d4ed8;
  box-shadow: 0 3px 10px rgba(37,99,235,0.18);
  transform: translateY(-1px);
}
.ghost-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(37,99,235,0.12);
}
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.type-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}
.type-chip {
  height: 32px;
  padding: 0 16px;
  border: 1px solid #dbe4e3;
  border-radius: 999px;
  background: #fff;
  color: #5b6b6a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}
.type-chip:hover {
  border-color: #2563eb;
  color: #2563eb;
  transform: translateY(-1px);
}
.type-active {
  background: linear-gradient(135deg,#2563eb,#3b82f6);
  border-color: #2563eb;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37,99,235,0.3);
}
.type-active:hover {
  color: #fff;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
.food-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5ebf7;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.food-card:hover {
  transform: translateY(-3px);
  border-color: #2563eb;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
}
.food-cover-wrap {
  position: relative;
  height: 160px;
  background: #f1f5f9;
}
.food-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.food-card:hover .food-cover {
  transform: scale(1.04);
}
.food-cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
.food-type {
  position: absolute;
  left: 10px;
  top: 10px;
  height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg,rgba(37,99,235,0.92),rgba(96,165,250,0.92));
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(37,99,235,0.3);
}
.food-cal {
  position: absolute;
  right: 10px;
  bottom: 10px;
  height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg,rgba(16,185,129,0.95),rgba(52,211,153,0.95));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(16,185,129,0.35);
}
.food-diff {
  position: absolute;
  right: 10px;
  top: 10px;
  height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(15,23,42,0.08);
}
.diff-1 {
  background: #d1fae5;
  color: #047857;
}
.diff-2 {
  background: #fef3c7;
  color: #b45309;
}
.diff-3 {
  background: #fee2e2;
  color: #b91c1c;
}
.food-body {
  padding: 14px 16px 16px;
}
.food-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.food-recipe-title {
  margin-top: 3px;
  font-size: 13px;
  color: #64748b;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.food-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.meta-cal {
  color: #047857 !important;
  font-weight: 600;
}
.food-ingredients {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
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
  background:linear-gradient(135deg,#eff6ff,#dbeafe);
  color:#3b82f6;
  margin-bottom:2px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dialog-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}
.dialog-type {
  height: 22px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
}
.food-dialog :deep(.el-dialog) {
  border-radius: 18px;
  overflow: hidden;
}
.detail-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 180px;
  color: #94a3b8;
  font-size: 13px;
}
.detail-body {
  max-height: 62vh;
  overflow-y: auto;
}
.detail-cover {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 12px;
}
.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 14px 0;
  font-size: 13px;
  color: #475569;
}
.detail-block {
  margin-bottom: 14px;
}
.detail-block-title {
  position: relative;
  margin-bottom: 8px;
  padding-left: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.detail-block-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg,#2563eb,#60a5fa);
}
.detail-text {
  font-size: 13px;
  line-height: 1.7;
  color: #475569;
  white-space: pre-wrap;
}
.step-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.step-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #edf0f3;
  font-size: 13px;
  line-height: 1.7;
  color: #475569;
}
.step-item:last-child {
  border-bottom: none;
}
.step-num {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(135deg,#eff6ff,#dbeafe);
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}
.step-content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 720px) {
  .food-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .food-cover-wrap {
    height: 110px;
  }
  .food-body {
    padding: 10px 10px 12px;
  }
  .food-name {
    font-size: 14px;
  }
}
@media (max-width: 480px) {
  .food-grid {
    grid-template-columns: 1fr;
  }
  .food-cover-wrap {
    height: 150px;
  }
}
</style>
