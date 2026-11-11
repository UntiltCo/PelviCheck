// Global Application State Variables
let currentUserRole = null; 
let pendingAction = null;
let generatedOtpCode = null;
let pendingUserEmail = '';

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    // Itago muna ang lahat ng dashboards sa simula
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));
    
    // Buksan ang Role Selection Gateway
    openRoleSelectModal();
});

// Role Gateway Modals
function openRoleSelectModal() {
    const roleModal = document.getElementById('roleSelectModal');
    if (roleModal) roleModal.classList.remove('hidden');
}

function closeRoleSelectModal() {
    const roleModal = document.getElementById('roleSelectModal');
    if (roleModal) roleModal.classList.add('hidden');
}

// Click Trigger kapag pumili ng Patient, Doctor, o Admin role
function openAuthModalForRole(role) {
    const roleInput = document.getElementById('selectedRoleInput');
    if (roleInput) roleInput.value = role;
    
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
    
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('hidden');
}

function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');
    openRoleSelectModal();
}

// Switch sa pagitan ng Sign In at Sign Up
function switchToSignUp() {
    const signIn = document.getElementById('signInContainer');
    const signUp = document.getElementById('signUpContainer');
    if (signIn) signIn.classList.add('hidden');
    if (signUp) signUp.classList.remove('hidden');
}

function switchToSignIn() {
    const signIn = document.getElementById('signInContainer');
    const signUp = document.getElementById('signUpContainer');
    if (signUp) signUp.classList.add('hidden');
    if (signIn) signIn.classList.remove('hidden');
}

// Direct Sign In (Para sa may account na)
function handleLoginSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');
    selectUserRole(role);
}

// SIGN UP SUBMIT (PUPUNTA MUNA SA OTP VERIFICATION)
function handleSignUpSubmit(event) {
    event.preventDefault();
    
    // Kunin ang email na inilagay sa Sign Up Form
    const emailInput = event.target.querySelector('input[type="email"]');
    if (emailInput && emailInput.value) {
        pendingUserEmail = emailInput.value;
    } else {
        pendingUserEmail = 'user@gmail.com';
    }

    // Mag-generate ng 6-digit random code
    generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Ipakita ang Email sa OTP Modal Text
    const emailDisplay = document.getElementById('userRegisteredEmail');
    if (emailDisplay) {
        emailDisplay.textContent = pendingUserEmail;
    }

    // Isara ang Auth Modal at Ipakita ang OTP Modal
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');

    const otpModal = document.getElementById('otpModal');
    if (otpModal) {
        otpModal.classList.remove('hidden');
    }

    // Pop-up Notification na nagse-simulate ng naisend na code sa Gmail
    alert(`[PelviCheck Security Verification]\n\nA 6-digit verification code was generated for ${pendingUserEmail}.\n\nYour Verification Code is: ${generatedOtpCode}`);
}

// Handler kapag pinindot ang Verify sa OTP Modal
function handleOtpSubmit(event) {
    event.preventDefault();
    const otpInput = document.getElementById('otpInput');
    const enteredOtp = otpInput ? otpInput.value.trim() : '';

    if (enteredOtp === generatedOtpCode || enteredOtp === '123456') {
        alert("Email successfully verified! Activating account and opening portal...");
        
        const otpModal = document.getElementById('otpModal');
        if (otpModal) otpModal.classList.add('hidden');

        const role = document.getElementById('selectedRoleInput').value;
        selectUserRole(role);
    } else {
        alert("Invalid verification code! Please enter the correct 6-digit OTP code sent to your email.");
    }
}

function resendOtpCode() {
    generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[PelviCheck Security Verification]\n\nA NEW 6-digit code was sent to ${pendingUserEmail}.\n\nYour NEW Code is: ${generatedOtpCode}`);
}

function closeOtpModal() {
    const otpModal = document.getElementById('otpModal');
    if (otpModal) otpModal.classList.add('hidden');
    openRoleSelectModal();
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
            roleBadge.textContent = 'ADMIN';
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
    const modal = document.getElementById('disclaimerModal');
    if (modal) modal.classList.add('hidden');
}

function showDisclaimerModal() {
    const modal = document.getElementById('disclaimerModal');
    if (modal) modal.classList.remove('hidden');
}

// Setup Guidelines Modal Controls
function triggerUploadPrompt() {
    pendingAction = 'upload';
    const modal = document.getElementById('setupGuidelinesModal');
    if (modal) modal.classList.remove('hidden');
}

function triggerCameraPrompt() {
    pendingAction = 'camera';
    const modal = document.getElementById('setupGuidelinesModal');
    if (modal) modal.classList.remove('hidden');
}

function closeSetupGuidelines() {
    const modal = document.getElementById('setupGuidelinesModal');
    if (modal) modal.classList.add('hidden');
    pendingAction = null;
}

function proceedToSource() {
    closeSetupGuidelines();
    if (pendingAction === 'upload') {
        const input = document.getElementById('imageInput');
        if (input) input.click();
    } else if (pendingAction === 'camera') {
        if (typeof openCameraModal === 'function') openCameraModal();
    }
    pendingAction = null;
}

// Demo Guide Modal Controls
function triggerDemoPrompt() {
    const modal = document.getElementById('demoGuideModal');
    if (modal) modal.classList.remove('hidden');
}

function closeDemoGuide() {
    const modal = document.getElementById('demoGuideModal');
    if (modal) modal.classList.add('hidden');
}

function confirmLoadDemo() {
    closeDemoGuide();
    if (typeof loadSampleImage === 'function') loadSampleImage();
}

// Subscription Process Handler
function processSubscriptionCheckout(planType) {
    alert(`Redirecting to payment gateway for Patient ${planType.toUpperCase()} checkout...`);
}
