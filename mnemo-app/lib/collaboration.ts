import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CollaboratorState {
  userId: string;
  userName: string;
  avatarColor: string;
  selectedNodeId: string | null;
  lastSeen: number;
}

export const COLLABORATOR_COLORS = ["#00D4FF", "#FF6B9D", "#FFD93D", "#A78BFA", "#6BCB77"];

export function getCollabColor(index: number): string {
  return COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length];
}
