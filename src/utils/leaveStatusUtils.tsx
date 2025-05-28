import Badge from '../components/ui/Badge';

// Type for leave request status
export type LeaveRequestStatus = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "cancelled" 
  | "partially_approved"
  | "pending_deletion";

// Type for metadata
export interface LeaveRequestMetadata {
  currentApprovalLevel?: number;
  requiredApprovalLevels?: number[];
  approvalHistory?: any[];
  [key: string]: any;
}

/**
 * Renders a status badge for leave requests
 * @param status The leave request status
 * @param metadata Optional metadata for partially approved requests
 * @returns JSX element with appropriate badge
 */
export const renderStatusBadge = (status: string, metadata?: LeaveRequestMetadata) => {
  // If it's partially approved and has metadata, show the approval level status
  if (status === "partially_approved" && metadata) {
    const currentLevel = metadata.currentApprovalLevel || 0;
    
    return (
      <div className="flex flex-col items-end">
        <Badge variant="warning">Partially Approved</Badge>
        <span className="text-xs text-gray-600 mt-1">
          L-{currentLevel} approved, L-{currentLevel + 1} pending
        </span>
      </div>
    );
  }
  
  switch (status) {
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "approved":
      return <Badge variant="success">Approved</Badge>;
    case "rejected":
      return <Badge variant="danger">Rejected</Badge>;
    case "cancelled":
      return <Badge variant="default">Cancelled</Badge>;
    case "partially_approved":
      return <Badge variant="warning">Partially Approved</Badge>;
    case "pending_deletion":
      return <Badge variant="warning">Pending Deletion</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

/**
 * Determines the approval level based on user role
 * @param userRole The user's role
 * @param hasCustomAdminRole Whether the user has custom admin permissions
 * @returns Numeric approval level (0-5)
 */
export const getApprovalLevel = (
  userRole: string,
  hasCustomAdminRole: boolean = false
): number => {
  const isTeamLead = userRole === "team_lead";
  const isManager = userRole === "manager";
  const isHR = userRole === "hr";
  const isAdmin = userRole === "admin";
  const isSuperAdmin = userRole === "super_admin";
  
  // Assign approval levels based on role hierarchy
  if (isTeamLead) return 1;
  if (isManager) return 2;
  if (isHR) return 3;
  if (isAdmin || hasCustomAdminRole) return 4;
  if (isSuperAdmin) return 5;
  return 0;
};

/**
 * Checks if a user can approve a specific leave request
 * @param userRole The user's role
 * @param hasCustomAdminRole Whether the user has custom admin permissions
 * @param requestStatus The leave request status
 * @param metadata The leave request metadata
 * @param requestUserRole Optional: The role of the user who made the request
 * @returns Boolean indicating if the user can approve the request
 */
export const canApproveRequest = (
  userRole: string,
  hasCustomAdminRole: boolean = false,
  requestStatus: string,
  metadata?: LeaveRequestMetadata,
  requestUserRole?: string
): boolean => {
  const userApprovalLevel = getApprovalLevel(userRole, hasCustomAdminRole);
  const isAdmin = userRole === "admin";
  const isSuperAdmin = userRole === "super_admin";
  const isManager = userRole === "manager";
  const isHR = userRole === "hr";
  
  // If user has no approval level, they can't approve anything
  if (userApprovalLevel === 0) return false;
  
  // Define the approval workflow based on requester's role
  const getNextApprovalLevel = (requesterRole?: string): number => {
    switch (requesterRole) {
      case "team_lead":
        // Team Lead requests skip level 1 (Team Lead) and go to level 2 (Manager)
        return 2;
      case "manager":
        // Manager requests skip levels 1-2 and go to level 3 (HR)
        return 3;
      case "hr":
        // HR requests skip levels 1-3 and go to level 4 (Admin)
        return 4;
      default:
        // Regular employee requests start at level 1 (Team Lead)
        return 1;
    }
  };
  
  // Super admins and admins can approve any request
  if (isSuperAdmin || isAdmin || hasCustomAdminRole) return true;
  
  // Handle hierarchical approval flow based on requestUserRole
  if (requestStatus === "pending") {
    const requiredApprovalLevel = getNextApprovalLevel(requestUserRole);
    
    // Check if the current user's approval level matches what's required for this request
    if (userApprovalLevel === requiredApprovalLevel) {
      return true;
    }
    
    // Special case handling for specific role combinations
    if (requestUserRole === "team_lead" && isManager) return true;
    if (requestUserRole === "manager" && isHR) return true;
    if (requestUserRole === "hr" && (isAdmin || isSuperAdmin)) return true;
    
    return false;
  }
  
  // For partially approved requests, check if the user's level matches the next required level
  if (requestStatus === "partially_approved" && metadata) {
    const currentApprovalLevel = metadata.currentApprovalLevel || 0;
    const nextRequiredLevel = currentApprovalLevel + 1;
    
    // If the request already has some approvals, check if this user is the next in line
    if (userApprovalLevel === nextRequiredLevel) {
      return true;
    }
    
    // Special case handling for specific role combinations in partially approved state
    if (requestUserRole === "team_lead" && isManager && nextRequiredLevel === 2) return true;
    if (requestUserRole === "manager" && isHR && nextRequiredLevel === 3) return true;
    if (requestUserRole === "hr" && (isAdmin || isSuperAdmin) && nextRequiredLevel === 4) return true;
    
    return false;
  }
  
  return false;
};