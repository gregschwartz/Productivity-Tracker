#!/bin/bash

echo "Running tests..."
echo "Note: weave and pytest_asyncio cause deprecation warnings that are not relevant to the tests."

# Set environment variables to suppress weave-related deprecation warnings
export PYTHONWARNINGS="ignore:.*sentry_sdk.Hub.*:DeprecationWarning,ignore:.*warn.*method.*deprecated.*:DeprecationWarning,ignore:.*The configuration option.*asyncio_default_fixture_loop_scope.*is unset.*"

echo "Just skip down to === test session starts === to see the actual test results."

# Run pytest with the provided arguments, or default to all tests
if [ $# -eq 0 ]; then
    python -m pytest tests/ -v
else
    python -m pytest "$@" -v
fi