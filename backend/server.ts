// backend/server.ts
import express from 'express';
import cors from 'cors';
import preferenciasRoutes from './routes/preferencias';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/preferencias', preferenciasRoutes);

// Inicializa o servidor
app.listen(3001, () => {
  console.log('✅ API rodando em http://localhost:3001');
});