# Error Handling Strategy

A centralized error handling approach will be utilized.

- **Custom Error Classes**: Define specific application errors (e.g., `NotFoundError`, `UnauthorizedError`).
- **Global Middleware**: A single `errorHandler` Express middleware intercepts all thrown errors, preventing application crashes and returning standardized JSON error payloads.
