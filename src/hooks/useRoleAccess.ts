import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import type { Assessment, AssessmentComment } from "@/services/AssessmentApi";
import type { EventData, EventLocation } from "@/types";

type UserRole = "Network Administrator" | "Agency Administrator" | "Agent";

interface RolePermissions {
  canCreateUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  canUpdateOwnProfile: boolean;
  canUpdateRoles: boolean;
  canUpdateStatus: boolean;
  allowedRolesToAssign: UserRole[];
  canAccessLocation: boolean;
  canEditDeleteAllAssistance: boolean;
  canUpdateCategories: boolean;
  canDeleteCategories: boolean;
  canAddEventActivity: boolean;
  canUpdateEventActivity: boolean;
  canDeleteEventActivity: boolean;
  canCreateService: boolean;
  canUpdateService: boolean;
  canDeleteService: boolean;
  canManageEventTypes: boolean;
  canMergeCase: boolean;
  canManageRentalSubsidy: boolean;
  canManageOwnAgencyRentalSubsidy: boolean;
  canViewRentalSubsidy: boolean;
  canCreateAssessment: boolean;
  canManageAssessment: boolean;
  canCommentOnAssessment: boolean;
  canManageAssessmentComment: boolean;
  // → Case Outcome Permissions
  canDeleteOutcome: boolean;
  canDeleteAndEditComments: (commentUserId?: string) => boolean;
  // → Bed Assignment Permissions
  canCreateBedRequest: boolean;
  canAssignBed: boolean;
}

