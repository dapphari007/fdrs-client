import { useQuery } from "@tanstack/react-query";
import { getLeaveTypes, getLeaveType } from "../services/leaveTypeService";

export const useLeaveTypes = () => {
  return useQuery({
    queryKey: ["leaveTypes"],
    queryFn: () => getLeaveTypes(),
  });
};

export const useLeaveType = (id: string | undefined) => {
  return useQuery({
    queryKey: ["leaveType", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("Leave type ID is required");
      }
      console.log("Fetching leave type with ID:", id);
      try {
        const response = await getLeaveType(id);
        console.log("Leave type API response:", response);
        
        if (!response || !response.leaveType) {
          throw new Error("Leave type not found or invalid response format");
        }
        
        return response;
      } catch (error) {
        console.error("Error fetching leave type:", error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1,
    staleTime: 30000, // Data remains fresh for 30 seconds
  });
};
