# XPMatch standalone frontend

Frontend preview with local sample data. Authentication and connected backend routes are disabled. No API keys or backend server are included.

## Run from source

Install Node.js 22.12+ or 24, then run:

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Navigation, sample planning, taste profiles, research, and local interactions are available. Data is saved in this browser; AI responses and community content are demonstrations.

## Run the included build

```sh
python3 -m http.server 4181 --directory dist
```

Open http://127.0.0.1:4181/. Serve the build over HTTP instead of double-clicking index.html.

## Rebuild

```sh
npm run build
```

Backend integration adapters are excluded from this standalone package.
