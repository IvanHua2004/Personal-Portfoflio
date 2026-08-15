# Personal portfolio

My portfolio site: projects, background, and a way to get in touch.

**Live:** https://ivanhua2004.github.io/Personal-Portfoflio/

The hero is a canvas of a few thousand particles that flow through a noise field, react to the cursor, and pull together to spell out the headings on the page.

## Built with

Angular 20, TypeScript, SCSS, Canvas 2D. Express and Node on the API side. No UI library.

## Running it

```bash
cd client
npm install
npm start
```

Then open http://localhost:4200.

The contact form needs the API. It lives in `server/`, runs with `npm install && npm run dev`, and reads its config from a `.env` file (see `.env.example`).

## Layout

```
client/    Angular app, deployed to GitHub Pages
server/    Express API for the contact form, deployed to Render
```

Content lives in `client/src/app/data/` — `projects.data.ts` for the project list, `profile.data.ts` for everything about me. Colours, spacing and type are in `client/src/styles/_tokens.scss`.
