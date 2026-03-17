import { HttpStatusCode } from 'axios';
import { z } from 'zod';
import { setResponseStatus, H3Event } from 'h3';

export class StatusError extends Error {
  constructor(public readonly status: HttpStatusCode, message: string) {
    super(message);
  }

  getStatusTitle(): string {
    return HttpStatusCode[this.status];
  }
}

export function sendErrorResponse(event: H3Event, error: any): ApiResponse {
  // Dump whole error for developers.
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    status: error.status || error.response?.status,
  });

  if (error instanceof z.ZodError) {
    // Set the nuxt response status code to
    setResponseStatus(event, HttpStatusCode.BadRequest);

    // Make zod error readable.
    const errorMessage = error.issues
      .map((err) => `Invalid ${err.path.join('.')}: ${err.message}`)
      .join('; ');

    // Return zod errors to user.
    return {
      success: false,
      error: errorMessage,
    };
  }

  if (error instanceof StatusError) {
    // Set the nuxt response status code.
    setResponseStatus(event, error.status);
    switch (error.status) {
      case HttpStatusCode.Forbidden:
      case HttpStatusCode.BadRequest:
      case HttpStatusCode.Unauthorized:
      case HttpStatusCode.NotFound:
        return {
          success: false,
          error: error.message,
        };

      default:
        break;
    }
  }

  // Handle upstream HTTP errors thrown by axios (e.g. from Bitcoin node RPC).
  // 401/403 from the node means the RPC method is not permitted for this user.
  const upstreamStatus = error.response?.status;
  if (upstreamStatus === HttpStatusCode.Unauthorized || upstreamStatus === HttpStatusCode.Forbidden) {
    setResponseStatus(event, HttpStatusCode.Forbidden);
    return {
      success: false,
      error: 'This node has not granted permission for this action.',
    };
  }

  return {
    success: false,
    error: 'An unexpected error occurred.',
  };
}
