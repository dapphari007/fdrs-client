import api from "./api";
import { UserRole } from "../types/index";

export interface WorkflowLevel {
  id: string;
  level: number;
  name: string;
  description: string;
  approverType: string;
  fallbackRoles: UserRole[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const createWorkflowLevel = async (
  levelData: Omit<WorkflowLevel, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const response = await api.post("/workflow-levels", levelData);
    return response.data;
  } catch (error) {
    console.error('Error creating workflow level:', error);
    throw error;
  }
};

export const getAllWorkflowLevels = async (filters?: { isActive?: boolean }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append("isActive", String(filters.isActive));
    }
    
    console.log('Fetching workflow levels with URL:', `/workflow-levels${params.toString() ? `?${params.toString()}` : ''}`);
    const response = await api.get(`/workflow-levels${params.toString() ? `?${params.toString()}` : ''}`);
    console.log('Workflow levels response:', response.data);
    
    // Ensure workflowLevels is an array with proper fallbackRoles
    const workflowLevels = response.data.workflowLevels || [];
    
    // Normalize the data to ensure fallbackRoles is always an array
    return workflowLevels.map((level: Partial<WorkflowLevel>) => {
      // Create a new object with all properties from level
      const normalizedLevel = { ...level };
      
      // Ensure fallbackRoles is always an array, even if it's null, undefined, or not an array
      normalizedLevel.fallbackRoles = Array.isArray(normalizedLevel.fallbackRoles) 
        ? normalizedLevel.fallbackRoles 
        : [];
        
      return normalizedLevel;
    });
  } catch (error) {
    console.error('Error fetching workflow levels:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

export const getWorkflowLevelById = async (id: string) => {
  try {
    const response = await api.get(`/workflow-levels/${id}`);
    
    // Ensure the workflowLevel has fallbackRoles as an array
    if (response.data.workflowLevel) {
      // Create a new object with all properties from workflowLevel
      const normalizedLevel = { ...response.data.workflowLevel };
      
      // Ensure fallbackRoles is always an array, even if it's null, undefined, or not an array
      normalizedLevel.fallbackRoles = Array.isArray(normalizedLevel.fallbackRoles) 
        ? normalizedLevel.fallbackRoles 
        : [];
        
      return normalizedLevel;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching workflow level with ID ${id}:`, error);
    throw error;
  }
};

export const updateWorkflowLevel = async (
  id: string,
  levelData: Partial<Omit<WorkflowLevel, "id" | "createdAt" | "updatedAt">>
) => {
  try {
    const response = await api.put(`/workflow-levels/${id}`, levelData);
    return response.data;
  } catch (error) {
    console.error(`Error updating workflow level with ID ${id}:`, error);
    throw error;
  }
};

export const deleteWorkflowLevel = async (id: string) => {
  try {
    const response = await api.delete(`/workflow-levels/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting workflow level with ID ${id}:`, error);
    throw error;
  }
};

export const toggleWorkflowLevelStatus = async (id: string) => {
  try {
    const response = await api.patch(`/workflow-levels/${id}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling workflow level status with ID ${id}:`, error);
    throw error;
  }
};

export const resetWorkflowLevelsToDefault = async () => {
  try {
    const response = await api.post('/workflow-levels/reset-defaults');
    return response.data;
  } catch (error) {
    console.error('Error resetting workflow levels to default:', error);
    throw error;
  }
};

export const getWorkflowLevelsForApprovalWorkflow = async () => {
  try {
    console.log('Fetching workflow levels for approval workflow...');
    const response = await api.get('/workflow-levels/for-approval-workflow');
    console.log('Workflow levels response:', response.data);
    
    // Ensure workflowLevels is an array with proper fallbackRoles
    const workflowLevels = response.data.workflowLevels || [];
    
    // Normalize the data to ensure fallbackRoles is always an array
    return workflowLevels.map((level: Partial<WorkflowLevel>) => {
      // Create a new object with all properties from level
      const normalizedLevel = { ...level };
      
      // Ensure fallbackRoles is always an array, even if it's null, undefined, or not an array
      normalizedLevel.fallbackRoles = Array.isArray(normalizedLevel.fallbackRoles) 
        ? normalizedLevel.fallbackRoles 
        : [];
        
      return normalizedLevel;
    });
  } catch (error) {
    console.error('Error fetching workflow levels for approval workflow:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};