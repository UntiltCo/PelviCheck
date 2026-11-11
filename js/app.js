// Global Application State Variables
let currentUserRole = null; 
let pendingAction = null;

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    // Hide all portal dashboards on initial load
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));
    
    // Open Role Selection Gateway Modal first
    openRoleSelectModal();
});

// Role Gateway Modals
function openRoleSelectModal() {
    document.getElementById('roleSelectModal').classList.remove('hidden');
}

function closeRoleSelectModal() {
    document.getElementById('roleSelectModal').classList.add('hidden');
}

// Click Trigger when selecting Patient, Doctor, or Admin role
function openAuthModalForRole(role) {
    document.getElementById('selectedRoleInput').value = role;
    
    const titleEl = document.getElementById('authModalTitle');
    const signUpTitleEl = document.getElementById('signUpModalTitle');

    if (titleEl) {
        titleEl.textContent = `Sign In as ${role.toUpperCase()}`;
    }
    if (signUpTitleEl) {
        signUpTitleEl.textContent = `Sign Up as ${role.toUpperCase()}`;
    }

    switchToSignIn();
    closeRoleSelectModal();
    document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    openRoleSelectModal(); // Return to role selection if modal is closed
}

// Switch between Sign In and Sign Up Views inside Modal
function switchToSignUp() {
    document.getElementById('signInContainer').classList.add('hidden');
    document.getElementById('signUpContainer').classList.remove('hidden');
}

function switchToSignIn() {
    document.getElementById('signUpContainer').classList.add('hidden');
    document.getElementById('signInContainer').classList.remove('hidden');
}

// Handle Form Submission for Sign In
function handleLoginSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    document.getElementById('authModal').classList.add('hidden');
    selectUserRole(role);
}

// Handle Form Submission for Sign Up
function handleSignUpSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    document.getElementById('authModal').classList.add('hidden');
    selectUserRole(role);
}

// Display Selected Portal Dashboard
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
}

// Medical Disclaimer Controls
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

// Subscription Process Handler
function processSubscriptionCheckout(planType) {
    alert(`Redirecting to payment gateway for Patient ${planType.toUpperCase()} checkout...`);
}
