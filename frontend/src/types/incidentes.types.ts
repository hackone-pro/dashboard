// src/types/incidente.types.ts

import type { Incidente as ServiceIncidente } from "../services/iris/cases.service";

export type PageIncidente = ServiceIncidente & {
  owner?: string;
  owner_name?: string;
  opened_by?: string;
  state_name?: string;
  case_close_date?: string;
  case_uuid?: string;
  case_soc_id?: string;
};
