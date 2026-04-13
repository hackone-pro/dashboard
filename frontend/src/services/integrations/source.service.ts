// frontend/src/services/integrations/source.service.ts

import type { SourceInstance, FetchType } from "../../types/source.types";

const STORAGE_KEY = "source_instances";
const SIMULATED_DELAY = 300;

// --------------- helpers ---------------

function delay(ms = SIMULATED_DELAY): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function generateId(): string {
  return crypto.randomUUID();
}

function readAll(): SourceInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(instances: SourceInstance[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
}

function findOrThrow(instances: SourceInstance[], id: string): SourceInstance {
  const inst = instances.find((i) => i.id === id);
  if (!inst) throw new Error(`Instância ${id} não encontrada`);
  return inst;
}

// --------------- public API ---------------

export async function getSourceInstances(
  product: string,
): Promise<SourceInstance[]> {
  await delay();
  return readAll().filter((i) => i.product === product);
}

export interface CreateSourcePayload {
  product: string;
  vendor: string;
  fetchType: FetchType;
  description: string;
  active: boolean;
  apiUrl?: string;
  apiToken?: string;
}

export async function createSourceInstance(
  data: CreateSourcePayload,
): Promise<SourceInstance> {
  await delay();
  const now = new Date().toISOString();
  const instance: SourceInstance = {
    id: generateId(),
    product: data.product,
    vendor: data.vendor,
    fetchType: data.fetchType,
    description: data.description,
    active: data.active,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  if (data.fetchType === "Pull") {
    instance.apiUrl = data.apiUrl ?? "";
    instance.apiToken = data.apiToken ?? "";
  } else {
    instance.pushEndpoint = `https://api.hackone.io/push/source/${instance.id}`;
    instance.pushToken = generateId();
  }

  const all = readAll();
  all.push(instance);
  writeAll(all);
  return instance;
}

export interface UpdateSourcePayload {
  description?: string;
  active?: boolean;
  apiUrl?: string;
  apiToken?: string;
}

export async function updateSourceInstance(
  id: string,
  data: UpdateSourcePayload,
): Promise<SourceInstance> {
  await delay();
  const all = readAll();
  const inst = findOrThrow(all, id);

  if (data.description !== undefined) inst.description = data.description;
  if (data.active !== undefined) inst.active = data.active;
  if (data.apiUrl !== undefined) inst.apiUrl = data.apiUrl;
  if (data.apiToken !== undefined) inst.apiToken = data.apiToken;
  inst.updatedAt = new Date().toISOString();

  writeAll(all);
  return inst;
}

export async function deleteSourceInstance(id: string): Promise<void> {
  await delay();
  const all = readAll();
  findOrThrow(all, id);
  writeAll(all.filter((i) => i.id !== id));
}

export async function toggleSourceInstance(
  id: string,
  active: boolean,
): Promise<SourceInstance> {
  return updateSourceInstance(id, { active });
}

export async function regeneratePushToken(id: string): Promise<string> {
  await delay();
  const all = readAll();
  const inst = findOrThrow(all, id);
  if (inst.fetchType !== "Push") throw new Error("Somente instâncias Push");
  inst.pushToken = generateId();
  inst.updatedAt = new Date().toISOString();
  writeAll(all);
  return inst.pushToken;
}
