const express = require("express");
const prisma = require("./prisma/client.js");
const bcrypt = require("bcryptjs")
const { passport, generateToken, authenticate } = require('./auth');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(passport.initialize());
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.get("/", (req, res) => {
  res.send("Hello World");
});

// create endpoint for creating a new user
app.post("/user", async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email and password and name are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name,
      },
    });

    const token = generateToken(user);
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name },
      token 
    });
  } catch (error) {
    if (error.code === 'P2002') { // Prisma unique constraint violation
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(400).json({ error: "User creation failed" });
    }
  }
});

// post endpoint logging in
app.post("/login", passport.authenticate('local', { session: false }), 
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ 
      user: { id: req.user.id, email: req.user.email, name: req.user.name },
      token 
    });
  }
);

// create endpoint for a single post
app.post("/post", authenticate, async (req, res) => {
  try {
    const { title, body, published } = req.body;
    const post = await prisma.post.create({
      data: {
        title,
        body,
        published,
        authorId: req.user.id,
      },
    });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: "Post creation failed" });
  }
});

// read endpoint for getting all posts
app.get("/post", authenticate, async (req, res) => {
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
app.get("/post/:id", authenticate, async (req, res) => {
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
app.patch("/post/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, published } = req.body;
    
    // First check if the post belongs to the user
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this post" });
    }
    
    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        title,
        body,
        published,
      },
    });
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ error: "Post update failed" });
  }
});

app.delete("/post/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await prisma.comment.deleteMany({
      where: { postId: parseInt(id) },
    });

    const deletedPost = await prisma.post.delete({
      where: { id: parseInt(id) },
    });
    res.json(deletedPost);
  } catch (error) {
    res.status(400).json({ error: "Post deletion failed" });
  }
});

// create endpoint for creating a new comment
app.post("/post/:id/comment", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const comment = await prisma.comment.create({
      data: {
        body,
        authorId: req.user.id,
        postId: parseInt(id),
      },
    });
    res.json(comment);
  } catch (error) {
    res.status(400).json({ error: "Comment creation failed" });
  }
});

// read endpoint for getting all comments for a post
app.get("/post/:id/comment", async (req, res) => {
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
app.delete("/post/:id/comment/:commentId", authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    // check if the comment belongs to the user
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    const deletedComment = await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });
    res.json(deletedComment);
  } catch (error) {
    res.status(400).json({ error: "Comment deletion failed" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000!"));
