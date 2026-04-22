import { apiClient } from './client'
import type { User, Post } from '../types'

export const getPendingUsers = (params?: { limit?: number; offset?: number }) =>
  apiClient.get<{ users: User[] }>('/admin/users/pending', { params })

export const approveUser = (id: string) =>
  apiClient.post(`/admin/users/${id}/approve`)

export const rejectUser = (id: string) =>
  apiClient.post(`/admin/users/${id}/reject`)

export const grantTrust = (id: string) =>
  apiClient.post(`/admin/users/${id}/trust`)

export const revokeTrust = (id: string) =>
  apiClient.delete(`/admin/users/${id}/trust`)

export const getPendingPosts = (params?: { limit?: number; offset?: number }) =>
  apiClient.get<{ posts: Post[] }>('/admin/posts/pending', { params })

export const approvePost = (id: string) =>
  apiClient.post(`/admin/posts/${id}/approve`)

export const rejectPost = (id: string) =>
  apiClient.post(`/admin/posts/${id}/reject`)
