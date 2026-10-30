<div align="center">

<img src="assets/icons/magify_logo.png" alt="Magify logo" width="160">

# MAGIFY

### A pixel-art grimoire for Magic: The Gathering

**Find a card. Discover its story. Let chance choose the next one.**

[**OPEN THE LIVE APP**](https://magifyapp.netlify.app/) · [**EXPLORE THE SOURCE**](https://github.com/PolZirilli/magify)

<img src="https://img.shields.io/badge/HTML5-171324?style=flat-square&logo=html5&logoColor=E8B95B" alt="HTML5"> <img src="https://img.shields.io/badge/CSS3-171324?style=flat-square&logo=css&logoColor=E8B95B" alt="CSS3"> <img src="https://img.shields.io/badge/JavaScript-171324?style=flat-square&logo=javascript&logoColor=E8B95B" alt="JavaScript"> <img src="https://img.shields.io/badge/Scryfall_API-171324?style=flat-square&logoColor=E8B95B" alt="Scryfall API">

</div>

---

## ✦ Enter the grimoire

**Magify** is a mobile-first Magic: The Gathering card explorer, wrapped in a retro fantasy interface. It combines card discovery with a playful pixel-art visual language: browse by name, inspect card details, or shuffle your way to a surprise.

<div align="center">
<table>
<tr>
<td align="center" width="50%">
<img src="assets/icons/buscar_pixel_icon.png" alt="Pixel-art search icon" width="92"><br>
<strong>SEARCH THE ARCHIVE</strong><br>
Find cards by name with autocomplete suggestions.
</td>
<td align="center" width="50%">
<img src="assets/icons/barajar_pixel_icon.png" alt="Pixel-art shuffle icon" width="92"><br>
<strong>SHUFFLE & DISCOVER</strong><br>
Reveal a random card and explore its details.
</td>
</tr>
</table>
</div>

## ✦ What you can do

- **Search cards** by name and browse matching results.
- **Autocomplete** card names as you type.
- **Draw a random card** for spontaneous discovery.
- **Explore card details**, including gameplay information, set, rarity, artist, and available pricing.
- **Discover more from an artist** through related card illustrations.
- **Follow external references** to supported Magic card resources.

Card information is retrieved from the [Scryfall API](https://scryfall.com/docs/api).

## ✦ Visual identity

Magify takes inspiration from **classic pixel-art games and fantasy grimoires**. Its visual language brings together dark atmospheric backgrounds, gold-toned accents, illustrated pixel icons, and the **Press Start 2P** typeface.

<div align="center">
<img src="assets/icons/magify_logo.png" alt="Magify original artwork" width="120">
<br><sub>Original Magify branding and interface assets, used throughout the application.</sub>
</div>

## ✦ Under the hood

| Layer | Technology |
| :--- | :--- |
| Structure | HTML5 |
| Styling | CSS3 |
| Interactivity | Vanilla JavaScript |
| Card data | Scryfall REST API |
| Typography | Google Fonts · Press Start 2P |
| Hosting | Netlify |

The project uses a lightweight, framework-free frontend. The Scryfall service handles searching, autocomplete, random cards, and artist-based discovery.

## ✦ Run it locally

Clone the repository:

```bash
git clone https://github.com/PolZirilli/magify.git
cd magify
```

Serve the project from its root directory:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser. An internet connection is required for card data and externally hosted fonts.

## ✦ Project structure

```text
magify/
├── assets/
│   └── icons/       # Brand artwork and pixel-art navigation icons
├── css/
│   └── styles.css   # Visual system and responsive layout
├── js/
│   ├── app.js       # Interface and interactions
│   └── scryfall.js  # Scryfall API integration
└── index.html       # Application entry point
```

## ✦ Credits & acknowledgments

**Created by [Pol Zirilli](https://github.com/PolZirilli).**

Card data and images are provided through [Scryfall](https://scryfall.com/). *Magic: The Gathering* and its associated trademarks and artwork belong to Wizards of the Coast and their respective owners.

Magify is an independent fan project and is **not affiliated with, endorsed by, or sponsored by Wizards of the Coast or Scryfall**.

---

<div align="center">
<img src="assets/icons/magify_logo.png" alt="" width="72">

**THE NEXT CARD IS WAITING.**

[Launch Magify](https://magifyapp.netlify.app/)
</div>
