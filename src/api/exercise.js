import request from '../utils/request'

export function getExerciseList(params) {
  return request({
    url: '/api/exercise/list',
    method: 'get',
    params
  })
}

export function getExerciseStat() {
  return request({
    url: '/api/exercise/stat',
    method: 'get'
  })
}

export function addExercise(data) {
  return request({
    url: '/api/exercise/add',
    method: 'post',
    data
  })
}

export function updateExercise(data) {
  return request({
    url: '/api/exercise/update',
    method: 'put',
    data
  })
}

export function deleteExercise(id) {
  return request({
    url: `/api/exercise/${id}`,
    method: 'delete'
  })
}

// ===== 器械动作库 =====
export function getActionList() {
  return request({
    url: '/api/exercise/action/list',
    method: 'get'
  })
}

// ===== 今日锻炼计划 =====
export function getPlanList(params) {
  return request({
    url: '/api/exercise/plan/list',
    method: 'get',
    params
  })
}

export function savePlan(data) {
  return request({
    url: '/api/exercise/plan/save',
    method: 'post',
    data
  })
}

export function finishPlan(data) {
  return request({
    url: '/api/exercise/plan/finish',
    method: 'put',
    data
  })
}

export function deletePlan(id) {
  return request({
    url: `/api/exercise/plan/${id}`,
    method: 'delete'
  })
}

export function generatePlan(data) {
  return request({
    url: '/api/exercise/plan/generate',
    method: 'post',
    data
  })
}

export function updatePlanSets(data) {
  return request({
    url: '/api/exercise/plan/sets',
    method: 'put',
    data
  })
}

export function getHeatmap(days = 84) {
  return request({
    url: '/api/exercise/heatmap',
    method: 'get',
    params: { days }
  })
}

export function getPendingPlan() {
  return request({
    url: '/api/exercise/plan/pending',
    method: 'get'
  })
}

export function rolloverPlan(data) {
  return request({
    url: '/api/exercise/plan/rollover',
    method: 'post',
    data
  })
}
