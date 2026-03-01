import os
import json
import pytest
import pandas as pd
from unittest.mock import MagicMock, patch
from mlmodel.classifier import MLPipeline, PipelineError, LABEL_NAMES

# Sample features from mlMock.js
SAMPLE_FEATURES = {
    "dstPort": 3389, "flowDuration": 5206015, "totFwdPkts": 9, "totBwdPkts": 11,
    "totLenFwdPkts": 1213, "totLenBwdPkts": 1948, "fwdPktLenMax": 661,
    "fwdPktLenMean": 134.7777778, "bwdPktLenMean": 177.0909091, "bwdPktLenStd": 347.9371939,
    "flowBytsPerSec": 607.182269, "flowPktsPerSec": 3.841710022, "flowIATMean": 274000.7895,
    "flowIATStd": 487382.2997, "flowIATMax": 1906221, "fwdIATMean": 650751.9,
    "bwdIATStd": 591640.0074, "finFlagCnt": 0, "synFlagCnt": 0, "rstFlagCnt": 1,
    "ackFlagCnt": 0, "fwdSegSizeAvg": 134.77777, "initFwdWinByts": 8192, "initBwdWinByts": 62872,
    "protocol": 6
}

@pytest.fixture
def mock_pipeline():
    p = MLPipeline(model_dir="./models", samples_path="./config/extraSamples.json")
    # Mock models
    p.binary_model = MagicMock()
    p.multiclass_model = MagicMock()
    p.initialized = True
    return p

def test_load_models_success(tmp_path):
    # Setup dummy model files
    m_dir = tmp_path / "models"
    m_dir.mkdir()
    (m_dir / "binaryClassifier.pkl").touch()
    (m_dir / "96percent.pkl").touch()
    
    pipeline = MLPipeline(model_dir=str(m_dir))
    
    with patch("joblib.load") as mock_load:
        pipeline.load_models()
        assert mock_load.call_count == 2
        assert pipeline.binary_model is not None
        assert pipeline.multiclass_model is not None

def test_load_models_failure(tmp_path):
    pipeline = MLPipeline(model_dir="./nonexistent")
    with pytest.raises(PipelineError):
        pipeline.load_models()

def test_load_samples_success(tmp_path):
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    samples_file = config_dir / "extraSamples.json"
    
    sample_data = [SAMPLE_FEATURES]
    with open(samples_file, "w") as f:
        json.dump(sample_data, f)
    
    pipeline = MLPipeline(samples_path=str(samples_file))
    pipeline.load_samples()
    assert len(pipeline.extra_samples) == 1

def test_load_samples_malformed(tmp_path):
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    samples_file = config_dir / "extraSamples.json"
    
    # Not an array
    with open(samples_file, "w") as f:
        json.dump({"not": "an_array"}, f)
    
    pipeline = MLPipeline(samples_path=str(samples_file))
    pipeline.load_samples()
    assert len(pipeline.extra_samples) == 0

def test_load_samples_invalid_entry(tmp_path):
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    samples_file = config_dir / "extraSamples.json"
    
    # Missing required fields
    sample_data = [{"dstPort": 80}]
    with open(samples_file, "w") as f:
        json.dump(sample_data, f)
    
    pipeline = MLPipeline(samples_path=str(samples_file))
    pipeline.load_samples()
    assert len(pipeline.extra_samples) == 0

def test_load_samples_not_found():
    pipeline = MLPipeline(samples_path="./invalid/path.json")
    pipeline.load_samples()
    assert len(pipeline.extra_samples) == 0

def test_classify_traffic_benign(mock_pipeline):
    mock_pipeline.binary_model.predict.return_value = [0] # Benign
    
    result = mock_pipeline.classifyTraffic(SAMPLE_FEATURES)
    assert result["class"] == "Benign"
    assert result["attackType"] is None

def test_classify_traffic_attack(mock_pipeline):
    mock_pipeline.binary_model.predict.return_value = [1] # Attack
    mock_pipeline.multiclass_model.predict.return_value = [4] # DDoS
    
    result = mock_pipeline.classifyTraffic(SAMPLE_FEATURES)
    assert result["class"] == "Attack"
    assert result["attackType"] == LABEL_NAMES[4]

def test_prediction_without_loading():
    pipeline = MLPipeline()
    df = pd.DataFrame([SAMPLE_FEATURES])
    with pytest.raises(PipelineError):
        pipeline.predictBinary(df)
    with pytest.raises(PipelineError):
        pipeline.predictMulticlass(df)

def test_validate_features_logic():
    pipeline = MLPipeline()
    assert pipeline._validate_features(SAMPLE_FEATURES) is True
    assert pipeline._validate_features({"foo": "bar"}) is False
