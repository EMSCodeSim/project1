# ResponderLog

ResponderLog is a privacy-first, offline-first personal career vault for firefighters, EMTs, paramedics, rescue personnel, and other responders.

The repository now includes a conversion-focused public site (`landing.html`) and the complete free app (`index.html`). Netlify serves the public site at `/` and the career log at `/index.html`.

## Business model

- **Personal:** free offline career log and exports; no account required.
- **Pro:** planned $39/year portfolio reports, analytics, and custom taskbooks.
- **Department:** planned $149/month founding tier for up to 50 members, custom taskbooks, evaluator sign-offs, readiness tracking, and compliance exports.

Paid features are presented as early access until billing, authentication, and shared department data are connected. The site does not imply that payment is currently being collected.

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
- Personal taskbooks with Driver / Operator, Fire Officer I, Field Training Officer, and custom templates
- Task completion history, progress meters, and printable qualification views
- Transparent promotion-readiness briefings that map logged evidence to a selected target role
- Suggested next actions based on the thinnest documented evidence category
- Print-friendly career report
- Dark / light themes
- JSON backup/import
- CSV exports
- Automatic migration from `responderlog.v1`
- No dependencies or build step
- Netlify-native founding-access lead capture plus privacy and confirmation pages

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
