<template>
  <div class="auth-page">
    <!-- 顶部品牌（手机端展示） -->
    <header class="mobile-brand">
      <span class="mobile-logo">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px;display:block;">
  <defs><linearGradient id="zlg-login" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs>
  <circle cx="24" cy="24" r="22" fill="url(#zlg-login)"/>
  <path d="M24 12 35 21v12.5a1.5 1.5 0 0 1-1.5 1.5H28.5V25.5h-9v9.5H14.5A1.5 1.5 0 0 1 13 33.5V21z" fill="#fff"/>
  <path d="M24 6.8l1.35 2.75 3 .55-2.2 2.05.55 3-2.7-1.45-2.7 1.45.55-3-2.2-2.05 3-.55z" fill="#FBBF24"/>
</svg>
      </span>
      <span class="mobile-brand-name">自律之家</span>
    </header>

    <!-- 左侧 SIGN IN 半透明面板（仅桌面） -->
    <aside class="side-panel" :class="{ 'side-active': isLogin }">
      <div class="side-inner">
        <div class="side-brand">
          <span class="side-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px;display:block;">
  <defs><linearGradient id="zlg-login" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs>
  <circle cx="24" cy="24" r="22" fill="url(#zlg-login)"/>
  <path d="M24 12 35 21v12.5a1.5 1.5 0 0 1-1.5 1.5H28.5V25.5h-9v9.5H14.5A1.5 1.5 0 0 1 13 33.5V21z" fill="#fff"/>
  <path d="M24 6.8l1.35 2.75 3 .55-2.2 2.05.55 3-2.7-1.45-2.7 1.45.55-3-2.2-2.05 3-.55z" fill="#FBBF24"/>
