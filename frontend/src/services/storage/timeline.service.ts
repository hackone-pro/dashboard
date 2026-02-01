import axios from "axios";
import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ============================
   TIPOS
============================ */
export type StorageTimelineItem = {
  date: string;    // yyyy-mm-dd
  used: number;    // GB (delta diário)
  deleted: number; // GB
};

export type StorageTimelineResponse = {
  totalCapacity: number;
  totalUsed: number;
  usagePercent: number; 
  series: StorageTimelineItem[];
};


/* ============================
   SERVICE
============================ */
export async function getStorageTimeline(): Promise<StorageTimelineResponse> {
  const token = getToken();

  const response = await axios.get<StorageTimelineResponse>(
    `${API_URL}/api/storage/timeline`,
    {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    }
  );

  return response.data;
}
