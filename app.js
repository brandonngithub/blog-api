const express = require("express");
const prisma = require("./prisma/client.js");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

// create endpoint for creating a new user
app.post("/user", async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "User creation failed" });
  }
});

// read endpoint for getting an existing user
app.get("/user", async (req, res) => {
  try {
    const { email } = req.query;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching user" });
  }
});

// create endpoint for a single post
app.post("/post", async (req, res) => {
  try {
    const { title, body, published, authorId } = req.body;
    const post = await prisma.post.create({
      data: {
        title,
        body,
        published,
        authorId: parseInt(authorId),
      },
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: "Post creation failed" });
  }
});

// read endpoint for getting all posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        comments: true,
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Error fetching posts" });
  }
});

// read endpoint for getting a single post
app.get("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
    });
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching post" });
  }
});

// update endpoint for editing a post
app.patch("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, published } = req.body;
    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        title,
        body,
        published,
      },
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: "Post update failed" });
  }
});

// delete endpoint for deleting a post
app.delete("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.comment.deleteMany({
      where: { postId: parseInt(id) },
    });

    const post = await prisma.post.delete({
      where: { id: parseInt(id) },
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: "Post deletion failed" });
  }
});

// create endpoint for creating a new comment
app.post("/post/:id/comment", async (req, res) => {
  try {
    const { id } = req.params;
    const { body, authorId } = req.body;
    const comment = await prisma.comment.create({
      data: {
        body,
        authorId: parseInt(authorId),
        postId: parseInt(id),
      },
    });
    res.json(comment);
  } catch (error) {
    res.status(400).json({ error: "Comment creation failed" });
  }
});

// read endpoint for getting all comments for a post
app.get("/post/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(id) },
      include: {
        author: true,
      },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching comments" });
  }
});

// delete endpoint for deleting a comment
app.delete("/post/:id/comment/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });
    res.json(comment);
  } catch (error) {
    res.status(400).json({ error: "Comment deletion failed" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000!"));
