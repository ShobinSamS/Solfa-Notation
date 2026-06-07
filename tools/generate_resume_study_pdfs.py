from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUT_DIR = Path("interview_prep")
ROADMAP_PDF = OUT_DIR / "Shobin_Sam_Technical_Skills_Topic_Roadmap.pdf"
DEFINITIONS_PDF = OUT_DIR / "Shobin_Sam_Technical_Skills_Definitions_and_Examples.pdf"


@dataclass(frozen=True)
class Topic:
    category: str
    name: str
    basic: tuple[str, ...]
    beginner: tuple[str, ...]
    intermediate: tuple[str, ...]
    hard: tuple[str, ...]
    definition: str
    examples: tuple[str, ...]


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=27,
            textColor=colors.HexColor("#1f3a5f"),
            spaceAfter=8,
            alignment=TA_CENTER,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#4b5563"),
            alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "h1": ParagraphStyle(
            "Heading1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=17,
            textColor=colors.HexColor("#1f3a5f"),
            spaceBefore=12,
            spaceAfter=7,
        ),
        "h2": ParagraphStyle(
            "Heading2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=colors.HexColor("#243b53"),
            spaceBefore=8,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.7,
            leading=11.5,
            textColor=colors.HexColor("#111827"),
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.4,
            leading=9.2,
            textColor=colors.HexColor("#111827"),
        ),
        "small_bold": ParagraphStyle(
            "SmallBold",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=7.4,
            leading=9.2,
            textColor=colors.HexColor("#111827"),
        ),
        "tiny": ParagraphStyle(
            "Tiny",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=6.8,
            leading=8.4,
            textColor=colors.HexColor("#111827"),
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.2,
            leading=8.5,
            textColor=colors.HexColor("#6b7280"),
            alignment=TA_CENTER,
        ),
        "toc": ParagraphStyle(
            "Toc",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.4,
            leading=11,
            leftIndent=8,
            firstLineIndent=-8,
            textColor=colors.HexColor("#111827"),
        ),
    }


