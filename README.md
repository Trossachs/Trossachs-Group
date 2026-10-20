# Trossachs Group site

Plain HTML, CSS and JavaScript. No build step. Open `index.html` (or upload the folder to any static host).

## Local admin
Open `admin.html`. Username: `trossachs.int@gmail.com`  Password: `BEST`

- Edit the words of every section, set image links (or upload a file), manage services, projects and the Launching Soon slides.
- Everything saves automatically in your browser and appears on the site straight away.
- **Messages**: the Contact form saves messages in the browser that sent them; read and delete them in Admin > Messages.
- **Publish for everyone**: Admin > Backup & publish > Download content.js, replace `js/content.js`, upload again.
- Change the sign-in on the first line of `js/admin.js`. It is a convenience gate, not real security.
- To receive every visitor's message by email, paste a form endpoint (for example Formspree) under Admin > Contact.

## Files
`index.html` site, `admin.html` admin, `css/`, `js/defaults.js` original wording, `js/content.js` published edits, `js/store.js`, `js/app.js`, `js/admin.js`, `js/textures.js` 3D logo images, `assets/`.
3D uses three.js from a CDN; for offline use put `three.min.js` in `js/vendor/` and change the script tag in `index.html`.
