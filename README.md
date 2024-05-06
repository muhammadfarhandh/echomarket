# Node.js Backend for product and User Management

This repository contains a Node.js backend implementing a RESTful API for the ECHOMARKET application. The application provides a RESTful API for e-commerce operations, including user authentication, product management, and more. The backend uses Express, MongoDB, and follows best practices for security and maintainability.

## Features

- User registration, login, and profile management.
- CRUD operations for products.
- Secure routes with JWT-based authentication.
- Service layer architecture for business logic.

## Technology Stack

- **Node.js**: Server environment.
- **Express.js**: Web application framework.
- **MongoDB**: NoSQL database.
- **Mongoose**: MongoDB object modeling.
- **Bcrypt.js**: Password hashing.
- **jsonwebtoken**: Implementing JWT authentication.
- **Joi**: Data validation.


## Installation

To set up the project locally:
1. Clone the repository to your local machine.
2. Updated branch is `master` branch
3. Navigate to the cloned directory and run `npm install` to install dependencies.
4. Ensure MongoDB is running on your machine or set up a remote MongoDB instance.
5. Change a `.env.example` file to `.env` at the root of the project to store environment variables like database URI, JWT secret, Cloudinary details, etc.

## Running the Application
1. Start the server with `npm run dev`.
2. The server should now be running and listening for requests on `http://localhost:3000` or your specified PORT.

## API Usage
Once the server is up, you can access the various API endpoints as per the routes defined within the `module` directory.


## NOTE 
I have deployed the backend on AZURE server important links are here:

- **GITHUB_REPO**:          =  https://github.com/muhammadfarhandh/echomarket.git
- **AZURE BASE_URL**:       =  https://echomarket.azurewebsites.net/api/v1/ecom
- **POSTMAN COLLECTION**:   =  https://documenter.getpostman.com/view/7773011/2sA3JDgQGQ

updated branch is `master`