TOPICS: list[Topic] = [
    Topic(
        "Programming Languages",
        "Python",
        ("Syntax, indentation, comments", "Primitive types: int, float, bool, str", "Variables and basic operators", "Conditionals and loops"),
        ("Lists, tuples, sets, dictionaries", "Functions, parameters, return values", "File I/O and exception handling", "Modules, packages, virtual environments"),
        ("OOP, dataclasses, decorators, generators", "Comprehensions, iterators, context managers", "Typing, mypy-style annotations, pydantic basics", "Testing with pytest and debugging"),
        ("Asyncio and concurrent futures", "Memory model, mutability, copy vs deepcopy", "Packaging, dependency pinning, wheels", "Performance profiling and vectorization choices"),
        "Python is a high-level programming language commonly used for backend services, automation, data work, machine learning, and AI applications.",
        ("Build a FastAPI endpoint that loads a model and returns predictions.", "Use pandas and scikit-learn to train and evaluate a classifier."),
    ),
    Topic(
        "Programming Languages",
        "SQL and PostgreSQL",
        ("Tables, rows, columns, primary keys", "SELECT, WHERE, ORDER BY, LIMIT", "INSERT, UPDATE, DELETE", "Basic data types"),
        ("JOINs: inner, left, right", "GROUP BY, HAVING, aggregates", "Subqueries and aliases", "PostgreSQL basics: schemas, psql, constraints"),
        ("Indexes, query plans, normalization", "Transactions, isolation, locks", "Window functions and CTEs", "JSONB, arrays, full-text search basics"),
        ("Query optimization with EXPLAIN ANALYZE", "Partitioning and materialized views", "Deadlocks and concurrency tuning", "Backup, restore, migrations, connection pooling"),
        "SQL is the standard language for querying relational data; PostgreSQL is a production-grade open-source relational database.",
        ("Store uploaded document metadata and query validation results by status.", "Aggregate prediction logs by day to monitor model drift."),
    ),
    Topic(
        "Frameworks and Libraries",
        "NumPy",
        ("Arrays vs Python lists", "Array creation, shape, dtype", "Indexing and slicing", "Basic math operations"),
        ("Broadcasting", "Vectorized operations", "Reshape, concatenate, stack", "Random number generation"),
        ("Linear algebra operations", "Boolean masks and advanced indexing", "Memory views vs copies", "Interoperability with pandas and PyTorch"),
        ("Numerical stability", "Performance profiling", "Strides and memory layout", "Large-array memory management"),
        "NumPy provides fast multidimensional arrays and numerical operations that underpin most Python ML libraries.",
        ("Normalize sensor readings before training a water-quality model.", "Convert image pixels into arrays for OpenCV preprocessing."),
    ),
    Topic(
        "Frameworks and Libraries",
        "Pandas",
        ("Series and DataFrame", "Reading CSV/Excel/JSON", "Selecting rows and columns", "Handling missing values"),
        ("Filtering, sorting, groupby", "Merging and joining data", "Datetime handling", "Basic feature engineering"),
        ("Pivot tables, window operations", "Categorical data and memory optimization", "Train/test split preparation", "Data validation checks"),
        ("Performance with chunking", "Avoiding chained assignment bugs", "Large dataset strategy", "Feature store style pipelines"),
        "Pandas is a data manipulation library for cleaning, transforming, joining, and analyzing structured datasets.",
        ("Prepare IoT sensor history for model training.", "Create a validation report from document processing results."),
    ),
    Topic(
        "Frameworks and Libraries",
        "Matplotlib",
        ("Figures, axes, plots", "Line, bar, scatter charts", "Labels, legends, titles", "Saving plots"),
        ("Subplots", "Histograms and boxplots", "Color and style control", "Annotations"),
        ("Confusion matrix visualization", "Training curves", "Custom ticks and scales", "Combining with pandas output"),
        ("Publication-quality charts", "Performance for many points", "Interactive backends", "Visual diagnostic dashboards"),
        "Matplotlib is a Python plotting library used to visualize data, model behavior, and evaluation metrics.",
        ("Plot validation accuracy over epochs.", "Show bacterial prediction rates by water source."),
    ),
    Topic(
        "Frameworks and Libraries",
        "scikit-learn",
        ("Estimator API: fit, predict, transform", "Train/test split", "Common algorithms", "Basic metrics"),
        ("Preprocessing pipelines", "Classification vs regression", "Cross-validation", "Feature scaling and encoding"),
        ("GridSearchCV and RandomizedSearchCV", "Model selection and leakage prevention", "Imbalanced classification", "Model persistence with joblib"),
        ("Calibration, threshold tuning", "Explainability: permutation importance, SHAP concept", "Custom transformers", "Production monitoring for sklearn models"),
        "scikit-learn is a machine learning library for classical ML models, preprocessing, pipelines, and evaluation.",
        ("Train a random forest classifier for water-quality prediction.", "Use precision, recall, and F1 to evaluate document classification."),
    ),
    Topic(
        "Frameworks and Libraries",
        "PyTorch",
        ("Tensors, shapes, dtype, device", "Autograd basics", "nn.Module", "Loss functions and optimizers"),
        ("Dataset and DataLoader", "Training and validation loops", "Saving/loading state_dict", "GPU vs CPU execution"),
        ("Transfer learning", "Learning-rate schedules", "Regularization: dropout, weight decay", "Mixed precision and gradient clipping"),
        ("Distributed training basics", "Model export: TorchScript/ONNX concept", "Debugging vanishing/exploding gradients", "Serving deep learning models efficiently"),
        "PyTorch is a deep learning framework for building, training, fine-tuning, and deploying neural networks.",
        ("Fine-tune an image classifier for document type detection.", "Train a neural network on sensor time-series features."),
    ),
    Topic(
        "Frameworks and Libraries",
        "OpenCV",
        ("Image loading, saving, color spaces", "Resize, crop, rotate", "Thresholding and filtering", "Drawing boxes and text"),
        ("Contours and morphology", "Camera/video capture", "Basic feature extraction", "Image preprocessing for ML"),
        ("Object detection pipeline inputs/outputs", "Perspective transforms", "Tracking basics", "Performance considerations"),
        ("Real-time video optimization", "Lighting/noise robustness", "Integrating with deep models", "Production image quality checks"),
        "OpenCV is a computer vision library for image and video processing, preprocessing, and classical CV operations.",
        ("Preprocess uploaded documents before OCR.", "Draw bounding boxes for detected gestures or document fields."),
    ),
    Topic(
        "Frameworks and Libraries",
        "Hugging Face Transformers",
        ("Tokenizer basics", "Model and pipeline APIs", "Tasks: text classification, QA, generation", "Loading pretrained models"),
        ("Fine-tuning concept", "Datasets and Trainer overview", "Attention masks and padding", "Model hub usage"),
        ("Embeddings from transformer models", "Prompting encoder-decoder vs decoder-only models", "Evaluation and inference batching", "Quantization concept"),
        ("PEFT/LoRA concept", "Serving latency and memory tradeoffs", "Model versioning", "Safety, hallucination, and evaluation"),
        "Hugging Face Transformers provides pretrained transformer models and tooling for NLP, embeddings, and generative AI tasks.",
        ("Use a QA pipeline to answer questions from extracted text.", "Generate embeddings or summaries for document chunks."),
    ),
    Topic(
        "Frameworks and Libraries",
        "LangChain",
        ("Chains, prompts, models", "Document loaders", "Text splitters", "Output parsers"),
        ("Retrievers and vector stores", "Memory concepts", "Tool calling basics", "Prompt templates"),
        ("LCEL runnable composition", "RAG pipelines", "Agents and tools", "Tracing and evaluation"),
        ("Production reliability", "Guardrails and fallback models", "Cost/latency optimization", "Stateful agent design"),
        "LangChain is an orchestration framework for building LLM applications, especially RAG, tool use, and agent workflows.",
        ("Build a document-question-answering chain.", "Connect a retriever to an LLM for citation-backed answers."),
    ),
    Topic(
        "Frameworks and Libraries",
        "FAISS",
        ("Vector similarity search concept", "IndexFlatL2 and cosine similarity basics", "Adding and searching vectors", "Top-k retrieval"),
        ("Embedding dimensionality", "Metadata mapping outside FAISS", "Index persistence", "Distance metrics"),
        ("IVF and HNSW concepts", "Recall vs latency", "Filtering strategies around FAISS", "Batch search"),
        ("Billion-scale indexing concept", "Quantization: PQ/OPQ concept", "Sharding and replicas", "Production refresh/rebuild strategy"),
        "FAISS is a vector search library optimized for fast nearest-neighbor search over embedding vectors.",
        ("Retrieve the most relevant PDF chunks for a RAG answer.", "Search similar document images or text snippets."),
    ),
    Topic(
        "Machine Learning and Generative AI",
        "Machine Learning Fundamentals",
        ("Supervised vs unsupervised learning", "Features, labels, targets", "Train/test split", "Overfitting and underfitting"),
        ("Bias-variance tradeoff", "Classification vs regression", "Metrics: accuracy, precision, recall, F1, ROC-AUC", "Data leakage"),
        ("Cross-validation", "Feature engineering", "Class imbalance", "Hyperparameter tuning"),
        ("Model drift and monitoring", "Experiment tracking", "Statistical validation", "Production retraining strategy"),
        "Machine learning uses data to learn patterns and make predictions or decisions without hard-coded rules.",
        ("Predict bacterial presence from sensor readings.", "Classify whether a document is valid or invalid."),
    ),
    Topic(
        "Machine Learning and Generative AI",
        "Deep Learning",
        ("Neurons, layers, activations", "Forward pass and loss", "Backpropagation concept", "Epochs and batches"),
        ("CNNs, RNNs, transformers overview", "Optimizers: SGD, Adam", "Regularization", "Train/validation/test sets"),
        ("Transfer learning", "Batch normalization", "Learning curves", "Gradient problems"),
        ("Architecture choice", "GPU memory debugging", "Model compression", "Deployment optimization"),
        "Deep learning is a subset of ML that uses neural networks with many layers to learn complex patterns in data.",
        ("Use a CNN-style detector for document objects.", "Use a transformer model for text understanding."),
    ),
    Topic(
        "Machine Learning and Generative AI",
        "Natural Language Processing (NLP)",
        ("Tokens, sentences, documents", "Text cleaning", "Stop words and stemming concept", "Bag-of-words and TF-IDF concept"),
        ("Text classification", "Named entity recognition", "Question answering", "Semantic similarity"),
        ("Tokenization tradeoffs", "Embeddings", "Transformers for NLP", "Evaluation for NLP tasks"),
        ("Domain adaptation", "Multilingual handling", "PII redaction", "Robustness against noisy text"),
        "NLP is the field of processing and understanding human language with algorithms and machine learning.",
        ("Evaluate email quality and suggest improvements.", "Extract entities and answers from uploaded PDFs."),
    ),
    Topic(
        "Machine Learning and Generative AI",
        "Large Language Models (LLMs)",
        ("Prompt, completion, context window", "Temperature and max tokens", "Chat vs completion", "Basic prompting"),
        ("System/user messages", "Few-shot examples", "Structured output", "Token costs and latency"),
        ("Function/tool calling", "RAG with citations", "Evaluation sets", "Prompt injection awareness"),
        ("Fine-tuning vs prompting vs adapters", "Safety and governance", "Observability and trace review", "Model routing and fallbacks"),
        "LLMs are transformer-based models trained on large text corpora to generate, summarize, reason over, or transform language.",
        ("Use LLaMA 7B to score email draft quality.", "Use Gemini or another LLM to answer uploaded-document questions."),
    ),
    Topic(
        "Machine Learning and Generative AI",
        "Retrieval-Augmented Generation (RAG)",
        ("Why retrieval reduces hallucination", "Documents, chunks, embeddings", "Retriever plus generator", "Top-k context"),
        ("Chunk size and overlap", "Vector store indexing", "Prompting with retrieved context", "Source citation basics"),
        ("Hybrid search", "Reranking", "Query rewriting", "Evaluation: faithfulness, answer relevance, context recall"),
        ("Production refresh pipelines", "Permission-aware retrieval", "Latency/cost optimization", "Failure modes and guardrails"),
        "RAG combines search over external knowledge with an LLM so answers are grounded in retrieved context.",
        ("Upload PDF, chunk it, embed chunks, retrieve relevant chunks, answer with citations.", "Use FAISS to fetch policy text before generating a response."),
    ),
    Topic(
        "Machine Learning and Generative AI",
        "Embeddings and Vector Search",
        ("Embedding meaning", "Vector dimensions", "Cosine similarity", "Nearest-neighbor search"),
        ("Sentence/document embeddings", "Chunk embeddings", "Top-k retrieval", "Metadata and IDs"),
        ("Vector database vs vector library", "Hybrid lexical plus vector search", "Reranking", "Embedding model selection"),
        ("Drift and re-embedding", "Approximate nearest neighbor tuning", "Security and tenant isolation", "Evaluation of retrieval quality"),
        "Embeddings convert text, images, or other objects into numerical vectors so similar items are close in vector space.",
        ("Find PDF chunks semantically related to a user query.", "Cluster similar validation errors from production logs."),
    ),
    Topic(
        "Machine Learning and Generative AI",
        "Agentic AI",
        ("Agent, tool, goal, observation", "Prompt plus tool use", "Planner/executor concept", "Basic ReAct pattern"),
        ("Tool schemas", "Memory and state", "Human-in-the-loop", "Error handling"),
        ("Multi-step workflows", "Guardrails", "Evaluation of agent runs", "Cost and timeout controls"),
        ("Autonomy boundaries", "Long-running workflow orchestration", "Security for tool access", "Production incident handling"),
        "Agentic AI refers to LLM systems that can plan, call tools, observe results, and iterate toward a goal.",
        ("An agent reads a PDF, calls a retriever, validates fields, and creates a summary.", "A support assistant calls database and document-search tools before replying."),
    ),
    Topic(
        "Model Deployment and Tools",
        "FastAPI",
        ("Routes, request, response", "Path and query parameters", "Pydantic schemas", "Uvicorn local server"),
        ("Dependency injection", "Error handling", "File uploads", "CORS and middleware"),
        ("Model loading lifecycle", "Async endpoints", "Background tasks", "Authentication basics"),
        ("Dockerized API serving", "Gunicorn/Uvicorn workers", "Observability and health checks", "Autoscaling and rollback strategy"),
        "FastAPI is a Python web framework for building typed, high-performance APIs, often used to serve ML models.",
        ("Expose /predict for a scikit-learn model.", "Expose /ask for a RAG pipeline with uploaded document IDs."),
    ),
    Topic(
        "Model Deployment and Tools",
        "Streamlit",
        ("Widgets, text, charts", "File upload", "Session state basics", "Running local apps"),
        ("Caching with st.cache_data/resource", "Layout columns and tabs", "Displaying model outputs", "Basic deployment options"),
        ("Multi-page apps", "Secrets management", "Long-running task UX", "Integrating APIs"),
        ("User auth strategy", "Scaling limits", "Separating frontend from backend", "Production hardening"),
        "Streamlit is a Python framework for rapidly building interactive data and ML web apps.",
        ("Create a document QA upload interface.", "Build an email-quality scoring demo for stakeholders."),
    ),
    Topic(
        "Model Deployment and Tools",
        "Model Serving",
        ("Inference vs training", "Input/output schema", "Serialization: pickle/joblib/state_dict", "Batch vs single prediction"),
        ("Preprocessing at inference", "Health checks", "Logging predictions", "Versioned model artifacts"),
        ("Latency, throughput, concurrency", "Docker basics", "API contracts", "Monitoring errors and drift"),
        ("Canary releases", "A/B testing", "GPU serving", "Rollback and reproducibility"),
        "Model serving is the practice of making a trained model available for real-time or batch predictions in an application.",
        ("Serve a classifier behind FastAPI.", "Run a nightly batch job that scores documents and stores results."),
    ),
    Topic(
        "Model Deployment and Tools",
        "Git",
        ("Repository, commit, branch", "git status, add, commit", "git log and diff", "Clone and pull"),
        ("Branching workflow", "Merge vs rebase concept", "Pull requests", "Resolving simple conflicts"),
        ("Tags and releases", "Stash", "Cherry-pick", "Good commit messages"),
        ("Git bisect", "Protected branches", "CI integration", "Release/version strategy"),
        "Git is a distributed version control system used to track code changes and collaborate safely.",
        ("Create a feature branch for a new model endpoint.", "Review a diff before deploying a document validation fix."),
    ),
    Topic(
        "Resume-Adjacent Project Topics",
        "YOLO Object Detection",
        ("Classification vs detection", "Bounding boxes", "Confidence score", "Intersection over Union concept"),
        ("Training data labels", "Precision and recall for detection", "Inference pipeline", "Drawing detections"),
        ("Non-max suppression", "mAP metric", "Fine-tuning and augmentation", "Export formats"),
        ("Real-time deployment", "Edge optimization", "Monitoring false positives", "Versioning detection models"),
        "YOLO is a real-time object detection family that predicts object classes and bounding boxes in images.",
        ("Detect hand gestures for a calculator.", "Detect fields or regions in uploaded documents."),
    ),
    Topic(
        "Resume-Adjacent Project Topics",
        "MediaPipe Facial Landmarks",
        ("Face landmarks", "Video frames", "Coordinate points", "Basic attention signals"),
        ("Landmark smoothing", "Head pose concept", "Eye and mouth features", "Frame-level classification"),
        ("Temporal aggregation", "Feature engineering from landmarks", "Real-time processing", "Metric validation"),
        ("Robustness to lighting/angles", "Privacy considerations", "Production camera constraints", "Latency tuning"),
        "MediaPipe provides ready-made perception pipelines, including facial landmark detection for real-time vision applications.",
        ("Estimate audience attention from facial landmarks.", "Aggregate frame scores into presentation-level engagement metrics."),
    ),
    Topic(
        "Resume-Adjacent Project Topics",
        "Azure Computer Vision and Document Intelligence",
        ("OCR concept", "Document extraction", "Key-value pairs", "Confidence scores"),
        ("Prebuilt vs custom models", "Tables and layout extraction", "API calls and credentials", "Basic error handling"),
        ("Human review workflow", "Validation rules", "Accuracy tracking", "Cost and rate limits"),
        ("Production governance", "PII/security controls", "Model versioning", "Fallback strategy"),
        "Azure Computer Vision and Document Intelligence are cloud services for OCR, layout analysis, and structured document extraction.",
        ("Extract fields from uploaded documents for validation.", "Compare OCR confidence against manual review thresholds."),
    ),
    Topic(
        "Resume-Adjacent Project Topics",
        "Cloud ML Pipelines and IoT",
        ("Sensor data collection", "Batch vs streaming", "Data cleaning", "Model training pipeline"),
        ("Raspberry Pi integration", "Cloud storage", "Scheduled jobs", "Basic monitoring"),
        ("Feature pipelines", "Model registry concept", "Automated evaluation", "Deployment gates"),
        ("Edge/cloud tradeoffs", "Data drift in sensors", "Fault tolerance", "Pipeline orchestration"),
        "Cloud ML pipelines automate data ingestion, training, evaluation, and deployment; IoT adds sensor devices as data sources.",
        ("Collect Raspberry Pi water sensor readings and train a bacterial prediction model.", "Schedule cloud retraining when new validated data arrives."),
    ),
]


