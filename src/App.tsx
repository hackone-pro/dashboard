// src/App.tsx

import AppRoutes from './router/AppRoutes';
import './index.css';
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

/**
 * Componente principal da aplicação.
 * Renderiza o sistema de rotas via <AppRoutes />.
 */
export default function App() {
  return( 
    <>
      <AppRoutes />
      <ToastContainer />
    </>
  );
}
