import type { AccountProfile, Profile } from '../lib/supabase';
export {};
declare global {
  interface Window {
    salesiaProfiles?: AccountProfile[];
    salesiaRole?: Profile['role_key'];
    salesiaCurrentUser?: { name: string; email: string; role: string; organization: string };
    salesiaOpenCreateUser?: () => void;
    salesiaRender?: () => void;
    salesiaMaintenanceApi?: {
      load: () => Promise<{
        categories: Array<{ id: string; code: string; name: string; description: string | null; is_active: boolean }>;
        customers: Array<{ id: string; code: string; name: string; email: string | null; phone: string | null; address: string | null; segment: string; status: string; notes: string | null }>;
      }>;
      saveCategory: (id: string | null, input: { name: string; description: string; is_active: boolean }) => Promise<void>;
      saveCustomer: (id: string | null, input: { name: string; email: string; phone: string; address: string; segment: string; status: string; notes: string }) => Promise<void>;
    };
  }
}
