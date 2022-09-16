const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen("3001", () => {
      console.log("*** Server is running at http://localhost:3001/ ***");
    });
  } catch (error) {
    console.log(`DB Eroor: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1

app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const userCheckQuery = `
    SELECT
     *
    FROM
        user
    WHERE
        username = '${username}';`;
  const dbUser = await db.get(userCheckQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const addUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location)
      VALUES(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}');`;
      await db.run(addUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login", async (request, response) => {
  const loginCredentials = request.body;
  const { username, password } = loginCredentials;
  const userVerificationQuery = `
    SELECT
       *
    FROM
        user
    WHERE
        username = '${username}';`;
  const dbUser = await db.get(userVerificationQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const changePasswordDetails = request.body;
  const { username, oldPassword, newPassword } = changePasswordDetails;
  const userVerification = `
  SELECT
    *
  FROM
    user
  WHERE
    username = '${username}';`;
  const dbUser = await db.get(userVerification);
  const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatch) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newHashedPassword = await bcrypt.hash(newPassword, 13);
      const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${newHashedPassword}'
          WHERE
            username = '${username}';`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
