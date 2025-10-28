# Benchmind

**AI Model Evaluation Platform with Intelligent Consultant**

Benchmind is an AI consultant that helps you choose the best AI model for your specific tasks. Instead of just comparing models, it uses a ReAct agent to understand your needs, run realistic simulations, and provide intelligent recommendations based on quality, latency, cost, and environmental impact.

## 🧠 How It Works

1. **Describe your task**: "I need a recommendation system for movies"
2. **AI agent analyzes**: Uses Gemini to understand your requirements  
3. **Runs real simulations**: Tests models on tasks similar to yours
4. **Provides recommendations**: With detailed reasoning and trade-off analysis

## ✨ Features

- 🤖 **AI Consultant**: LangGraph ReAct agent with Gemini reasoning
- 🎯 **Task Simulation**: Tests models on realistic scenarios
- 🌱 **Green AI Focus**: Environmental impact measurement
- ⚡ **Real Benchmarks**: Actual API calls with latency/cost tracking
- 📊 **Professional UI**: Clean, enterprise-grade interface
- 🔬 **Scientific Foundation**: Based on peer-reviewed research

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- API Keys: Mistral AI, Google Gemini

### Setup

1. **Clone and setup environment**:
```bash
git clone git@github.com:Abmstpha/Benchmind.git
cd Benchmind
python -m venv benchenv
source benchenv/bin/activate  # On Windows: benchenv\Scripts\activate
```

2. **Install dependencies**:
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

3. **Configure API keys** in `backend/.env`:
```bash
MISTRAL_API_KEY=your_mistral_key_here
GEMINI_API_KEY=your_gemini_key_here
```

4. **Start the services**:
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

5. **Open**: http://localhost:3000

## 🎯 Example Usage

**User**: "I need a recommendation system for movies"

**AI Consultant**:
1. Analyzes your task using Gemini
2. Runs recommendation simulations on Mistral models
3. Tests with realistic movie recommendation prompts
4. Measures quality, latency, cost, and CO₂ emissions
5. Provides detailed recommendation with reasoning

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │    │   FastAPI        │    │   AI Models     │
│   (Port 3000)   │◄──►│   (Port 8000)    │◄──►│   (Mistral API) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   LangGraph      │
                       │   ReAct Agent    │
                       │   (Gemini Brain) │
                       └──────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: FastAPI, LangGraph, LangChain
- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: Gemini (reasoning), Mistral (testing)
- **Agent**: LangGraph ReAct pattern

## 📊 What Makes It Different

Unlike simple model comparison tools, Benchmind:

- **Understands context**: AI agent analyzes your specific needs
- **Runs real tests**: Simulates your actual use case
- **Provides reasoning**: Explains why one model is better
- **Considers environment**: Green AI is a first-class metric
- **Enterprise ready**: Professional, clean interface

## 🌱 Environmental Impact

Based on peer-reviewed research:
- Strubell et al. (2019) - Energy methodology
- Schwartz et al. (2020) - "Green AI"
- Henderson et al. (2020) - Energy policy
- Lacoste et al. (2021) - CodeCarbon

## 📝 License

MIT License - See LICENSE file for details


