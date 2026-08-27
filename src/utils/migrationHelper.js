/**
 * Migration Helper
 * Detects and cleans up legacy Supabase tokens/data
 */

const MIGRATION_FLAG = 'migration_v2_complete';

/**
 * Detect if user has old Supabase tokens that need cleanup
 */
function hasLegacyData() {
  try {
    // Check for Supabase-specific keys
    const hasSupabaseAuth = localStorage.getItem('supabase.auth.token') !== null;
    const hasSupabaseSession = Object.keys(localStorage).some(key => 
      key.includes('supabase') || key.includes('sb-')
    );
    
    // Check if migration already done
    const migrationComplete = localStorage.getItem(MIGRATION_FLAG) === 'true';
    
    return (hasSupabaseAuth || hasSupabaseSession) && !migrationComplete;
  } catch {
    return false;
  }
}

/**
 * Clean up all legacy Supabase data and mark migration complete
 */
export function runMigrationCleanup() {
  if (!hasLegacyData()) {
    return false; // No cleanup needed
  }

  console.log('[Migration] Detected legacy Supabase data - cleaning up...');

  try {
    // Remove all Supabase-related keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear current session (will force re-login with new system)
    localStorage.removeItem('retailer_session');
    localStorage.removeItem('retailer_token');

    // Mark migration complete
    localStorage.setItem(MIGRATION_FLAG, 'true');

    console.log('[Migration] Cleanup complete. Please log in with new credentials.');
    return true; // Cleanup was performed
  } catch (error) {
    console.error('[Migration] Cleanup failed:', error);
    return false;
  }
}

/**
 * Check if migration cleanup is needed and optionally run it
 */
export function checkMigrationStatus() {
  const needsCleanup = hasLegacyData();
  
  if (needsCleanup) {
    console.warn('[Migration] Legacy data detected. Call runMigrationCleanup() to clean up.');
  }
  
  return {
    needsCleanup,
    migrationComplete: !needsCleanup
  };
}

/**
 * Force a complete reset (for debugging)
 */
export function forceMigrationReset() {
  console.log('[Migration] Forcing complete reset...');
  localStorage.clear();
  console.log('[Migration] All localStorage cleared. Reload required.');
}