DEPLOYMENT_SAMPLES = [
    (
        "Simple production: Streamlit ML app",
        "Package the model with joblib, build a Streamlit UI, pin requirements, keep secrets outside code, deploy on Streamlit Community Cloud or an internal VM, and add basic logging plus manual rollback by versioned artifacts.",
        ("Best for demos, internal tools, PoCs, and stakeholder review.", "Example: document QA upload app or email-quality scoring app."),
    ),
    (
        "User-facing production: FastAPI service plus separate frontend",
        "Serve the model through FastAPI in Docker, expose typed endpoints, use a React/Streamlit frontend separately, run behind Nginx or a cloud load balancer, add auth, health checks, request logs, metrics, CI/CD, and blue/green or canary deployment.",
        ("Best for external users, multiple clients, predictable APIs, and scaling.", "Example: /predict for document validation or /ask for RAG answers."),
    ),
    (
        "ML platform style: managed cloud endpoint",
        "Store the model in a registry, deploy to a managed endpoint such as Azure ML, AWS SageMaker, or GCP Vertex AI, configure autoscaling, secrets, monitoring, model/version rollout, and retraining pipelines.",
        ("Best when governance, auditability, traffic scaling, and model lifecycle matter.", "Example: production document validation model with monitored accuracy and drift alerts."),
    ),
]


