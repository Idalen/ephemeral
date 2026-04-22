import { apiClient } from './client'
import type { FeedResponse } from '../types'

export const getFeed = (params?: { cursor?: string; limit?: number }) =>
  apiClient.get<FeedResponse>('/feed', { params })
