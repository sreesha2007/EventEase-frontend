# EventEase frontend

## Deploy to Vercel

1. Push this frontend project to a Git repository and import it into Vercel.
2. Use the repository root as the Vercel project root directory. If the repository
   contains both frontend and backend folders, set the root directory to
   `EventEase-frontend`.
3. Vercel should detect Vite automatically. Use `npm run build` as the build
   command and `dist` as the output directory.
4. You can deploy the frontend before the backend is available. The public
   landing page will work, but sign-in, registration, and dashboard API features
   will remain unavailable until the backend is deployed.
5. Once the backend is publicly available, add `VITE_API_BASE_URL` in the Vercel
   project environment variables. Set it to the backend URL without a trailing
   slash or `/api` suffix (for example, `https://api.example.com`), then
   redeploy the frontend.

When `VITE_API_BASE_URL` is not configured in production, API actions show a
message that the backend is not deployed. Local development continues to use
`http://localhost:8080` by default.

The backend must be deployed separately and reachable over HTTPS. Configure
`APP_CORS_ALLOWED_ORIGIN` in its hosting environment to the exact public
frontend origin (for example, `https://eventease.vercel.app`, with no path or
trailing slash). The backend also needs a production MySQL database; configure
its `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and
`SPRING_DATASOURCE_PASSWORD` environment variables with the database
connection details. Do not put backend secrets in Vercel or any `VITE_`
variable.

Vercel uses `vercel.json` to serve the SPA entry point for direct page requests.

## Local development

Copy `.env.example` to `.env`, then run:

```sh
npm install
npm run dev
```

The local API URL defaults to `http://localhost:8080`. Start the backend with
its local MySQL database, or set `VITE_API_BASE_URL` to another backend URL.