def grouped_topics() -> dict[str, list[Topic]]:
    groups: dict[str, list[Topic]] = {}
    for topic in TOPICS:
        groups.setdefault(topic.category, []).append(topic)
    return groups


def make_doc(path: Path, title: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(path),
        pagesize=LETTER,
        leftMargin=0.62 * inch,
        rightMargin=0.62 * inch,
        topMargin=0.58 * inch,
        bottomMargin=0.55 * inch,
        title=title,
        author="Codex",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin + 0.18 * inch, doc.width, doc.height - 0.18 * inch, id="normal")

    def on_page(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#d1d5db"))
        canvas.setLineWidth(0.5)
        canvas.line(document.leftMargin, 0.48 * inch, LETTER[0] - document.rightMargin, 0.48 * inch)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor("#6b7280"))
        canvas.drawCentredString(LETTER[0] / 2, 0.3 * inch, f"{title} | Page {document.page}")
        canvas.restoreState()

    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=on_page)])
    return doc


def bullet_list(items: Iterable[str], style, bullet_color="#1f3a5f", left_indent=11):
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=left_indent) for item in items],
        bulletType="bullet",
        start="disc",
        bulletFontName="Helvetica",
        bulletFontSize=5,
        bulletColor=colors.HexColor(bullet_color),
        leftIndent=left_indent,
        bulletIndent=0,
        bulletOffsetY=1,
    )


