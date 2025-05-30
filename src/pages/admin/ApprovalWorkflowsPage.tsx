import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getAllApprovalWorkflows,
  deleteApprovalWorkflow,
  updateApprovalWorkflow,
  ApprovalWorkflow,
  initializeDefaultWorkflows,
} from "../../services/approvalWorkflowService";
import { useAuth } from "../../context/AuthContext";
import Alert from "../../components/ui/Alert";
import { Tab } from "@headlessui/react";

interface ApprovalWorkflowsPageProps {
  isTabContent?: boolean;
}

export default function ApprovalWorkflowsPage({ isTabContent = false }: ApprovalWorkflowsPageProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [workflowToToggle, setWorkflowToToggle] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRoleTab, setSelectedRoleTab] = useState(0);
  
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const queryClient = useQueryClient();

  // Define role tabs for filtering
  const roleTabs = [
    { name: "All Workflows", roles: [] },
    { name: "Team Lead", roles: ["team_lead"] },
    { name: "Manager", roles: ["manager"] },
    { name: "HR", roles: ["hr"] }
  ];

  const {
    data: workflows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["approvalWorkflows", selectedRoleTab],
    queryFn: () => getAllApprovalWorkflows({ 
      roles: roleTabs[selectedRoleTab].roles
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApprovalWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvalWorkflows"] });
      setIsDeleteModalOpen(false);
      setWorkflowToDelete(null);
      setSuccessMessage("Workflow deleted successfully");
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || "Failed to delete workflow");
    }
  });
  
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Only send the isActive field to avoid validation issues with other fields
      setWorkflowToToggle(id);
      return updateApprovalWorkflow(id, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvalWorkflows"] });
      setSuccessMessage("Workflow status updated successfully");
      setWorkflowToToggle(null);
    },
    onError: (error: any) => {
      console.error("Error toggling workflow status:", error);
      setErrorMessage(error.response?.data?.message || "Failed to update workflow status");
      setWorkflowToToggle(null);
    }
  });
  
  const resetMutation = useMutation({
    mutationFn: initializeDefaultWorkflows,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvalWorkflows"] });
      setSuccessMessage("Workflows have been reset to default successfully");
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || "Failed to reset workflows");
    }
  });

  const handleDeleteClick = (id: string) => {
    setWorkflowToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (workflowToDelete) {
      deleteMutation.mutate(workflowToDelete);
    }
  };
  
  const handleToggleStatus = (id: string, isActive: boolean) => {
    console.log(`Toggling workflow ${id} to ${isActive ? 'active' : 'inactive'}`);
    toggleStatusMutation.mutate({ id, isActive });
  };
  
  const handleResetWorkflows = () => {
    if (window.confirm('Are you sure you want to reset all workflows to default? This will delete any custom workflows.')) {
      resetMutation.mutate();
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );

  if (error)
    return <div className="text-red-500">Error loading approval workflows</div>;

  return (
    <div className={isTabContent ? "" : "container mx-auto px-4 py-8"}>
      <div className="flex justify-between items-center mb-6">
        {!isTabContent && <h1 className="text-2xl font-bold">Approval Workflows</h1>}
        <div className={`flex space-x-2 ${isTabContent ? "ml-auto" : ""}`}>
          {isSuperAdmin && (
            <button
              onClick={handleResetWorkflows}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Resetting..." : "Reset to Default"}
            </button>
          )}
          {!isTabContent && (
            <Link
              to="/workflow-categories"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Manage Categories
            </Link>
          )}
          <Link
            to="/approval-workflows/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create New Workflow
          </Link>
        </div>
      </div>
      
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-6"
        />
      )}
      
      {errorMessage && (
        <Alert
          variant="error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
          className="mb-6"
        />
      )}
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
        <h2 className="text-lg font-medium text-blue-800 mb-2">About Approval Workflows</h2>
        <p className="text-blue-700">
          Approval workflows define the approval process for leave requests based on the number of days requested.
          Each workflow specifies which roles are required to approve the request at each level.
        </p>
        <p className="text-blue-700 mt-2">
          These workflows are automatically initialized when the server starts, ensuring that there are always
          default workflows available in the system.
        </p>
      </div>
      
      {/* Role-based tabs - Only show for super admin */}
      {isSuperAdmin && (
        <div className="mb-6">
          <Tab.Group selectedIndex={selectedRoleTab} onChange={setSelectedRoleTab}>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/10 p-1">
              {roleTabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                    ${
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
                    }`
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
          </Tab.Group>
          
          <div className="mt-3">
            {selectedRoleTab > 0 && (
              <div className="bg-white border border-gray-200 rounded-md p-4 mt-2">
                <h3 className="font-medium text-gray-800 mb-2">{roleTabs[selectedRoleTab].name} Role Workflows</h3>
                <p className="text-sm text-gray-600">
                  Showing workflows that include {roleTabs[selectedRoleTab].name} role in their approval process.
                </p>
                
                {selectedRoleTab === 1 && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Team Lead:</span> Typically approves leave requests from team members before they are escalated to higher management.
                  </p>
                )}
                
                {selectedRoleTab === 2 && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Manager:</span> Reviews leave requests that have been approved by Team Leads or directly submitted by employees without Team Leads.
                  </p>
                )}
                
                {selectedRoleTab === 3 && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">HR:</span> Usually involved in the final approval stage, especially for longer leave durations or special leave types.
                  </p>
                )}
                
                <p className="text-sm text-gray-600 mt-2">
                  Total workflows with this role: <span className="font-medium">{workflows.length}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          {selectedRoleTab > 0 ? (
            <div>
              <p className="text-gray-600">No approval workflows found for {roleTabs[selectedRoleTab].name} role.</p>
              <p className="text-sm text-gray-500 mt-2">
                Try selecting a different role or create a new workflow that includes this role.
              </p>
              <Link
                to="/approval-workflows/create"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Create new workflow
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">No approval workflows found.</p>
              <Link
                to="/approval-workflows/create"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Create your first workflow
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Days Range</th>
                <th className="py-3 px-4 text-left">Approval Steps Count</th>
                {selectedRoleTab > 0 && isSuperAdmin && (
                  <th className="py-3 px-4 text-left">Role Involvement</th>
                )}
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Created At</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow: ApprovalWorkflow) => (
                <tr
                  key={workflow.id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{workflow.name}</td>
                  <td className="py-3 px-4">
                    {workflow.minDays === 0.5 ? '½' : workflow.minDays} - {workflow.maxDays === 365 ? '∞' : workflow.maxDays} days
                  </td>
                  <td className="py-3 px-4">
                    {workflow.approvalLevels
                      ? workflow.approvalLevels.length
                      : 0}
                  </td>
                  {selectedRoleTab > 0 && isSuperAdmin && (
                    <td className="py-3 px-4">
                      {workflow.approvalLevels
                        .filter(level => level.roles?.some(role => 
                          roleTabs[selectedRoleTab].roles.includes(role)
                        ))
                        .map(level => (
                          <div key={level.level} className="mb-1">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">
                              Level {level.level}
                            </span>
                            {level.approverType ? 
                              <span className="text-xs text-gray-600">({level.approverType})</span> : 
                              <span className="text-xs text-gray-600">
                                ({level.roles?.join(', ')})
                              </span>
                            }
                          </div>
                        ))}
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      workflow.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 flex space-x-2">
                    <Link
                      to={`/approval-workflows/edit/${workflow.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(workflow.id, !workflow.isActive)}
                      className={`${
                        workflow.isActive 
                          ? 'text-orange-600 hover:text-orange-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                      disabled={toggleStatusMutation.isPending && workflowToToggle === workflow.id}
                    >
                      {(toggleStatusMutation.isPending && workflowToToggle === workflow.id)
                        ? 'Updating...' 
                        : (workflow.isActive ? 'Deactivate' : 'Activate')}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(workflow.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete this approval workflow? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
