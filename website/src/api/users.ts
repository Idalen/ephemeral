import { apiClient } from './client'
import type { User, UserProfile, Post, UpdateProfileRequest } from '../types'

export const getMe = () =>
  apiClient.get<UserProfile>('/users/me')

export const updateMe = (data: UpdateProfileRequest) =>
  apiClient.patch<UserProfile>('/users/me', data)

export const getUser = (username: string) =>
  apiClient.get<UserProfile>(`/users/${username}`)

export const getUserPosts = (username: string, limit = 30) =>
  apiClient.get<{ posts: Post[] }>(`/users/${username}/posts`, { params: { limit } })

export const follow = (username: string) =>
  apiClient.post(`/users/${username}/follow`)

export const unfollow = (username: string) =>
  apiClient.delete(`/users/${username}/follow`)

export const getFollowers = (username: string, params?: { limit?: number; offset?: number }) =>
  apiClient.get<{ users: User[] }>(`/users/${username}/followers`, { params })

export const getFollowing = (username: string, params?: { limit?: number; offset?: number }) =>
  apiClient.get<{ users: User[] }>(`/users/${username}/following`, { params })
