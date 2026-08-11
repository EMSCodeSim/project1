# ResponderLog

ResponderLog is a privacy-first, offline-first Fire & EMS career logbook built for responders who want one simple place to track the work that matters over time.

## Why this exists

Fire and EMS professionals commonly end up spreading career evidence across notes apps, spreadsheets, certification portals, training systems, calendars, and memory. ResponderLog keeps a personal, portable record without trying to replace an ePCR, RMS, LMS, scheduling system, or department record system.

The first version focuses on five jobs:

- Log incident categories without patient-identifying information.
- Track hands-on EMS and fire skills.
- Track training and drill time.
- Watch certification expiration dates.
- Build a promotion-ready record of accomplishments, projects, instruction, awards, and leadership work.

## Privacy model

ResponderLog intentionally has **no fields for patient names, DOBs, addresses, MRNs, phone numbers, or other identifiers**. Data is stored in the browser's local storage on the user's device. There is no account, cloud database, analytics SDK, or server-side patient record.

Users can export a JSON backup or CSV log and import a JSON backup later. Clearing browser/site data can erase local records, so periodic backup is recommended.

## Features

- Installable PWA
- Works offline after first load
- Responsive phone/desktop layout
- Incident, skill, training, and accomplishment quick-log modes
- Fire + EMS skill/category library
- 30-day dashboard
- Certification renewal radar
- Career portfolio summary
- JSON backup/import
- CSV log export
- Local-only storage

## Run locally

No build step or dependencies are required.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Validation

```bash
node --check app.js
python3 -m json.tool manifest.json > /dev/null
```

## Scope and safety

ResponderLog is a personal career/training record, not a medical device, ePCR, clinical decision-support tool, official department record, or substitute for agency documentation requirements. Never store protected health information or sensitive incident-identifying information in the app.

## License

MIT
