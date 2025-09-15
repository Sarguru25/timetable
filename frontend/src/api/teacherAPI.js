import api from './api';

const teacherAPI = {
  getAll: () => api.get('/teachers').then(res => res.data),
  create: (data) => api.post('/teachers', data).then(res => res.data),
  update: (id, data) => api.put(`/teachers/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/teachers/${id}`).then(res => res.data),
};

export default teacherAPI;
