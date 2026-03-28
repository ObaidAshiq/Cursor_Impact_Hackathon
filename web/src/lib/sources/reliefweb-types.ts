/** Minimal ReliefWeb v2 shapes; API returns more fields. */

export type ReliefWebCountry = {
  name?: string;
  value?: { name?: string };
};

export type ReliefWebFields = {
  title?: string;
  url?: string;
  body?: string;
  "body-html"?: string;
  date?: {
    original?: string;
    created?: number;
    changed?: number;
  };
  country?: ReliefWebCountry[];
  disaster?: { id?: number; name?: string };
  source?: { name?: string }[];
};

export type ReliefWebEntity = {
  id: number;
  fields?: ReliefWebFields;
};

export type ReliefWebListResponse = {
  data?: ReliefWebEntity[];
  statusCode?: number;
  message?: string;
  title?: string;
};
