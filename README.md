# Cape Hawke Game Fishing Club — Website

Static site: plain HTML/CSS/JS, no build step required.

## Structure
```
index.html         Home
about.html          About / history / committee
events.html         Calendar, comp rules, leaderboard
sponsors.html       Sponsor spotlight by tier
membership.html     Membership tiers & benefits
contact.html        Contact form + details
css/styles.css       All styling (design tokens at the top)
js/main.js           Mobile nav toggle, tideline animation, contact form handler
assets/logo.jpg      Club logo
```

## Before going live
- [x] Real club details added (about, committee, membership fees, sponsorship tiers, contact)
- [ ] Add the leaderboard once results exist, and sponsor names/logos when confirmed
- [ ] Contact form opens the visitor's email app (mailto:); swap for Formspree/Web3Forms later if wanted

## Deploy (static hosting — Netlify, Vercel, or Cloudflare Pages)
1. Push this folder to a GitHub repo
2. Connect the repo in Netlify/Vercel/Cloudflare Pages
3. Build settings: none needed — it's static HTML, no build command, publish
   directory is the repo root
4. Once deployed, add your custom domain in the host's dashboard and update
   your DNS records at your domain registrar as instructed

## Local preview
Just open index.html in a browser, or run a local server, e.g.:
```
python3 -m http.server 8000
```
then visit http://localhost:8000

If Python/Node aren't installed (e.g. a fresh Windows machine), use the bundled
PowerShell static server instead:
```
powershell -ExecutionPolicy Bypass -File ../.claude/serve.ps1
```
then visit http://localhost:8123


## Merch shop
See `SHOP-SETUP.md`. Checkout stays off while `shop/products.json` has `"mode": "sample"`. Never commit `shop/config.php`.
