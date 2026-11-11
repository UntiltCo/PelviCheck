// Global Application State Variables
let currentUserRole = 'doctor'; // Default initial view: Doctor/Clinic Admin
let pendingAction = null;

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    selectUserRole('doctor');
});

// Dynamic User Role Selector Gateway
function selectUserRole(role) {
    currentUserRole = role;
    
    // Hide all portal containers
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));

    // Show active portal container
    const activePortal = document.getElementById(`portal-${role}`);
    if (activePortal) {
        activePortal.classList.remove('hidden');
    }

    // Update Header Badge and Subscription Button Visibility
    const roleBadge = document.getElementById('userRoleBadge');
    const patientPayBtn = document.getElementById('patientPayBtn');

    if (roleBadge) {
        if (role === 'admin') {
            roleBadge.textContent = 'SUPER ADMIN';
            roleBadge.className = 'text-xs bg-red-600 text-white px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
            if (patientPayBtn) patientPayBtn.classList.add('hidden');
        } else if (role === 'doctor') {
            roleBadge.textContent = 'CLINIC / DOCTOR (FREE ADMIN)';
            roleBadge.className = 'text-xs bg-brand-deep text-white px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
            if (patientPayBtn) patientPayBtn.classList.add('hidden');
        } else {
            roleBadge.textContent = 'PATIENT (SUBSCRIBED)';
            roleBadge.className = 'text-xs bg-brand-mint text-brand-dark px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
            if (patientPayBtn) patientPayBtn.classList.remove('hidden');
        }
    }

    closeRoleSelectModal();
}

// Role Selection Modal Triggers
function openRoleSelectModal() {
    document.getElementById('roleSelectModal').classList.remove('hidden');
}

function closeRoleSelectModal() {
    document.getElementById('roleSelectModal').classList.add('hidden');
}

// Patient Subscription Checkout Trigger
function processSubscriptionCheckout(planType) {
    alert(`Redirecting to PayMongo/GCash for Patient ${planType.toUpperCase()} subscription checkout...`);
}

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
