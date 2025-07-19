// src/pages/Dashboard.tsx

import { logout } from "../utils/auth"
import { useNavigate } from "react-router-dom"
import { toastSuccess } from "../utils/toast"

export default function Dashboard() {
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        toastSuccess('Logout realizado com sucesso!')
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-4">Painel Hackone</h1>
            <button
                onClick={handleLogout}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
                Sair
            </button>
        </div>
    )
}
