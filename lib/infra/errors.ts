export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}
export class AuthError extends DomainError {
  constructor(msg = "Unauthorized") { super(msg, "UNAUTHORIZED"); }
}
export class ForbiddenError extends DomainError {
  constructor(msg = "Forbidden") { super(msg, "FORBIDDEN"); }
}
export class NotFoundError extends DomainError {
  constructor(msg = "Not found") { super(msg, "NOT_FOUND"); }
}
export class ConflictError extends DomainError {
  constructor(msg: string) { super(msg, "CONFLICT"); }
}
export class ValidationError extends DomainError {
  constructor(msg: string) { super(msg, "VALIDATION"); }
}
