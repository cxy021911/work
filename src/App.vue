<template>
  <div class="app-shell">
    <!-- 登录页：独立全屏布局 -->
    <div v-if="isLoginPage" class="auth-host">
      <router-view />
    </div>

    <!-- 主布局：左侧导航栏 + 内容区 -->
    <div v-else class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px;display:block;">
  <defs><linearGradient id="zlg-app" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs>
  <circle cx="24" cy="24" r="22" fill="url(#zlg-app)"/>
  <path d="M24 12 35 21v12.5a1.5 1.5 0 0 1-1.5 1.5H28.5V25.5h-9v9.5H14.5A1.5 1.5 0 0 1 13 33.5V21z" fill="#fff"/>
  <path d="M24 6.8l1.35 2.75 3 .55-2.2 2.05.55 3-2.7-1.45-2.7 1.45.55-3-2.2-2.05 3-.55z" fill="#FBBF24"/>
</svg>
          </span>
          <span class="brand-name">自律之家</span>
        </div>

        <nav class="side-nav">
          <div class="nav-group">
            <div class="nav-group-title">工作台</div>
            <router-link to="/work" class="nav-link">
              <el-icon :size="17"><List /></el-icon>
              <span>今日工作台</span>
            </router-link>
            <router-link to="/plan" class="nav-link">
              <el-icon :size="17"><Calendar /></el-icon>
              <span>未来工作计划</span>
            </router-link>
          </div>
          <div class="nav-group">
            <div class="nav-group-title">美食</div>
            <router-link to="/food" class="nav-link">
              <el-icon :size="17"><Food /></el-icon>
              <span>美食食谱</span>
            </router-link>
          </div>
          <div class="nav-group">
            <div class="nav-group-title">健康</div>
            <router-link to="/today-exercise" class="nav-link">
              <el-icon :size="17"><Lightning /></el-icon>
              <span>今日锻炼</span>
            </router-link>
            <router-link to="/plan-exercise" class="nav-link">
              <el-icon :size="17"><Notebook /></el-icon>
              <span>锻炼计划</span>
            </router-link>
            <router-link to="/exercise" class="nav-link">
              <el-icon :size="17"><Stopwatch /></el-icon>
              <span>锻炼记录</span>
            </router-link>
          </div>
          <div class="nav-group nav-logout-group">
            <a class="nav-link nav-logout" @click="handleLogout">
              <el-icon :size="17"><SwitchButton /></el-icon>
              <span>退出登录</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-foot">
          <div v-if="isLoggedIn" class="side-user">
            <span class="user-avatar">
              <el-icon :size="16"><User /></el-icon>
            </span>
            <span class="user-name">{{ nickname }}</span>
          </div>
        </div>
      </aside>

      <main class="page">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Calendar, Food, User, SwitchButton, Stopwatch, Notebook, Lightning } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 是否登录页（登录页隐藏整体布局）
const isLoginPage = computed(() => route.path === '/login')

// 登录状态与昵称（用 ref + 路由变化时刷新，避免 localStorage 非响应式导致切换用户后不更新）
const isLoggedIn = ref(!!localStorage.getItem('token'))
const nickname = ref(localStorage.getItem('nickname') || localStorage.getItem('username') || '用户')

const refreshAuth = () => {
  isLoggedIn.value = !!localStorage.getItem('token')
  nickname.value = localStorage.getItem('nickname') || localStorage.getItem('username') || '用户'
}
watch(() => route.path, refreshAuth)

// 点击退出先弹确认框，防止手机端误触/返回键直接退出
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出当前账号吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
    autofocus: false,
    roundButton: true
  })
    .then(() => logout())
    .catch(() => {})
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('nickname')
  refreshAuth()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ===== 主布局：侧边栏 + 内容 ===== */
.layout {
  flex: 1;
  display: flex;
  min-height: 100vh;
  background: linear-gradient(180deg, #eef4ff 0%, #f8fafc 300px);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 30;
  width: 220px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e5ebf7;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid #eef2f7;
}

.brand-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #eef4ff, #f3efff);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.28);
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
}

.side-nav {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
}

.nav-group {
  margin-bottom: 8px;
}

.nav-group-title {
  padding: 10px 12px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 1px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 12px;
  margin-bottom: 2px;
  border-radius: 10px;
  color: #475569;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.18s ease;
}

.nav-link:hover {
  background: #eef4ff;
  color: #2563eb;
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.nav-link.router-link-active:hover {
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
}

.sidebar-foot {
  padding: 14px 12px;
  border-top: 1px solid #eef2f7;
}

.side-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 10px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eef4ff;
  color: #2563eb;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

/* 导航内退出登录项 */
.nav-logout-group {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5ebf7;
}

.nav-logout {
  color: #ef4444;
  cursor: pointer;
}

.nav-logout:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* ===== 内容区 ===== */
.page {
  flex: 1;
  min-width: 0;
  margin-left: 220px;
  padding: 28px 28px 48px;
}

.auth-host {
  flex: 1;
  display: flex;
}

/* ===== 移动端：侧边栏收起为顶部胶囊 ===== */
@media (max-width: 860px) {
  .layout {
    flex-direction: column;
  }

  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e5ebf7;
  }

  .sidebar-brand {
    height: 54px;
    padding: 0 14px;
  }

  .side-nav {
    display: flex;
    gap: 6px;
    padding: 8px 12px;
    overflow-x: auto;
  }

  .nav-group {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 0;
  }

  .nav-logout-group {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    margin-left: 2px;
  }

  .nav-logout {
    background: #fef2f2;
    color: #dc2626;
  }

  .nav-group-title {
    display: none;
  }

  .nav-link {
    height: 36px;
    padding: 0 14px;
    margin-bottom: 0;
    border-radius: 9px;
    white-space: nowrap;
    font-size: 13px;
  }

  .sidebar-foot {
    display: none;
  }

  .page {
    margin-left: 0;
    padding: 18px 14px 36px;
  }
}
</style>
