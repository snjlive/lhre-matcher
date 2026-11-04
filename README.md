# LHRE Matcher · MVP

Independent Next.js 15 app for the Lighthouse Real Estate team. Displays Airtable requests and villa availability in either orientation of a match matrix and a timeline. **Read-only**: no writes to Airtable.

## Local setup

```sh
npm install
cp .env.example .env.local
# edit .env.local (never commit secrets)
npm run dev
```

`AIRTABLE_TOKEN`: read-only personal access token restricted to the LHRE base; `AIRTABLE_BASE_ID`: Airtable base. Missing Airtable credentials give a marked demo mode. The app has no separate password prompt.

## Vercel

Import this GitHub repository as a Next.js project. Set both Airtable environment variables in Vercel project settings. **Enable Vercel deployment protection or implement real authentication before sharing the preview URL**. Do not put keys in `NEXT_PUBLIC_` variables or commit `.env.local`.

## Matching semantics

Dates represent nights, checkout date is exclusive. Confirm how the Airtable fields `доступно по / занято с` and `занято по` should be interpreted. The matcher only marks nights as available if explicitly covered; gaps remain unknown. Other criteria such as location, budget, and bedroom count are visible but not yet used in scoring. This does not confirm a booking.

## Safety

This repository contains no Airtable records or access tokens. Airtable and `lhre.homes` are unchanged. The repository was found to be public at bootstrap; make it private in GitHub Settings before relying on it for internal work.
