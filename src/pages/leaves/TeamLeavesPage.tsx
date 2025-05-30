import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTeamLeaveRequests,
} from "../../services/leaveRequestService";
import { LeaveRequest } from "../../types";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Textarea from "../../components/ui/Textarea";
import { formatDate } from "../../utils/dateUtils";

import { useAuth } from "../../context/AuthContext";
import { renderStatusBadge as renderStatusBadgeUtil, getApprovalLevel as getApprovalLevelUtil, canApproveRequest as canApproveRequestUtil } from "../../utils/leaveStatusUtils";
import ApprovalWorkflowModal from "../../components/leaves/ApprovalWorkflowModal";
import { useLeaveFilters } from "../../hooks/useLeaveFilters";
import { useTeamLeaveRequestHandlers } from "../../hooks/useTeamLeaveRequestHandlers";

const TeamLeavesPage: React.FC = () => {
  const { user } = useAuth();
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  
  // Use the shared leave filters hook
  const {
    selectedYear,
    setSelectedYear,
    selectedStatus,
    setSelectedStatus,
    yearOptions,
    statusOptions
  } = useLeaveFilters();
  
  // Default to "pending" status for team leaves
  React.useEffect(() => {
    if (selectedStatus === 'all') {
      setSelectedStatus('pending');
    }
  }, []);

  // Determine user role for approval level
  const userRole = user?.role || "";
  
  // Check for custom admin roles
  const hasCustomAdminRole = user?.roleObj?.permissions?.includes('admin');

  // Get approval level using the shared utility
  const getApprovalLevel = () => {
    return getApprovalLevelUtil(userRole, hasCustomAdminRole);
  };
  
  // Check if the current user can approve a specific leave request using the shared utility
  const canApproveRequest = (request: LeaveRequest) => {
    // First check if this is the user's own request - users shouldn't approve their own requests
    if (user?.id === request.userId) {
      return false;
    }
    
    // Get the current user's approval level
    const userApprovalLevel = getApprovalLevel();
    
    // For pending requests, check if the user's level matches the required first level
    if (request.status === 'pending') {
      // Log for debugging
      console.log('Checking initial approval for pending request:', {
        userRole,
        userApprovalLevel,
        requestStatus: request.status,
        metadata: request.metadata,
        requestUserRole: request.user?.role
      });
      
      // If there's a custom approval workflow defined
      if (request.metadata && request.metadata.requiredApprovalLevels && request.metadata.requiredApprovalLevels.length > 0) {
        // Get the first required approval level
        const firstRequiredLevel = Math.min(...request.metadata.requiredApprovalLevels);
        console.log(`First required approval level: ${firstRequiredLevel}, user level: ${userApprovalLevel}`);
        
        // Check for special cases based on the request user's role
        if (request.user?.role) {
          // If request is from a Manager and approver is HR
          if (request.user.role === 'manager' && userRole === 'hr') {
            console.log('HR can approve manager request');
            return true;
          }
          
          // If request is from HR and approver is Super Admin
          if (request.user.role === 'hr' && (userRole === 'super_admin' || userRole === 'admin')) {
            console.log('Super Admin can approve HR request');
            return true;
          }
          
          // If request is from a Team Lead and approver is a Manager
          if (request.user.role === 'team_lead' && userRole === 'manager') {
            console.log('Manager can approve team lead request');
            return true;
          }
        }
        
        // User can approve if their level matches the first required level
        return userApprovalLevel === firstRequiredLevel;
      } else {
        // Check if the request is from a team lead and the current user is a manager
        if (request.user?.role === 'team_lead' && userRole === 'manager') {
          console.log('Manager can approve team lead request');
          return true;
        }
        
        // Check if the request is from a manager and the current user is HR
        if (request.user?.role === 'manager' && userRole === 'hr') {
          console.log('HR can approve manager request');
          return true;
        }
        
        // Check if the request is from HR and the current user is Super Admin
        if (request.user?.role === 'hr' && (userRole === 'super_admin' || userRole === 'admin')) {
          console.log('Super Admin can approve HR request');
          return true;
        }
        
        // If no custom workflow, only users with approval level 1 (team leads) can approve initial requests
        return userApprovalLevel === 1;
      }
    }
    
    // For partially approved requests, check if the user's level matches the next required level
    if (request.status === 'partially_approved' && request.metadata) {
      const currentApprovalLevel = request.metadata.currentApprovalLevel || 0;
      
      // If there's a custom approval workflow defined
      if (request.metadata.requiredApprovalLevels && request.metadata.requiredApprovalLevels.length > 0) {
        // Sort the required levels to ensure they're in ascending order
        const sortedLevels = [...request.metadata.requiredApprovalLevels].sort((a, b) => a - b);
        
        // Find the next required level in the workflow
        const nextRequiredLevel = sortedLevels.find(level => level > currentApprovalLevel);
        
        // Log for debugging
        console.log('Checking next level approval for partially approved request:', {
          userRole,
          userApprovalLevel,
          currentApprovalLevel,
          nextRequiredLevel,
          requiredLevels: sortedLevels,
          requestStatus: request.status,
          requestUserRole: request.user?.role
        });
        
        // Check for special cases based on the request user's role
        if (request.user?.role) {
          // If request is from a Manager and approver is HR
          if (request.user.role === 'manager' && userRole === 'hr') {
            console.log('HR can approve manager request in partially approved state');
            return true;
          }
          
          // If request is from HR and approver is Super Admin
          if (request.user.role === 'hr' && (userRole === 'super_admin' || userRole === 'admin')) {
            console.log('Super Admin can approve HR request in partially approved state');
            return true;
          }
          
          // If request is from a Team Lead and approver is a Manager
          if (request.user.role === 'team_lead' && userRole === 'manager') {
            console.log('Manager can approve team lead request in partially approved state');
            return true;
          }
        }
        
        // User can approve if their level matches the next required level
        return userApprovalLevel === nextRequiredLevel;
      } else {
        // Check if the request is from a team lead and the current user is a manager
        if (request.user?.role === 'team_lead' && userRole === 'manager') {
          console.log('Manager can approve team lead request');
          return true;
        }
        
        // Check if the request is from a manager and the current user is HR
        if (request.user?.role === 'manager' && userRole === 'hr') {
          console.log('HR can approve manager request in default workflow');
          return true;
        }
        
        // Check if the request is from HR and the current user is Super Admin
        if (request.user?.role === 'hr' && (userRole === 'super_admin' || userRole === 'admin')) {
          console.log('Super Admin can approve HR request in default workflow');
          return true;
        }
        
        // If no custom workflow, use the default sequential workflow
        const nextRequiredLevel = currentApprovalLevel + 1;
        
        // Log for debugging
        console.log('Using default sequential workflow for partially approved request:', {
          userRole,
          userApprovalLevel,
          currentApprovalLevel,
          nextRequiredLevel,
          requestStatus: request.status
        });
        
        // User can approve if their level matches the next required level
        return userApprovalLevel === nextRequiredLevel;
      }
    }
    
    // For pending deletion requests, admins and super admins can approve
    if (request.status === 'pending_deletion') {
      return userRole === 'admin' || userRole === 'super_admin' || hasCustomAdminRole;
    }
    
    // Default to the utility function for any other cases
    return canApproveRequestUtil(userRole, hasCustomAdminRole, request.status, request.metadata);
  };

  // Check if user has permission to view team leaves
  const hasTeamLeavePermission = 
    user?.role === "manager" || 
    user?.role === "team_lead" || 
    user?.role === "hr" || 
    user?.role === "super_admin" || 
    user?.role === "admin" ||
    user?.dashboardType === "manager" ||
    user?.dashboardType === "team_lead" ||
    user?.dashboardType === "hr" ||
    user?.roleObj?.permissions?.includes('view_team_leaves');

  // Fetch team leave requests
  const { data, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ["teamLeaveRequests", selectedYear, selectedStatus],
    queryFn: async () => {
      try {
        // If status is "pending", also include "partially_approved" status
        // to show leave requests that need approval at higher levels
        if (selectedStatus === "pending") {
          return await getTeamLeaveRequests({
            year: selectedYear,
            status: "pending_approval", // This is a special status that will fetch both pending and partially_approved
          });
        } else {
          return await getTeamLeaveRequests({
            year: selectedYear,
            status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
          });
        }
      } catch (err) {
        console.error("Error fetching team leave requests:", err);
        // Return empty data instead of throwing, with the same structure as GetLeaveRequestsResponse
        return { leaveRequests: [], count: 0 };
      }
    },
    enabled: hasTeamLeavePermission, // Only run query if user has permission
    retry: 1,
  });
  
  // Use the shared handlers hook
  const {
    error,
    setError,
    successMessage,
    setSuccessMessage,
    actionLeaveId,
    setActionLeaveId,
    comments,
    setComments,
    isApproving,
    isRejecting,
    isApprovingDeletion,
    isRejectingDeletion,
    handleUpdateStatus,
    handleApproveDeleteRequest,
    handleRejectDeleteRequest
  } = useTeamLeaveRequestHandlers({ refetch });
  
  // Handle view approval workflow
  const handleViewApprovalWorkflow = (leaveRequest: LeaveRequest) => {
    setSelectedLeaveRequest(leaveRequest);
    setIsApprovalModalOpen(true);
  };

  // Helper function to render leave status badge using the shared utility
  const renderStatusBadge = renderStatusBadgeUtil;

  // Use the shared approval workflow modal component

  // If user doesn't have permission, show a message
  if (!hasTeamLeavePermission) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Team Leave Requests
        </h1>
        <Card>
          <div className="py-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8a3 3 0 00-3-3H6a3 3 0 00-3 3v1m12-1v1m0 0v1m0-1h2m-2 0h-2" />
            </svg>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Permission Required</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              You don't have permission to view team leave requests. Please contact your administrator if you believe this is an error.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Team Leave Requests
        </h1>
        <Badge variant="primary" className="text-sm">
          Approval Level: {getApprovalLevel()}
        </Badge>
      </div>
      
      <ApprovalWorkflowModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        leaveRequest={selectedLeaveRequest}
      />

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {fetchError && (
        <Alert
          variant="error"
          message="Failed to load team leave requests. Please try again later."
          onClose={() => {}}
          className="mb-6"
        />
      )}

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-6"
        />
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Year
            </label>
            <select
              id="year"
              className="form-input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              className="form-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.value === 'pending' ? 'Pending Approval' : option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.leaveRequests && data.leaveRequests.length > 0 ? (
            data.leaveRequests.map((request: LeaveRequest) => (
              <Card 
                key={request.id} 
                className={request.status === "partially_approved" ? "border-l-4 border-l-blue-500" : ""}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.user?.firstName} {request.user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Leave Type:</span>{" "}
                      {request.leaveType?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Duration:</span>{" "}
                      {request.startDate ? formatDate(request.startDate) : 'N/A'} -{" "}
                      {request.endDate ? formatDate(request.endDate) : 'N/A'} ({request.numberOfDays}{" "}
                      day(s))
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Type:</span>{" "}
                      {request.requestType.replace("_", " ")}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Reason:</span>{" "}
                        {request.reason}
                      </p>
                    )}
                    
                    {request.status === "partially_approved" && request.metadata && (
                      <p className={`text-sm mt-1 ${canApproveRequest(request) ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        {canApproveRequest(request) 
                          ? `This request needs your approval as Step ${(request.metadata.currentApprovalLevel || 0) + 1}`
                          : `This request needs Step ${(request.metadata.currentApprovalLevel || 0) + 1} approval`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderStatusBadge(request.status, request.metadata)}

                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewApprovalWorkflow(request)}
                      >
                        View Status
                      </Button>
                      
                      {(((request.status === "pending" || request.status === "partially_approved") && canApproveRequest(request)) || request.status === "pending_deletion") && (
                        <>
                          {actionLeaveId !== request.id ? (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => setActionLeaveId(request.id)}
                            >
                              {request.status === "pending_deletion" 
                                ? "Review Deletion" 
                                : request.status === "partially_approved" && request.metadata?.requiredApprovalLevels
                                  ? `Approve/Reject as Step ${(request.metadata?.currentApprovalLevel || 0) + 1}` 
                                  : request.status === "pending" && request.metadata?.requiredApprovalLevels
                                    ? `Approve/Reject as Step 1`
                                    : "Approve/Reject"}
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setActionLeaveId(null);
                                setComments("");
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {actionLeaveId === request.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <Textarea
                      label="Comments (optional)"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add comments for the employee"
                      rows={2}
                    />
                    <div className="mt-4 flex justify-end space-x-2">
                      {request.status === "pending_deletion" ? (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={isRejectingDeletion}
                            onClick={() => handleRejectDeleteRequest(request.id)}
                          >
                            Reject Deletion
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            isLoading={isApprovingDeletion}
                            onClick={() => handleApproveDeleteRequest(request.id)}
                          >
                            Approve Deletion
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={isRejecting}
                            onClick={() => handleUpdateStatus(request.id, "rejected")}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            isLoading={isApproving}
                            onClick={() => handleUpdateStatus(request.id, "approved")}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-8">
                No leave requests found for the selected filters.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamLeavesPage;
