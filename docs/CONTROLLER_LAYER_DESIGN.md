# Controller Layer Design

Controllers act as the bridge between Express routes and Services. 

## Responsibilities
- Parse incoming `req.body`, `req.params`, and `req.query`.
- Hand data over to the appropriate Service method.
- Return structured JSON responses with appropriate HTTP status codes (200, 201, 400, 404, 500).

## Current Scaffolding
Empty controllers have been instantiated corresponding to the service layers (e.g., `BreakdownController`).
