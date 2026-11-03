# tphiepbk-dashboard
My customized dashboard for personal needs

# Static website

The repository root is the website root. The site is hosted using an Apache httpd Docker container; no build step or package installation is needed.

## Structure

- `index.html`: dashboard and main entry point.
- `pages/`: AWS Cloud Practitioner practice bank, SecondShift architecture, and PDF library.
- `resources/`: PDF files linked from `pages/pdf-library.html`.
- `assets/css/main.css`: dashboard styles. Each secondary page has its own stylesheet alongside it.
- `assets/js/`: page-specific practice-bank behavior and Mermaid diagram setup.
- `assets/images/logo.png`: browser-tab icon shared by all pages. The site uses system fonts.

## Preview

Use the existing httpd Docker container and its configured host address and port.
Check the container’s port and volume mappings to confirm the URL and which files it serves.

## Editing and hosting

Edit the HTML in `pages/` and its matching CSS or JavaScript under `assets/`. Keep links relative so the site can also be hosted under a URL subdirectory. Update the dashboard when adding pages.

SecondShift diagrams load Mermaid from jsDelivr and require internet access. No custom font files are required.

To add a PDF, store it in `resources/` and add a link in `pages/pdf-library.html` using `../resources/your-file.pdf`. The library list is maintained manually.

