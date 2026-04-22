import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Project from './pages/Project'
import Join from './pages/auth/Join'
import Login from './pages/auth/Login'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import PostDetail from './pages/PostDetail'
import NewPost from './pages/NewPost'
import AdminPanel from './pages/admin/AdminPanel'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/project" element={<Project />} />
            <Route path="/join" element={<Join />} />
            <Route path="/login" element={<Login />} />

            {/* Authenticated — wrapped in shared Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/feed" element={<Feed />} />
              <Route path="/users/:username" element={<Profile />} />
              <Route path="/posts/:id" element={<PostDetail />} />
              <Route path="/new" element={<NewPost />} />
            </Route>

            {/* Admin only */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Layout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminPanel />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
