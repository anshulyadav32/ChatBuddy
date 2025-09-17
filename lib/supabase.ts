// Re-export everything from utils for backward compatibility
export * from '../utils/prisma';
// export * from '../utils/auth'; // Commented out due to export conflicts

// Legacy exports for compatibility
export { db as supabase } from '../utils/prisma';