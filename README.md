# PyPulse — Static Code Analyzer & Code Smell Suite 🔍⚡

PyPulse is a modern, high-performance Python Static Code Analysis web application and AST metrics suite designed to audit Python codebases for security vulnerabilities, code smells, cyclomatic complexity, maintainability indices, and PEP8 compliance.

![PyPulse Banner](https://img.shields.sh/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)
![Framework](https://img.shields.sh/badge/Flask-3.0-green?style=for-the-badge&logo=flask)
![Build](https://img.shields.sh/badge/CI%2FCD-GitHub%20Actions-orange?style=for-the-badge&logo=githubactions)

---

## 📁 Repository Directory Structure

```
Static-Code-Analysis/
│
├── app.py                      # Flask Application Server & AST Code Analysis Engine
├── calculator.py               # Sample Python code containing real-world smells & security tests
├── requirements.txt            # Python package dependencies
├── README.md                   # Project documentation & usage guide
│
├── templates/
│   └── index.html              # Modern dark-mode web dashboard UI
│
├── static/
│   ├── style.css               # Glassmorphism design system & visual styles
│   └── script.js               # Interactive frontend controller & line highlighter
│
└── .github/
      └── workflows/
            └── static-analysis.yml # Automated GitHub Actions CI workflow
```

---

## ✨ Features & Capabilities

- 🛡️ **Security Vulnerability Scanner**:
  - Detects unsafe dynamic evaluations (`eval()`, `exec()`).
  - Detects shell command injection vectors (`os.system()`, `subprocess(shell=True)`).
  - Detects unsafe deserializers (`pickle.loads()`, `yaml.unsafe_load()`).
  - Identifies hardcoded secrets and credentials.

- 🌀 **Cyclomatic Complexity & Maintainability Index**:
  - Computes per-function and average cyclomatic complexity (CC).
  - Calculates standard Maintainability Index (MI) score (0–100 scale).

- 🧹 **Code Smell & Best Practice Detection**:
  - Unused imports detection.
  - Long function detection (>25 lines) & excessive parameter count (>5 params).
  - Missing docstrings for public classes and methods.
  - Broad or suppressed exception handling (`except Exception: pass`).
  - Snake_case and PascalCase naming convention validation.

- 📊 **Real-time Web Dashboard**:
  - Interactive dual-pane code editor with line sync and file drag-and-drop.
  - Animated Health Grade Circle (A+, A, B, C, F) and visual line breakdown (SLOC vs Comments).
  - One-click jump to file line numbers for highlighted issues.
  - JSON export for security audit compliance reports.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10 or higher
- `pip` package manager

### 2. Installation
Clone or navigate to the project root directory and install dependencies:

```bash
cd Static-Code-Analysis
pip install -r requirements.txt
```

### 3. Running the Web Application

Launch the local Flask dev server:

```bash
python app.py
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🧪 Testing with `calculator.py` Sample Code

1. Click the **"Load Sample (calculator.py)"** button in the PyPulse navbar.
2. Observe the automatic static analysis run:
   - **Health Score & Grade**: Evaluated based on issue severity and complexity.
   - **Security Tab**: Flags `eval()` and `subprocess` shell calls.
   - **Structure Tab**: Displays method complexity breakdown table.
   - **Issues Tab**: Filter by Critical, Warning, or Info items.

---

## ⚙️ CI/CD Integration (GitHub Actions)

This project includes a ready-to-use GitHub Actions workflow in `.github/workflows/static-analysis.yml`.

Whenever code is pushed or a Pull Request is opened:
1. `flake8` verifies syntax and PEP8 compliance.
2. `radon` calculates cyclomatic complexity thresholds.
3. `bandit` scans for security vulnerabilities automatically.

---

## 📜 License
MIT License. Created for static code quality analysis and secure coding education.
