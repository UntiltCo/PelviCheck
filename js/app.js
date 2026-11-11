// Application State Variables
let pendingAction = null;

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    // Initial setup routines if needed
});

// Modal Controls - Medical Disclaimer
function acceptDisclaimer() {
    document.getElementById('disclaimerModal').classList.add('hidden');
}

function showDisclaimerModal() {
    document.getElementById('disclaimerModal').classList.remove('hidden');
}

// Setup Guidelines Modal Controls
function triggerUploadPrompt() {
    pendingAction = 'upload';
    document.getElementById('setupGuidelinesModal').classList.remove('hidden');
}

function triggerCameraPrompt() {
    pendingAction = 'camera';
    document.getElementById('setupGuidelinesModal').classList.remove('hidden');
}

function closeSetupGuidelines() {
    document.getElementById('setupGuidelinesModal').classList.add('hidden');
    pendingAction = null;
}

function proceedToSource() {
    document.getElementById('setupGuidelinesModal').classList.add('hidden');
    if (pendingAction === 'upload') {
        document.getElementById('imageInput').click();
    } else if (pendingAction === 'camera') {
        openCameraModal();
    }
    pendingAction = null;
}

// Demo Guide Modal Controls
function triggerDemoPrompt() {
    document.getElementById('demoGuideModal').classList.remove('hidden');
}

function closeDemoGuide() {
    document.getElementById('demoGuideModal').classList.add('hidden');
}

function confirmLoadDemo() {
    closeDemoGuide();
    loadSampleImage();
}

// Tab Switching Navigation
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = "nav-btn px-4 py-2 rounded-xl font-semibold text-sm text-brand-dark hover:text-brand-deep hover:bg-brand-ice transition-all";
    });

    const activeBtn = document.getElementById(`nav-${tabName}`);
    if (activeBtn) {
        activeBtn.className = "nav-btn px-4 py-2 rounded-xl font-bold text-sm text-white bg-brand-deep shadow-md";
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}
