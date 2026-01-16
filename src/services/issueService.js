import api from '../config/api';

function normalizeIssue(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeName: raw.employee_name,
    videoRecorderId: raw.video_recorder_id,
    videoRecorderNumber: raw.video_recorder_number,
    issueDate: raw.issue_date,
    returnDate: raw.return_date,
    issuedByUserId: raw.issued_by_user_id,
    issuedByUsername: raw.issued_by_username,
    returnedByUserId: raw.returned_by_user_id,
    returnedByUsername: raw.returned_by_username,
  };
}

export const issueService = {
  issue: async (employeeId, videoRecorderId) => {
    const response = await api.post('/issues/issue', {
      employee_id: employeeId,
      video_recorder_id: videoRecorderId,
    });
    return response.data;
  },

  return: async (employeeId, videoRecorderId) => {
    const response = await api.post('/issues/return', {
      employee_id: employeeId,
      video_recorder_id: videoRecorderId,
    });
    return response.data;
  },

  // Активные выдачи из /issues/active (сервер возвращает только ещё не возвращённые).
  getActive: async () => {
    const response = await api.get('/issues/active');
    const list = response.data?.issues ?? response.data ?? [];
    return (Array.isArray(list) ? list : []).map(normalizeIssue).filter(Boolean);
  },

  // Полная история из /issues/history
  getHistory: async (filters = {}) => {
    const response = await api.get('/issues/history', { params: filters });
    const list = response.data?.issues ?? [];
    return list.map(normalizeIssue).filter(Boolean);
  },

  delete: async (id) => {
    if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
      throw new Error('Invalid ID provided for deletion');
    }
    try {
      const response = await api.delete(`/issues/${id}`);
      return response.data; // Или просто true/false в зависимости от API
    } catch (error) {
      console.error('Error deleting issue:', error);
      throw error; // Перебросьте для обработки выше
    }
  },

  deleteAll: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Invalid IDs array provided for deletion');
    }
    const results = [];
    for (const id of ids) {
      try {
        const result = await this.delete(id);
        results.push({ id, success: true, data: result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  },
};

