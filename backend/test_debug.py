import pytest
import asyncio
from tests.conftest import test_client, test_db

@pytest.mark.asyncio
async def test_debug_fixture_type(test_client):
    print(f"test_client type: {type(test_client)}")
    print(f"test_client: {test_client}")
    if hasattr(test_client, '__anext__'):
        actual_client = await test_client.__anext__()
        print(f"actual_client type: {type(actual_client)}")
        response = await actual_client.get("/health")
        print(f"Response: {response.status_code}")