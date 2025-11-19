// src/utils/request.js
import axios from 'axios'
import Vue from 'vue'

// 创建axios实例
const service = axios.create({
  baseURL: '', // 基础URL，可根据环境配置
  timeout: 5000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    // 根据后端约定处理响应数据
    if (res.code !== 200) {
      console.error('接口错误:', res.msg)
      return Promise.reject(new Error(res.msg || '接口请求失败'))
    }
    return res
  },
  error => {
    console.error('响应错误:', error)
    return Promise.reject(error)
  }
)

// 封装请求方法
const request = {
  get(url, params = {}) {
    return service.get(url, { params })
  },
  post(url, data = {}) {
    return service.post(url, data)
  },
  put(url, data = {}) {
    return service.put(url, data)
  },
  delete(url, params = {}) {
    return service.delete(url, { params })
  }
}

// 挂载到Vue原型
Vue.prototype.$request = request

export default request