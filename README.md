<div align="center">
  <img src="frontend/public/assets/logo.png" alt="Benchmind Logo" width="200" height="200">
  
  # 🎯 Benchmind
  **AI Model Selection with Environmental Intelligence**
</div>

> Choose the right AI model for your task based on **performance, cost, and carbon footprint** — powered by Google ADK and real-world benchmarking.

## What It Does

Benchmind is an AI consultant that helps you select optimal models by:
- 🤖 **Understanding your task** through natural language
- 🔍 **Searching the web** for model quality benchmarks (MMLU, HumanEval)
- ⚡ **Benchmarking efficiency** with real API calls (latency, cost, CO₂)
- 📊 **Visualizing trade-offs** with interactive charts (scatter plots, radar charts, bar charts)
- 🌱 **Color-coded insights** - Green (most eco-friendly) to Red (least eco-friendly)
- 💡 **Recommending** the best model with detailed reasoning

**Key Innovation:** Combines efficiency metrics (measured via EcoLogits) with quality data (web-sourced) for complete model evaluation.

## 🏗️ Tech Stack

**Backend:** FastAPI + PostgreSQL + Google ADK + EcoLogits (ISO 14044)  
**Frontend:** React + TypeScript + Vite + TailwindCSS + Recharts  
**Database:** PostgreSQL + Alembic migrations  
**Authentication:** JWT tokens + OTP email verification  
**AI:** Google Gemini (reasoning) + DuckDuckGo (web search) + Mistral API (benchmarking)  
**Deployment:** Backend on Render + Frontend on Firebase

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** with pip
- **Node.js 18+** with npm
- **PostgreSQL** database
- **API Keys**: Mistral AI, **2x Google Gemini keys**

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys and database:
# DATABASE_URL=postgresql://user:password@localhost:5432/benchmind
# JWT_SECRET=your-secret-key
# MISTRAL_API_KEY=your_mistral_key
# GEMINI_API_KEY=your_first_gemini_key   # Main agent
# GOOGLE_API_KEY=your_second_gemini_key  # Search agent

# Initialize database
python init_db.py

# Run migrations
alembic upgrade head

# Start the server (choose one)
python -m app.main                    # Direct Python execution
# OR
uvicorn app.main:app --reload         # Using uvicorn with auto-reload
```

Backend available at: `http://localhost:8000`

**API Documentation:** `http://localhost:8000/docs` (FastAPI auto-generated)

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend available at: `http://localhost:5173` (Vite dev server)

## 🎮 Usage

### **Live Application:** https://benchmind-app.web.app/

1. **Sign up/Login** with email verification (OTP system)
2. **Describe your task**: *"I need an AI-powered Q&A system for my knowledge base"*
3. **Select 1-3 models** to compare from 60+ available models
4. **Click "🌱 See greenest models"** and wait 1-2 minutes for benchmarking
5. **View results across 3 pages**:
   - **Efficiency**: Environmental impact recommendations
   - **Quality**: Web-sourced benchmarks and analysis
   - **Analytics**: Historical data with interactive charts
6. **Session Management**: All runs saved to your profile with delete functionality

## 📊 Example Output

**Section 1: Efficiency Analysis** (from benchmarking)
```
| Model              | Latency | Cost    | Energy  | CO₂    |
|--------------------|---------|---------|---------|--------|
| Mistral Tiny 2407  | 2080ms  | $0.00035| 0.28 Wh | 0.17g  |
| Mistral Tiny Latest| 1432ms  | $0.00035| 0.25 Wh | 0.15g  |
| Devstral Small     | 1228ms  | $0.00035| 0.50 Wh | 0.30g  |
```

**Section 2: Quality Research** (from web search)
```
🔍 Mistral Tiny Latest:
• Versatile model for generative AI tasks
• Source: https://mistral.ai/news - ✅ Highly Credible
• No specific MMLU scores found for this version

🔍 Devstral Small:
• Specialized for software engineering tasks
• Source: https://mistral.ai/news/devstral - ✅ Highly Credible
```

**Section 3: Final Recommendation**
```
Winner: Mistral Tiny Latest
- Fastest latency (1432ms)
- Lowest CO₂ (0.15g)
- General-purpose model (vs Devstral's code specialization)
```

## 🌟 Features

