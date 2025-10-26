import type { Pagination } from '@/types/case'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  code?: number
  pagination?: Pagination
}

export interface ApiErrorResponse {
  message: string
  code?: number | string
  response?: {
    data: {
      success: boolean
      message: string | string
      code?: number | string
      errors?: Record<string, string[]>
      data?: null
    }
    status: number | string
    statusText: string
  }
}

export interface DecryptedUserData {
  userId: string
  companyId: string
  role: string
  type: string
  activeLocation: string
  userName: string
  email: string
  propertyRole: string
}