</svg>
          </span>
          <span class="side-brand-name">自律之家</span>
        </div>
        <h2 class="side-title">{{ isLogin ? 'Welcome Back' : 'Join Us' }}</h2>
        <p class="side-desc">
          {{ isLogin ? '登录你的账号，继续管理目标与计划' : '已有账号？点击下方按钮直接登录' }}
        </p>
        <button type="button" class="side-btn" @click="isLogin = true">
          SIGN IN
        </button>
        <p class="side-foot">Snow Mountain · Cloud Sea</p>
      </div>
    </aside>

    <!-- 右侧表单卡片 -->
    <section class="form-side">
      <div class="form-card" :class="{ 'card-register': !isLogin }">
        <div class="card-head">
          <h1 class="form-title">{{ isLogin ? 'Sign In' : 'Sign Up' }}</h1>
          <p class="form-subtitle">
            {{ isLogin ? '使用你的账号登录' : '创建你的新账号' }}
          </p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          label-position="top"
          @submit.prevent
        >
          <el-form-item label="User" prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              :prefix-icon="User"
              clearable
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item v-if="!isLogin" label="Email" prop="email">
            <el-input
              v-model="form.email"
              placeholder="邮箱（可选）"
              :prefix-icon="Message"
              clearable
              autocomplete="email"
            />
          </el-form-item>

          <el-form-item label="Password" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="至少6位密码"
              :prefix-icon="Lock"
              show-password
              autocomplete="current-password"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-form-item v-if="!isLogin" label="Confirm" prop="confirmPwd">
            <el-input
              v-model="form.confirmPwd"
              type="password"
              placeholder="再次输入密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-button
            type="primary"
            class="submit-btn"
            :loading="submitting"
            @click="submit"
          >
            {{ isLogin ? 'SIGN IN' : 'SIGN UP' }}
          </el-button>
        </el-form>

        <div class="form-switch">
          <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
          <a class="switch-link" @click="toggleMode">
            {{ isLogin ? 'Sign Up' : 'Sign In' }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { login, register } from '../api/auth'

const router = useRouter()
const formRef = ref(null)
const isLogin = ref(true)
const submitting = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPwd: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度2-20位', trigger: 'blur' }
  ],
  email: [
    {
      validator: (rule, value, callback) => {
        if (!isLogin.value && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          callback(new Error('邮箱格式不正确'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度6-32位', trigger: 'blur' }
  ],
  confirmPwd: [
    {
      validator: (rule, value, callback) => {
        if (!isLogin.value && value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  // 切换时清空残留，避免校验误触发
  form.confirmPwd = ''
  form.email = ''
}

const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isLogin.value) {
      const res = await login({
        username: form.username.trim(),
        password: form.password
      })
      saveAuth(res.data)
      ElMessage.success('登录成功')
      router.push('/work')
    } else {
      const res = await register({
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: form.password
      })
      saveAuth(res.data)
      ElMessage.success('注册成功，已自动登录')
      router.push('/work')
    }
  } catch (err) {
    // 错误提示已由拦截器统一处理
  } finally {
    submitting.value = false
  }
}

const saveAuth = data => {
  localStorage.setItem('token', data.token)
  localStorage.setItem('username', data.username)
  localStorage.setItem('nickname', data.nickname || data.username)
}
</script>

<style scoped>
.auth-page {
  position: relative;
  flex: 1;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(155deg, #1e3a8a 0%, #2563eb 44%, #5b9bf0 74%, #cfe4fb 100%);
  background-attachment: fixed;
  overflow-x: hidden;
  overflow-y: auto;
}

/* ============ 顶部品牌（手机端） ============ */
.mobile-brand {
  display: none;
}

/* ============ 左侧半透明面板（桌面） ============ */
.side-panel {
  position: relative;
  z-index: 2;
  width: 46%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.28);
}

.side-inner {
  max-width: 360px;
  text-align: left;
  color: #fff;
}

.side-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 48px;
}

.side-logo {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(4px);
}

.side-brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(30, 60, 100, 0.25);
}

.side-title {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  text-shadow: 0 2px 14px rgba(30, 60, 100, 0.3);
}

.side-desc {
  margin: 14px 0 30px;
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.92;
}

.side-btn {
  width: 180px;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.side-btn:hover {
  background: rgba(255, 255, 255, 0.32);
  transform: translateY(-2px);
}

.side-foot {
  position: absolute;
  bottom: 26px;
  left: 40px;
  font-size: 11px;
  letter-spacing: 2px;
  opacity: 0.6;
}

/* ============ 右侧表单 ============ */
.form-side {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.form-card {
  width: 100%;
  max-width: 420px;
  padding: 40px 42px 30px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 24px;
  box-shadow: 0 24px 70px rgba(30, 64, 105, 0.22);
  transition: padding 0.3s ease;
}

.card-head {
  text-align: left;
  margin-bottom: 26px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.3px;
}

.form-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
}

.submit-btn {
  width: 100%;
  height: 46px;
  margin-top: 2px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 3px;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.34);
}

.form-switch {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

.switch-link {
  margin-left: 6px;
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
}

.switch-link:hover {
  color: #1d4ed8;
}

/* 表单控件圆角统一 */
:deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 2px 14px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #334155;
}

/* ============ 手机端：沉浸背景 + 底部毛玻璃卡片 ============ */
@media (max-width: 860px) {
  .auth-page {
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    padding: 0;
  }

  /* 隐藏桌面左面板 */
  .side-panel {
    display: none;
  }

  /* 顶部品牌展示 */
  .mobile-brand {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 30px 16px 10px;
    color: #fff;
    text-shadow: 0 2px 10px rgba(20, 50, 90, 0.35);
  }

  .mobile-logo {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(4px);
  }

  .mobile-brand-name {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  /* 表单区：撑满宽度，卡片圆角上浮 */
  .form-side {
    position: relative;
    z-index: 2;
    width: 100%;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 18px 30px;
  }

  .form-card {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
    padding: 30px 22px 26px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 20px 50px rgba(20, 50, 90, 0.25);
  }

  .card-head {
    text-align: center;
  }

  .form-title {
    font-size: 26px;
  }

  .form-subtitle {
    font-size: 13px;
  }

  .submit-btn {
    height: 50px;
    font-size: 15px;
  }

  .form-switch {
    font-size: 13px;
  }
}

/* 小屏手机再紧凑一点 */
@media (max-width: 480px) {
  .form-card {
    padding: 26px 18px 22px;
  }

  .card-head {
    margin-bottom: 20px;
  }

  .form-title {
    font-size: 24px;
  }

  .submit-btn {
    height: 48px;
  }
}
</style>
