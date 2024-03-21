import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";
import jwt from "jsonwebtoken";

// Load environment variables from .env file
env.config();

// Initialize Express app
const app = express();
const port = 5000;

// Set up bcrypt
const saltRounds = 10;

// Secret key for JWT
const secretKey = process.env.JWT_SECRET_TOKEN;

// Connect to PostgreSQL database
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

// Middleware setup
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Middleware function to verify JWT token
export default function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    } else {
      req.user = decoded; // Store decoded user information in request object
    }

    next(); // Proceed to the next middleware or route handler
  });
}

// Registration endpoint
app.post("/register", async (req, res) => {
  const { username, password, fullname } = req.body;

  try {
    // Check if username already exists
    const checkResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (checkResult.rows.length > 0) {
      res.status(400).json({ message: "Username already exists!" });
    } else {
      // Hash the password
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log(err);
        } else {
          try {
            // Insert new user into the database
            await db.query(
              "INSERT INTO users (username, password, fullname) VALUES ($1, $2, $3)",
              [username, hash, fullname]
            );
            res.status(200).json({
              message:
                "Thankyou very much for registering! Please proceed to log in.",
            });
          } catch (err) {
            res.status(400).json({ message: "Error executing registeration" });
          }
        }
      });
    }
  } catch (err) {
    res.status(400).json({ message: "Error executing sql query" });
  }
});
app.options("/register", cors());

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body
  try {
    // Query the database to find user with the provided username
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length > 0) {
      // If user found
      const user = result.rows[0]; // Get the user data from the result
      const storedHashPassword = user.password; // Get the hashed password from the database
      // Compare the provided password with the hashed password
      bcrypt.compare(password, storedHashPassword, async (err, result) => {
        if (result) {
          // If passwords match
          // Create payload for JWT token
          const payload = {
            id: user.id,
            username: user.username,
          };
          // Generate JWT token with payload and secret key
          const token = jwt.sign(payload, secretKey, { expiresIn: "2d" });
          // Send success response with token
          res.status(200).json({
            message: "You are logged in!",
            token: token,
          });
        } else {
          // Send error response if passwords don't match
          res.status(401).json({ message: "Incorrect password" });
        }
      });
    } else {
      // Send error response if user not found
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    // Send error response if there's an error executing the database query
    res.status(400).json({ message: "Error executing query" });
  }
});

// Endpoint for adding a new note
app.post("/addNote", verifyToken, async (req, res) => {
  const { note } = req.body; // Extract the note object from the request body
  const userId = req.user.id; // Extract the user ID from the request object
  const { note_title, note_content } = note; // Extract title and content from the note object
  // Query the database to check if the user exists
  const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
  if (result.rows.length > 0) {
    try {
      // Insert the new note into the database and return the added note
      const addedNote = await db.query(
        "INSERT INTO users_notes (user_id, note_title, note_content) VALUES ($1, $2, $3) RETURNING *;",
        [userId, note_title, note_content]
      );
      // Send success response with the ID of the added note
      res.status(200).json({ addedNoteId: addedNote.rows[0].id });
    } catch {
       // Send error response if there's an error adding the note to the database
      res.status(400).json("Error adding note in database");
    }
  } else {
    // Send error response if user does not exist
    res.status(400).json("User not exists!");
  }
});

// Endpoint for editing a note
app.post("/editNote", verifyToken, async (req, res) => {
  const { note, noteId } = req.body; // Extract the note object and note ID from the request body
  const { note_title, note_content } = note; // Extract title and content from the note object
  try {
    // Update the note in the database and return the updated note
    const updatedNote = await db.query(
      "UPDATE users_notes SET note_title=$1, note_content=$2 WHERE id = $3 RETURNING *",
      [note_title, note_content, noteId]
    );
    // Send success response with the ID of the updated note
    res.status(200).json({
      message: "Note updated successfully",
      updatedNoteId: updatedNote.rows[0].id,
    });
  } catch (err) {
    // Send error response if there's an error updating the note in the database
    res.status(400).send("error updating note in database");
    console.log(err);
  }
});

// Endpoint for deleting a note
app.delete("/deleteNote", verifyToken, async (req, res) => {
  const { noteIdToDelete } = req.body; // Extract the ID of the note to delete from the request body
  try {
    // Delete the note from the database
    await db.query("DELETE FROM users_notes WHERE id = $1", [noteIdToDelete]);
    // Send success response
    res.status(200).json("Note deleted successfully");
  } catch {
    // Send error response if there's an error deleting the note from the database
    res.status(400).json("Error deleting note from database");
  }
});

// Endpoint for deleting a user
app.delete("/deleteUser", verifyToken, async (req, res) => {
  const idToDeleteUser = req.user.id; // Extract the ID of the user to delete from the request object
  try {
    // Delete user's notes and user record from the database
    await Promise.all([
      db.query("DELETE FROM users_notes WHERE user_id = $1", [idToDeleteUser]),
      db.query("DELETE FROM users WHERE id = $1", [idToDeleteUser]),
    ]);
    // Send success response
    res.status(200).json({ message: "User deleted successfully" });
  } catch {
    // Send error response if there's an error deleting the user
    res.status(400).json({ message: "Error deleting user" });
  }
});

// Endpoint for getting user data
app.post("/getUserData", verifyToken, async (req, res) => {
  const userId = req.user.id; // Extract the ID of the user from the request object
  const username = req.user.username; // Extract the username of the user from the request object
  try {
    // Query the database to fetch user data
    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      try {
        // Fetch existing notes of the user from the database
        const existedNotesArray = await db.query(
          "SELECT id, note_title, note_content FROM users_notes WHERE user_id = $1;",
          [user.id]
        );
        // Send success response with username and existing notes array
        res.status(200).json({
          username: username,
          existedNotes: existedNotesArray.rows,
        });
      } catch (e) {
        // Send error response if there's an error executing the query
        res.status(400).json("Error executing query" + e.message);
      }
    } else {
      // Send error response if user not found
      res.status(400).json({ message: "User not found" });
    }
  } catch (e) {
    // Send error response if there's an invalid request
    res.status(400).json({ message: "Invalid Request" + e.message });
  }
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
