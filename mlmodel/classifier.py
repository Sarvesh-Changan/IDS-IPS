import os
import json
import logging
import joblib
import pandas as pd
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
LABEL_NAMES = {
    1: 'Benign',
    2: 'Brute Force Web',
    3: 'FTP Brute Force',
    4: 'DDoS',
    5: 'BAT',
    6: 'SSN brute force',
    7: 'GoldenEye',
    8: 'GoldenEye',
    9: 'Slowloris',
    10: 'Brute Force XSS',
    11: 'SQL Injection'
}

# Mapping from user's sample fields to model's expected fields
# Based on inspection of binaryClassifier.pkl
FEATURE_MAPPING = {
    "dstPort": "Dst Port",
    "flowDuration": "Flow Duration",
    "totFwdPkts": "Tot Fwd Pkts",
    "totBwdPkts": "Tot Bwd Pkts",
    "totLenFwdPkts": "TotLen Fwd Pkts",
    "totLenBwdPkts": "TotLen Bwd Pkts",
    "flowPktsPerSec": "Flow Pkts/s",
    "fwdPktLenMean": "Fwd Pkt Len Mean",
    "bwdPktLenMean": "Bwd Pkt Len Mean",
    "bwdPktLenStd": "Pkt Len Std", # Best-effort mapping
    "flowIATMean": "Flow IAT Mean",
    "flowIATStd": "Flow IAT Std",
    "synFlagCnt": "SYN Flag Cnt",
    "ackFlagCnt": "ACK Flag Cnt",
    "finFlagCnt": "FIN Flag Cnt",
    "rstFlagCnt": "RST Flag Cnt",
    "fwdSegSizeAvg": "Fwd Seg Size Avg"
}

# The specific 17 features the binary model expects
REQUIRED_ORDER = [
    "Flow Duration", "Tot Fwd Pkts", "Tot Bwd Pkts", "TotLen Fwd Pkts", 
    "TotLen Bwd Pkts", "Flow Pkts/s", "Fwd Pkt Len Mean", "Bwd Pkt Len Mean", 
    "Pkt Len Std", "Flow IAT Mean", "Flow IAT Std", "SYN Flag Cnt", 
    "ACK Flag Cnt", "FIN Flag Cnt", "RST Flag Cnt", "Fwd Seg Size Avg", "Dst Port"
]

# The 24 features for the multiclass model (guessed from app.py TrafficFeatures)
MULTICLASS_ORDER = [
    "dstPort", "flowDuration", "totFwdPkts", "totBwdPkts", "totLenFwdPkts",
    "totLenBwdPkts", "fwdPktLenMax", "fwdPktLenMean", "bwdPktLenMean",
    "bwdPktLenStd", "flowBytsPerSec", "flowPktsPerSec", "flowIATMean",
    "flowIATStd", "flowIATMax", "fwdIATMean", "bwdIATStd", "finFlagCnt",
    "synFlagCnt", "rstFlagCnt", "ackFlagCnt", "fwdSegSizeAvg",
    "initFwdWinByts", "initBwdWinByts"
]

class PipelineError(Exception):
    pass

class MLPipeline:
    def __init__(self, model_dir: str = "./mlmodel", samples_path: str = "./config/extraSamples.json"):
        self.model_dir = model_dir
        self.samples_path = samples_path
        self.binary_model = None
        self.multiclass_model = None
        self.extra_samples = []
        self.initialized = False

    def load_models(self):
        """Load the ML models once at startup."""
        try:
            binary_path = os.path.join(self.model_dir, "binaryClassifier.pkl")
            multiclass_path = os.path.join(self.model_dir, "96percent.pkl")

            logger.info(f"Loading binary model from {binary_path}...")
            self.binary_model = joblib.load(binary_path)

            logger.info(f"Loading multiclass model from {multiclass_path}...")
            self.multiclass_model = joblib.load(multiclass_path)
            
            logger.info("Models loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            raise PipelineError(f"Model loading failed: {e}")

    def load_samples(self):
        """Load and validate extraSamples.json."""
        resolved_path = os.path.abspath(self.samples_path)
        if not os.path.exists(resolved_path):
            logger.warning(f"Samples file not found at {resolved_path}, skipping.")
            return

        try:
            with open(resolved_path, "r") as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                logger.error("extraSamples.json should be a JSON array.")
                return

            validated_samples = []
            for entry in data:
                if self._validate_features(entry):
                    validated_samples.append(entry)
                else:
                    logger.warning(f"Skipping malformed entry: {entry}")
            
            self.extra_samples = validated_samples
            logger.info(f"Loaded {len(self.extra_samples)} valid samples.")
        except Exception as e:
            logger.error(f"Failed to load extra samples: {e}")

    def _validate_features(self, features: Dict[str, Any]) -> bool:
        """Simple schema validation for features."""
        # Check for presence of mapped keys
        for key in FEATURE_MAPPING.keys():
            if key not in features:
                return False
        return True

    def startup(self):
        """Initialize the pipeline."""
        self.load_models()
        self.load_samples()
        self.initialized = True

    def _prepare_binary_df(self, features_dict: Dict[str, Any]) -> pd.DataFrame:
        """Prepare 17-feature DF for binary model."""
        mapped_data = {FEATURE_MAPPING[k]: [features_dict.get(k, 0)] for k in FEATURE_MAPPING}
        df = pd.DataFrame(mapped_data)
        # Ensure correct order and presence
        for col in REQUIRED_ORDER:
            if col not in df.columns:
                df[col] = 0
        return df[REQUIRED_ORDER]

    def _prepare_multiclass_df(self, features_dict: Dict[str, Any]) -> pd.DataFrame:
        """Prepare 24-feature DF for multiclass model."""
        # Use simple values without names as the model was fitted without them
        data = [[features_dict.get(k, 0) for k in MULTICLASS_ORDER]]
        return pd.DataFrame(data)

    def _prepare_dataframe(self, features_dict: Dict[str, Any]) -> pd.DataFrame:
        """Deprecated: Use model-specific preparation methods."""
        return self._prepare_binary_df(features_dict)

    def predictBinary(self, features_df: pd.DataFrame) -> int:
        if self.binary_model is None:
            raise PipelineError("Binary model not loaded")
        return int(self.binary_model.predict(features_df)[0])

    def predictMulticlass(self, features_df: pd.DataFrame) -> int:
        if self.multiclass_model is None:
            raise PipelineError("Multiclass model not loaded")
        return int(self.multiclass_model.predict(features_df)[0])

    def classifyTraffic(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Hybrid classification pipeline logic."""
        # Step 1: Binary Classification (17 features)
        df_binary = self._prepare_binary_df(features_dict)
        is_attack = self.predictBinary(df_binary)
        
        logger.info(f"Binary prediction: {'Attack' if is_attack == 1 else 'Benign'}")
        
        if is_attack == 0:
            return {"class": "Benign", "attackType": None}
        
        # Step 2: Multiclass Classification (24 features)
        df_multi = self._prepare_multiclass_df(features_dict)
        predicted_int = self.predictMulticlass(df_multi)
        attack_type = LABEL_NAMES.get(predicted_int, "Unknown")
        
        logger.info(f"Multiclass prediction: Label {predicted_int} ({attack_type})")
        
        return {"class": "Attack", "attackType": attack_type}

pipeline = MLPipeline()
