import { apiClient } from './client'
import type { Post, CreatePostRequest } from '../types'

export const createPost = (data: CreatePostRequest) =>
  apiClient.post<Post>('/posts', data)

export const getPost = (id: string) =>
  apiClient.get<Post>(`/posts/${id}`)

export const deletePost = (id: string) =>
  apiClient.delete(`/posts/${id}`)

export const likePost = (id: string) =>
  apiClient.post(`/posts/${id}/like`)

export const unlikePost = (id: string) =>
  apiClient.delete(`/posts/${id}/like`)
