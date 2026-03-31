export type ApiErrorResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  errors?: unknown[];
  data: null;
};

export interface ApiPaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
