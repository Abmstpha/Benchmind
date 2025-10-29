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
- 📊 **Visualizing trade-offs** between speed, cost, and environmental impact
- 💡 **Recommending** the best model with detailed reasoning

**Key Innovation:** Combines efficiency metrics (measured) with quality data (web-sourced) for complete model evaluation.

## 🏗️ Tech Stack

**Backend:** FastAPI + Google ADK (Agent Development Kit) + EcoLogits (ISO 14044)  
**Frontend:** React + TypeScript + Recharts  
**AI:** Google Gemini (reasoning) + DuckDuckGo (web search) + Mistral API (benchmarking)

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **API Keys**: Mistral AI, Google Gemini

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
# Edit .env with your API keys:
# MISTRAL_API_KEY=your_mistral_key
# GEMINI_API_KEY=your_gemini_key

# Get your API keys from:
# Mistral API: https://console.mistral.ai/
# Google Gemini API: https://aistudio.google.com/app/apikey

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

Frontend available at: `http://localhost:3000`

## 🎮 Usage

1. Describe your task: *"I need an AI-powered Q&A system for my knowledge base"*
2. Select models to compare (or let the agent choose)
3. Get intelligent recommendations with:
   - **Efficiency metrics**: Latency, cost, CO₂ (measured via real API calls)
   - **Quality insights**: MMLU/HumanEval scores (sourced from web search)
   - **Trade-off analysis**: Speed vs cost vs environmental impact
   - **Visual charts**: Radar plots, bar charts, comparison tables

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

## 🤝 Contributing

Contributions welcome! Open an issue or PR.
