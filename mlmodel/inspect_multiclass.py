import joblib
import os
import pandas as pd

model_dir = "c:/Vivo Y50/Major Project/ids-new-latest/IDS-IPS/mlmodel"
multiclass_path = os.path.join(model_dir, "96percent.pkl")

try:
    model = joblib.load(multiclass_path)
    print(f"Model type: {type(model)}")
    for attr in dir(model):
        if not attr.startswith('_') and not callable(getattr(model, attr)):
            if attr in ['n_features_in_', 'feature_names_in_', 'n_outputs_', 'classes_']:
                print(f"{attr}: {getattr(model, attr)}")
except Exception as e:
    print(f"Error: {e}")
