/**
 * LearnWorlds Integration
 *
 * This module provides integration with LearnWorlds LMS for:
 * - SSO Authentication
 * - Course enrollment checking
 * - Access control based on course purchases
 */

export { learnworlds, LearnWorldsClient } from './client';
export {
  checkToolAccess,
  checkDashboardAccess,
  checkAdminAccess,
  getUserAccessibleTools,
  syncLearnWorldsUser,
} from './access-control';
export type {
  LearnWorldsConfig,
  LearnWorldsUser,
  LearnWorldsProduct,
  LearnWorldsEnrollment,
  LearnWorldsApiResponse,
  SSOTokenPayload,
  AccessCheckResult,
} from './types';
