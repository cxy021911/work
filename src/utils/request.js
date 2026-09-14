// src/utils/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.DEV ? '' : 'http://120.55.98.135:8080', // 开发走vite proxy用空串（接口文件自带/api前缀）；生产走服务器地址
  timeout: 10000 // 超时时间10秒
})

// 请求拦截器：自动携带 JWT token
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器（统一处理返回格式，匹配你的Result结构）
service.interceptors.response.use(
  response => {
    const res = response.data
    // 业务码非200统一报错
    if (res && res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res
  },
  error => {
    // 401：未登录或token过期 → 清token跳登录页
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('nickname')
      if (router.currentRoute.value.path !== '/login') {
        ElMessage.warning('请先登录')
        router.push('/login')
      }
    } else {
      ElMessage.error(error.response?.data?.msg || '网络请求失败')
    }
    return Promise.reject(error)
  }
)

export default service
