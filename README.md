# tphiepbk-dashboard
My customized dashboard for personal needs

# Static website

The repository root is the website root. Deploy its contents directly to a static host; no build step or package installation is needed.

## Structure

- `index.html`: dashboard and main entry point.
- `pages/`: AWS Cloud Practitioner practice bank, SecondShift architecture, and PDF library.
- `resources/`: PDF files linked from `pages/pdf-library.html`.
- `assets/css/main.css`: dashboard styles. Each secondary page has its own stylesheet alongside it.
- `assets/js/`: page-specific practice-bank behavior and Mermaid diagram setup.
- `assets/images/` and `assets/fonts/`: reserved for future assets; currently empty. The site uses system fonts.

## Preview

From this directory, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/ in a browser. Stop the server with Ctrl+C.

## Editing and hosting

Edit the HTML in `pages/` and its matching CSS or JavaScript under `assets/`. Keep links relative so the site can also be hosted under a URL subdirectory. Update the dashboard when adding pages.

SecondShift diagrams load Mermaid from jsDelivr and require internet access. No local images or custom font files are required.

To add a PDF, store it in `resources/` and add a link in `pages/pdf-library.html` using `../resources/your-file.pdf`. The library list is maintained manually.

