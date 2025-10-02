export interface ProtectedResponse {
  user_id: string;
  email: string;
  message: string;
}

export interface ApiError {
  error: string;
  detail?: string;
}
