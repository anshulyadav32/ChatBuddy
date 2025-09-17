// Re-export everything from utils for backward compatibility
export * from '../utils/database';
export * from '../utils/auth';

// Legacy exports for compatibility
export { db as supabase } from '../utils/database';