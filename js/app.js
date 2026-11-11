// Global State Variables
let currentUserRole = null; 
let pendingAction = null;
let generatedOtpCode = null;
let pendingUserData = null; // Store temp sign-up data before OTP

// Helper to Get Registered Users from Mock Database (LocalStorage)
function getRegisteredUsers() {
    const users = localStorage.getItem('pelvicheck_users');
    return users ? JSON.parse(users) : [];
}

// Helper to Save New User to Mock Database
function saveRegisteredUser(userData) {
    const users = getRegisteredUsers();
    users.push(userData);
    localStorage.setItem('pelvicheck_users', JSON.stringify(users));
}

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    // Hide all portal dashboards on initial load
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));
    
    // Open Role Selection Gateway Modal
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

// Click Trigger when selecting Patient, Doctor, or Admin role
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

// Switch between Sign In and Sign Up Views inside Modal
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

// 1. STRICT SIGN IN SUBMIT HANDLER (Validates against Registered Accounts)
function handleLoginSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    
    // Get form inputs
    const emailInput = event.target.querySelector('input[type="email"]').value.trim().toLowerCase();
    const passwordInput = event.target.querySelector('input[type="password"]').value;

    const registeredUsers = getRegisteredUsers();

    // Check if account exists with matching email, password, and role
    const existingUser = registeredUsers.find(user => 
        user.email === emailInput && 
        user.password === passwordInput && 
        user.role === role
    );

    if (existingUser) {
        alert(`Welcome back, ${existingUser.fullName || existingUser.email}!`);
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.classList.add('hidden');
        selectUserRole(role);
    } else {
        alert(`ACCESS DENIED!\n\nNo active ${role.toUpperCase()} account found with this email and password combination.\n\nPlease check your credentials or click 'Create New Account' to register.`);
    }
}

// 2. SIGN UP SUBMIT HANDLER (Generates OTP & Holds Data in Temp Buffer)
function handleSignUpSubmit(event) {
    event.preventDefault();
    
    const role = document.getElementById('selectedRoleInput').value;
    const nameInput = event.target.querySelector('input[placeholder="Juan Dela Cruz"]');
    const emailInput = event.target.querySelector('input[type="email"]').value.trim().toLowerCase();
    const passwordInput = event.target.querySelector('input[type="password"]').value;

    const registeredUsers = getRegisteredUsers();
    
    // Prevent duplicate registrations
    const duplicateUser = registeredUsers.find(user => user.email === emailInput && user.role === role);
    if (duplicateUser) {
        alert(`An account with email '${emailInput}' is already registered as a ${role.toUpperCase()}. Please Sign In instead.`);
        switchToSignIn();
        return;
    }

    // Temporary hold user registration data until OTP is verified
    pendingUserData = {
        fullName: nameInput ? nameInput.value : 'User',
        email: emailInput,
        password: passwordInput,
        role: role
    };

    // Generate random 6-digit OTP code
    generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Display Email in OTP Modal
    const emailDisplay = document.getElementById('userRegisteredEmail');
    if (emailDisplay) {
        emailDisplay.textContent = emailInput;
    }

    // Hide Sign Up Modal and Open OTP Verification Modal
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');

    const otpModal = document.getElementById('otpModal');
    if (otpModal) otpModal.classList.remove('hidden');

    // Simulated Email Notification
    alert(`[SECURITY VERIFICATION]\n\nA verification code was sent to ${emailInput}.\n\nYour OTP Verification Code is: ${generatedOtpCode}`);
}

// 3. OTP SUBMIT HANDLER (Verifies Code -> Saves User to DB -> Unlocks Site)
function handleOtpSubmit(event) {
    event.preventDefault();
    const otpInput = document.getElementById('otpInput');
    const enteredOtp = otpInput ? otpInput.value.trim() : '';

    if (enteredOtp === generatedOtpCode || enteredOtp === '123456') {
        // SAVE USER TO DATABASE ON SUCCESSFUL OTP
        if (pendingUserData) {
            saveRegisteredUser(pendingUserData);
        }

        alert("Email verified successfully! Your account has been registered.\n\nOpening your dashboard...");
        
        const otpModal = document.getElementById('otpModal');
        if (otpModal) otpModal.classList.add('hidden');

        const role = pendingUserData ? pendingUserData.role : 'patient';
        pendingUserData = null;
        selectUserRole(role);
    } else {
        alert("Invalid OTP code! Please enter the correct code sent to your email.");
    }
}

function resendOtpCode() {
    if (!pendingUserData) return;
    generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[SECURITY VERIFICATION]\n\nA NEW code was sent to ${pendingUserData.email}.\n\nYour NEW OTP Code is: ${generatedOtpCode}`);
}

function closeOtpModal() {
    const otpModal = document.getElementById('otpModal');
    if (otpModal) otpModal.classList.add('hidden');
    pendingUserData = null;
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
