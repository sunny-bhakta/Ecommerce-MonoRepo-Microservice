# Admin Service

Purpose: track admin actions (moderation, refunds, approvals).

- Port: 3110 (default)
- Env: `ADMIN_SERVICE_URL`
- Storage: in-memory
- Key endpoints:
  - `GET /health`
  - `POST /admin/actions`
  - `GET /admin/actions` (filters: status, targetType)
  - `PATCH /admin/actions/:id`
- Notes: Admin-only via gateway; consider persistence later.

## Real-world Use Cases

- **Content Moderation:** Admins can review and remove inappropriate product listings or user reviews.
- **Refund Management:** Admins process and approve customer refund requests, tracking each action for accountability.
- **Order Approvals:** For high-value or flagged orders, admins can manually approve or reject transactions.
- **User Account Actions:** Admins can suspend, reactivate, or escalate user accounts based on policy violations.
- **Audit Trail:** All admin actions are logged for compliance and future audits, ensuring transparency.

## Endpoint Design Approach

Instead of creating a separate endpoint for each admin action (e.g., approve review, process refund, block vendor), design a **generic actions endpoint**. Each action type (like `APPROVE_REVIEW`, `REFUND`, `BLOCK_VENDOR`) is specified in the request payload. This approach:

- Keeps the API surface small and maintainable.
- Allows easy addition of new admin actions without changing the API contract.
- Enables consistent logging and auditing.

**Example request:**

```json
POST /admin/actions
{
  "type": "APPROVE_REVIEW",
  "targetId": "review_123",
  "details": { "reason": "Spam content" }
}
```

**Supported action types:**
- `APPROVE_REVIEW`
- `REFUND`
- `BLOCK_VENDOR`
- `SUSPEND_USER`
- ...and more as needed

## How Admin Actions Are Performed

When an admin needs to perform an action (such as approving a review or processing a refund), they interact with the Admin Service through the generic `/admin/actions` endpoint. The process typically follows these steps:

1. **Initiate Action:**  
  The admin sends a `POST /admin/actions` request with the action type, target entity, and any relevant details.

2. **Action Processing:**  
  The service validates the request, performs the specified action (e.g., updates a review status, triggers a refund), and logs the action for auditing.

3. **Status Tracking:**  
  Each action is assigned a status (`PENDING`, `COMPLETED`, `FAILED`, etc.). Admins can query actions using `GET /admin/actions` with filters to track progress or review history.

4. **Update or Resolve:**  
  If needed, admins can update an action (e.g., change status, add notes) using `PATCH /admin/actions/:id`.

This workflow ensures all admin interventions are tracked, auditable, and consistent across different types of actions.

Document supported types and required fields for each in your API docs.

## Integration with Other Services

For actions like order approvals or refunds, the Admin Service acts as an orchestrator. When an admin initiates such an action, the service will:

- Validate and log the action.
- Call the relevant downstream service (e.g., Order or Payment Service) via their APIs to perform the actual business operation (such as approving an order or issuing a refund).
- Update the action status based on the response from the downstream service.

This ensures that admin-triggered actions are both auditable and correctly executed in the appropriate domain service.

## Example: Approving a Product Review

Suppose an admin wants to approve a user-submitted product review flagged for moderation. Here’s how the process works:

**Request:**

```http
POST /admin/actions
Content-Type: application/json

{
  "type": "APPROVE_REVIEW",
  "targetId": "review_12345",
  "details": {
    "reason": "Manual review completed. No policy violation found."
  }
}
```

**Response:**

```json
{
  "id": "action_67890",
  "type": "APPROVE_REVIEW",
  "targetId": "review_12345",
  "status": "PENDING",
  "createdAt": "2024-06-01T10:00:00Z"
}
```

The Admin Service logs the action, triggers the review approval in the Review Service, and updates the action status once completed.

## How Integration Works: Simple Example

Suppose an admin needs to refund an order:

1. **Admin Request:**  
  The admin sends a request to the Admin Service:
  ```http
  POST /admin/actions
  Content-Type: application/json

  {
    "type": "REFUND",
    "targetId": "order_98765",
    "details": {
     "amount": 49.99,
     "reason": "Product damaged"
    }
  }
  ```

2. **Admin Service Processing:**  
  - Logs the action as `PENDING`.
  - Calls the Payment Service API to process the refund.

3. **Downstream Service Response:**  
  - If the Payment Service succeeds, the Admin Service updates the action status to `COMPLETED`.
  - If it fails, the status is set to `FAILED` and the error is logged.

4. **Admin Can Track Status:**  
  The admin can check the status using:
  ```http
  GET /admin/actions?targetId=order_98765
  ```

This pattern applies to other actions (like approving reviews or blocking vendors) by changing the `type` and `targetId` in the request.

## Extending
- Persist actions and add audit trail/history.
- Add SLAs, assignment (owner), and notifications on status changes.
- Integrate with review/payment/order systems for linked workflows.

