import api from '../config/api';

function normalizeVideoRecorder(vr) {
  if (!vr) return null;
  return {
    id: vr.id,
    number: vr.number ?? vr.serialNumber ?? vr.name,
    status: vr.status,
    createdAt: vr.created_at ?? vr.createdAt,
  };
}

function extractVideoRecorder(payload) {
  // API часто возвращает { video_recorder: {...} }
  const vr = payload?.video_recorder ?? payload?.videoRecorder ?? payload;
  return normalizeVideoRecorder(vr);
}

export const videoRecorderService = {
  getAll: async () => {
    const response = await api.get('/video-recorders');
    const list = response.data?.video_recorders ?? response.data?.videoRecorders ?? response.data;
    return Array.isArray(list) ? list.map(normalizeVideoRecorder) : [];
  },

  getById: async (id) => {
    const response = await api.get(`/video-recorders/${id}`);
    return extractVideoRecorder(response.data);
  },

  create: async (data) => {
    const payload = {
      number: data.number,
      status: data.status,
    };
    const response = await api.post('/video-recorders', payload);
    return extractVideoRecorder(response.data);
  },

  update: async (id, data) => {
    const payload = {};
    if (data.number != null) payload.number = data.number;
    if (data.status != null) payload.status = data.status;
    const response = await api.put(`/video-recorders/${id}`, payload);
    return extractVideoRecorder(response.data);
  },

  delete: async (id) => {
    const response = await api.delete(`/video-recorders/${id}`);
    return response.data;
  },
};
