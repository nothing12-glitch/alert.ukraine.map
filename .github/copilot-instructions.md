# Workspace Guide

## Project

- Desktop-first Ukrainian air-raid alert map built with React, TypeScript, and Vite.
- Keep the map, region list, filters, loading state, connection status, and fetch time synchronized.
- Use `npm.cmd run dev` for local testing, `npm.cmd run lint` for linting, and `npm.cmd run build` for production validation.

## Alert Data

- Read public alert cards from `https://map.ukrainealarm.com/` through the local Vite middleware at `/api/alerts`.
- Normalize and deduplicate visible card fields server-side; never expose or copy authorization tokens into browser code.
- Do not substitute mock statuses for source data. The selected polling mode is every 20 seconds; preserve and label the last successful data when offline.
- The live mode embeds the official map and its own push connection; do not copy or expose credentials from that page.
- Keep long-running administrative notices in occupied territory visually distinct from current threats and exclude them from current-threat totals.
- Do not show target coordinates or imply that absent map markers mean safety.
- Keep favorites, user notification settings, activity history, filters, and CSV export synchronized with the selected source data.
- GitHub Pages needs `ALERTS_API_URL` for the custom 20-second view; its backend must expose only sanitized public feed data.
- Treat this as informational only, never as a replacement for official alerts or local authority instructions.

## Map Attribution

- Map geometry comes from `@svg-maps/ukraine`, derived from MapSVG under CC BY 4.0.
- Retain links to MapSVG and the CC BY 4.0 license in the interface and documentation.