import joblib
import os

model_dir = "c:/Vivo Y50/Major Project/ids-new-latest/IDS-IPS/mlmodel"
binary_path = os.path.join(model_dir, "binaryClassifier.pkl")
multiclass_path = os.path.join(model_dir, "96percent.pkl")

def inspect_model(name, path):
    if not os.path.exists(path):
        print(f"{name} not found at {path}")
        return
    try:
        model = joblib.load(path)
        print(f"Model: {name}")
        if hasattr(model, 'n_features_in_'):
            print(f"  n_features_in_: {model.n_features_in_}")
        if hasattr(model, 'feature_names_in_'):
            print(f"  feature_names_in_: {model.feature_names_in_}")
        else:
            print("  feature_names_in_: Not available")
    except Exception as e:
        print(f"Error loading {name}: {e}")

inspect_model("Binary", binary_path)
inspect_model("Multiclass", multiclass_path)
