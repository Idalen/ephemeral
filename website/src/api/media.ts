import { apiClient } from './client'
import type { MediaUploadResponse } from '../types'

export const uploadMedia = (formData: FormData) =>
  apiClient.post<MediaUploadResponse>('/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
