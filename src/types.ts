export interface Viewing {
  id: string | null;
  name: string;
  location: string;
  date_and_time: string;
  max_attendees: number;
  attending: number;
}

export interface Lead {
  id: string | null;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Invite {
  id: string | null;
  status: string;
}

export interface InviteStatus {
  lead_id: string;
  status: "send_email" | "invited" | "accepted" | "attended" | "did_not_show";
}

export interface AppConfig {
  PORT: number;
  ENDPOINT: string;
  ENDPOINT_FOR_EMAIL: string;
}