export const useRoleAccess = () => {
  const userData = useSelector((state: RootState) => state.user.data);

  const getRolePermissions = (): RolePermissions => {
    const userRole = userData?.propertyRole || userData?.role;

    if (!userRole) {
      return {
        canCreateUsers: false,
        canUpdateUsers: false,
        canDeleteUsers: false,
        canUpdateOwnProfile: false,
        canUpdateRoles: false,
        canUpdateStatus: false,
        allowedRolesToAssign: [],
        canAccessLocation: false,
        canEditDeleteAllAssistance: false,
        canUpdateCategories: false,
        canDeleteCategories: false,
        canAddEventActivity: false,
        canUpdateEventActivity: false,
        canDeleteEventActivity: false,
        canCreateService: false,
        canUpdateService: false,
        canDeleteService: false,
        canManageEventTypes: false,

        // → Case Outcome Permissions
        canDeleteOutcome: false,
        canDeleteAndEditComments: () => false,

        canMergeCase: false,
        canManageRentalSubsidy: false,
        canManageOwnAgencyRentalSubsidy: false,
        canViewRentalSubsidy: false,
        canCreateAssessment: false,
        canManageAssessment: false,
        canCommentOnAssessment: false,
        canManageAssessmentComment: false,
        // → Bed Assignment Permissions
        canCreateBedRequest: false,
        canAssignBed: false,
      };
    }

    switch (userRole) {
      case "Network Administrator":
        return {
          canCreateUsers: true,
          canUpdateUsers: true,
          canDeleteUsers: true,
          canUpdateOwnProfile: true,
          canUpdateRoles: true,
          canUpdateStatus: true,
          allowedRolesToAssign: [
            "Network Administrator",
            "Agency Administrator",
            "Agent",
          ],
          canAccessLocation: true,
          canEditDeleteAllAssistance: true,
          canUpdateCategories: true,
          canDeleteCategories: true,
          canAddEventActivity: true,
          canUpdateEventActivity: true,
          canDeleteEventActivity: true,
          canCreateService: true,
          canUpdateService: true,
          canDeleteService: true,
          canManageEventTypes: true,

          // → Case Outcome Permissions
          canDeleteOutcome: true,
          canDeleteAndEditComments: () => true,

          canMergeCase: true,
          canManageRentalSubsidy: true,
          canManageOwnAgencyRentalSubsidy: true,
          canViewRentalSubsidy: true,
          canCreateAssessment: true,
          canManageAssessment: true,
          canCommentOnAssessment: true,
          canManageAssessmentComment: true,
          // → Bed Assignment Permissions
          canCreateBedRequest: true,
          canAssignBed: true,
        };
      case "Agency Administrator":
        return {
          canCreateUsers: true,
          canUpdateUsers: true,
          canDeleteUsers: true,
          canUpdateOwnProfile: true,
          canUpdateRoles: true,
          canUpdateStatus: true,
          allowedRolesToAssign: ["Agency Administrator", "Agent"],
          canAccessLocation: true,
          canEditDeleteAllAssistance: true,
          canUpdateCategories: true,
          canDeleteCategories: true,
          canAddEventActivity: true,
          canUpdateEventActivity: true,
          canDeleteEventActivity: true,
          canCreateService: true,
          canUpdateService: true,
          canDeleteService: true,
          canManageEventTypes: true,

          // → Case Outcome Permissions
          canDeleteOutcome: false,
          canDeleteAndEditComments: (commentUserId?: string) =>
            isCurrentUser(commentUserId),

          canMergeCase: false,
          canManageRentalSubsidy: false,
          canManageOwnAgencyRentalSubsidy: true,
          canViewRentalSubsidy: true,
          canCreateAssessment: true,
          canManageAssessment: false,
          canCommentOnAssessment: false,
          canManageAssessmentComment: false,
          // → Bed Assignment Permissions
          canCreateBedRequest: true,
          canAssignBed: true,
        };
      case "Agent":
        return {
          canCreateUsers: false,
          canUpdateUsers: false,
          canDeleteUsers: false,
          canUpdateOwnProfile: true,
          canUpdateRoles: false,
          canUpdateStatus: false,
          allowedRolesToAssign: [],
          canAccessLocation: true,
          canEditDeleteAllAssistance: false,
          canUpdateCategories: false,
          canDeleteCategories: false,
          canAddEventActivity: false,
          canUpdateEventActivity: false,
          canDeleteEventActivity: false,
          canCreateService: false,
          canUpdateService: false,
          canDeleteService: false,
          canManageEventTypes: false,

          // → Case Outcome Permissions
          canDeleteOutcome: false,
          canDeleteAndEditComments: (commentUserId?: string) =>
            isCurrentUser(commentUserId),

          canMergeCase: false,
          canManageRentalSubsidy: false,
          canManageOwnAgencyRentalSubsidy: false,
          canViewRentalSubsidy: true,
          canCreateAssessment: true,
          canManageAssessment: false,
          canCommentOnAssessment: false,
          canManageAssessmentComment: false,
          // → Bed Assignment Permissions
          canCreateBedRequest: true,
          canAssignBed: true,
        };
      default:
        return {
          canCreateUsers: false,
          canUpdateUsers: false,
          canDeleteUsers: false,
          canUpdateOwnProfile: false,
          canUpdateRoles: false,
          canUpdateStatus: false,
          allowedRolesToAssign: [],
          canAccessLocation: false,
          canEditDeleteAllAssistance: false,
          canUpdateCategories: false,
          canDeleteCategories: false,
          canAddEventActivity: false,
          canUpdateEventActivity: false,
          canDeleteEventActivity: false,
          canCreateService: false,
          canUpdateService: false,
          canDeleteService: false,
          canManageEventTypes: false,

          // → Case Outcome Permissions
          canDeleteOutcome: false,
          canDeleteAndEditComments: () => false,

          canMergeCase: false,
          canManageRentalSubsidy: false,
          canManageOwnAgencyRentalSubsidy: false,
          canViewRentalSubsidy: false,
          canCreateAssessment: false,
          canManageAssessment: false,
          canCommentOnAssessment: false,
          canManageAssessmentComment: false,
          // → Bed Assignment Permissions
          canCreateBedRequest: false,
          canAssignBed: false,
        };
    }
  };

  const canModifyUser = (
    targetUserRole: UserRole,
    targetUserId?: string
  ): boolean => {
    const permissions = getRolePermissions();
    if (!permissions.canUpdateUsers) return false;

    const userRole = userData?.propertyRole || userData?.role;
    if (userRole === "Network Administrator") {
      return true;
    }
    if (userRole === "Agency Administrator") {
      if (targetUserRole === "Agent") return true;
      if (targetUserId && userData?.userId === targetUserId) return true;
      return false;
    }
    return false;
  };

  const canCreateUserWithRole = (newRole: UserRole): boolean => {
    const userRole = userData?.propertyRole || userData?.role;
    if (userRole === "Network Administrator") return true;
    if (userRole === "Agency Administrator") return newRole === "Agent";
    return false;
  };

  const canAssignRole = (newRole: UserRole): boolean => {
    const permissions = getRolePermissions();
    return permissions.allowedRolesToAssign.includes(newRole);
  };

  const canUpdateStatus = (targetUserRole: UserRole): boolean => {
    const permissions = getRolePermissions();
    if (!permissions.canUpdateStatus) return false;

    const userRole = userData?.propertyRole || userData?.role;
    if (
      userRole === "Agency Administrator" &&
      targetUserRole === "Network Administrator"
    ) {
      return false;
    }

    return true;
  };

  const canAccessLocation = (locationId: string): boolean => {
    const permissions = getRolePermissions();
    if (!permissions.canAccessLocation) return false;

    return userData?.locations?.includes(locationId) || false;
  };

  const canEditDeleteAssistance = (authorId?: string): boolean => {
    const permissions = getRolePermissions();

    if (permissions.canEditDeleteAllAssistance) {
      return true;
    }

    if (userData?.propertyRole === "Agent" && authorId === userData.userId) {
      return true;
    }

    return false;
  };

  const canEditDeleteDocument = (): boolean => {
    const permissions = getRolePermissions();

    if (permissions.canEditDeleteAllAssistance) {
      return true;
    }

    if (userData?.propertyRole === "Agent") {
      return true;
    }

    return false;
  };

  const isCurrentUser = (targetUserId?: string) => {
    return (
      !!userData?.userId && !!targetUserId && userData.userId === targetUserId
    );
  };

  const canManageRentalSubsidyRecord = (record: {
    companyId?: string;
    locationId?: string;
  }) => {
    const permissions = getRolePermissions();

    if (permissions.canManageRentalSubsidy) return true;

    if (permissions.canManageOwnAgencyRentalSubsidy) {
      return (
        (!userData?.activeLocation &&
          record.companyId &&
          record.companyId === userData?.companyId) ||
        (record.locationId && record.locationId === userData?.activeLocation)
      );
    }

    return false;
  };
  const canEditDeleteAssessmentAddComment = (
    assessment: Assessment
  ): boolean => {
    const permissions = getRolePermissions();

    if (permissions.canManageAssessment) {
      return true;
    }

    if (userData?.propertyRole === "Agency Administrator") {
      if (
        assessment?.locationId &&
        assessment?.locationId === userData?.activeLocation
      ) {
        return true;
      }
      if (
        !userData?.activeLocation &&
        assessment?.companyId &&
        assessment?.companyId === userData?.companyId
      ) {
        return true;
      }
      return false;
    }
    if (userData?.propertyRole === "Agent") {
      if (
        assessment?.createdBy &&
        assessment?.createdBy?.userId === userData?.userId
      ) {
        return true;
      }
      return false;
    }

    return false;
  };
  const canEditDeleteComment = (comment: AssessmentComment): boolean => {
    const permissions = getRolePermissions();

    if (permissions.canManageAssessmentComment) {
      return true;
    }

    if (userData?.propertyRole === "Agency Administrator") {
      if (
        comment?.locationId &&
        comment?.locationId === userData?.activeLocation
      ) {
        return true;
      }
      if (
        !userData?.activeLocation &&
        comment?.companyId &&
        comment?.companyId === userData?.companyId
      ) {
        return true;
      }
      return false;
    }
    if (userData?.propertyRole === "Agent") {
      if (
        comment?.commentedBy &&
        comment?.commentedBy?.userId === userData?.userId &&
        comment?.locationId &&
        comment?.locationId === userData?.activeLocation
      ) {
        return true;
      } else if (
        comment?.commentedBy &&
        comment?.commentedBy?.userId === userData?.userId &&
        !userData?.activeLocation &&
        comment?.companyId &&
        comment?.companyId === userData?.companyId
      ) {
        return true;
      }
      return false;
    }

    return false;
  };

  // → Bed Assignment Permission Functions
  const canEditBedRequest = (assignment?: {
    agencyId?: string;
    createdBy?: { userId?: string };
  }): boolean => {
    const userRole = userData?.propertyRole || userData?.role;

    if (userRole === "Network Administrator") return true;

    if (!assignment) return false;

    // Check if assignment agency matches user's activeLocation or companyId
    const agencyMatches =
      assignment.agencyId === userData?.activeLocation ||
      (!userData?.activeLocation &&
        assignment.agencyId === userData?.companyId);

    if (userRole === "Agency Administrator" && agencyMatches) return true;

    if (
      userRole === "Agent" &&
      agencyMatches &&
      assignment.createdBy?.userId === userData?.userId
    )
      return true;

    return false;
  };

  const canDeleteBedRequest = (assignment?: {
    agencyId?: string;
    createdBy?: { userId?: string };
  }): boolean => {
    const userRole = userData?.propertyRole || userData?.role;

    if (userRole === "Network Administrator") return true;

    if (!assignment) return false;

    // Check if assignment agency matches user's activeLocation or companyId
    const agencyMatches =
      assignment.agencyId === userData?.activeLocation ||
      (!userData?.activeLocation &&
        assignment.agencyId === userData?.companyId);

    if (userRole === "Agency Administrator" && agencyMatches) return true;

    if (
      userRole === "Agent" &&
      agencyMatches &&
      assignment.createdBy?.userId === userData?.userId
    )
      return true;

    return false;
  };

  const canEditDeleteEvent = (event?: EventData): boolean => {
    const userRole = userData?.propertyRole || userData?.role;

    //new requirement
    if (userRole === "Agency Administrator") {
      return event?.sameAgency ?? true;
    }
    // existing role-based permission
    if (permissions.canUpdateEventActivity) {
      return true;
    }

    return false;
  };

  const canEditDeleteEventLocation = (location?: EventLocation): boolean => {
    const userRole = userData?.propertyRole || userData?.role;

    if (userRole === "Network Administrator") {
      return true; // always full access
    }

    if (userRole === "Agent") {
      return false; // never edit/delete
    }

    if (userRole === "Agency Administrator") {
      if (!location?.dedicateToCompany) {
        return true; // if not dedicated → allow
      }

      // if dedicated, only allow when it's same agency
      if (
        location.dedicateToCompany &&
        location.sameAgency // backend should flag this boolean
      ) {
        return true;
      }

      return false; // otherwise not allowed
    }

    return false;
  };

  const permissions = getRolePermissions();
  return {
    ...permissions,
    canModifyUser,
    canCreateUserWithRole,
    canAssignRole,
    canUpdateStatus,
    canAccessLocation,
    canEditDeleteAssistance,
    canEditDeleteDocument,
    isCurrentUser,
    currentRole: (userData?.propertyRole || userData?.role) as
      | UserRole
      | undefined,
    canManageRentalSubsidyRecord,
    canEditDeleteAssessmentAddComment,
    canEditDeleteComment,
    canEditBedRequest,
    canDeleteBedRequest,
    canEditDeleteEvent,
    canEditDeleteEventLocation,
  };
};
