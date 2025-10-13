## Contact Us API

### 1. Submit a Contact Form Message

Allows any user to send a message through the contact form.

*   **Endpoint:** `POST /api/contact`
*   **Method:** `POST`
*   **Access:** Public
*   **Content-Type:** `application/json`

**Request Body:**

```json
{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "subject": "Inquiry about your service",
    "message": "Hello, I would like to know more about your menu services. Thank you."
}
```

**Fields:**

*   `name` (string, required): Sender's full name.
*   `email` (string, required): Sender's email address.
*   `subject` (string, optional): The subject of the message.
*   `message` (string, required): The content of the message.

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/contact \
-H "Content-Type: application/json" \
-d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "subject": "Inquiry about your service",
    "message": "Hello, I would like to know more about your menu services. Thank you."
}'
```

**Success Response (201 Created):**

```json
{
    "success": true,
    "message": "Your message has been sent successfully!",
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "subject": "Inquiry about your service",
        "message": "Hello, I would like to know more about your menu services. Thank you.",
        "status": "new",
        "created_at": "2023-10-27T10:00:00.000Z",
        "updated_at": "2023-10-27T10:00:00.000Z"
    }
}
```

---

### 2. Get All Contact Submissions

Retrieves a paginated list of all messages submitted through the contact form.

*   **Endpoint:** `GET /api/contact`
*   **Method:** `GET`
*   **Access:** Private (Admin only)

**Query Parameters:**

*   `page` (number, optional, defaults to 1): The page number for pagination.
*   `limit` (number, optional, defaults to 10): The number of items per page.

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/contact?page=1&limit=5" \
-H "Authorization: Bearer <your_admin_jwt_token>"
```