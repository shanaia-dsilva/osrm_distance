// Global variables
let currentData = null;
let currentResults = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeFileUpload();
    initializeDragDrop();
});

// File Upload Initialization
function initializeFileUpload() {
    const form = document.getElementById('csv-form');
    const fileInput = document.getElementById('file-input');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        uploadFile();
    });

    fileInput.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            uploadFile();
        }
    });
}

// Drag & Drop Initialization
function initializeDragDrop() {
    const dragArea = document.getElementById('drag-area');

    dragArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        dragArea.classList.add('hover');
    });

    dragArea.addEventListener('dragleave', function (e) {
        e.preventDefault();
        dragArea.classList.remove('hover');
    });

    dragArea.addEventListener('drop', function (e) {
        e.preventDefault();
        dragArea.classList.remove('hover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('file-input');
            fileInput.files = files;
            uploadFile();
        }
    });
}

// Switch between upload and paste
function setActiveToggle(index) {
    document.querySelectorAll('.btn-toggle').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
}

function switchToUpload() {
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('paste-section').style.display = 'none';
    setActiveToggle(0);  // Set upload button active
}

function switchToPaste() {
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('paste-section').style.display = 'block';
    setActiveToggle(1);  // Set paste button active
}


// File Upload
function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (!file) return showStatus('Please select a file', 'error');
    if (!file.name.toLowerCase().endsWith('.csv')) return showStatus('Please select a CSV file', 'error');

    const formData = new FormData();
    formData.append('file', file);

    showStatus('Uploading file...', 'info');

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentData = data.preview.rows;
                showPreview(data.preview);
                showStatus(`File uploaded successfully! ${data.row_count} rows loaded.`, 'success');
            } else {
                showStatus(data.error, 'error');
            }
        })
        .catch(err => {
            console.error('Upload error:', err);
            showStatus('Error uploading file', 'error');
        });
}

// Process Paste Data
function processPastedData() {
    const content = document.getElementById('paste-input').value.trim();
    if (!content) return showStatus('Please paste some data', 'error');

    showStatus('Processing pasted data...', 'info');

    fetch('/process_paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentData = data.preview.rows;
                showPreview(data.preview);
                showStatus(`Data processed successfully! ${data.row_count} rows loaded.`, 'success');
            } else {
                showStatus(data.error, 'error');
            }
        })
        .catch(err => {
            console.error('Process error:', err);
            showStatus('Error processing data', 'error');
        });
}

// Preview Data
function showPreview(previewData) {
    const previewSection = document.getElementById('preview-section');
    const previewTable = document.getElementById('preview-table');
    const previewInfo = document.getElementById('preview-info');

    // Clear existing content
    previewTable.innerHTML = '';

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    previewData.columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    previewTable.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    previewData.rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    previewTable.appendChild(tbody);

    // Update preview info
    previewInfo.textContent = `(Showing ${previewData.preview_rows} of ${previewData.total_rows} rows)`;

    // Show preview section
    previewSection.style.display = 'block';

    // Scroll to preview after a short delay to allow DOM update
    setTimeout(() => {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);  // 100ms delay ensures layout is ready
}

// Distance Calculation
function calculateDistances() {
    if (!currentData) return showStatus('No data loaded', 'error');

    updateProgress(25, 'Sending data to server...');

    const payload = {
        data: currentData.map(row => ({
            'Vehicle Number': row[0],
            'Institute': row[1],
            'Point 1 latitude': row[2],
            'Point 1 longitude': row[3],
            'Point 2 latitude': row[4],
            'Point 2 longitude': row[5]
        }))
    };

    fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentResults = data.results;
                showResults(data);
                showStatus('Distance calculation completed successfully!', 'success');
            } else {
                showStatus(data.error, 'error');
            }
        })
        .catch(err => {
            console.error('Calculation error:', err);
            showStatus('Error calculating distances', 'error');
        });
}

// Results Rendering
function showResults(data) {
    const resultsSection = document.getElementById('results-section');
    const resultsTable = document.getElementById('results-table');
    const resultsSummary = document.getElementById('results-summary');

    resultsTable.innerHTML = '';
    const summary = data.summary;

    resultsSummary.innerHTML = `
        <div class="summary-box">
            <strong>Calculation Summary:</strong><br>
            Total routes: ${summary.total_routes}<br>
            Successful: ${summary.successful_calculations}<br>
            Failed: ${summary.failed_calculations}
        </div>
    `;

    const columns = [
        'Vehicle Number', 'Institute',
        'Point 1 latitude', 'Point 1 longitude',
        'Point 2 latitude', 'Point 2 longitude',
        'Distance_km', 'Duration_minutes'
    ];

    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.replace(/_/g, ' ');
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    resultsTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.results.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            let val = row[col];

            if (col === 'Distance_km' && val !== null) val = parseFloat(val).toFixed(3);
            if (col === 'Duration_minutes' && val !== null) val = parseFloat(val).toFixed(1);

            td.textContent = val ?? 'N/A';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    resultsTable.appendChild(tbody);
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Export Results
function exportResults() {
    if (!currentResults) return showStatus('No results to export', 'error');

    const dataStr = JSON.stringify(currentResults);
    const url = `/export/csv?data=${encodeURIComponent(dataStr)}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = 'distance_results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showStatus('Results exported successfully!', 'success');
}

// Status Message
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    const typeClass = `status-${type}`;
    statusDiv.innerHTML = `<div class="${typeClass}">${message}</div>`;
}

// Progress Bar
function updateProgress(percent, message) {
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    bar.style.width = percent + '%';
    text.textContent = message;
}
