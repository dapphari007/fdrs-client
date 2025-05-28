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
    const response = await api.post("/api/workflow-levels", levelData);
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
    
    console.log('Fetching workflow levels with URL:', `/api/workflow-levels${params.toString() ? `?${params.toString()}` : ''}`);
    const response = await api.get(`/api/workflow-levels${params.toString() ? `?${params.toString()}` : ''}`);
    console.log('Workflow levels response:', response.data);
    return response.data.workflowLevels || [];
  } catch (error) {
    console.error('Error fetching workflow levels:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

export const getWorkflowLevelById = async (id: string) => {
  try {
    const response = await api.get(`/api/workflow-levels/${id}`);
    return response.data.workflowLevel;
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
    const response = await api.put(`/api/workflow-levels/${id}`, levelData);
    return response.data;
  } catch (error) {
    console.error(`Error updating workflow level with ID ${id}:`, error);
    throw error;
  }
};

export const deleteWorkflowLevel = async (id: string) => {
  try {
    const response = await api.delete(`/api/workflow-levels/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting workflow level with ID ${id}:`, error);
    throw error;
  }
};

export const toggleWorkflowLevelStatus = async (id: string) => {
  try {
    const response = await api.patch(`/api/workflow-levels/${id}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling workflow level status with ID ${id}:`, error);
    throw error;
  }
};

export const resetWorkflowLevelsToDefault = async () => {
  try {
    const response = await api.post('/api/workflow-levels/reset-defaults');
    return response.data;
  } catch (error) {
    console.error('Error resetting workflow levels to default:', error);
    throw error;
  }
};

export const getWorkflowLevelsForApprovalWorkflow = async () => {
  try {
    const response = await api.get('/api/workflow-levels/for-approval-workflow');
    return response.data.workflowLevels || [];
  } catch (error) {
    console.error('Error fetching workflow levels for approval workflow:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};