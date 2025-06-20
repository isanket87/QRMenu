# Restaurant Menu API Documentation

## Authentication

### Register
**POST** `/api/auth/register`  
Registers a new user.

**Body:**
```json
{
  "fullName": "John Doe",
  "businessName": "My Restaurant",
  "phoneNumber": "1234567890",
  "email": "john@example.com",
  "password": "yourpassword",
  "city": "City",
  "state": "State",
  "country": "Country",
  "role": "admin" // optional, defaults to "user"
}
```

---

### Login
**POST** `/api/auth/login`  
Logs in a user and returns a JWT token.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "token": "JWT_TOKEN",
  "user": { ... }
}
```

---

## Restaurants

### Create Restaurant
**POST** `/api/restaurants`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

**Body:**
```json
{
  "name": "Pizza Palace",
  "address": "123 Main St",
  "description": "Best pizza in town",
  "opening_time": "09:00",
  "closing_time": "23:00",
  "type": "restaurant",
  "food_type": "both",
  "phone_number": "1234567890",
  "email": "info@pizza.com",
  "website": "https://pizza.com",
  "image_url": "https://img.com/pizza.jpg"
}
```

---

### Get All Restaurants
**GET** `/api/restaurants`

---

### Get Restaurant by ID
**GET** `/api/restaurants/:id`

---

### Search Restaurants
**GET** `/api/restaurants/search?q=pizza`

---

### Update Restaurant
**PUT** `/api/restaurants/:id`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

**Body:** (any updatable fields)

---

### Soft Delete Restaurant
**DELETE** `/api/restaurants/:id`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

---

## Categories

### Create Category
**POST** `/api/categories`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

**Body:**
```json
{
  "restaurant_id": 1,
  "name": "Starters",
  "description": "Begin your meal",
  "display_order": 1
}
```

---

### Get My Categories
**GET** `/api/categories/my-categories`  
**Headers:** `Authorization: Bearer <token>`  
Retrieves all categories created by the currently logged-in user.

---

### Get All Categories for a Restaurant
**GET** `/api/categories/restaurant/:restaurant_id`

---

### Get Category by ID
**GET** `/api/categories/:id`

---

### Get Category by Name
**GET** `/api/categories/by-name?restaurant_id=1&name=Starters`

---

### Search Categories
**GET** `/api/categories/search?restaurant_id=1&q=star`

---

### Update Category
**PUT** `/api/categories/:id`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

**Body:** (any updatable fields)

---

### Soft Delete Category
**DELETE** `/api/categories/:id`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

---

### Bulk Update Category Display Order
**PUT** `/api/categories/bulk-update-order`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

**Body:**
An array of category update objects. Each object must contain `id` (the category ID) and `display_order` (the new display order).
```json
[
  { "id": 1, "display_order": 0 },
  { "id": 2, "display_order": 1 },
  { "id": 5, "display_order": 2 }
]
```

**Response (Success Example):**
If all requested updates are successful.
```json
{
  "message": "Bulk display order update processed. 3 operations successful out of 3 requested.",
  "successfulOperations": 3,
  "requestedOperations": 3,
  "updatedCategories": [
    {
      "id": 1,
      "restaurant_id": 1,
      "name": "Starters",
      "description": "Begin your meal",
      "display_order": 0,
      "status": "active",
      "created_at": "2023-10-26T10:00:00.000Z",
      "updated_at": "2023-10-27T12:30:00.000Z",
      "created_by": 10,
      "updated_by": 12
    }
    // ... other updated categories
  ]
}
```

**Note:** If some categories specified in the request are not found or not active, `successfulOperations` will be less than `requestedOperations`. The `updatedCategories` array will only contain details for the categories that were actually updated.

---

## Dishes (Menu Items)

### Create Dish
**POST** `/api/dishes`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

**Body:**
```json
{
  "restaurant_id": 1,
  "category_id": 2, // optional for independent items
  "name": "French Fries",
  "description": "Crispy fries",
  "price": 99.99,
  "image_url": "https://img.com/fries.jpg",
  "is_available": true
}
```

---

### Get All Dishes for a Restaurant
**GET** `/api/dishes?restaurant_id=1`

---

### Get All Dishes for a Category
**GET** `/api/dishes?restaurant_id=1&category_id=2`

---

### Get Independent Dishes (No Category)
**GET** `/api/dishes/independent?restaurant_id=1`

---

### Get Dish by ID
**GET** `/api/dishes/:id`

---

### Get Dish by Name
**GET** `/api/dishes/by-name?restaurant_id=1&name=French Fries`

---

### Search Dishes
**GET** `/api/dishes/search?restaurant_id=1&q=fries`

---

### Update Dish
**PUT** `/api/dishes/:id`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

**Body:** (any updatable fields)

---

### Soft Delete Dish
**DELETE** `/api/dishes/:id`  
**Headers:** `Authorization: Bearer <token>` (admin/super_admin only)

---

## Notes

- All protected routes require a valid JWT token in the `Authorization` header.
- Only users with `admin` or `super_admin` roles can create, update, or delete restaurants, categories, and dishes.
- All "soft delete" operations set the `status` to `'deleted'` instead of removing the record.
