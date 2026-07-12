export type AppUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  provider: string | null;
  emailVerified: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  email_verified: boolean;
  completed_onboarding_at: string | null;
  username: string | null;
  username_changed_at: string | null;
  bio: string;
  created_at: string;
  updated_at: string;
};

/** @deprecated Use UserRow — table renamed from profiles to users */
export type ProfileRow = UserRow;

export type HobbyRow = {
  id: string;
  user_id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
