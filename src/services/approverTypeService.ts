import api from "./api";

export interface ApproverType {
  id: string;
  name: string;
  description?: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createApproverType = async (
  approverTypeData: Omit<ApproverType, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const response = await api.post("/api/approver-types", approverTypeData);
    return response.data;
  } catch (error) {
    console.error('Error creating approver type:', error);
    throw error;
  }
};

export const getAllApproverTypes = async (filters?: { isActive?: boolean }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append("isActive", String(filters.isActive));
    }
    
    console.log('Fetching approver types with URL:', `/api/approver-types${params.toString() ? `?${params.toString()}` : ''}`);
    const response = await api.get(`/api/approver-types${params.toString() ? `?${params.toString()}` : ''}`);
    console.log('Approver types response:', response.data);
    return response.data.approverTypes || [];
  } catch (error) {
    console.error('Error fetching approver types:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

export const getApproverTypeById = async (id: string) => {
  try {
    const response = await api.get(`/api/approver-types/${id}`);
    return response.data.approverType;
  } catch (error) {
    console.error(`Error fetching approver type with ID ${id}:`, error);
    throw error;
  }
};

export const updateApproverType = async (
  id: string,
  approverTypeData: Partial<Omit<ApproverType, "id" | "createdAt" | "updatedAt">>
) => {
  try {
    const response = await api.put(`/api/approver-types/${id}`, approverTypeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating approver type with ID ${id}:`, error);
    throw error;
  }
};

export const deleteApproverType = async (id: string) => {
  try {
    const response = await api.delete(`/api/approver-types/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting approver type with ID ${id}:`, error);
    throw error;
  }
};

export const toggleApproverTypeStatus = async (id: string) => {
  try {
    const response = await api.patch(`/api/approver-types/${id}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling approver type status with ID ${id}:`, error);
    throw error;
  }
};