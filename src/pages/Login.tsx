import { useState } from 'react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        console.log({ email, senha })
    }

    return (
        <div className="min-h-screen bg-hackone flex items-center justify-center bg-gradient-to-br from-[#4C009A] to-[#2A014B] px-4">

            <form
                onSubmit={handleLogin}
                className="w-full max-w-md bg-[#1b133d] p-8 rounded-2xl shadow-xl border border-[#342470]"
            >

                <div className="flex justify-center mb-6">
                    <img
                        src="/assets/img/logo.png"
                        alt="Hackone Logo"
                        className="h-15"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-1">E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-4 py-2 bg-[#2a1d5a] text-white border border-[#3d2a7d] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        required
                    />
                </div>

                <div className="mb-8">
                    <label className="block text-sm text-gray-300 mb-1">Senha</label>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-[#2a1d5a] text-white border border-[#3d2a7d] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-cyan-400 hover:bg-cyan-300 text-[#1a1a1a] font-bold py-2 rounded-lg transition-all duration-200"
                >
                    Entrar
                </button>

                <p className="text-center text-xs text-gray-400 mt-6">
                    © 2025 Hackone. Todos os direitos reservados.
                </p>
            </form>
        </div>
    )
}
