import api from '../api';

export async function getQuestions(params = {}) {
  const { data } = await api.get('/admin/questions', { params });
  return data.data;
}

export async function rejectQuestion(id) {
  const { data } = await api.patch(`/admin/questions/${id}/reject`);
  return data.data;
}

export async function deleteQuestion(id) {
  const { data } = await api.delete(`/admin/questions/${id}`);
  return data;
}

export async function deleteAnswer(questionId, answerId) {
  const { data } = await api.delete(`/admin/questions/${questionId}/answers/${answerId}`);
  return data;
}
