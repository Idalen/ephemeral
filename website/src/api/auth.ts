import { apiClient } from './client'
import type { AuthResponse, RegisterResponse } from '../types'

export const authRegister = (data: { username: string; password: string }) =>
  apiClient.post<RegisterResponse>('/auth/register', data)

export const authLogin = (data: { username: string; password: string }) =>
  apiClient.post<AuthResponse>('/auth/login', data)
