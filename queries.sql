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
