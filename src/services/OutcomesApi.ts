// Outcome API Service - All outcome-related API calls and types
import backendApi from "@/api/api";

// =============================================================
// 1. MANAGE OUTCOME GOALS (Listing & Grouping Goals by Section)
// =============================================================
// These APIs and types are for listing and grouping outcome goals

// Represents a single outcome goal
export interface IOutcomeGoal {
  _id: string;
  name: string;
}

// API response for fetching outcome goals (paginated, grouped by section)
export interface IOutcomeGoalsApiResponse {
  results: {
    section: {
      _id: string;
      name: string;
    };
    goals: IOutcomeGoal[];
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// -> Gets all outcome goals, grouped by section, with pagination
export const getOutcomeGoals = async (
  page: number,
  limit: number,
  userId: string,
  disablePagination: boolean = false
): Promise<IOutcomeGoalsApiResponse> => {
  const response = await backendApi.get<{ data: IOutcomeGoalsApiResponse }>(
    `/api/outcome-goals?page=${page}&limit=${limit}&disablePagination=${disablePagination}`,
    {
      headers: {
        "x-user-id": userId,
      },
    }
  );
  return response?.data?.data;
};

// -> Gets all outcome goals, grouped by section, without pagination
export const getOutcomeGoalsList = async (
  userId: string
): Promise<IOutcomeGoalsApiResponse> => {
  const response = await backendApi.get<{ data: IOutcomeGoalsApiResponse }>(
    `/api/outcome-goals/getList`,
    {
      headers: {
        "x-user-id": userId,
      },
    }
  );
  return response?.data?.data;
};
// -> API response for creating an outcome goal
export interface ICreateOutcomeGoalResponse {
  success: boolean;
  message?: string;
  data?: {
    name: string;
    section: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
  };
  code: number;
}

// -> Creates a new outcome goal under a section
export const createOutcomeGoal = async (
  name: string,
  section: string,
  userId: string
): Promise<ICreateOutcomeGoalResponse> => {
  const response = await backendApi.post<ICreateOutcomeGoalResponse>(
    "/api/outcome-goals",
    { name, section },
    {
      headers: {
        "x-user-id": userId,
        "Content-Type": "application/json",
      },
    }
  );
  // -> return the response, optional chaining safety
  return response?.data;
};

// -> API response for deleting an outcome goal
export interface IDeleteOutcomeGoalResponse {
  success: boolean;
  message?: string;
  data?: null;
  code: number;
}

// -> Deletes an outcome goal by ID
export const deleteOutcomeGoal = async (
  id: string,
  userId: string
): Promise<IDeleteOutcomeGoalResponse> => {
  const response = await backendApi.delete<IDeleteOutcomeGoalResponse>(
    `/api/outcome-goals/${id}`,
    {
      headers: {
        "x-user-id": userId,
      },
    }
  );
  return response?.data;
};

// -> API response for updating an outcome goal
export interface IUpdateOutcomeGoalResponse {
  success: boolean;
  message?: string;
  data?: {
    name: string;
    section: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
  };
  code: number;
}

// -> Updates an outcome goal by ID
export const updateOutcomeGoal = async (
  id: string,
  name: string,
  section: string,
  userId: string
): Promise<IUpdateOutcomeGoalResponse> => {
  const response = await backendApi.put<IUpdateOutcomeGoalResponse>(
    `/api/outcome-goals/${id}`,
    { name, section },
    {
      headers: {
        "x-user-id": userId,
        "Content-Type": "application/json",
      },
    }
  );
  // -> return the response, optional chaining safety
  return response?.data;
};

// =============================================================
// 2. MANAGE OUTCOME SECTIONS
// =============================================================
// These APIs and types are for managing outcome sections (create, read, update, delete)

// Represents a single outcome section (e.g., Education, Health)
export interface IOutcomeSection {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

// API response for fetching all outcome sections
export interface IOutcomeSectionsApiResponse {
  success: boolean;
  message: string;
  data: IOutcomeSection[];
  code: number;
}

// -> Gets all outcome sections for the network
export const getOutcomeSections = async (
  userId: string
): Promise<IOutcomeSection[]> => {
  const response = await backendApi.get<IOutcomeSectionsApiResponse>(
    "/api/outcome-sections",
    {
      headers: {
        "x-user-id": userId,
      },
    }
  );
  return response?.data?.data;
};

// -> Adds a new outcome section (e.g., Education)
export interface ICreateOutcomeSectionResponse {
  success: boolean;
  message: string;
  data: IOutcomeSection;
  code: number;
}

export const createOutcomeSection = async (
  name: string,
  userId: string
): Promise<ICreateOutcomeSectionResponse> => {
  const response = await backendApi.post<ICreateOutcomeSectionResponse>(
    "/api/outcome-sections",
    { name },
    {
      headers: {
        "x-user-id": userId,
        "Content-Type": "application/json",
      },
    }
  );
  return response?.data;
};

// -> Deletes an outcome section by ID
export interface IDeleteOutcomeSectionResponse {
  success: boolean;
  message: string;
  code: number;
}

export const deleteOutcomeSection = async (
  id: string,
  userId: string
): Promise<IDeleteOutcomeSectionResponse> => {
  const response = await backendApi.delete<IDeleteOutcomeSectionResponse>(
    `/api/outcome-sections/${id}`,
    {
      headers: {
        "x-user-id": userId,
      },
    }
  );
  return response?.data;
};

// -> Updates the name of an outcome section by ID
export interface IUpdateOutcomeSectionResponse {
  success: boolean;
  message: string;
  data: IOutcomeSection;
  code: number;
}

export const updateOutcomeSection = async (
  id: string,
  name: string,
  userId: string
): Promise<IUpdateOutcomeSectionResponse> => {
  const response = await backendApi.put<IUpdateOutcomeSectionResponse>(
    `/api/outcome-sections/${id}`,
    { name },
    {
      headers: {
        "x-user-id": userId,
        "Content-Type": "application/json",
      },
    }
  );
  return response?.data;
};

// =============================================================
// 3. MANAGE OUTCOME STATUS
// =============================================================
// These APIs and types are for managing outcome statuses

// Represents a single outcome status (e.g., Enrolled, Completed)
export interface IOutcomeStatus {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

// API response for fetching all outcome statuses
export interface IOutcomeStatusesApiResponse {
  success: boolean;
  message: string;
  data: IOutcomeStatus[];
  code: number;
}

// -> Gets all outcome statuses
export const getOutcomeStatuses = async (
  userId: string
): Promise<IOutcomeStatus[]> => {
  const response = await backendApi.get<IOutcomeStatusesApiResponse>(
    "/api/outcome-statuses",
    {
      headers: {
        "x-user-id": userId,
      },
    }
  );
  return response?.data?.data;
};

// -> Adds a new outcome status
export interface ICreateOutcomeStatusResponse {
  success: boolean;
  message?: string;
  data?: IOutcomeStatus;
  code: number;
}

export const createOutcomeStatus = async (
  name: string,
  userId: string
): Promise<ICreateOutcomeStatusResponse> => {
  const response = await backendApi.post<ICreateOutcomeStatusResponse>(
    "/api/outcome-statuses",
    { name },
    {
      headers: {
        "x-user-id": userId,
        "Content-Type": "application/json",
      },
    }
  );
  // -> return the response, optional chaining safety
  return response?.data;
};

// -> Deletes an outcome status by ID
export const deleteOutcomeStatus = async (
  id: string,
  userId: string
): Promise<ICreateOutcomeStatusResponse> => {
  const response = await backendApi.delete<ICreateOutcomeStatusResponse>(
    `/api/outcome-statuses/${id}`,
    {
      headers: {
        "x-user-id": userId,
      },
    }
  );
  // -> return the response, optional chaining safety
  return response?.data;
};

// -> Updates an outcome status by ID
export const updateOutcomeStatus = async (
  id: string,
  name: string,
  userId: string
): Promise<ICreateOutcomeStatusResponse> => {
  const response = await backendApi.put<ICreateOutcomeStatusResponse>(
    `/api/outcome-statuses/${id}`,
    { name },
    {
      headers: {
        "x-user-id": userId,
        "Content-Type": "application/json",
      },
    }
  );
  // -> return the response, optional chaining safety
  return response?.data;
};
