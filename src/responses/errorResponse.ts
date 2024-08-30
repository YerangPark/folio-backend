import { ApiResponse } from "./apiResponse";
import CustomError from "../errors/customError";

//SECTION - 에러
interface ErrorResponse extends ApiResponse{
  success: boolean;
  error: {
    status: number;
    code: string;
    message: string;
  };
}

export function generateErrorMessage(error: CustomError): ErrorResponse {
  return {
    success: false,
    error: {
      status: error.status,
      code: error.code,
      message: error.message
    }
  };
}