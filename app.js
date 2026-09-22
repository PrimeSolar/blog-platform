/**
 * Blog Platform Application Script
 *
 * Copyright © Vladislav Kazantsev
 * All rights reserved.
 * This code is the intellectual property of Vladislav Kazantsev.
 * You are welcome to clone the related repository and use the code for exploratory purposes.
 * However, unauthorized reproduction, modification, or redistribution of this code (including cloning of related repository or altering it for activities beyond exploratory use) is strictly prohibited.
 * Code snippets may be shared only when the original author is explicitly credited and a direct link to the original source of the code is provided alongside the code snippet.
 * Sharing the link to the file is permitted, except when directed toward retrieval purposes.
 * Any form of interaction with this file is strictly prohibited when facilitated by the code, except when such interaction is for discussion or exchange purposes with others.
 * This copyright notice applies globally.
 * For inquiries about collaboration, usage outside exploratory purposes, or permissions, please contact: hypervisor7@pm.me
 */

import express from "express";
import path from "path";

const app = express();
const port = 3000;

/** Configuration. */
const CONFIG = {
  MAX_POST_TITLE_LENGTH: 200,
  MAX_POST_CONTENT_LENGTH: 50000,
  MAX_POSTS: 1000 /** Prevent memory exhaustion. */,
};

/** Validate post input data before storage and reports potential errors consistently.
 * Return { valid: boolean, error?: string }
 */
const validatePost = (title, content) => {
  if (!title || typeof title !== "string") {
    return { valid: false, error: "Title is required and must be text." };
  }
  if (!content || typeof content !== "string") {
    return { valid: false, error: "Content is required and must be text." };
  }
  if (title.length > CONFIG.MAX_POST_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Title exceeds ${CONFIG.MAX_POST_TITLE_LENGTH} characters.`,
    };
  }
  if (content.length > CONFIG.MAX_POST_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Content exceeds ${CONFIG.MAX_POST_CONTENT_LENGTH} characters.`,
    };
  }
  if (posts.length >= CONFIG.MAX_POSTS) {
    return { valid: false, error: "Post limit reached." };
  }
  return { valid: true };
};

/** Middleware. */

app.use(express.urlencoded({ extended: true }));
/** Middleware to parse JSON data. */
app.use(express.json());
/** Middleware to parse JSON data. */
app.use(express.static(path.join(path.dirname(""), "public")));

/** Set EJS as the templating engine. */
app.set("view engine", "ejs");
app.set("views", path.join(path.dirname(""), "views"));

/** Security headers. */
app.use((req, res, next) => {
  /** Prevents the browser from doing MIME-type sniffing. */
  res.set("X-Content-Type-Options", "nosniff");
  /** Prevents clickjacking and enforces same-origin resource loading. */
  res.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; default-src 'self' https://cdn.jsdelivr.net/;"
  );
  res.set("X-Frame-Options", "DENY");
  next();
});

/** In-memory storage for blog posts. */

let posts = [];

/** Route handlers. */

/** GET /
 * Render the home webpage.
 */
app.get("/", (req, res) => {
  res.render("index", { posts });
});

/** GET /create
 * Render the webpage to create a new blog post.
 */
app.get("/create", (req, res) => {
  res.render("create");
});

/**
 * POST /create
 * Publish a new blog post. Provides input validation, error handling, proper status codes.
 */
app.post("/create", (req, res) => {
  const { title, content } = req.body;
  /** Validate input. */
  const validation = validatePost(title, content);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  try {
    posts.push({ title, content });
    /** Redirect with success context. */
    res.redirect("/");
  } catch {
    res.status(500).json({ error: "Failed to create post." });
  }
});

/** POST /delete
 * Delete a blog post.
 */
app.post("/delete", (req, res) => {
  const { index } = req.body;
  posts.splice(index, 1);
  res.redirect("/");
});

/** POST /update
 * Update a blog post.
 */
app.post("/update", (req, res) => {
  const { index, title, content } = req.body;
  posts[[...posts].reverse().length - 1 - index] = { title, content };
  res.redirect("/");
});

/** Render the 404 webpage.
 * Centralized error handler for unmapped routes. Improves:
 * 1. HTTP semantics: correctly returns 404 status (not 200) - important for SEO,
 * crawlers, and CDN caching behavior.
 * 2. User experience: redirects to the custom error webpage instead of a generic server output.
 * 3. Security: no stack traces or sensitive information exposed to a client.
 * 4. Error recovery: offers navigation guidance within the 404 template.
 */
app.all("*", (req, res) => {
  res.status(404).render("404");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
