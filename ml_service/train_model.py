import os
import json
import joblib
import pandas as pd
import sklearn

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

def train_and_save():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    csv_path = os.path.join(
        script_dir, "synthetic_quiz_dataset.csv"
    )
    model_path = os.path.join(
        script_dir, "difficulty_model.joblib"
    )
    metadata_path = os.path.join(
        script_dir, "model_metadata.json"
    )

    print(f"Loading dataset: {csv_path}")

    if not os.path.exists(csv_path):
        # Fallback to synthetic_training_data.csv if available
        fallback_path = os.path.join(script_dir, "synthetic_training_data.csv")
        if os.path.exists(fallback_path):
            csv_path = fallback_path
        else:
            raise FileNotFoundError(
                f"Dataset not found: {csv_path}"
            )

    df = pd.read_csv(csv_path)

    feature_cols = [
        "accuracy",
        "avg_response_time_sec",
        "previous_attempts",
        "topic"
    ]

    target_col = "recommended_difficulty"
    required_cols = feature_cols + [target_col]

    missing_cols = [
        col for col in required_cols
        if col not in df.columns
    ]

    if missing_cols:
        raise ValueError(
            f"Missing required columns: {missing_cols}"
        )

    df = df[required_cols].copy()

    if df.empty:
        raise ValueError("Dataset is empty.")

    if df.isnull().any().any():
        raise ValueError(
            "Dataset contains missing values."
        )

    if not df["accuracy"].between(0, 1).all():
        raise ValueError(
            "Accuracy must be between 0 and 1."
        )

    if (df["avg_response_time_sec"] <= 0).any():
        raise ValueError(
            "Response time must be greater than 0."
        )

    if (df["previous_attempts"] < 0).any():
        raise ValueError(
            "Previous attempts cannot be negative."
        )

    if not df["topic"].map(
        lambda value: isinstance(value, str)
        and bool(value.strip())
    ).all():
        raise ValueError(
            "Topic values must be non-empty strings."
        )

    df["topic"] = df["topic"].str.strip()

    if not df[target_col].map(
        lambda value: isinstance(value, str)
        and bool(value.strip())
    ).all():
        raise ValueError(
            "Difficulty labels must be non-empty strings."
        )

    df[target_col] = df[target_col].str.strip()

    if df[target_col].nunique() < 2:
        raise ValueError(
            "At least two difficulty classes are required."
        )

    class_counts = df[target_col].value_counts()

    if class_counts.min() < 2:
        raise ValueError(
            "Each class needs at least two rows "
            "for a stratified train-test split."
        )

    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "topic_encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False
                ),
                ["topic"]
            )
        ],
        remainder="passthrough"
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=100,
                random_state=42
            )
        )
    ])

    print(f"Training rows: {len(X_train)}")
    print(f"Testing rows: {len(X_test)}")
    print("Training Random Forest pipeline...")

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    labels = pipeline.classes_.tolist()

    report = classification_report(
        y_test,
        predictions,
        labels=labels,
        output_dict=True,
        zero_division=0
    )

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=labels
    )

    print(f"\nTest accuracy: {accuracy:.4f}")
    print("\nClassification report:")
    print(
        classification_report(
            y_test,
            predictions,
            labels=labels,
            zero_division=0
        )
    )

    print("Confusion matrix:")
    print(matrix)

    metadata = {
        "note": (
            "Trained on SYNTHETIC demo data - "
            "not real user data."
        ),
        "model": (
            "RandomForestClassifier inside "
            "a scikit-learn Pipeline"
        ),
        "features": feature_cols,
        "target": target_col,
        "classes": labels,
        "topics": sorted(df["topic"].unique().tolist()),
        "dataset_rows": int(len(df)),
        "training_rows": int(len(X_train)),
        "testing_rows": int(len(X_test)),
        "test_accuracy_on_synthetic_data": round(
            float(accuracy), 4
        ),
        "classification_report": report,
        "confusion_matrix": {
            "labels": labels,
            "values": matrix.tolist()
        },
        "scikit_learn_version": sklearn.__version__,
        "random_state": 42,
        "n_estimators": 100,
        "test_size": 0.2
    }

    joblib.dump(pipeline, model_path)

    with open(
        metadata_path, "w", encoding="utf-8"
    ) as file:
        json.dump(metadata, file, indent=2)

    print(f"\nModel saved: {model_path}")
    print(f"Metadata saved: {metadata_path}")
    print("Training and evaluation completed successfully.")


if __name__ == "__main__":
    train_and_save()
