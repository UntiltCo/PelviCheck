// Partner Dashboard & Progress Analytics State
let progressChartInstance = null;

// Open Progress Modal and Render Chart.js Analytics
function viewPatientProgress(patientName, historicalAngles) {
    const modalTitle = document.getElementById('modalPatientName');
    if (modalTitle) {
        modalTitle.textContent = `${patientName} - Clinical Progress History`;
    }

    const progressModal = document.getElementById('progressModal');
    if (progressModal) {
        progressModal.classList.remove('hidden');
    }

    const canvasEl = document.getElementById('progressChart');
    if (!canvasEl) return;

    const ctx = canvasEl.getContext('2d');
    
    // Destroy previous chart instance before re-rendering
    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Session 1 (Baseline)', 'Session 2 (Week 2)', 'Session 3 (Week 4)', 'Session 4 (Current)'],
            datasets: [{
                label: 'Pelvic Tilt Angle (°)',
                data: historicalAngles,
                borderColor: '#174C5A',
                backgroundColor: 'rgba(114, 183, 176, 0.2)',
                fill: true,
                tension: 0.3,
                pointRadius: 6,
                pointBackgroundColor: '#72B7B0'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Angle (Degrees)' },
                    suggestedMin: 5,
                    suggestedMax: 22
                }
            }
        }
    });
}

// Close Progress Modal
function closeProgressModal() {
    const progressModal = document.getElementById('progressModal');
    if (progressModal) {
        progressModal.classList.add('hidden');
    }
}

// New Patient Registration Modal Controls
function openNewPatientModal() {
    alert("New Patient modal trigger. Connect this function to your backend API / Firebase Firestore registration endpoint.");
}

// Credit Token Purchase Trigger
function openCreditPurchaseModal() {
    alert("You are out of screening credits. Redirecting to PayMongo / Xendit checkout gateway...");
}