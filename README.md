# Benchmind

**AI Model Evaluation Platform with Green AI Observability**

Transform your AI model selection process with intelligent, data-driven recommendations that consider quality, performance, cost, and environmental impact.

## 🎯 Overview

Benchmind is a comprehensive AI model evaluation platform that helps developers, data scientists, and engineering teams make informed decisions about which AI models to use for their specific applications. Our intelligent consultant analyzes your requirements and provides strategic recommendations based on real benchmarking data.

### Core Value Proposition

Evaluate and select AI models across **4 key dimensions**:

1. **🎯 Quality/Accuracy** - Performance on your specific tasks
2. **⚡ Latency/Speed** - Response time and real-time performance  
3. **💰 Cost Efficiency** - Token pricing and operational expenses
4. **🌱 Environmental Impact** - Energy consumption and carbon footprint

## ✨ Key Features

- **🤖 AI Consultant** - Intelligent ReAct agent that understands your use case and creates custom benchmarks
- **📊 Real-time Benchmarking** - Live performance testing with actual API calls to AI models
- **🌍 Green AI Dashboard** - Visualize performance vs energy vs CO₂ trade-offs
- **📈 Interactive Charts** - Multi-dimensional analysis with beautiful data visualizations
- **💡 Strategic Recommendations** - Data-driven insights with detailed reasoning
- **🏢 Enterprise Ready** - Production-grade architecture with proper logging and error handling

## 🏗️ Architecture

### Modern FastAPI Backend
```
backend/
├── app/                          # Main application package
│   ├── main.py                  # App factory with lifespan management
│   ├── core/                    # Core system configuration
│   │   ├── config.py           # Pydantic settings with environment variables
│   │   ├── logging.py          # Structured logging setup
│   │   └── exceptions.py       # Custom exceptions & error handlers
│   ├── routers/                 # API endpoints (thin layer)
│   │   ├── models.py           # /models - Model registry endpoints
│   │   └── consultant.py       # /ai-consultant - Intelligent recommendations
│   ├── schemas/                 # Pydantic request/response models
│   │   ├── requests.py         # Input validation schemas
│   │   └── responses.py        # Output response schemas
│   ├── services/                # Business logic (clean separation)
│   │   ├── model_registry.py   # Model management & metadata
│   │   ├── consultant_agent.py # ReAct agent service
│   │   └── simulator.py        # Task simulation logic
│   ├── agents/                  # AI agents & tools
│   │   ├── agent.py            # LangChain ReAct agent creation
│   │   └── tools.py            # LangChain tools for benchmarking
│   └── utils/                   # Utility functions
│       └── utils.py            # Cost calculation, environmental impact
├── .env.example                 # Environment variables template
└── requirements.txt             # Python dependencies
```

### React Frontend
```
frontend/
├── src/
│   ├── components/             # React components
│   │   ├── AIConsultant.tsx   # Main consultant interface
│   │   └── BenchmarkCharts.tsx # Data visualization
│   ├── api/                   # API client
│   └── pages/                 # Next.js pages
├── package.json               # Node.js dependencies
└── next.config.js            # Next.js configuration
```

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

# Start the server
python -m app.main
```

Backend available at: `http://localhost:8000`

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

## 🎮 How to Use

1. **📝 Describe Your Task**
   - "I want to build a recommendation system for my e-commerce platform"
   - "I need a content generation system for marketing copy"
   - "I'm creating a customer support chatbot"

2. **🎯 Select Models to Compare**
   - Choose from 60+ available AI models
   - Mix different model sizes and capabilities

3. **🤖 Get AI Recommendations**
   - Our ReAct agent analyzes your requirements
   - Creates custom test prompts for your use case
   - Benchmarks models with real API calls

4. **📊 Review Results**
   - Interactive charts showing performance trade-offs
   - Detailed cost and environmental impact analysis
   - Strategic recommendations with reasoning

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - API information and health
- `GET /models` - Available AI models registry
- `POST /ai-consultant` - Intelligent model recommendations
- `GET /health` - System health check

### Example Request
```json
{
  "task_description": "I want to build a recommendation system for my e-commerce platform",
  "user_context": "Budget constraints, need fast response times",
  "selected_models": ["mistral-large-latest", "mistral-small", "mistral-tiny"]
}
```

## 🧠 AI Consultant Intelligence

Our ReAct agent powered by Google Gemini:

1. **🔍 Analyzes** your task description and requirements
2. **💭 Reasons** about the best approach for testing
3. **🛠️ Creates** custom test prompts that simulate real usage
4. **⚡ Executes** benchmarks with actual API calls
5. **📈 Measures** quality, latency, cost, and environmental impact
6. **🎯 Recommends** optimal models with detailed explanations

## 🌱 Green AI Focus

Benchmind emphasizes environmental responsibility:

- **📊 CO₂ Emissions** - Calculate carbon footprint per model
- **⚡ Energy Consumption** - Track power usage in Wh
- **🌍 Environmental Impact** - Compare green alternatives
- **📈 Sustainability Metrics** - Make eco-conscious decisions

## 🏢 Production Ready

- **⚙️ Structured Configuration** - Pydantic settings with environment variables
- **📝 Comprehensive Logging** - Structured logging for observability
- **🛡️ Error Handling** - Custom exceptions with proper HTTP responses
- **🔒 Security** - API key management and validation
- **📦 Dependency Injection** - Clean FastAPI patterns
- **🧪 Testable Architecture** - Separated business logic

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework
- **LangChain** - AI agent framework
- **Pydantic** - Data validation and settings
- **Google Gemini** - Reasoning brain for AI consultant
- **Mistral AI** - Model provider for benchmarking

### Frontend  
- **Next.js** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization library

## 📈 Development Roadmap

- [x] **Core Platform** - AI consultant with real benchmarking
- [x] **Green AI Metrics** - Environmental impact calculation
- [x] **Production Architecture** - Professional FastAPI structure
- [ ] **Database Integration** - Persistent storage for results
- [ ] **Advanced Visualizations** - Pareto frontier analysis
- [ ] **Multi-provider Support** - OpenAI, Anthropic integration
- [ ] **Team Features** - Collaboration and sharing
- [ ] **API Rate Limiting** - Production-grade controls

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

MIT License - See LICENSE file for details


