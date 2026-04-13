// frontend/src/services/integrations/source.service.ts

import axios from "axios";
import { serviceHeaders } from "../azure-api/headers";
import type { SourceInstance, FetchType, SourceInstanceRaw } from "../../types/source.types";
import { FETCH_TYPE_TO_NUM, mapRawToInstance } from "../../types/source.types";

const BASE = import.meta.env.VITE_CUSTOMERS_API_URL;
const SOURCES = `${BASE}/api/customers/sources`;

// --------------- public API ---------------

export async function getSourceInstances(
  product: string,
): Promise<SourceInstance[]> {
  const { data } = await axios.get<SourceInstanceRaw[]>(SOURCES, {
    headers: serviceHeaders(),
    params: { product },
  });
  return data.map(mapRawToInstance);
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
  const body = {
    product: data.product,
    vendor: data.vendor,
    fetchType: FETCH_TYPE_TO_NUM[data.fetchType],
    description: data.description,
    active: data.active,
    apiUrl: data.fetchType === "Pull" ? (data.apiUrl ?? null) : null,
    apiToken: data.fetchType === "Pull" ? (data.apiToken ?? null) : null,
  };
  const { data: raw } = await axios.post<SourceInstanceRaw>(SOURCES, body, {
    headers: { ...serviceHeaders(), "Content-Type": "application/json" },
  });
  return mapRawToInstance(raw);
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
  const body: Record<string, unknown> = {};
  if (data.description !== undefined) body.description = data.description;
  if (data.active !== undefined) body.active = data.active;
  if (data.apiUrl !== undefined) body.apiUrl = data.apiUrl;
  if (data.apiToken !== undefined) body.apiToken = data.apiToken;

  const { data: raw } = await axios.put<SourceInstanceRaw>(
    `${SOURCES}/${id}`,
    body,
    { headers: { ...serviceHeaders(), "Content-Type": "application/json" } },
  );
  return mapRawToInstance(raw);
}

export async function deleteSourceInstance(id: string): Promise<void> {
  await axios.delete(`${SOURCES}/${id}`, {
    headers: serviceHeaders(),
  });
}

export async function toggleSourceInstance(
  id: string,
  active: boolean,
): Promise<SourceInstance> {
  const { data: raw } = await axios.patch<SourceInstanceRaw>(
    `${SOURCES}/${id}/toggle`,
    { active },
    { headers: { ...serviceHeaders(), "Content-Type": "application/json" } },
  );
  return mapRawToInstance(raw);
}

export async function regeneratePushToken(id: string): Promise<string> {
  const { data: raw } = await axios.post<SourceInstanceRaw>(
    `${SOURCES}/${id}/regenerate-token`,
    null,
    { headers: serviceHeaders() },
  );
  return raw.pushToken ?? "";
}
