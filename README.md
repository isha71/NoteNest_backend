# NoteNest
NoteNest is a web application that allows users to securely manage their notes. It provides features for user registration, login, adding, editing, and deleting notes, as well as deleting user accounts.

# Table of Contents

1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
4. [Usage](#usage)
5. [API Endpoints](#api-endpoints)
6. [Contributing](#contributing)
7. [License](#license)

### Features

- **User registration** with full name, username, and password
- **User authentication and login** with username and password
- **Adding, editing, and deleting notes**
- **Deleting user accounts**
- **Token-based authentication** with JSON Web Tokens (JWT)
- **Secure password storage** with bcrypt hashing
- Frontend built with **React.js**
- Backend built with **Node.js** and **Express**
- Database management with **PostgreSQL**

### Technologies Used

- React.js
- Node.js
- Express.js
- PostgreSQL
- Axios
- bcrypt
- cors
- jwt
- MUI (Material-UI)

### Getting Started

#### Prerequisites

- Node.js installed on your machine
- PostgreSQL installed and running locally or accessible via a URL.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/isha71/NoteNest_backend.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Usage

1. Ensure your PostgreSQL server is running. 
2. Create .env file in backend directory and write down your database credentials and JWT secret token.
   To run this project, you will need to add the following environment variables to your .env file
   ```bash
   `PG_USER` = ""
   `PG_HOST` = ""
   `PG_DATABASE` = ""
   `PG_PASSWORD` = ""
   `PG_PORT` = ""
   `JWT_SECRET_TOKEN` = ""
   ```

3. You need to set up the necessary tables in    your PostgreSQL database. Below are the SQL queries to create the required tables:
   ```bash
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       fullname VARCHAR(255),
       username VARCHAR(255) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL
   );
   CREATE TABLE users_notes (
       id SERIAL PRIMARY KEY,
       user_id INTEGER NOT NULL REFERENCES users(id),
       note_title VARCHAR(255),
       note_content VARCHAR(255)
   );
   ```
   
4.  Start the backend server:
   ```bash
   nodemon server.js
   ```

### API Endpoints

- **POST /register:** Register a new user.
- **POST /login:** Authenticate and log in a user.
- **POST /addNote:** Add a new note for the authenticated user.
- **POST /editNote:** Edit an existing note for the authenticated user.
- **DELETE /deleteNote:** Delete a note for the authenticated user.
- **DELETE /deleteUser:** Delete the user account of the authenticated user.
- **POST /getUserData:** Retrieve user data and existing notes for the authenticated user.

### Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests.

### License

This project is licensed under the MIT License.
