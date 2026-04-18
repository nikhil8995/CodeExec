import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import QuestionsList from './pages/QuestionsList'
import QuestionDetail from './pages/QuestionDetail'
import CreateQuestion from './pages/CreateQuestion'
import MyQuestions from './pages/MyQuestions'
import Submissions from './pages/Submissions'
import QuestionSubmissions from './pages/QuestionSubmissions'

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-900 text-slate-500">Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (role && user.role !== role) return <Navigate to="/dashboard" />
  return <AppShell>{children}</AppShell>
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/questions" element={<PrivateRoute><QuestionsList /></PrivateRoute>} />
          <Route path="/questions/new" element={<PrivateRoute role="TEACHER"><CreateQuestion /></PrivateRoute>} />
          <Route path="/questions/:id" element={<PrivateRoute><QuestionDetail /></PrivateRoute>} />
          <Route path="/questions/:id/submissions" element={<PrivateRoute role="TEACHER"><QuestionSubmissions /></PrivateRoute>} />
          <Route path="/my-questions" element={<PrivateRoute role="TEACHER"><MyQuestions /></PrivateRoute>} />
          <Route path="/submissions" element={<PrivateRoute><Submissions /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
