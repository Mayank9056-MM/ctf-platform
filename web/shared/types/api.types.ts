export type ApiErrorResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  errors?: unknown[];
  data: null;
};
