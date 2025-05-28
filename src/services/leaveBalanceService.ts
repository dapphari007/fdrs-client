import { get, post, put, del } from "./api";
import { LeaveBalance } from "../types";

export interface GetLeaveBalancesParams {
  year?: number;
  userId?: string;
}

export interface GetLeaveBalancesResponse {
  leaveBalances: LeaveBalance[];
  count: number;
}

export interface CreateLeaveBalanceData {
  userId: string;
  leaveTypeId: string;
  totalDays: number;
  year: number;
}

export interface BulkCreateLeaveBalanceData {
  leaveTypeId: string;
  totalDays: number;
  year: number;
}

export interface UpdateLeaveBalanceData {
  totalDays?: number;
  adjustmentReason?: string;
}

export const getMyLeaveBalances = async (
  params?: GetLeaveBalancesParams
): Promise<GetLeaveBalancesResponse> => {
  return get<GetLeaveBalancesResponse>("/leave-balances/my-balances", {
    params,
  });
};

export const getUserLeaveBalances = async (
  userId: string,
  params?: GetLeaveBalancesParams
): Promise<GetLeaveBalancesResponse> => {
  return get<GetLeaveBalancesResponse>(`/leave-balances/user/${userId}`, {
    params,
  });
};

export const getAllLeaveBalances = async (
  params?: GetLeaveBalancesParams
): Promise<LeaveBalance[]> => {
  const response = await get<{ leaveBalances: any[]; count: number }>(
    "/leave-balances",
    { params }
  );
  
  // Transform server model to client model
  const transformedBalances = (response.leaveBalances || []).map(balance => {
    // Calculate pending days from leave requests if not provided
    const pendingDays = balance.pendingDays || 0;
    
    return {
      id: balance.id,
      userId: balance.userId,
      leaveTypeId: balance.leaveTypeId,
      year: balance.year,
      // Map server 'balance' to client 'totalDays'
      totalDays: balance.balance !== undefined ? Number(balance.balance) : 0,
      // Map server 'used' to client 'usedDays'
      usedDays: balance.used !== undefined ? Number(balance.used) : 0,
      pendingDays: pendingDays,
      // Calculate remainingDays - ensure we're working with numbers
      remainingDays: balance.remainingDays !== null && balance.remainingDays !== undefined 
        ? Number(balance.remainingDays) 
        : (Number(balance.balance) + Number(balance.carryForward || 0) - Number(balance.used) - pendingDays),
      carryForwardDays: balance.carryForward !== undefined ? Number(balance.carryForward) : 0,
      user: balance.user,
      leaveType: balance.leaveType,
      createdAt: balance.createdAt,
      updatedAt: balance.updatedAt
    };
  });
  
  console.log('Transformed leave balances:', transformedBalances);
  return transformedBalances;
};

export const getLeaveBalanceById = async (
  id: string
): Promise<LeaveBalance | null> => {
  const response = await get<{ leaveBalance: any }>(
    `/leave-balances/${id}`
  );
  
  const balance = response.leaveBalance;
  if (!balance) return null;
  
  // Calculate pending days from leave requests if not provided
  const pendingDays = balance.pendingDays || 0;
  
  // Transform server model to client model
  const transformedBalance = {
    id: balance.id,
    userId: balance.userId,
    leaveTypeId: balance.leaveTypeId,
    year: balance.year,
    // Map server 'balance' to client 'totalDays'
    totalDays: balance.balance !== undefined ? Number(balance.balance) : 0,
    // Map server 'used' to client 'usedDays'
    usedDays: balance.used !== undefined ? Number(balance.used) : 0,
    pendingDays: pendingDays,
    // Calculate remainingDays - ensure we're working with numbers
    remainingDays: balance.remainingDays !== null && balance.remainingDays !== undefined 
      ? Number(balance.remainingDays) 
      : (Number(balance.balance) + Number(balance.carryForward || 0) - Number(balance.used) - pendingDays),
    carryForwardDays: balance.carryForward !== undefined ? Number(balance.carryForward) : 0,
    user: balance.user,
    leaveType: balance.leaveType,
    createdAt: balance.createdAt,
    updatedAt: balance.updatedAt
  };
  
  console.log('Transformed leave balance:', transformedBalance);
  return transformedBalance;
};

export const createLeaveBalance = async (
  data: CreateLeaveBalanceData
): Promise<LeaveBalance> => {
  const response = await post<{ leaveBalance: LeaveBalance }>(
    "/leave-balances",
    data
  );
  return response.leaveBalance;
};

export const updateLeaveBalance = async (
  id: string,
  data: UpdateLeaveBalanceData
): Promise<LeaveBalance> => {
  const response = await put<{ leaveBalance: LeaveBalance }>(
    `/leave-balances/${id}`,
    data
  );
  return response.leaveBalance;
};

export const deleteLeaveBalance = async (id: string): Promise<void> => {
  await del(`/leave-balances/${id}`);
};

export const bulkCreateLeaveBalances = async (
  data: BulkCreateLeaveBalanceData
): Promise<{
  leaveBalances: LeaveBalance[];
  created: number;
  skipped: number;
}> => {
  try {
    console.log("Bulk creating leave balances with data:", data);
    const response = await post<{
      leaveBalances: LeaveBalance[];
      created: number;
      skipped: number;
    }>("/leave-balances/bulk-create", data);
    console.log("Bulk create leave balances response:", response);
    return response;
  } catch (error: any) {
    console.error("Error bulk creating leave balances:", error);
    // Rethrow with more details for better error handling in the UI
    if (error.response?.data?.message) {
      throw new Error(`Failed to create leave balances: ${error.response.data.message}`);
    }
    throw new Error("Failed to create leave balances. Please try again later.");
  }
};

export const checkLeaveTypeBalances = async (
  leaveTypeId: string,
  year: number
): Promise<{ exists: boolean; count: number }> => {
  try {
    console.log(`Checking leave balances for leave type ${leaveTypeId} and year ${year}`);
    const response = await get<{ exists: boolean; count: number }>(
      `/leave-balances/check-type/${leaveTypeId}`,
      { params: { year } }
    );
    console.log("Check leave type balances response:", response);
    return response;
  } catch (error) {
    console.error("Error checking leave type balances:", error);
    // Return a default response instead of throwing to prevent UI errors
    return { exists: false, count: 0 };
  }
};

export const createAllLeaveBalancesForAllUsers = async (): Promise<{
  created: number;
  updated: number;
  skipped: number;
  leaveTypes: number;
  users: number;
}> => {
  const response = await post<{
    results: {
      created: number;
      updated: number;
      skipped: number;
      leaveTypes: number;
      users: number;
    };
  }>("/leave-balances/create-all-for-all-users", {});
  return response.results;
};
