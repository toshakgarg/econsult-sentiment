# Sentrix

Sentrix analyzes stakeholder comments submitted during MCA (Ministry of Corporate
Affairs) eConsultations. The live website is [sentrix.page](https://sentrix.page).

## Features

- CSV, XLS, and XLSX comment upload with schema, size, and row-count validation.
- Firebase Authentication: email/password registration and login, Google sign-in,
  password reset, persistent browser sessions, and protected routes.
- Azure AI Language sentiment analysis, including batched requests.
- Hugging Face comment summaries and generated word clouds.
- MongoDB Atlas upload and analysis history, scoped to the authenticated user.
- Excel and PDF exports, plus a responsive React dashboard.
- FastAPI OpenAPI documentation and health endpoint.

## Architecture

```text
React/Vite browser
  ├─ Firebase Authentication JS SDK
  └─ Firebase ID token in Authorization: Bearer <token>
       ↓
FastAPI
  ├─ Firebase Admin verifies signature, issuer, audience, expiry, and revocation
  ├─ Owner ID scopes every MongoDB upload, analysis, history, and export query
  ├─ Azure AI Language analyzes sentiment
  └─ Hugging Face generates summaries
       ↓
MongoDB Atlas
```

New records use `firebase:<uid>` as their owner key. Access to older records is
provided only through a verified, explicit identity mapping; accounts are never
linked by matching email addresses.

## Technology

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Recharts, Firebase JS SDK.
- Backend: Python 3.11, FastAPI, Uvicorn, Pandas, OpenPyXL, ReportLab, Firebase Admin.
- Data and AI: MongoDB Atlas, Azure AI Language, Hugging Face Inference API.
- Hosting: Azure App Service (API) and Azure Static Web Apps (web client).
- CI/CD: GitHub Actions.

## Repository layout

```text
econsult-sentiment/
├── .github/workflows/
│   ├── deploy-backend.yml
│   └── deploy-frontend.yml
├── backend/
│   ├── main.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── requirements.txt
│   ├── startup.txt
│   └── .env.example
├── dataset/
│   └── mock_comments.csv
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── .env.example
└── vercel.json
```

Local `.env` files, virtual environments, dependency folders, caches, and build
outputs are intentionally excluded from version control.

## Local development

Prerequisites: Python 3.11, Node.js 22, npm, and access to configured Firebase,
MongoDB, Azure AI Language, and Hugging Face services.

### Backend

From the repository root in PowerShell:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Fill in the required backend values in `backend/.env` before using protected
routes. The API runs at `http://localhost:8000`; interactive API documentation
is at `http://localhost:8000/docs`.

### Frontend

In another PowerShell window:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

The Vite development server runs at `http://localhost:5173`. Configure the
Firebase Web App values and set:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Environment variables

`backend/.env.example` lists the supported backend settings. Required production
values include:

- `FIREBASE_PROJECT_ID`
- Either `FIREBASE_SERVICE_ACCOUNT_JSON` (complete service-account JSON) or
  `GOOGLE_APPLICATION_CREDENTIALS` (path to a service-account JSON file)
- `MONGODB_URI` and `MONGODB_DB_NAME`
- `AZURE_LANGUAGE_ENDPOINT` and `AZURE_LANGUAGE_KEY`
- `HUGGINGFACE_API_KEY`

Optional backend controls include `CORS_ALLOWED_ORIGINS`,
`FRONTEND_PROD_ORIGIN`, `AZURE_LANGUAGE_API_VERSION`,
`AZURE_MAX_DOCUMENTS_PER_BATCH`, `AZURE_MAX_CHARS_PER_DOCUMENT`,
`HF_MAX_ATTEMPTS`, upload limits, rate limits, `TRUST_AZURE_PROXY`, and
`PDF_UNICODE_FONT`. Never place backend credentials in frontend variables.

`frontend/.env.example` contains the complete browser configuration:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

The Firebase Web App API key and app identifiers are public client configuration;
Firebase Admin service-account JSON, MongoDB credentials, and provider API keys
are private server-side credentials.

## Authentication and data isolation

1. Firebase Authentication issues a signed ID token to the browser.
2. The Axios client attaches it as `Authorization: Bearer <token>`.
3. FastAPI Firebase Admin verifies the token and checks revocation. Protected
   requests fail closed if verification is unavailable.
4. The verified Firebase UID determines the MongoDB owner filter for every
   upload, analysis, history, and export operation.
5. To preserve access to older records, an administrator must independently
   verify ownership and add one document to `identity_mappings`:

   ```json
   {
     "firebase_uid": "<verified Firebase UID>",
     "legacy_owner_id": "<verified existing MongoDB owner ID>"
   }
   ```

No email-based identity matching or automatic account linking is performed.

## API

Except for `GET /health`, API routes require a Firebase ID token.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/upload/` | Upload and validate a CSV/XLS/XLSX file |
| `POST` | `/api/analysis/` | Analyze uploaded or supplied comments |
| `GET` | `/api/analysis/progress/{batch_id}` | Get owner-scoped batch status |
| `GET` | `/api/history/` | List the signed-in user's analysis history |
| `GET` | `/api/history/{batch_id}` | Read one owner-scoped analysis |
| `GET` | `/api/history/{batch_id}/export/excel` | Download an Excel report |
| `GET` | `/api/history/{batch_id}/export/pdf` | Download a PDF report |
| `GET` | `/health` | Health check |

Interactive OpenAPI documentation is available at `/docs` when the backend is
running. Use an `Idempotency-Key` header when retrying analysis requests.

## Tests and builds

Backend tests:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m unittest discover -s tests -p "test_*.py"
```

Frontend checks:

```powershell
cd frontend
npm ci
npm run test
npm run lint
npm run build
```

The GitHub Actions workflows run backend tests/syntax checks and frontend
tests/lint/build for pull requests. Production deployment runs only from a
validated push to `main`.

## Azure deployment

Use the existing Azure resources in resource group `econsult-rg`; this project
does not require creating new Azure resources. Configure production values
before merging a release to `main`.

### Backend App Service

In Azure Portal, open **App Services > your backend app > Settings > Environment
variables > App settings** (called **Configuration > Application settings** in
some portal layouts) and set:

| App setting | Value |
| --- | --- |
| `FIREBASE_PROJECT_ID` | `sentrix-75081` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Complete Firebase Admin service-account JSON, stored as a protected app setting |
| `MONGODB_URI` | MongoDB Atlas connection string for the application user |
| `MONGODB_DB_NAME` | `econsult_sentiment` |
| `AZURE_LANGUAGE_ENDPOINT` | HTTPS endpoint of the Azure AI Language resource |
| `AZURE_LANGUAGE_KEY` | Key for that resource |
| `AZURE_LANGUAGE_API_VERSION` | `2023-04-01` unless the Azure resource requires a supported alternative |
| `HUGGINGFACE_API_KEY` | Hugging Face access token with required inference access |
| `HUGGINGFACE_MODEL_URL` | `https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn` |
| `FRONTEND_PROD_ORIGIN` | `https://sentrix.page` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated additional exact frontend origins, if needed |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `1`, so App Service/Oryx installs `backend/requirements.txt` |

Keep the service-account JSON on the server. `FIREBASE_SERVICE_ACCOUNT_JSON`
must contain the complete JSON object (a compact one-line JSON string is the
simplest app-setting value). For local development, use the ignored
`GOOGLE_APPLICATION_CREDENTIALS` setting with an absolute file path instead.
Do not configure both unless you intentionally want the inline JSON to take
precedence.

The backend workflow uses publish-profile deployment and intentionally does
not pass an unsupported `startup-command` input. Confirm that the existing App
Service is a Linux Python 3.11 app. In **App Services > your app > Settings >
Configuration > General settings**, set the startup command to:

```text
uvicorn main:app --host 0.0.0.0 --port 8000
```

If the existing app is Windows-based, stop and confirm a compatible hosting
configuration before deployment; this Linux startup configuration is not
interchangeable with a Windows App Service.

### Frontend Static Web App

In **GitHub > repository > Settings > Secrets and variables > Actions**, add:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `VITE_API_BASE_URL` — the backend public URL ending in `/api`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

The production API URL should have the form
`https://<backend-app-name>.azurewebsites.net/api`. The Static Web Apps
workflow checks that its deployment token and required Firebase/API settings
exist before deployment. `frontend/public/staticwebapp.config.json` enables
SPA route fallback for refreshed protected pages.

The backend workflow also requires `AZURE_BACKEND_APP_NAME` and
`AZURE_BACKEND_PUBLISH_PROFILE` GitHub Actions secrets. The Firebase Admin
service-account JSON belongs in App Service settings, not GitHub Actions.

### Firebase Console

1. Open **Firebase Console > Authentication > Sign-in method** and enable
   **Email/Password** and **Google**. Configure the Google support email.
2. Open **Authentication > Settings > Authorized domains**. Keep `localhost`
   and add `sentrix.page` and the Static Web App's default hostname if it is
   used for sign-in.
3. Open **Project settings > General > Your apps** and use the registered Web
   App values for the `VITE_FIREBASE_*` settings above.
4. Open **Project settings > Service accounts** and generate a private key only
   when needed. Store it securely; never commit or paste it into frontend or
   workflow source. The service account needs permission to read Firebase Auth
   users (`firebaseauth.users.get`) for revocation/disabled-account checks;
   grant the least-privilege Firebase Authentication Admin role or equivalent.

### MongoDB Atlas network access

In **MongoDB Atlas > Security > Network Access > IP Access List**, allow the
existing App Service's outbound IP addresses. Find them in **Azure Portal >
App Services > your backend app > Properties**. Do not use `0.0.0.0/0` as a
shortcut. Confirm the Atlas application database user has only the required
database permissions.

### Domain and production checks

In **Azure Portal > Static Web Apps > your app > Custom domains**, add
`sentrix.page` and complete the DNS validation using the exact records shown
there. Do not change current DNS until the Azure hostname, TLS certificate,
frontend build, and API are verified. Keep `vercel.json` until any existing
Vercel routing has been intentionally retired.

Before declaring a release complete, verify:

- Firebase email/password and Google login, password reset, and protected API
  calls from each authorized frontend domain.
- Backend `/health`, Firebase token verification/revocation, and CORS.
- Upload, analysis, history, owner isolation, word-cloud generation, and both
  report exports using a test account and synthetic/sample data.
- The production frontend can refresh protected routes and reach the correct
  production `/api` URL.
- Azure deployment workflows pass their validation jobs and the resulting live
  frontend/backend are confirmed after deployment.
