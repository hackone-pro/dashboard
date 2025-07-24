// backend/db.ts
import Database from 'better-sqlite3';

const db = new Database('db.sqlite');

// Ativa suporte a FOREIGN KEY
db.pragma('foreign_keys = ON');

// Cria a tabela de usuários (se não existir)
db.prepare(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT
  )
`).run();

// Cria a tabela de preferências (se não existir)
db.prepare(`
  CREATE TABLE IF NOT EXISTS preferencias (
    usuario_id TEXT PRIMARY KEY,
    tema TEXT,
    filtros TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )
`).run();

export default db;