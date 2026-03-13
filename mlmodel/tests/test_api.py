import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from mlmodel.app import app
from .test_pipeline import SAMPLE_FEATURES

client = TestClient(app)

@pytest.fixture
def mock_pipeline_initialized():
    with patch("mlmodel.app.pipeline") as mock_pipe:
        mock_pipe.initialized = True
        yield mock_pipe

def test_health_check(mock_pipeline_initialized):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_api_single_item(mock_pipeline_initialized):
    mock_pipeline_initialized.classifyTraffic.return_value = {"class": "Benign", "attackType": None}
    
    response = client.post("/test", json=SAMPLE_FEATURES)
    assert response.status_code == 200
    assert "results" in response.json()
    assert response.json()["results"][0]["class"] == "Benign"

def test_api_batch_items(mock_pipeline_initialized):
    mock_pipeline_initialized.classifyTraffic.side_effect = [
        {"class": "Benign", "attackType": None},
        {"class": "Attack", "attackType": "DDoS"}
    ]
    
    response = client.post("/test", json=[SAMPLE_FEATURES, SAMPLE_FEATURES])
    assert response.status_code == 200
    assert len(response.json()["results"]) == 2
    assert response.json()["results"][1]["class"] == "Attack"

def test_api_not_initialized():
    with patch("mlmodel.app.pipeline") as mock_pipe:
        mock_pipe.initialized = False
        response = client.post("/test", json=SAMPLE_FEATURES)
        assert response.status_code == 503

def test_api_invalid_data(mock_pipeline_initialized):
    # Missing required field 'dstPort'
    response = client.post("/test", json={"flowDuration": 123})
    assert response.status_code == 422 # Unprocessable Entity (Pydantic validation)
