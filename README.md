# WTFisHappening hosted prototype

This is the smallest deployable Vercel version of the current prototype.

## Deploy in Vercel
1. Create a new GitHub repository.
2. Upload the contents of this folder to that repo.
3. In Vercel, choose **Add New → Project** and import the repository.
4. Framework preset: **Other**.
5. Leave Build Command blank.
6. Leave Output Directory blank.
7. Deploy.

The root `index.html` is the app.
`/api/headlines` is a Vercel serverless function that fetches Reuters/AP tracker-related headlines server-side, avoiding the Android `content://` CORS problem.

No paid API key is required for this first hosted test.

## What remains device-local
The 48-hour Changes journal and score history are still stored in browser localStorage in this version.
The next backend step would be moving those to a shared database so every visitor sees the same canonical history.
