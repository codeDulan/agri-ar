# AgriAR — Interactive WebXR Agriculture Sensor Dashboard

An individual assignment for INTE 42312 (Virtual and Augmented Reality).

A browser-based AR experience for precision agriculture. It visualises **live weather
and air-quality data** (Open-Meteo API — no key required) on 3D farm assets, and
demonstrates both **marker-based** and **markerless** AR tracking.

## Features

- **Marker-based AR** — a Hiro marker anchors a 3D sensor-station model (AR.js).
- **Markerless AR** — WebXR hit-testing places the farm scene on a detected surface.
- **Live data (Advanced Option A)** — Open-Meteo readings drive the 3D content:
  wind-turbine rotation speed, crop-health colour, and an on-scene readout panel.
- Two web-optimised glTF models, HTML UI overlay, lighting, animation, and audio.

## Tech stack

- [A-Frame](https://aframe.io/) 1.6.0 — WebXR / Three.js framework
- [AR.js](https://ar-js-org.github.io/AR.js-Docs/) — marker tracking
- WebXR Device API — markerless hit-testing
- Open-Meteo REST API — live environmental data

## Run locally

AR needs HTTPS (or `localhost`) for camera access. Serve the folder:

```bash
npx serve .          # or: python3 -m http.server 8080
```

Open the printed `localhost` URL. For phone testing use the hosted URL (see below)
or a tunnel such as `npx localtunnel --port 8080`.

## Hosted application

_URL added in Step 8 (GitHub Pages)._

## Build progress

- [x] Step 1 — project skeleton + running A-Frame scene
- [ ] Step 2 — UI shell + mode switching
- [ ] Step 3 — marker-based AR
- [ ] Step 4 — optimised 3D models
- [ ] Step 5 — markerless AR (hit-test)
- [ ] Step 6 — live Open-Meteo data integration
- [ ] Step 7 — audio + polish + error handling
- [ ] Step 8 — cross-device testing + deploy
- [ ] Step 9 — technical report + demo

## Credits / licences

_3D models and their CC licences listed here as they are added._
