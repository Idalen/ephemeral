// All interfaces use snake_case to match the backend JSON exactly.

export interface User {
  id: string
  username: string
  display_name?: string
  status: 'pending' | 'active' | 'disabled'
  is_approved: boolean
  is_trusted: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  username: string
  display_name?: string
  bio?: string
  profile_picture_url?: string
  background_picture_url?: string
  follower_count: number
  following_count: number
  post_count: number
  is_following?: boolean
  created_at: string
}

export interface PostMedia {
  id: string
  post_id: string
  url: string
  position: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  description?: string
  city: string
  country: string
  latitude?: number
  longitude?: number
  status: 'pending' | 'approved' | 'rejected'
  media: PostMedia[]
  created_at: string
  updated_at: string
}

export interface FeedPost extends Post {
  author_username: string
  author_display_name?: string
  author_picture_url?: string
  like_count: number
  is_liked: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface RegisterResponse {
  message: string
  user: User
}

export interface MediaUploadResponse {
  id: string
  url: string
}

export interface FeedResponse {
  posts: FeedPost[]
  next_cursor?: string
  has_more: boolean
}

export interface CreatePostRequest {
  city: string
  country: string
  description?: string
  latitude?: number
  longitude?: number
  media_ids: string[]
}

export interface UpdateProfileRequest {
  display_name?: string
  bio?: string
  profile_picture_url?: string
  background_picture_url?: string
}
