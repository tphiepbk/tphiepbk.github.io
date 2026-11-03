# Repository guidance

## Project

This is a static personal dashboard. The repository root is the website root.
The site is hosted by an Apache httpd Docker container.
There is no build step or dependency installation required.

- `index.html`: homepage linking to the resource pages.
- `pages/`: AWS practice bank, SecondShift architecture, and PDF library.
- `assets/css/main.css`: homepage and PDF library styles.
- `assets/css/site-layout.css`: shared page spacing and circular top-right logo.
- Other files in `assets/css/` and `assets/js/`: page-specific styles and behavior.
- `assets/images/logo.png`: shared visible logo and favicon.
- `resources/`: PDFs; links in the PDF library are maintained manually.

## Changes

- Make the smallest complete change using existing HTML, CSS, and JavaScript.
- Preserve unrelated local changes. Do not add dependencies for simple edits.
- Keep links relative so hosting under a URL subdirectory works.
- Add new pages to the homepage navigation.
- Load `site-layout.css` after page-specific styles. Keep shared logo and spacing
  rules there rather than duplicating them in individual stylesheets.
- Preserve the circular logo at the top right and reserve space for header text.
- Check every page when changing shared styles; retain usable mobile layouts.
- Preserve accessible labels, image alt text, keyboard focus, and skip links.
- Preserve the practice bank's filtering behavior and question data when editing it.
- Update existing stylesheet version query strings when needed to avoid stale caches.

## Verification

Use the existing httpd Docker deployment for preview and verification. Inspect
its port and volume mappings before assuming a URL or how edits reach the served
files. Do not assume GitHub Pages hosting from the repository name.
Check affected pages at desktop and mobile widths, including logo placement,
text overlap, navigation, and relative asset paths. Check relevant interactions
when changing JavaScript. SecondShift diagrams load Mermaid from jsDelivr and
need internet access.

There is no configured automated test suite. Use checks appropriate to the change
and report what was actually verified. Do not claim a browser check unless performed.
