// import axios from 'axios';

// let base = '';

// export const requestLogin = params => { return axios.post(`${base}/login`, params).then(res => res.data); };

// export const getUserList = params => { return axios.get(`${base}/user/list`, { params: params }); };

// export const getUserListPage = params => { return axios.get(`${base}/user/listpage`, { params: params }); };

// export const removeUser = params => { return axios.get(`${base}/user/remove`, { params: params }); };

// export const editUser = params => { return axios.get(`${base}/user/edit`, { params: params }); };

// export const addUser = params => { return axios.get(`${base}/user/add`, { params: params }); };

import request from '../utils/request'; // 引入封装好的request（而非直接用axios）

// let base = 'http://192.168.3.19:8082';
let base = '/api';

// 统一封装所有API接口
const api = {
  // 登录相关
  requestLogin: (params) => request.post(`${base}/user/login`, params),

  // 系统相关
  getProgram: (params) => request.get(`${base}/program/getProgram`, { params }),
  getUserListPage: (params) => request.get(`${base}/user/listpage`, { params }),
  // removeUser: (params) => request.get(`${base}/user/remove`, { params }),
  // editUser: (params) => request.get(`${base}/user/edit`, { params }),
  // addUser: (params) => request.get(`${base}/user/add`, { params })
};

export default api;