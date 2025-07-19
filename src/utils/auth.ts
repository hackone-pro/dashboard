// src/utils/auth.ts
export const login = () => {
    localStorage.setItem('auth', 'true')
}

export const logout = () => {
    localStorage.removeItem('auth')
}

export const isAuthenticated =() => {
    return localStorage.getItem('auth') === 'true'
}