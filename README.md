# ResponderLog

ResponderLog is a privacy-first, offline-first personal career vault for firefighters, EMTs, paramedics, rescue personnel, and other responders.

## Product idea

Department systems are built for the department. ResponderLog is built for the individual responder and is intended to remain useful across stations, employers, roles, and decades.

It keeps six parts of a responder's professional history together:

1. **Career log** — non-identifying incident categories, hands-on skills, training, and accomplishments.
2. **Exposure record** — a personal history of occupational smoke, chemical, biological, noise, temperature, near-miss, and related exposures.
3. **Certification radar** — expiration dates plus optional continuing-education / renewal-hour progress.
4. **Career goals** — target dates, next steps, and progress.
5. **Career report** — lifetime training, skill repetitions, credentials, and accomplishments for reviews and promotion preparation.
6. **Portable backup** — full JSON backup plus career-log and exposure CSV exports.

## Privacy model

ResponderLog intentionally has no patient-name, DOB, patient-address, MRN, phone, or similar patient fields. It includes lightweight pattern checks that block several common forms of identifying information in free-text fields.

Data is stored in browser `localStorage` on the user's device. There is no ResponderLog account, analytics SDK, cloud database, or server-side patient record.

ResponderLog is **not** an ePCR, medical device, official department record, exposure reporting system, workers' compensation filing system, or substitute for agency documentation requirements.

## Key features

- Responsive mobile + desktop interface
- Installable progressive web app
- Offline cache after first load
- One-tap quick capture
- Editable career records
- Search + category filters
- Skill confidence / practice tracking
- Training-hour totals
- Occupational exposure log
- Certification expiry alerts
- Optional renewal-hour progress
- Career goals + progress
- Print-friendly career report
- Dark / light themes
- JSON backup/import
- CSV exports
- Automatic migration from `responderlog.v1`
- No dependencies or build step

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Validate

```bash
node --check app.js
python3 -m json.tool manifest.json > /dev/null
```

## License

MIT
