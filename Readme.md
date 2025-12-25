# PrepSmart: AI Interviewer

![PrepSmart Logo](https://raw.githubusercontent.com/your-repo/prepsmart_logo.png)

PrepSmart is an intelligent AI-powered interview preparation platform designed to help users practice and improve their interview skills. It features real-time chat with an AI interviewer, domain-specific questions, and actionable feedback.

## Features

-   **AI Interviewer**: Conducts realistic interview sessions using Google Gemini AI.
-   **Domain Selection**: Choose from various domains (General, Software Engineering, Data Science, etc.).
-   **Real-time Feedback**: Receive instant scores and tips after each exchange.
-   **Conversation History**: Save and review past interview sessions.
-   **User Authentication**: Secure login and signup via Supabase.
-   **Responsive Design**: Modern, beautiful UI built with React and Tailwind CSS.

## Tech Stack

### Backend
-   **FastAPI**: High-performance Python web framework.
-   **Google Gemini API**: Powering the AI intelligence (`gemini-flash-latest`).
-   **Supabase**: Authentication and PostgreSQL database.
-   **AsyncPG**: Asynchronous database driver.

### Frontend
-   **React (Vite)**: Fast and modern frontend framework.
-   **Tailwind CSS**: Utility-first CSS framework for styling.
-   **Shadcn UI**: Reusable and accessible UI components.
-   **Lucide React**: Beautiful icons.

## Setup & Installation

### Prerequisites
-   Python 3.11+
-   Node.js 18+
-   Supabase Account
-   Google AI Studio Account (for Gemini API Key)

### Backend Setup

1.  Navigate to the root directory:
    ```bash
    cd d:\ai-interviewer
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file with the following variables:
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    DATABASE_URL=your_postgres_connection_string
    JWT_SECRET=your_jwt_secret
    GEMINI_API_KEY=your_gemini_api_key
    ```
5.  Run the server:
    ```bash
    uvicorn app.main:app --reload
    ```

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `frontend/`:
    ```env
    VITE_API_URL=http://localhost:8000
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## Security Note

-   **SSL Verification**: For development compatibility, SSL verification for the database connection is currently disabled in `app/db.py`. For production environments with strict security requirements, ensure your database provider uses a trusted certificate authority or configure the CA bundle correctly.
-   **CORS**: The API is currently configured to allow all origins (`*`) for ease of development. For production, update `CORS_ORIGINS` in `app/config.py` or your environment variables to list only your frontend domain.

## Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.
