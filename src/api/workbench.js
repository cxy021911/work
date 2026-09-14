import request from '../utils/request'

export function getServerStatus() {
  return request({
    url: '/api/work/test/msg',
    method: 'GET'
  })
}

// 2. 获取今日数据统计
export function getWorkStat() {
  return request({
    url: '/api/work/stat',
    method: 'GET'
  })
}

// 3. 获取今日代办任务列表
export function getTodoList() {
  return request({
    url: '/api/work/task/list',
    method: 'GET'
  })
}

// 4. 新增任务
export function addTask(data) {
  return request({
    url: '/api/work/task/add',
    method: 'POST',
    data
  })
}

// 5. 修改任务完成状态
export function changeTaskStatus(data) {
  return request({
    url: '/api/work/task/status',
    method: 'PUT',
    data
  })
}

// 6. 根据id删除任务
export function deleteTask(id) {
  return request({
    url: `/api/work/task/${id}`,
    method: 'DELETE'
  })
}

// 7. 根据id查询单条任务（刚后端补上的接口）
export function getTaskById(id) {
  return request({
    url: `/api/work/task/${id}`,
    method: 'GET'
  })
}