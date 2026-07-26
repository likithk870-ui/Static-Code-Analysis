document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.getElementById('line-numbers');
    const lineCounterBadge = document.getElementById('line-counter-badge');
    const currentFilename = document.getElementById('current-filename');
    const fileStatus = document.getElementById('file-status');
    const editorDropzone = document.getElementById('editor-dropzone');
    const fileUploadInput = document.getElementById('file-upload-input');

    const btnRunAnalysis = document.getElementById('btn-run-analysis');
    const btnLoadSample = document.getElementById('btn-load-sample');
    const btnClearEditor = document.getElementById('btn-clear-editor');
    const btnCopyCode = document.getElementById('btn-copy-code');
    const btnExportReport = document.getElementById('btn-export-report');

    // Dashboard Elements
    const scoreNum = document.getElementById('score-num');
    const gradeBadge = document.getElementById('grade-badge');
    const gradeDesc = document.getElementById('grade-desc');
    const gaugeProgress = document.getElementById('gauge-progress');

    const metricComplexity = document.getElementById('metric-complexity');
    const metricMI = document.getElementById('metric-mi');
    const metricIssuesCount = document.getElementById('metric-issues-count');
    const metricSLOC = document.getElementById('metric-sloc');

    const issuesList = document.getElementById('issues-list');
    const securityList = document.getElementById('security-list');
    const tableFunctions = document.getElementById('table-functions').querySelector('tbody');
    const listClasses = document.getElementById('list-classes');

    const statSlocVal = document.getElementById('stat-sloc-val');
    const statCommentsVal = document.getElementById('stat-comments-val');
    const statBlankVal = document.getElementById('stat-blank-val');
    const barSloc = document.getElementById('bar-sloc');
    const barComments = document.getElementById('bar-comments');
    const barBlank = document.getElementById('bar-blank');

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const filterChips = document.querySelectorAll('.chip-filter');

    let currentAnalysisData = null;

    // Line Number Generator & Scroll Sync
    function updateLineNumbers() {
        const lines = codeInput.value.split('\n');
        const count = lines.length;
        lineCounterBadge.textContent = `${count} ${count === 1 ? 'line' : 'lines'}`;
        
        let numbersHtml = '';
        for (let i = 1; i <= count; i++) {
            numbersHtml += `<div>${i}</div>`;
        }
        lineNumbers.innerHTML = numbersHtml;
    }

    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeInput.scrollTop;
    });

    // Tab Switcher
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetTab = document.getElementById(`tab-${btn.dataset.tab}`);
            if (targetTab) targetTab.classList.add('active');
        });
    });

    // Severity Filters
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const severity = chip.dataset.severity;

            const items = issuesList.querySelectorAll('.issue-item');
            items.forEach(item => {
                if (severity === 'all' || item.classList.contains(`severity-${severity}`)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Perform Analysis API Call
    async function runAnalysis() {
        const code = codeInput.value;
        if (!code.trim()) {
            alert("Please paste or type Python code first.");
            return;
        }

        fileStatus.textContent = "Analyzing...";
        fileStatus.style.borderColor = "var(--accent-amber)";
        fileStatus.style.color = "var(--accent-amber)";

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            if (!response.ok) throw new Error("Analysis failed");
            const data = await response.json();
            currentAnalysisData = data;

            renderDashboardResults(data);

            fileStatus.textContent = "Analysis Complete";
            fileStatus.style.borderColor = "var(--accent-green)";
            fileStatus.style.color = "var(--accent-green)";
        } catch (err) {
            console.error(err);
            alert("An error occurred while analyzing code.");
            fileStatus.textContent = "Error";
            fileStatus.style.borderColor = "var(--accent-rose)";
            fileStatus.style.color = "var(--accent-rose)";
        }
    }

    // Render Dashboard UI
    function renderDashboardResults(data) {
        const m = data.metrics;

        // Health Score & Gauge Update
        scoreNum.textContent = m.health_score;
        gradeBadge.textContent = m.grade;

        // Animate SVG gauge ring (circumference = 264)
        const offset = 264 - (264 * m.health_score) / 100;
        gaugeProgress.style.strokeDashoffset = offset;

        // Grade colors
        if (m.health_score >= 80) {
            gaugeProgress.style.stroke = "var(--accent-green)";
            gradeBadge.style.color = "var(--accent-green)";
            gradeBadge.style.borderColor = "var(--accent-green)";
            gradeDesc.textContent = "Excellent Code Health";
        } else if (m.health_score >= 60) {
            gaugeProgress.style.stroke = "var(--accent-amber)";
            gradeBadge.style.color = "var(--accent-amber)";
            gradeBadge.style.borderColor = "var(--accent-amber)";
            gradeDesc.textContent = "Needs Refactoring";
        } else {
            gaugeProgress.style.stroke = "var(--accent-rose)";
            gradeBadge.style.color = "var(--accent-rose)";
            gradeBadge.style.borderColor = "var(--accent-rose)";
            gradeDesc.textContent = "High Risk Code Smells";
        }

        // Metrics Cards
        if (document.getElementById('metric-code-score')) document.getElementById('metric-code-score').textContent = data.score || `${(m.health_score/10).toFixed(1)} / 10`;
        if (document.getElementById('metric-warnings')) document.getElementById('metric-warnings').textContent = data.warnings_count || 5;
        if (document.getElementById('metric-errors')) document.getElementById('metric-errors').textContent = data.errors_count || 0;
        if (document.getElementById('metric-smells')) document.getElementById('metric-smells').textContent = m.category_counts ? m.category_counts.smell : 3;

        if (metricComplexity) metricComplexity.textContent = m.avg_complexity;
        if (metricMI) metricMI.textContent = `${m.maintainability_index}/100`;
        if (metricIssuesCount) metricIssuesCount.textContent = m.total_issues;
        if (metricSLOC) metricSLOC.textContent = m.code_lines;

        // Tab Badge Counters
        if (document.getElementById('count-all')) document.getElementById('count-all').textContent = m.total_issues;
        if (document.getElementById('count-security')) document.getElementById('count-security').textContent = m.category_counts ? m.category_counts.security : 0;

        // Render Issues Feed
        if (data.issues.length === 0) {
            issuesList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-circle-check" style="color: var(--accent-green)"></i>
                    <h3>Clean Code Standard Achieved</h3>
                    <p>No critical syntax errors, security vulnerabilities, or code smells detected.</p>
                </div>`;
        } else {
            issuesList.innerHTML = data.issues.map(i => `
                <div class="issue-item severity-${i.severity}">
                    <div class="issue-header">
                        <span class="issue-type">
                            <i class="fa-solid ${getCategoryIcon(i.category)}"></i> ${escapeHtml(i.type)}
                        </span>
                        <span class="line-tag" onclick="jumpToLine(${i.line})">Line ${i.line}</span>
                    </div>
                    <p class="issue-msg">${escapeHtml(i.message)}</p>
                    ${i.suggestion ? `<div class="issue-suggestion"><i class="fa-solid fa-lightbulb"></i> Fix: ${escapeHtml(i.suggestion)}</div>` : ''}
                </div>
            `).join('');
        }

        // Render Security List
        const securityIssues = data.issues.filter(i => i.category === 'security');
        if (securityIssues.length === 0) {
            securityList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-shield-check" style="color: var(--accent-green)"></i>
                    <h3>No Security Vulnerabilities Detected</h3>
                    <p>Code passed checks for dynamic evaluation, command injection, and exposed secrets.</p>
                </div>`;
        } else {
            securityList.innerHTML = securityIssues.map(i => `
                <div class="issue-item severity-${i.severity}">
                    <div class="issue-header">
                        <span class="issue-type"><i class="fa-solid fa-shield-virus"></i> ${escapeHtml(i.type)}</span>
                        <span class="line-tag" onclick="jumpToLine(${i.line})">Line ${i.line}</span>
                    </div>
                    <p class="issue-msg">${escapeHtml(i.message)}</p>
                    <div class="issue-suggestion"><i class="fa-solid fa-triangle-exclamation"></i> Security Advice: ${escapeHtml(i.suggestion)}</div>
                </div>
            `).join('');
        }

        // Render Functions Table
        if (data.functions.length === 0) {
            tableFunctions.innerHTML = `<tr><td colspan="5" class="text-muted">No top-level or method functions found</td></tr>`;
        } else {
            tableFunctions.innerHTML = data.functions.map(f => {
                let compClass = "complexity-low";
                if (f.complexity > 10) compClass = "complexity-high";
                else if (f.complexity > 5) compClass = "complexity-medium";

                return `
                    <tr>
                        <td><code>${escapeHtml(f.name)}()</code></td>
                        <td>Line ${f.line}</td>
                        <td>${f.length} lines</td>
                        <td>${f.args_count} args</td>
                        <td><span class="complexity-badge ${compClass}">CC: ${f.complexity}</span></td>
                    </tr>`;
            }).join('');
        }

        // Render Classes List
        if (data.classes.length === 0) {
            listClasses.innerHTML = `<li class="text-muted">No classes declared</li>`;
        } else {
            listClasses.innerHTML = data.classes.map(c => `
                <li><i class="fa-solid fa-box"></i> <code>class ${escapeHtml(c.name)}</code> (Line ${c.line})</li>
            `).join('');
        }

        // Render Breakdown Bars
        const totalLines = m.total_lines || 1;
        statSlocVal.textContent = `${m.code_lines} lines (${Math.round(m.code_lines/totalLines*100)}%)`;
        statCommentsVal.textContent = `${m.comment_lines} lines (${Math.round(m.comment_lines/totalLines*100)}%)`;
        statBlankVal.textContent = `${m.blank_lines} lines (${Math.round(m.blank_lines/totalLines*100)}%)`;

        barSloc.style.width = `${(m.code_lines / totalLines) * 100}%`;
        barComments.style.width = `${(m.comment_lines / totalLines) * 100}%`;
        barBlank.style.width = `${(m.blank_lines / totalLines) * 100}%`;
    }

    // Helper functions
    function getCategoryIcon(category) {
        switch(category) {
            case 'security': return 'fa-shield-halved';
            case 'syntax': return 'fa-bug';
            case 'smell': return 'fa-wind';
            case 'complexity': return 'fa-diagram-project';
            default: return 'fa-circle-check';
        }
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }

    // Jump to Line in Code Editor
    window.jumpToLine = function(lineNum) {
        const lines = codeInput.value.split('\n');
        let pos = 0;
        for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
            pos += lines[i].length + 1;
        }
        codeInput.focus();
        codeInput.setSelectionRange(pos, pos + lines[lineNum - 1].length);
        
        // Scroll editor
        const lineHeight = 24; // approximate px per line
        codeInput.scrollTop = (lineNum - 3) * lineHeight;
    };

    // Button Actions
    btnRunAnalysis.addEventListener('click', runAnalysis);

    btnLoadSample.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/sample');
            const data = await res.json();
            codeInput.value = data.code;
            currentFilename.textContent = data.filename || 'calculator.py';
            updateLineNumbers();
            runAnalysis();
        } catch (e) {
            alert("Could not load sample file.");
        }
    });

    btnClearEditor.addEventListener('click', () => {
        codeInput.value = '';
        currentFilename.textContent = 'untitled.py';
        updateLineNumbers();
    });

    btnCopyCode.addEventListener('click', () => {
        navigator.clipboard.writeText(codeInput.value);
        alert("Code copied to clipboard!");
    });

    btnExportReport.addEventListener('click', async () => {
        if (!codeInput.value.trim()) {
            alert("No code available for report export.");
            return;
        }
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codeInput.value })
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'static_analysis_report.json';
        a.click();
    });

    // File Upload Handler
    fileUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                codeInput.value = evt.target.result;
                currentFilename.textContent = file.name;
                updateLineNumbers();
                runAnalysis();
            };
            reader.readAsText(file);
        }
    });

    // Drag & Drop File Loader
    editorDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        editorDropzone.classList.add('dragover');
    });

    editorDropzone.addEventListener('dragleave', () => {
        editorDropzone.classList.remove('dragover');
    });

    editorDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        editorDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
                codeInput.value = evt.target.result;
                currentFilename.textContent = file.name;
                updateLineNumbers();
                runAnalysis();
            };
            reader.readAsText(file);
        }
    });

    // Initial Load: Auto-load sample code
    btnLoadSample.click();
});
