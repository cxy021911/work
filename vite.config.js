import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // ⭐关键！打包H5/App必须相对路径，不要写 '/'
  plugins: [vue()],
  server: {
    proxy: {
      // 匹配所有/api开头的请求
      '/api': {
        target: 'http://localhost:8080', // 本地后端
        changeOrigin: true // 开启跨域模拟
        // ⚠️ 后端接口本身就带 /api 前缀（如 /api/recipe/list），
        // 这里不能 rewrite 剥掉 /api，直接原样转发
      }
    }
  }
})
