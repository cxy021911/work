import request from '../utils/request'

// 获取食谱列表（含美食信息：菜名、菜系、封面、食谱标题等）
export function getRecipeList() {
  return request({
    url: '/api/recipe/list',
    method: 'get'
  })
}

// 获取食谱详情（含做法步骤）
export function getRecipeDetail(recipeId) {
  return request({
    url: `/api/recipe/detail/${recipeId}`,
    method: 'get'
  })
}
