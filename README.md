# Kyushu 2026 Travel Planner

A mobile-first, static travel planner for the Kyushu 2026 road trip. It uses only HTML, CSS, JavaScript, and JSON, and is ready for GitHub Pages.

## Project structure

```text
dist/
├── index.html
├── styles.css
├── app.js
├── .nojekyll
├── assets/
└── data/
    └── itinerary.json
.github/workflows/pages.yml
```

All trip content lives in `dist/data/itinerary.json`. Update that file to reuse the same site for another trip; the day navigation, itinerary cards, parking details, copy buttons, hotel section, and map markers are rendered from the JSON.

The `navigationName` and `parking` fields are deliberately separate so each can be changed independently.

## Preview locally

Serve the `dist` folder with a local static web server. Do not open `index.html` directly from the file system because browsers usually block the JSON request in that mode.

For example, with Node.js installed:

```powershell
npx --yes serve dist
```

Open the local address printed in the terminal.

## First-time GitHub Pages deployment

### 1. Create an empty GitHub repository

1. Sign in to GitHub.
2. Click the **+** menu in the upper-right corner, then **New repository**.
3. Enter a repository name, such as `kyushu-2026-travel-planner`.
4. Choose **Public** if your GitHub plan does not include Pages for private repositories.
5. Leave **Add a README**, **Add .gitignore**, and **Choose a license** unchecked.
6. Click **Create repository**.

### 2. Push this project

From this project folder, replace the example remote URL with the one GitHub shows for your new repository, then run:

```powershell
git add .
git commit -m "Prepare Kyushu travel planner for GitHub Pages"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If `origin` already exists, update it instead:

```powershell
git remote set-url origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

### 3. Enable GitHub Pages

1. Open the repository on GitHub.
2. Click **Settings**.
3. In the left sidebar, under **Code and automation**, click **Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Click the **Actions** tab and open **Deploy static site to Pages**.
6. If the workflow did not run automatically, click **Run workflow**, choose `main`, then click **Run workflow** again.
7. Wait for the deployment to show a green check mark.
8. Return to **Settings → Pages** and click **Visit site**.

The project site URL will normally be:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

## Publish future changes

Every push to `main` redeploys the site automatically:

```powershell
git add .
git commit -m "Update itinerary"
git push
```

## GitHub Pages path compatibility

All local links use relative paths rather than root-relative paths. This lets the site work beneath a repository subdirectory such as `/YOUR-REPOSITORY/`. Leaflet and OpenStreetMap resources are loaded from their public HTTPS services, so the interactive map requires an internet connection.

No build step, backend, or database is required.
