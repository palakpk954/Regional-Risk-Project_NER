import axios from 'axios';

const INSIGHTS_BASE = import.meta.env.VITE_INSIGHTS_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: INSIGHTS_BASE,
  timeout: 12000,
});

export async function fetchInsightsSummary() {
  const { data } = await api.get('/insights/summary');
  return data;
}

export async function predictPlacement(profile) {
  const { data } = await api.post('/insights/predict', profile);
  return data;
}
