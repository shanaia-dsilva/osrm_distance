// Global variables
let currentData = null;
let currentResults = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    initializeDragDrop();
});

// Initialize file upload functionality
function initializeFileUpload() {
    const form = document.getElementById('csv-form');
    const fileInput = document.getElementById('file-input');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        uploadFile();
    });
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            uploadFile();
        }
    });
}

// Initialize drag and drop functionality
function initializeDragDrop() {
    const dragArea = document.getElementById('drag-area');
    
    dragArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        dragArea.classList.add('hover');
        // dragArea.classList.add('active');
    });
    
    dragArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dragArea.classList.remove('hover');
    });
    
    dragArea.addEventListener('drop', function(e) {
        e.preventDefault();
        dragArea.classList.remove('hover');
        // dragArea.classList.remove('active');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('file-input');
            fileInput.files = files;
            uploadFile();
        }
    });
}

// Switch between upload and paste modes
function switchToUpload() {
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('paste-section').style.display = 'none';
    
    // Update button states
    document.querySelectorAll('.btn-toggle').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.btn-toggle')[0].classList.add('active');
}

function switchToPaste() {
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('paste-section').style.display = 'block';
    
    // Update button states
    document.querySelectorAll('.btn-toggle').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.btn-toggle')[1].classList.add('active');
}

// Upload file function
function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Please select a file', 'danger');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showStatus('Please select a CSV file', 'danger');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    showStatus('Uploading file...', 'info');
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentData = data.preview.rows;
            showPreview(data.preview);
            showStatus(`File uploaded successfully! ${data.row_count} rows loaded.`, 'success');
        } else {
            showStatus(data.error, 'danger');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showStatus('Error uploading file', 'danger');
    });
}

// Process pasted data
function processPastedData() {
    const pasteInput = document.getElementById('paste-input');
    const content = pasteInput.value.trim();
    
    if (!content) {
        showStatus('Please paste some data', 'danger');
        return;
    }
    
    showStatus('Processing pasted data...', 'info');
    
    fetch('/process_paste', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentData = data.preview.rows;
            showPreview(data.preview);
            showStatus(`Data processed successfully! ${data.row_count} rows loaded.`, 'success');
        } else {
            showStatus(data.error, 'danger');
        }
    })
    .catch(error => {
        console.error('Process error:', error);
        showStatus('Error processing data', 'danger');
    });
}

// Show data preview
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
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Calculate distances
function calculateDistances() {
    if (!currentData) {
        showStatus('No data loaded', 'danger');
        return;
    }
    
    // Show progress modal
    const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
    progressModal.show();
    
    // Update progress
    updateProgress(0, 'Preparing data for calculation...');
    
    // Prepare data for calculation
    const calculationData = {
        data: currentData.map(row => {
            return {
                'Vehicle Number': row[0],
                'Institute': row[1],
                'Point 1 latitude': row[2],
                'Point 1 longitude': row[3],
                'Point 2 latitude': row[4],
                'Point 2 longitude': row[5]
            };
        })
    };
    
    updateProgress(25, 'Sending data to server...');
    
    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(calculationData)
    })
    .then(response => response.json())
    .then(data => {
        progressModal.hide();
        
        if (data.success) {
            currentResults = data.results;
            showResults(data);
            showStatus('Distance calculation completed successfully!', 'success');
        } else {
            showStatus(data.error, 'danger');
        }
    })
    .catch(error => {
        progressModal.hide();
        console.error('Calculation error:', error);
        showStatus('Error calculating distances', 'danger');
    });
}

// Update progress bar
function updateProgress(percentage, message) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    progressBar.style.width = percentage + '%';
    progressText.textContent = message;
}

// Show calculation results
function showResults(data) {
    const resultsSection = document.getElementById('results-section');
    const resultsTable = document.getElementById('results-table');
    const resultsSummary = document.getElementById('results-summary');
    
    // Clear existing content
    resultsTable.innerHTML = '';
    
    // Show summary
    const summary = data.summary;
    resultsSummary.innerHTML = `
        <div class="alert alert-info">
            <strong>Calculation Summary:</strong><br>
            Total routes: ${summary.total_routes}<br>
            Successful calculations: ${summary.successful_calculations}<br>
            Failed calculations: ${summary.failed_calculations}
        </div>
    `;
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Define column order
    const columns = [
        'Vehicle Number',
        'Institute',
        'Point 1 latitude',
        'Point 1 longitude',
        'Point 2 latitude',
        'Point 2 longitude',
        'Distance_km',
        'Duration_minutes',
        'Calculation_status'
    ];
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    resultsTable.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    data.results.forEach(row => {
        const tr = document.createElement('tr');
        
        columns.forEach(column => {
            const td = document.createElement('td');
            let value = row[column];
            
            // Format values
            if (column === 'Distance_km' && value !== null) {
                value = parseFloat(value).toFixed(2);
            } else if (column === 'Duration_minutes' && value !== null) {
                value = parseFloat(value).toFixed(1);
            } else if (column === 'Calculation_status') {
                if (value === 'success') {
                    td.classList.add('text-success');
                } else if (value === 'error') {
                    td.classList.add('text-danger');
                }
            }
            
            td.textContent = value || 'N/A';
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    resultsTable.appendChild(tbody);
    
    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Export results
function exportResults() {
    if (!currentResults) {
        showStatus('No results to export', 'danger');
        return;
    }
    
    // Create download link
    const dataStr = JSON.stringify(currentResults);
    const url = `/export/csv?data=${encodeURIComponent(dataStr)}`;
    
    // Create temporary link and click it
    const link = document.createElement('a');
    link.href = url;
    link.download = 'distance_results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('Results exported successfully!', 'success');
}

// Show status messages
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Auto-dismiss after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            const alert = statusDiv.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

// Scroll to upload section
function scrollToUpload() {
    const uploadSection = document.getElementById('description-sec');
    uploadSection.scrollIntoView({ behavior: 'smooth' });
}

// Utility functions
function formatNumber(num) {
    return num.toLocaleString();
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// function switchToUpload() {
//     document.getElementById("upload-section").style.display = "block";
//     document.getElementById("paste-section").style.display = "none";
// }

// function switchToPaste() {
//     document.getElementById("upload-section").style.display = "none";
//     document.getElementById("paste-section").style.display = "block";
// }

