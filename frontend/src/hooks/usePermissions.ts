import { useAuthStore } from "@/stores/authStore";

/**
 * Custom hook to check user permissions
 * Returns boolean values for common actions
 */
export const usePermissions = () => {
  const { checkPermission } = useAuthStore();

  return {
    canCreate: checkPermission('create'),
    canDelete: checkPermission('delete'),
    canDownload: checkPermission('download'),
    canView: checkPermission('view'),
  };
};

