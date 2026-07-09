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

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
};
