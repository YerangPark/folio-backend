import { ApiResponse } from "./apiResponse.js";

//SECTION - 성공
interface SuccessResponse<T> extends ApiResponse {
  data: T | null;
}

export function generateSuccessResponse<T>(data: T | null = null): SuccessResponse<T> {
  return {
    success: true,
    data: data
  };
}