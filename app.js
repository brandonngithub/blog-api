const express = require("express");

const app = express();


app.get("/", (req, res) => {
  res.send("Hello World");
});


// create endpoint for creating a new user
app.post("/user", (req, res) => {});

// read endpoint for getting an existing user
app.get("/user", (req, res) => {});


// create endpoint for a single post
app.post("/post", (req, res) => {});

// read endpoint for getting all posts
app.get("/posts", (req, res) => {});

// read endpoint for getting a single post
app.get("/post/:id", (req, res) => {});

// update endpoint for editing a post
app.patch("/post/:id", (req, res) => {});

// delete endpoint for deleting a post
app.delete("/post/:id", (req, res) => {});


// create endpoint for creating a new comment
app.post("/post/:id/comment", (req, res) => {});

// read endpoint for getting all comments for a post
app.get("/post/:id/comments", (req, res) => {});

// delete endpoint for deleting a comment
app.delete("/post/:id/comment/:commentId", (req, res) => {});


app.listen(3000, () => console.log("Server running on port 3000!"));
