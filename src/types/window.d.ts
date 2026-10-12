import type { AccountProfile, Profile } from '../lib/supabase';
export {};
declare global {
  interface Window {
    salesiaProfiles?: AccountProfile[];
    salesiaRole?: Profile['role_key'];
    salesiaCurrentUser?: { name: string; email: string; role: string; organization: string };
    salesiaOpenCreateUser?: () => void;
    salesiaRender?: () => void;
  }
}
