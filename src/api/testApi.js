// src/api/testApi.js
import request from '../utils/request'

// 测试接口 GET请求
export function getTestMsg() {
  return request({
    url: '/api/test/msg',
    method: 'get'
  })
}