- ✅ **User Authentication** - JWT + OTP email verification system
- ✅ **Session Management** - All runs saved with user isolation
- ✅ **Real-time benchmarking** with actual API calls to 60+ Mistral models
- ✅ **EcoLogits integration** for accurate CO₂ and energy measurements (ISO 14044)
- ✅ **Google ADK ReAct agent** for intelligent reasoning and tool use
- ✅ **Independent web search** for quality benchmarks via Google Search
- ✅ **Multi-page architecture** - Efficiency, Quality, Analytics views
- ✅ **Interactive charts** - Recharts with historical data visualization
- ✅ **Professional UI** - Modern React + TailwindCSS design
- ✅ **Production deployment** - Backend on Render, Frontend on Firebase

## 🤖 AI Agent Architecture

### **Parallel Agent Workflow:**

Benchmind uses **two independent agents running in parallel** for comprehensive AI model evaluation:

```mermaid
flowchart TD
    A[User Request] --> B[Main Consultant Agent]
    B --> C[Benchmarking Tool]
    B --> D[Search Sub-Agent]
    
    C --> E[Mistral API Calls]
    C --> F[EcoLogits Analysis]
    C --> G[Cost Calculation]
    
    D --> H[Google Search]
    D --> I[Quality Research]
    D --> J[Academic Papers]
    
    E --> K[Efficiency Results]
    F --> K
    G --> K
    
    H --> L[Quality Results]
    I --> L
    J --> L
    
    K --> M[Combined Analysis]
    L --> M
    M --> N[Final Recommendation]
```

### **Agent Roles:**

#### **1. 🧠 Main Consultant Agent (`adk_green_agent.py`)**
- **Role:** Primary ReAct agent using Google ADK
- **Responsibilities:**
  - Orchestrates the entire analysis workflow
  - Calls benchmarking tools for efficiency metrics
  - Integrates results from search sub-agent
  - Generates final recommendations with reasoning
- **Tools:** `benchmark_models_for_task`, `analyze_cost_efficiency`
- **Model:** Gemini (temperature=0.1 for consistency)

#### **2. 🔍 Search Sub-Agent (`adk_search_agent.py`)**
- **Role:** Independent quality research specialist
- **Responsibilities:**
  - Searches web for model benchmarks (MMLU, HumanEval)
  - Finds academic papers and leaderboards
  - Analyzes real-world usage reports
  - Caches results for performance
- **Tools:** `google_search` (Google ADK)
- **Model:** Gemini (dedicated instance)

#### **3. ⚡ Benchmarking Tools (`tools.py`)**
- **Role:** Direct API integration for efficiency metrics
- **Responsibilities:**
  - Makes real API calls to Mistral models
  - Measures latency, cost, token usage
  - Integrates EcoLogits for CO₂/energy data
  - Calculates efficiency scores
- **Integration:** EcoLogits (ISO 14044 standard)

#### **4. 🌐 Quality Service (`google_search_service.py`)**
- **Role:** Async quality analysis coordinator
- **Responsibilities:**
  - Manages search agent lifecycle
  - Handles caching and database storage
  - Processes search results into structured data
  - Runs in parallel with benchmarking

### **Execution Flow:**

1. **User submits task** → Main Consultant Agent receives request
2. **Parallel execution:**
   - **Thread A:** Benchmarking tools → Mistral API → EcoLogits → Efficiency data
   - **Thread B:** Search sub-agent → Google Search → Quality research
3. **Data integration:** Main agent combines both result sets
4. **Analysis:** ReAct reasoning over combined efficiency + quality data
5. **Recommendation:** Final model selection with detailed justification

## 📁 Project Structure

