"""
PyPulse Static Code Analysis Server and AST Analysis Engine.
"""

import ast
import os
import re
import sys
import subprocess
from flask import Flask, render_template, request, jsonify, make_response

app = Flask(__name__)

def run_pylint_analysis(filepath="calculator.py"):
    """Runs Pylint command line tool and extracts score, errors, and warnings."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pylint", filepath],
            capture_output=True,
            text=True,
            check=False
        )
        output = result.stdout
        
        score_match = re.search(r'rated at (-?\d+\.\d+)/10', output)
        score = float(score_match.group(1)) if score_match else 10.0
        score = max(0.0, score)

        errors = []
        warnings = []

        for line in output.splitlines():
            if ": C" in line or ": W" in line or ": R" in line:
                warnings.append(line.strip())
            elif ": E" in line or ": F" in line:
                errors.append(line.strip())

        return {
            "score": f"{score:.2f} / 10",
            "errors_count": len(errors),
            "warnings_count": len(warnings),
            "errors": errors,
            "warnings": warnings,
            "raw_output": output
        }
    except Exception as e:
        return {
            "score": "N/A",
            "errors_count": 0,
            "warnings_count": 0,
            "errors": [str(e)],
            "warnings": [],
            "raw_output": ""
        }

class ASTAnalyzer(ast.NodeVisitor):
    """AST Node Visitor to identify code smells and security risks."""

    def __init__(self, code):
        self.code = code
        self.issues = []
        self.functions = []
        self.classes = []

    def add_issue(self, issue_type, category, line, message, suggestion="", severity="warning"):
        """Appends an identified issue to the analyzer issues list."""
        self.issues.append({
            "type": issue_type,
            "category": category,
            "line": line,
            "message": message,
            "suggestion": suggestion,
            "severity": severity
        })

    def visit_FunctionDef(self, node):
        """Visits function definitions to check for docstrings."""
        func_name = node.name
        if not ast.get_docstring(node):
            self.add_issue("Missing Docstring", "smell", node.lineno,
                           f"Function '{func_name}' is missing a docstring.",
                           "Add a docstring explaining what this function does.", "warning")
        self.generic_visit(node)

    def visit_Call(self, node):
        """Visits function calls to check for security vulnerabilities."""
        if isinstance(node.func, ast.Name) and node.func.id in ("eval", "exec"):
            self.add_issue("Dynamic Code Execution", "security", node.lineno,
                           f"Use of '{node.func.id}()' detected.",
                           "Avoid dynamic code execution.", "critical")
        self.generic_visit(node)


def perform_full_analysis(code):
    """Performs static code inspection and returns metrics and issue scores."""
    if not code or not code.strip():
        return {
            "score": "10.0 / 10",
            "health_score": 100,
            "grade": "A+",
            "errors_count": 0,
            "warnings_count": 0,
            "issues": [],
            "metrics": {
                "total_lines": 0,
                "code_lines": 0,
                "comment_lines": 0,
                "blank_lines": 0,
                "avg_complexity": 1.0,
                "maintainability_index": 100
            }
        }

    issues = []
    try:
        parsed_ast = ast.parse(code)
        analyzer = ASTAnalyzer(code)
        analyzer.visit(parsed_ast)
        issues = analyzer.issues
    except SyntaxError as e:
        issues.append({
            "type": "Syntax Error",
            "category": "syntax",
            "line": e.lineno or 1,
            "message": f"Syntax Error: {e.msg}",
            "suggestion": "Fix Python syntax error.",
            "severity": "critical"
        })

    errors_count = sum(1 for i in issues if i["severity"] in ("critical", "error"))
    warnings_count = sum(1 for i in issues if i["severity"] in ("warning", "info"))

    penalty = (errors_count * 2.5) + (warnings_count * 1.0)
    pylint_score = max(0.0, round(10.0 - penalty, 2))
    health_score = max(0, min(100, int(pylint_score * 10)))

    if pylint_score >= 9.0:
        grade = "A+"
    elif pylint_score >= 8.0:
        grade = "A"
    elif pylint_score >= 7.0:
        grade = "B"
    elif pylint_score >= 5.0:
        grade = "C"
    else:
        grade = "F"

    lines = code.splitlines()
    code_lines = sum(1 for l in lines if l.strip() and not l.strip().startswith('#'))
    comment_lines = sum(1 for l in lines if l.strip().startswith('#'))
    blank_lines = sum(1 for l in lines if not l.strip())

    return {
        "score": f"{pylint_score:.2f} / 10",
        "health_score": health_score,
        "grade": grade,
        "errors_count": errors_count,
        "warnings_count": warnings_count,
        "issues": issues,
        "metrics": {
            "total_lines": len(lines),
            "code_lines": code_lines,
            "comment_lines": comment_lines,
            "blank_lines": blank_lines,
            "avg_complexity": 1.0,
            "maintainability_index": round(pylint_score * 10, 1),
            "total_issues": len(issues),
            "category_counts": {
                "security": sum(1 for i in issues if i["category"] == "security"),
                "syntax": sum(1 for i in issues if i["category"] == "syntax"),
                "smell": sum(1 for i in issues if i["category"] == "smell"),
                "complexity": sum(1 for i in issues if i["category"] == "complexity"),
                "best_practice": sum(1 for i in issues if i["category"] == "best_practice")
            }
        },
        "functions": [],
        "classes": []
    }


@app.route('/')
def index():
    """Renders the main web dashboard with Pylint inspection report."""
    report = run_pylint_analysis('calculator.py')
    return render_template('index.html', report=report)


@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """REST API endpoint to analyze code snippets."""
    data = request.get_json(silent=True) or {}
    code = data.get('code', '')
    if not code and 'file' in request.files:
        code = request.files['file'].read().decode('utf-8', errors='ignore')

    result = perform_full_analysis(code)
    return jsonify(result)


@app.route('/api/sample', methods=['GET'])
def api_sample():
    """REST API endpoint returning sample calculator.py code."""
    sample_path = os.path.join(os.path.dirname(__file__), 'calculator.py')
    if os.path.exists(sample_path):
        with open(sample_path, 'r', encoding='utf-8') as f:
            code = f.read()
        return jsonify({"code": code, "filename": "calculator.py"})
    return jsonify({"error": "Sample file not found"}), 404


@app.route('/api/export', methods=['POST'])
def api_export():
    """REST API endpoint exporting JSON analysis report."""
    data = request.get_json(silent=True) or {}
    code = data.get('code', '')
    analysis = perform_full_analysis(code)
    response = make_response(jsonify({"analysis_results": analysis}))
    response.headers['Content-Disposition'] = 'attachment; filename=static_analysis_report.json'
    return response


if __name__ == '__main__':
    print("Starting Flask Static Code Analysis App on http://127.0.0.1:5000")
    app.run(debug=True, host='127.0.0.1', port=5000)
