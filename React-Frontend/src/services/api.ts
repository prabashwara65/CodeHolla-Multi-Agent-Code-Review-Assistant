// src/services/api.ts

import axios from 'axios';
import type { ReviewResponse } from '../types';

const API_URL = 'http://localhost:5000/api';

export const api = {
  healthCheck: async () => {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  },

  reviewCode: async (code: string, filename: string): Promise<ReviewResponse> => {
    const response = await axios.post(`${API_URL}/review`, {
      code,
      filename
    });
    return response.data;
  },

  reviewFile: async (file: File): Promise<ReviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/review-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};