# BiteReveal

## Local app

```bash
npm install
npm run dev
```

## Local UI + API

1. Copy `.env.example` to `.env`
2. Add your `GEMINI_API_KEY`
3. Run:

```bash
npm run dev:full
```

This starts:
- the Vite frontend at `http://localhost:5173`
- the Express API at `http://localhost:8787`

The frontend calls `POST /api/analyze`, which proxies to the local API in development.

## Notes

- GitHub Pages can host the frontend, but not the backend API route.
- To deploy `/api/analyze`, use a server host such as Vercel, Render, Railway, or another Node-compatible platform.
- For a separately deployed API, rebuild the frontend with `VITE_API_BASE_URL=https://your-api-host`.
- The backend is set up for the Gemini API free tier by default and keeps the same JSON contract for the frontend.

## Make GitHub Pages analysis work

Recommended path: deploy the backend on Render.

1. Push this repo to GitHub.
2. In Render, create a new `Web Service` from the GitHub repo.
3. Render will detect `render.yaml`.
4. Set `GEMINI_API_KEY` in Render.
5. Deploy and copy your backend URL, for example:

```text
https://bitereveal-api.onrender.com
```

6. In GitHub, open:
   `Repo -> Settings -> Secrets and variables -> Actions -> Variables`
7. Add:

```text
VITE_API_BASE_URL=https://bitereveal-api.onrender.com
```

8. Push a new frontend commit so GitHub Pages rebuilds with that API URL.

After that, the frontend at `https://elaine2003101.github.io/bitereveal/` will call the deployed backend instead of `/api` on GitHub Pages.

## Gemini setup

Get a Gemini API key from Google AI Studio and use the free tier:
- Billing and free tier: https://ai.google.dev/gemini-api/docs/billing/
- Image understanding: https://ai.google.dev/gemini-api/docs/image-understanding
- Node quickstart: https://ai.google.dev/gemini-api/docs/quickstart?lang=node

Recommended Render env vars:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=https://elaine2003101.github.io,http://localhost:5173
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
