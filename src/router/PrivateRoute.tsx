// src/router/PrivateRoute.tsx
import { JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../utils/auth'

export default function PrivateRoute({ children }: { children: JSX.Element }){
    return isAuthenticated() ? children : <Navigate to="/login" replace />
}