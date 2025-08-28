/**
 * Represents an API response with a success status, optional data, and optional error.
 * @template T - The type of the data property, defaults to `never` (no data) for error responses.
 * @interface
 */
export interface ApiResponse<T = never> {
  success: boolean;
  data?: T;
  error?: string | Error;
}
