Authentication API
1. User Registration
Registers a new user in the system.

Endpoint: POST /api/auth/register
Method: POST
Content-Type: application/json
Request Body:

json
{
    "fullName": "Jane Doe",
    "businessName": "Jane's Innovations",
    "phoneNumber": "098-765-4321",
    "email": "jane.doe@example.com",
    "password": "strongPassw--- /dev/null
    +++ b/Authentication_API.md
    @@ -0,0 +1,126 @@
    +## Authentication API
    +
    +### 1. User Registration
    +
    +Registers a new user in the system.
    +
    +*   **Endpoint:** `POST /api/auth/register`
    +*   **Method:** `POST`
    +*   **Content-Type:** `application/json`
    +
    +**Request Body:**
    +
    +```json
    +{
    +    "fullName": "Jane Doe",
    +    "businessName": "Jane's Innovations",
    +    "phoneNumber": "098-765-4321",
    +    "email": "jane.doe@example.com",
    +    "password": "strongPassword456",
    +    "city": "San Francisco",
    +    "state": "CA",
    +    "country": "USA",
    +    "role": "user"
    +}
    +```
    +
    +**Fields:**
    +
    +*   `fullName` (string, required): Full name of the user.
    +*   `businessName` (string, optional): Name of the user's business.
    +*   `phoneNumber` (string, optional): User's phone number.
    +*   `email` (string, required): User's email address (must be unique).
    +*   `password` (string, required): User's password (min 6 characters).
    +*   `city` (string, optional): User's city.
    +*   `state` (string, optional): User's state.
    +*   `country` (string, optional): User's country.
    +*   `role` (string, optional, defaults to 'user'): User's role (e.g., 'user', 'admin').
    +
    +**cURL Example:**
    +
    +```bash
    +curl -X POST http://localhost:5000/api/auth/register \
    +-H "Content-Type: application/json" \
    +-d '{
    +    "fullName": "Jane Doe",
    +    "businessName": "Jane'\''s Innovations",
    +    "phoneNumber": "098-765-4321",
    +    "email": "jane.doe@example.com",
    +    "password": "strongPassword456",
    +    "city": "San Francisco",
    +    "state": "CA",
    +    "country": "USA",
    +    "role": "user"
    +}'
    +```
    +
    +**Success Response (201 Created):**
    +
    +```json
    +{
    +    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE2NzgzNzQyMDAsImV4cCI6MTY3ODM3NzgwMH0.someGeneratedJWT",
    +    "user": {
    +        "id": 2,
    +        "fullName": "Jane Doe",
    +        "email": "jane.doe@example.com",
    +        "role": "user"
    +    }
    +}
    +```
    +
    +**Error Responses:**
    +
    +*   **400 Bad Request (Validation Failed):**
    +    ```json
    +    {
    +        "message": "Validation failed.",
    +        "errors": [
    +            "Full name is required and must be a non-empty string.",
    +            "A valid email address is required.",
    +            "Password is required and must be at least 6 characters long."
    +        ]
    +    }
    +    ```
    +*   **400 Bad Request (User Exists):**
    +    ```json
    +    {
    +        "message": "User with this email already exists."
    +    }
    +    ```
    +*   **500 Internal Server Error:**
    +    ```json
    +    {
    +        "message": "Server error during registration."
    +    }
    +    ```
    +
    +---
    +
    +### 2. User Login
    +
    +Logs in an existing user and returns a JWT.
    +
    +*   **Endpoint:** `POST /api/auth/login`
    +*   **Method:** `POST`
    +*   **Content-Type:** `application/json`
    +
    +**Request Body:**
    +
    +```json
    +{
    +    "email": "jane.doe@example.com",
    +    "password": "strongPassword456"
    +}
    +```
    +
    +**Fields:**
    +
    +*   `email` (string, required): User's email address.
    +*   `password` (string, required): User's password.
    +
    +**cURL Example:**
    +
    +```bash
    +curl -X POST http://localhost:5000/api/auth/login \
    +-H "Content-Type: application/json" \
    +-d '{
    +    "email": "jane.doe@example.com",
    +    "password": "strongPassword456"
    +}'
    +```
    +
    +**Success Response (200 OK):**
    +
    +```json
    +{
    +    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE2NzgzNzQzMDAsImV4cCI6MTY3ODM3NzkwMH0.anotherGeneratedJWT",
    +    "user": {
    +        "id": 2,
    +        "fullName": "Jane Doe",
    +        "email": "jane.doe@example.com",
    +        "role": "user"
    +    }
    +}
    +```
    +
    +**Error Responses:**
    +
    +*   **400 Bad Request (Validation Failed):**
    +    ```json
    +    {
    +        "message": "Validation failed.",
    +        "errors": [
    +            "Email is required.",
    +            "Password is required."
    +        ]
    +    }
    +    ```
    +*   **401 Unauthorized (Invalid Credentials):**
    +    ```json
    +    {
    +        "message": "Invalid credentials."
    +    }
    +    ```
    +*   **500 Internal Server Error:**
    +    ```json
    +    {
    +        "message": "Server error during login."
    +    }
    +    ```
    +
    +---
    +
    +**Note on JWT Token:**
    +The `token` received upon successful registration or login should be stored securely by the client. For subsequent requests to protected API endpoints, this token must be included in the `Authorization` header as a Bearer token:
    +
    +`Authorization: Bearer <your_jwt_token>`
    +
    ord456",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "role": "user"
}
Fields:

