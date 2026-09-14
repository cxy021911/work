import request from '../utils/request'

export function getPlanList(params) {
  return request({
    url:'/api/plan/list',
    method:'get',
    params
  })
}

export function getPlanStat(params) {
  return request({
    url:'/api/plan/stat',
    method:'get',
    params
  })
}

export function addPlan(data) {
  return request({
    url:'/api/plan/add',
    method:'post',
    data
  })
}

export function changePlanStatus(data) {
  return request({
    url:'/api/plan/status',
    method:'put',
    data
  })
}

export function deletePlan(id) {
  return request({
    url:`/api/plan/${id}`,
    method:'delete'
  })
}
