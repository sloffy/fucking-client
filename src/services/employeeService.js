import api from '../config/api';

function normalizeEmployee(emp) {
  if (!emp) return null;
  const baseUrl = 'http://158.160.9.21:5000/api';
  return {
    id: emp.id,
    fullName: emp.full_name ?? emp.fullName,
    position: emp.position,
    employeeNumber: emp.employee_number ?? emp.employeeNumber,
    photo: emp.photo_url || (emp.id ? `${baseUrl}/employees/${emp.id}/photo` : null),
    createdAt: emp.created_at ?? emp.createdAt,
  };
}

function extractEmployee(payload) {
  // API часто возвращает { employee: {...} }
  const emp = payload?.employee ?? payload;
  return normalizeEmployee(emp);
}

export const employeeService = {
  getAll: async () => {
    const response = await api.get('/employees');
    const list = response.data?.employees ?? response.data;
    return Array.isArray(list) ? list.map(normalizeEmployee) : [];
  },

  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return extractEmployee(response.data);
  },

  create: async (data) => {
    const payload = {
      full_name: data.fullName,
      position: data.position,
      employee_number: data.employeeNumber,
    };
    const response = await api.post('/employees', payload);
    return extractEmployee(response.data);
  },

  update: async (id, data) => {
    const payload = {};
    if (data.fullName != null) payload.full_name = data.fullName;
    if (data.position != null) payload.position = data.position;
    if (data.employeeNumber != null) payload.employee_number = data.employeeNumber;
    const response = await api.put(`/employees/${id}`, payload);
    return extractEmployee(response.data);
  },

  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  uploadPhoto: async (id, photoUri) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });
    const response = await api.post(`/employees/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPhotoUrl: (id) => {
    return `http://158.160.9.21:5000/api/employees/${id}/photo`;
  },
};

