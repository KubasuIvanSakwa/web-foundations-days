# Library API Design

This document outlines the REST API design for the library's `books` resource.

## Endpoints

### 1. List all books
**Method:** GET  
**Path:** `/books`  
**Description:** Retrieves a list of all books in the library.  
**Success Status Code:** 200 OK  

### 2. Get one book
**Method:** GET  
**Path:** `/books/:id`  
**Description:** Retrieves the details of a specific book by its unique ID.  
**Success Status Code:** 200 OK  

### 3. Create a book
**Method:** POST  
**Path:** `/books`  
**Description:** Adds a new book to the library catalog.  
**Example Request Body:**  
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publishedYear": 1925
}
```
**Success Status Code:** 201 Created  

### 4. Update a book
**Method:** PUT  
**Path:** `/books/:id`  
**Description:** Completely updates an existing book's record.  
**Example Request Body:**  
```json
{
  "title": "The Great Gatsby (Revised Edition)",
  "author": "F. Scott Fitzgerald",
  "publishedYear": 1925
}
```
**Success Status Code:** 200 OK (or 204 No Content)  

### 5. Delete a book
**Method:** DELETE  
**Path:** `/books/:id`  
**Description:** Removes a book from the library catalog by its ID.  
**Success Status Code:** 200 OK (or 204 No Content)  

### 6. List books by an author
**Method:** GET  
**Path:** `/books?author=AuthorName`  
**Description:** Retrieves a filtered list of books written by a specific author using a query parameter.  
**Success Status Code:** 200 OK  

## Error Codes

* **400 Bad Request:** Returned when the client sends invalid data.
  * *Example:* A client attempts to create a new book using the `POST /books` endpoint but forgets to include the required `"title"` field in the JSON request body.
* **404 Not Found:** Returned when the requested resource does not exist on the server.
  * *Example:* A client tries to fetch a book's details using `GET /books/999`, but there is no book with the ID of `999` in the database.