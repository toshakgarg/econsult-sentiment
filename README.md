# eCon-Sentiment

AI-powered Sentiment Analysis web application for MCA (Ministry of Corporate Affairs), Government of India eConsultation comments.

## Features

- Upload stakeholder comments via CSV/Excel (`comment_id`, `stakeholder_type`, `provision_no`, `comment_text`, `date`)
- Sentiment analysis per comment using **Azure AI Language**
- Summary generation per comment using **Hugging Face Inference API** (`facebook/bart-large-cnn`)
- Word cloud generation on backend using Python **wordcloud** library (returned as base64 PNG)
- Dashboard with sentiment visualizations (Recharts)
- Analysis history storage in MongoDB Atlas
- Excel report export for each analysis batch
- Appwrite-based login and protected routes

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Recharts, Axios, React Router
- **Backend:** FastAPI, Uvicorn, Pandas, OpenPyXL
- **Database:** MongoDB Atlas
- **Auth:** Appwrite
- **AI APIs:** Azure AI Language + Hugging Face Inference API
- **Deployment:** Azure App Service (backend), Azure Static Web Apps (frontend)
- **CI/CD:** GitHub Actions

## Project Structure

```text
econsult-sentiment/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── utils/
│   ├── .env
│   └── venv/
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── dataset/
│   └── mock_comments.csv
└── .github/workflows/
```

## Backend Environment Variables (`backend/.env`)

```env
AZURE_LANGUAGE_ENDPOINT=https://<your-language-resource>.cognitiveservices.azure.com
AZURE_LANGUAGE_KEY=<your-azure-language-key>
AZURE_LANGUAGE_API_VERSION=2023-04-01

HUGGINGFACE_API_KEY=<your-huggingface-token>
HUGGINGFACE_MODEL_URL=https://api-inference.huggingface.co/models/facebook/bart-large-cnn

MONGODB_URI=<your-mongodb-atlas-connection-string>
MONGODB_DB_NAME=econsult_sentiment

FRONTEND_PROD_ORIGIN=https://<your-static-web-app>.azurestaticapps.net
CORS_ALLOWED_ORIGINS=https://<optional-extra-origin-1>,https://<optional-extra-origin-2>
```

## Frontend Environment Variables (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<your-appwrite-project-id>
```

## Local Setup (Windows)

### 1. Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend will run at: `http://localhost:5173`

## API Endpoints

- `POST /api/upload/` - Upload CSV/Excel and validate required columns
- `POST /api/analysis/` - Run sentiment, summary, and word cloud generation
- `GET /api/history/` - Retrieve past analysis batches
- `GET /api/history/{batch_id}` - Retrieve specific batch details
- `GET /api/history/{batch_id}/export/excel` - Download Excel report
- `GET /health` - Health check

## CI/CD Secrets Required

### Backend Workflow (`deploy-backend.yml`)

- `AZURE_BACKEND_APP_NAME`
- `AZURE_BACKEND_PUBLISH_PROFILE`

### Frontend Workflow (`deploy-frontend.yml`)

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `VITE_API_BASE_URL` (e.g. `https://<your-backend-app>.azurewebsites.net/api`)
- `VITE_APPWRITE_ENDPOINT` (e.g. `https://sgp.cloud.appwrite.io/v1`)
- `VITE_APPWRITE_PROJECT_ID`

## Notes

- Word cloud is generated on Python backend and sent to frontend as base64 PNG.
- Do not store API keys in frontend code.
- Use `dataset/mock_comments.csv` for local testing.
- The backend startup command for Azure App Service is in `backend/startup.txt`.
- Azure Static Web Apps SPA routing is configured in `frontend/public/staticwebapp.config.json`.
