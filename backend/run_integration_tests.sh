#!/bin/bash

echo "🧪 Running Benchmind Agent Integration Tests..."
echo "================================================"

# Activate virtual environment if it exists
if [ -d "../EnvBenchmind" ]; then
    echo "📦 Activating virtual environment..."
    source ../EnvBenchmind/bin/activate
fi

# Run the integration tests
echo "🚀 Starting integration tests..."
python test_agent_integration.py

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed! You can now run the server safely."
    echo "📋 Check test_report.txt and test_agent_integration.log for details."
else
    echo ""
    echo "❌ Tests failed! Please fix the issues before running the server."
    echo "📋 Check test_report.txt and test_agent_integration.log for details."
fi
