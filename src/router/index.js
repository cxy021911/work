import { createRouter, createWebHashHistory } from 'vue-router'
// 导入页面组件
import testPage from '../components/HelloWorld.vue'
import login from '../components/Login.vue'
import work from '../components/Work.vue'
import plan from '../components/FuturePlan.vue'
import food from '../components/Food.vue'
import exercise from '../components/Exercise.vue'
import planExercise from '../components/PlanExercise.vue'
import todayExercise from '../components/TodayExercise.vue'
// 路由表
const routes = [
  {
    path: '/login',
    name: 'login',
    component: login
  },
  {
    path: '/',
    redirect: '/work' // 默认打开工作台
  },
  {
    path: '/test',
    name: 'testPage',
    component: testPage
  },
  {
    path: '/work',
    name: 'work',
    component: work
  },
  {
    path: '/plan',
    name: 'plan',
    component: plan
  },
  {
    path: '/food',
    name: 'food',
    component: food
  },
  {
    path: '/exercise',
    name: 'exercise',
    component: exercise
  },
  {
    path: '/today-exercise',
    name: 'todayExercise',
    component: todayExercise
  },
  {
    path: '/plan-exercise',
    name: 'planExercise',
    component: planExercise
  }

]
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // ✅改为hash模式，适配HBuilderX打包APP
  routes
})
// 全局路由守卫：未登录只能访问登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!token && to.path !== '/login') {
    next('/login')
  } else if (token && to.path === '/login') {
    next('/work')
  } else {
    next()
  }
})

export default router
