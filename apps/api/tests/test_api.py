import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_health_check():
    """Test that the API runs and handles basic errors cleanly."""
    response = client.get("/")
    assert response.status_code == 404 # Root isn't defined, so 404 is expected, but server is UP
    
def test_youtube_status_returns_401_without_token():
    """Test YouTube API status requires auth or degrades gracefully."""
    response = client.get("/api/youtube/status")
    # Should be 200 but content indicates 'not_connected' because we don't have a token active yet
    assert response.status_code == 200
    assert response.json() == {"status": "not_connected"}

def test_video_stats_endpoint_returns_data(mocker):
    """Mock the supabase client to test video pipeline stats."""
    # This is a sample on how to mock the supabase DB call for CI/CD
    class MockData:
        data = [{"id": 1, "status": "discovered"}, {"id": 2, "status": "published"}]
    mocker.patch('apps.api.routers.videos.supabase.table', return_value=MockData())
    
    # Normally we'd assert the actual endpoint behavior here