def cover(title: str, subtitle: str, S):
    flow = [
        Spacer(1, 0.15 * inch),
        Paragraph(title, S["title"]),
        Paragraph(subtitle, S["subtitle"]),
    ]
    return flow


def topic_table(topic: Topic, S):
    headers = ["Basic", "Beginner", "Intermediate", "Hard"]
    data = [[Paragraph(f"<b>{h}</b>", S["small_bold"]) for h in headers]]
    data.append(
        [
            bullet_list(topic.basic, S["tiny"], left_indent=7),
            bullet_list(topic.beginner, S["tiny"], left_indent=7),
            bullet_list(topic.intermediate, S["tiny"], left_indent=7),
            bullet_list(topic.hard, S["tiny"], left_indent=7),
        ]
    )
    t = Table(data, colWidths=[1.78 * inch, 1.78 * inch, 1.78 * inch, 1.78 * inch], repeatRows=1, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e9f0f7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def build_roadmap():
    S = styles()
    flow = cover(
        "Technical Skills Interview Roadmap",
        "Granular study checklist based on the resume technical skills section, with resume-adjacent project topics included for interview readiness.",
        S,
    )
    flow.append(Paragraph("Coverage Map", S["h1"]))
    coverage = []
    for category, topics in grouped_topics().items():
        coverage.append(f"<b>{category}:</b> " + ", ".join(t.name for t in topics))
    flow.append(bullet_list(coverage, S["body"], left_indent=13))
    flow.append(Paragraph("How to use this roadmap", S["h1"]))
    flow.append(
        Paragraph(
            "Start with Basic and Beginner for every topic, then move to Intermediate for resume discussion depth. Use Hard topics for senior-style follow-up questions, production design, and troubleshooting.",
            S["body"],
        )
    )
    flow.append(PageBreak())
    for category, topics in grouped_topics().items():
        flow.append(Paragraph(category, S["h1"]))
        for topic in topics:
            flow.append(KeepTogether([Paragraph(topic.name, S["h2"]), topic_table(topic, S), Spacer(1, 6)]))
    flow.append(PageBreak())
    flow.append(Paragraph("Python Web App and ML Deployment Samples", S["h1"]))
    for title, description, points in DEPLOYMENT_SAMPLES:
        flow.append(KeepTogether([Paragraph(title, S["h2"]), Paragraph(description, S["body"]), bullet_list(points, S["body"], left_indent=13)]))
    make_doc(ROADMAP_PDF, "Technical Skills Interview Roadmap").build(flow)


def definition_block(topic: Topic, S):
    items = [
        Paragraph(topic.name, S["h2"]),
        Paragraph(f"<b>Definition:</b> {topic.definition}", S["body"]),
        Paragraph("<b>Examples:</b>", S["small_bold"]),
        bullet_list(topic.examples, S["body"], left_indent=13),
        Spacer(1, 3),
    ]
    return KeepTogether(items)


def build_definitions():
    S = styles()
    flow = cover(
        "Technical Skills Definitions and Examples",
        "One-to-two line definitions and practical examples for every topic in the roadmap.",
        S,
    )
    flow.append(Paragraph("Quick Table of Contents", S["h1"]))
    for category, topics in grouped_topics().items():
        flow.append(Paragraph(f"<b>{category}</b>: " + ", ".join(t.name for t in topics), S["toc"]))
    flow.append(PageBreak())
    for category, topics in grouped_topics().items():
        flow.append(Paragraph(category, S["h1"]))
        for topic in topics:
            flow.append(definition_block(topic, S))
    flow.append(PageBreak())
    flow.append(Paragraph("Deployment Definitions and Examples", S["h1"]))
    for title, description, points in DEPLOYMENT_SAMPLES:
        flow.append(KeepTogether([Paragraph(title, S["h2"]), Paragraph(description, S["body"]), bullet_list(points, S["body"], left_indent=13)]))
    make_doc(DEFINITIONS_PDF, "Technical Skills Definitions and Examples").build(flow)


def main():
    build_roadmap()
    build_definitions()
    print(ROADMAP_PDF.resolve())
    print(DEFINITIONS_PDF.resolve())


if __name__ == "__main__":
    main()