```
Benchmind/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── adk_green_agent.py      # 🧠 Main ReAct agent (Google ADK)
│   │   │   └── adk_search_agent.py     # 🔍 Web search sub-agent (Google Search)
│   │   ├── tools/
│   │   │   ├── tools.py                # ⚡ Benchmarking & cost analysis tools
│   │   │   └── duckduckgo_search.py    # 🌐 alternative Web search implementation
│   │   ├── routers/
│   │   │   ├── auth.py                 # 🔐 Authentication (signup/login/OTP)
│   │   │   ├── user.py                 # 👤 User profile management
│   │   │   ├── settings.py             # ⚙️ User settings (email/password change)
│   │   │   ├── consultant.py           # 🤖 AI consultant endpoint (main orchestrator)
│   │   │   ├── run.py                  # 📊 Session management & history
│   │   │   ├── models.py               # 🏷️ Model registry endpoint
│   │   │   └── test_ecologits.py       # 🧪 EcoLogits testing endpoint
│   │   ├── services/
│   │   │   ├── google_search_service.py # 🌐 Quality analysis via web search
│   │   │   └── model_registry.py       # 📋 Available models database
│   │   ├── schemas/
│   │   │   ├── auth.py                 # 🔐 Authentication schemas
│   │   │   ├── requests.py             # 📥 Pydantic request models
│   │   │   └── responses.py            # 📤 Pydantic response models
│   │   ├── db/
│   │   │   ├── database.py             # 🗄️ PostgreSQL connection
│   │   │   └── models.py               # 📊 SQLAlchemy models
│   │   ├── core/
│   │   │   ├── config.py               # ⚙️ Settings & environment vars
│   │   │   ├── logging.py              # 📝 Logging configuration
│   │   │   ├── exceptions.py           # ❌ Custom exceptions
│   │   │   └── job_store.py            # 💼 Background job management
│   │   ├── utils/
│   │   │   ├── utils.py                # 🧮 EcoLogits & cost calculations
│   │   │   └── auth_utils.py           # 🔑 JWT & OTP utilities
│   │   └── main.py                     # 🚀 FastAPI app entry point
│   ├── alembic/                        # 🗄️ Database migrations (gitignored)
│   ├── requirements.txt                # 📦 Python dependencies
│   ├── init_db.py                      # 🗄️ Database initialization
│   └── .env.example                    # 🔧 Environment template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BenchmarkCharts.tsx     # 📊 Interactive charts (Recharts)
│   │   │   ├── BenchmindLanding.tsx    # 🏠 Home page with model selection
│   │   │   ├── LandingPage.tsx         # 🔐 Login/signup page
│   │   │   ├── ProfessionalLayout.tsx  # 🎨 App layout & navigation
│   │   │   ├── Profile.tsx             # 👤 User profile management
│   │   │   ├── Settings.tsx            # ⚙️ User settings page
│   │   │   ├── ProgressOverlay.tsx     # ⏳ Benchmarking progress
│   │   │   ├── ResultCards.tsx         # 🎯 Results navigation cards
│   │   │   └── MarkdownRenderer.tsx    # 📝 Quality analysis renderer
│   │   ├── pages/
│   │   │   ├── EfficiencyPage.tsx      # 🌱 Environmental recommendations
│   │   │   ├── QualityPage.tsx         # 🔍 Web-sourced quality analysis
│   │   │   └── AnalyticsPage.tsx       # 📈 Historical data & charts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx         # 🔐 Authentication state management
│   │   ├── api/
│   │   │   └── benchmind.ts            # 🌐 API client (Axios)
│   │   ├── config/
│   │   │   └── api.ts                  # 🔧 API configuration
│   │   ├── styles/
│   │   │   └── modern.css              # 🎨 Custom styles
│   │   ├── App.tsx                     # 🚀 Root component with routing
│   │   └── main.tsx                    # ⚛️ React entry point
│   ├── package.json                    # 📦 Node.js dependencies
│   ├── vite.config.ts                  # ⚡ Vite configuration
│   ├── tailwind.config.js              # 🎨 TailwindCSS configuration
│   └── firebase.json                   # 🔥 Firebase hosting config
└── README.md                           # 📖 This file
```

## 🚀 Live Deployment

### **Production URLs:**
- **live:** https://benchmind-app.web.app/ (Firebase Hosting)


### **Architecture:**
- **Frontend:** React app deployed on Firebase with automatic CI/CD
- **Backend:** FastAPI server deployed on Render with PostgreSQL database
- **Database:** Managed PostgreSQL on Render with automatic migrations
- **Authentication:** JWT tokens with OTP email verification
- **Session Management:** User-isolated data with full CRUD operations

### **CI/CD Pipeline:**
- **GitHub Actions** for automated testing and deployment
- **Path-based triggers** - only deploys changed components (frontend/backend)
- **Automatic migrations** on backend deployment
- **Environment-specific configurations**
