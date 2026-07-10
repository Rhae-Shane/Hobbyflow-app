export type PactStatus = 'active' | 'fulfilled' | 'broken';

export type UserPactRow = {
  id: string;
  user_id: string;
  hobby_id: string;
  promise_text: string;
  start_date: string;
  end_date: string;
  status: PactStatus;
  fulfilled_at: string | null;
  broken_at: string | null;
  created_at: string;
  updated_at: string;
  hobby_name?: string | null;
};
