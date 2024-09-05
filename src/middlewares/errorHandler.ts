import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import CustomError from "../errors/customError.js";
import { generateErrorMessage } from "../responses/errorResponse.js";

const ErrorHandler: ErrorRequestHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error);

  if (error instanceof CustomError) {
    res.status(error.status).json(generateErrorMessage(error));
  } else {
    res.status(500).json({
      sucess: false,
      error: {
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
};

export default ErrorHandler;