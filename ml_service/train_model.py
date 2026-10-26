import os
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

def train_and_save():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "synthetic_training_data.csv")
    model_path = os.path.join(script_dir, "difficulty_model.joblib")
    
    print(f"Loading synthetic training data from: {csv_path}")
    df = pd.read_csv(csv_path)
    
    feature_cols = ["accuracy", "avg_response_time_sec", "previous_attempts", "topic"]
    X = df[feature_cols]
    y = df["recommended_difficulty"]
    
    # Preprocessor: OneHotEncoder on 'topic' with handle_unknown='ignore'
    # Numeric features passed through
    preprocessor = ColumnTransformer(
        transformers=[
            ("topic_encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["topic"])
        ],
        remainder="passthrough"
    )
    
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(random_state=42, n_estimators=100))
    ])
    
    print("Fitting Pipeline (OneHotEncoder + RandomForestClassifier)...")
    pipeline.fit(X, y)
    
    print(f"Classes: {pipeline.classes_}")
    print(f"Saving model to: {model_path}")
    joblib.dump(pipeline, model_path)
    print("Model successfully trained and saved!")

if __name__ == "__main__":
    train_and_save()
