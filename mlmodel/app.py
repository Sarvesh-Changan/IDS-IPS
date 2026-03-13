import os
import logging
from typing import List, Union, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from classifier import pipeline, PipelineError

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Hybrid Attack Classification API")

# Pydantic model for input features
class TrafficFeatures(BaseModel):
    model_config = ConfigDict(extra='allow')
    
    dstPort: int
    flowDuration: float
    totFwdPkts: int
    totBwdPkts: int
    totLenFwdPkts: float
    totLenBwdPkts: float
    fwdPktLenMax: float
    fwdPktLenMean: float
    bwdPktLenMean: float
    bwdPktLenStd: float
    flowBytsPerSec: float
    flowPktsPerSec: float
    flowIATMean: float
    flowIATStd: float
    flowIATMax: float
    fwdIATMean: float
    bwdIATStd: float
    finFlagCnt: int
    synFlagCnt: int
    rstFlagCnt: int
    ackFlagCnt: int
    fwdSegSizeAvg: float
    initFwdWinByts: int
    initBwdWinByts: int
    protocol: int

@app.on_event("startup")
async def startup_event():
    """Load models and configuration on startup."""
    # Determine base directory (parent of the script's directory)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # Environment variables or robust defaults
    models_dir = os.getenv("mlmodel", script_dir) # Use script dir as default for models
    samples_path = os.getenv("SAMPLES_PATH", os.path.join(project_root, "config", "extraSamples.json"))
    
    logger.info(f"Using models directory: {models_dir}")
    logger.info(f"Using samples path: {samples_path}")
    
    pipeline.model_dir = models_dir
    pipeline.samples_path = samples_path
    
    try:
        pipeline.startup()
        logger.info("Pipeline startup complete.")
    except Exception as e:
        logger.error(f"Critical failure during pipeline startup: {e}")
        # In production, we might want to exit(1) if models fail to load
        # For now, we'll let the app run but endpoints might fail

@app.get("/health")
def health():
    return {"status": "healthy" if pipeline.initialized else "initializing"}

@app.post("/test")
async def test_classify(data: Union[TrafficFeatures, List[TrafficFeatures]]):
    """
    Expose a POST /test endpoint that:
    a. Accepts either a single features object or an array;
    b. Runs classifyTraffic on each item;
    c. Returns JSON {results: [{class, attackType}, …]}.
    """
    if not pipeline.initialized:
        raise HTTPException(status_code=503, detail="ML Models not initialized yet")

    # Normalize to list
    items = data if isinstance(data, list) else [data]
    
    results = []
    for item in items:
        try:
            # Convert pydantic model to dict
            features_dict = item.model_dump()
            # Perform classification
            result = pipeline.classifyTraffic(features_dict)
            results.append(result)
        except Exception as e:
            logger.error(f"Error classifying item: {e}")
            results.append({"class": "Error", "attackType": str(e)})

    return {"results": results}