fullName (string, required): Full name of the user.
businessName (string, optional): Name of the user's business.
phoneNumber (string, optional): User's phone number.
email (string, required): User's email address (must be unique).
password (string, required): User's password (min 6 characters).
city (string, optional): User's city.
state (string, optional): User's state.
country (string, optional): User's country.
role (string, optional, defaults to 'user'): User's role (e.g., 'user', 'admin').
cURL Example:

bash
curl -X POST http://localhost:5000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
    "fullName": "Jane Doe",
    "businessName": "Jane'\''s Innovations",
    "phoneNumber": "098-765-4321",
    "email": "jane.doe@example.com",
    "password": "strongPassword456",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "role": "user"
}'
Success Response (201 Created):

json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE2NzgzNzQyMDAsImV4cCI6MTY3ODM3NzgwMH0.someGeneratedJWT",
    "user": {
        "id": 2,
        "fullName": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "user"
    }
}
Error Responses:

400 Bad Request (Validation Failed):
json
{
    "message": "Validation failed.",
    "errors": [
        "Full name is required and must be a non-empty string.",
        "A valid email address is required.",
        "Password is required and must be at least 6 characters long."
    ]
}
400 Bad Request (User Exists):
json
{
    "message": "User with this email already exists."
}
500 Internal Server Error:
json
{
    "message": "Server error during registration."
}
2. User Login
Logs in an existing user and returns a JWT.

Endpoint: POST /api/auth/login
Method: POST
Content-Type: application/json
Request Body:

json
{
    "email": "jane.doe@example.com",
    "password": "strongPassword456"
}
Fields:

email (string, required): User's email address.
password (string, required): User's password.
cURL Example:

bash
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
    "email": "jane.doe@example.com",
    "password": "strongPassword456"
}'
Success Response (200 OK):

json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE2NzgzNzQzMDAsImV4cCI6MTY3ODM3NzkwMH0.anotherGeneratedJWT",
    "user": {
        "id": 2,
        "fullName": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "user"
    }
}
Error Responses:

400 Bad Request (Validation Failed):
json
{
    "message": "Validation failed.",
    "errors": [
        "Email is required.",
        "Password is required."
    ]
}
401 Unauthorized (Invalid Credentials):
json
{
    "message": "Invalid credentials."
}
500 Internal Server Error:
json
{
    "message": "Server error during login."
}
Note on JWT Token: The token received upon successful registration or login should be stored securely by the client. For subsequent requests to protected API endpoints, this token must be included in the Authorization header as a Bearer token:

Authorization: Bearer <your_jwt_token>