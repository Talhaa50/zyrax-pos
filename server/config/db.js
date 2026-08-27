// DEPRECATED: Supabase has been replaced with local SQLite database
// This file is kept for backwards compatibility but is no longer used
// All database operations now go through server/config/database.js

export const supabase = null;

export function isSupabaseConfigured() {
  return false;
}
