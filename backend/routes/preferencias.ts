// backend/routes/preferencias.ts
import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// GET /api/preferencias/:id
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const stmt = db.prepare('SELECT * FROM preferencias WHERE usuario_id = ?');
  const resultado = stmt.get(id);

  res.json(resultado || {});
});

// POST /api/preferencias/:id
router.post('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { tema, filtros } = req.body;

  // Garante que o usuário exista
  db.prepare('INSERT OR IGNORE INTO usuarios (id, nome) VALUES (?, ?)').run(id, 'Usuário');

  const stmt = db.prepare(`
    INSERT INTO preferencias (usuario_id, tema, filtros)
    VALUES (?, ?, ?)
    ON CONFLICT(usuario_id) DO UPDATE SET
      tema = excluded.tema,
      filtros = excluded.filtros
  `);

  stmt.run(id, tema, JSON.stringify(filtros || {}));
  res.json({ ok: true });
});

export default router;