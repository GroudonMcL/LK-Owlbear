# LegendKeeper Link

An [Owlbear Rodeo](https://www.owlbear.rodeo) extension that opens a token's [LegendKeeper](https://www.legendkeeper.com) page from its context menu.

Right-click a token (an image on the Character, Mount or Prop layer) and choose **Open LK Page**. The extension finds the page whose name or alias matches the token's label text, or its name, and opens it in a panel on the right of Owlbear or in a new tab. When there's no single match, it asks you to choose. **Link LK Page…** sets or changes a token's page.

- **GM**: searches every page, including hidden ones. Links the GM picks are saved on the token for everyone.
- **Players**: search only public pages. Links a player picks are kept in their own browser.
- **Panel**: shows LegendKeeper's public view, which hides hidden pages and documents. "Open in LegendKeeper" opens the full app for the GM (DM notes included) and the public view for players.
- **Settings**: the toolbar button chooses where pages open (Owlbear panel or new tab), per person.

Design notes: [`.scratch/legendkeeper-link/spec.md`](.scratch/legendkeeper-link/spec.md).

## How it gets page data

LegendKeeper's API doesn't accept requests from web pages on other sites, so the extension never calls it. Instead, the **Deploy** workflow fetches two page lists when it runs and publishes them next to the extension:

- `lk/public.json`: fetched without a key, so only public pages. Players search this.
- `lk/gm.json`: fetched with your API key, so hidden pages are included. The GM searches this. It is not encrypted, so anyone with the URL can read the page names in it.

New or renamed pages become searchable after the next run.

## Setup

1. Add a repository secret named `LK_API_KEY` holding a LegendKeeper API key (LegendKeeper: Project Settings → Developers → API Keys). Settings → Secrets and variables → Actions → New repository secret.
2. Set Settings → Pages → Source to **GitHub Actions**.
3. Run the **Deploy** workflow (Actions → Deploy → Run workflow), or push to `main`.
4. In Owlbear Rodeo, add the extension from `https://groudonmcl.github.io/LK-Owlbear/manifest.json`.

The project must be public in LegendKeeper for the panel and for players' searches. With a private project, pages open in a new tab, which only works for LegendKeeper members of that project.

## Development

```sh
npm install
LK_API_KEY=lk_... npm run lists   # writes public/lk/*.json for local use
npm run dev                       # serves http://localhost:5173/manifest.json
npm test
npm run build
```

Add `http://localhost:5173/manifest.json` as an extension in Owlbear Rodeo to try local changes.
