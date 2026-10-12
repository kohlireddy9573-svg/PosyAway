# PosyAway

PosyAway is a small social-networking project built with Node.js, Express, and ES modules. It includes an in-memory API and a responsive browser client for sharing posts, images, comments, likes, and bookmarks.

## Run locally

Use Node.js 20 or newer.

```sh
npm install
copy .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set a private `JWT_SECRET` in `.env` before exposing the app beyond local development. Uploaded images are stored in `public/uploads`; account and social data are held in memory and reset when the server restarts.

## API

All routes are prefixed with `/api`. Except for health, signup, and signin, routes require `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/signup` | Create an account (`name`, `email`, `password`) |
| `POST` | `/signin` | Sign in (`email`, `password`) |
| `GET` | `/posts` | Paginated feed (`page`, `limit`, `sort=recent\|popular`) |
| `GET` | `/posts/search?q=...` | Search post captions |
| `GET` | `/posts/user/:userId` | List a user's posts |
| `GET` | `/posts/:id` | Get one post |
| `POST` | `/posts` | Create a post; use `caption`, optional `image` multipart file or `imageUrl`, and optional `isDraft` |
| `PUT` | `/posts/:id` | Update your post or archive it with `isArchived` |
| `DELETE` | `/posts/:id` | Delete your post and its comments/likes |
| `GET`, `POST` | `/comments/:postId` | List comments (`page`, `limit`) or add a comment |
| `PUT`, `DELETE` | `/comments/:commentId` | Update or remove your comment |
| `GET` | `/likes/:postId` | List likes and current user's like state |
| `POST` | `/likes/toggle/:postId` | Toggle the current user's like |
| `GET` | `/likes/toggle/:postId` | Compatibility route from the original brief; use `POST` for state changes |
| `GET` | `/bookmarks` | List the current user's saved posts |
| `POST` | `/bookmarks/:postId` | Toggle a saved post |

Post captions are limited to 2,000 characters, comments to 1,000 characters, and images to 5 MB (JPEG, PNG, GIF, or WebP). Passwords are hashed before storage.

The API separates route definitions, controllers, models, and in-memory data. Request logs include the URL and a bounded request-body summary; password, token, secret, and authorization fields are redacted, and signup/signin requests are excluded.

## Test

```sh
npm test
```

