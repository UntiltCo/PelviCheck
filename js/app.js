// Firebase SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

// Firebase Config Credentials
const firebaseConfig = {
    apiKey: "AIzaSyBkJ-jTh-OBMPsquAf1t18PcRTYY_dWxc",
    authDomain: "pelvicheck-pro.firebaseapp.com",
    projectId: "pelvicheck-pro",
    storageBucket: "pelvicheck-pro.firebasestorage.app",
    messagingSenderId: "513013512051",
    appId: "1:513013512051:web:37ee0a5755dd8f44917706",
    measurementId: "G-WBF467RWGF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Application State
let currentUserRole = 'patient'; 
let pendingAction = null;
let isPatientSubscribed = false; // Subscription State Lock
let selectedSubscriptionPlan = 'monthly';

// Web Bluetooth State Variables
let bluetoothDevice = null;
let gattServer = null;
let postureCharacteristic = null;

const PELVI_SERVICE_UUID = '0000181a-0000-1000-8000-00805f9b34fb';
const ANGLE_CHARACTERISTIC_UUID = '00002a58-0000-1000-8000-00805f9b34fb';

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));
    openRoleSelectModal();
});

// Modal Gateway Handlers
function openRoleSelectModal() {
    const roleModal = document.getElementById('roleSelectModal');
    if (roleModal) roleModal.classList.remove('hidden');
}

function closeRoleSelectModal() {
    const roleModal = document.getElementById('roleSelectModal');
    if (roleModal) roleModal.classList.add('hidden');
}

function openAuthModalForRole(role) {
    const roleInput = document.getElementById('selectedRoleInput');
    if (roleInput) roleInput.value = role;
    
    const titleEl = document.getElementById('authModalTitle');
    const signUpTitleEl = document.getElementById('signUpModalTitle');

    if (titleEl) titleEl.textContent = `Sign In as ${role.toUpperCase()}`;
    if (signUpTitleEl) signUpTitleEl.textContent = `Sign Up as ${role.toUpperCase()}`;

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

// FIREBASE AUTH: SIGN IN
async function handleLoginSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    const email = event.target.querySelector('input[type="email"]').value.trim().toLowerCase();
    const password = event.target.querySelector('input[type="password"]').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            alert(`ACCESS DENIED!\n\nThe account for '${email}' is not yet verified.\n\nPlease check your Gmail Inbox or Spam folder and click the verification link before signing in.`);
            return;
        }

        alert(`Welcome back to PelviCheck Pro!`);
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.classList.add('hidden');
        selectUserRole(role);
    } catch (error) {
        alert("Sign In Error: " + error.message);
    }
}

// FIREBASE AUTH: SIGN UP (Direct to Gmail Inbox, No browser pop-up)
async function handleSignUpSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    const email = event.target.querySelector('input[type="email"]').value.trim().toLowerCase();
    const password = event.target.querySelector('input[type="password"]').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send activation link directly to Gmail Inbox
        await sendEmailVerification(user);

        alert(`REGISTRATION SUCCESSFUL!\n\nAn activation link has been sent to your email (${email}).\n\nPlease check your Gmail Inbox or Spam folder and click the link to verify your account.`);
        
        switchToSignIn();
    } catch (error) {
        alert("Sign Up Error: " + error.message);
    }
}

// SUBSCRIPTION CHECKOUT & LOCK SYSTEM
function processSubscriptionCheckout(planType) {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) paymentModal.classList.remove('hidden');
}

function closePaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) paymentModal.classList.add('hidden');
}

function selectPlan(plan) {
    selectedSubscriptionPlan = plan;
    const scanBox = document.getElementById('plan-scan');
    const monthlyBox = document.getElementById('plan-monthly');

    if (plan === 'pay_per_scan') {
        scanBox.className = "p-4 rounded-2xl border-2 border-brand-deep bg-brand-ice cursor-pointer hover:border-brand-deep transition space-y-1";
        monthlyBox.className = "p-4 rounded-2xl border-2 border-brand-mint/40 bg-brand-ice/40 cursor-pointer hover:border-brand-deep transition space-y-1 relative";
    } else {
        monthlyBox.className = "p-4 rounded-2xl border-2 border-brand-deep bg-brand-ice cursor-pointer hover:border-brand-deep transition space-y-1 relative";
        scanBox.className = "p-4 rounded-2xl border-2 border-brand-mint/40 bg-brand-ice/40 cursor-pointer hover:border-brand-deep transition space-y-1";
    }
}

function confirmPayment(gateway) {
    closePaymentModal();
    isPatientSubscribed = true;
    
    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge && currentUserRole === 'patient') {
        roleBadge.textContent = 'PATIENT (SUBSCRIBED)';
        roleBadge.className = 'text-xs bg-brand-mint text-brand-dark px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
    }

    alert(`[PAYMENT SUCCESSFUL]\n\nThank you! Your payment via ${gateway} has been successfully processed.\n\nYou now have full access to Posture Scanning and Bluetooth Tracking!`);
}

// Subscription Guard Protection for Scanning Actions
function checkSubscriptionAndProceed(actionCallback) {
    if (currentUserRole === 'patient' && !isPatientSubscribed) {
        alert("SUBSCRIPTION REQUIRED!\n\nYou must have an active subscription or single-scan pass to perform a posture scan.");
        processSubscriptionCheckout('patient');
        return;
    }
    actionCallback();
}

function triggerUploadPrompt() {
    checkSubscriptionAndProceed(() => {
        pendingAction = 'upload';
        const modal = document.getElementById('setupGuidelinesModal');
        if (modal) modal.classList.remove('hidden');
    });
}

function triggerCameraPrompt() {
    checkSubscriptionAndProceed(() => {
        pendingAction = 'camera';
        const modal = document.getElementById('setupGuidelinesModal');
        if (modal) modal.classList.remove('hidden');
    });
}

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

// WEARABLE WEB BLUETOOTH API CONNECT
async function connectPelviBelt() {
    if (currentUserRole === 'patient' && !isPatientSubscribed) {
        alert("SUBSCRIPTION REQUIRED!\n\nPlease subscribe to pair your ESP32 PelviCheck Belt.");
        processSubscriptionCheckout('patient');
        return;
    }

    const btBtn = document.getElementById('btConnectBtn');
    const btText = document.getElementById('btStatusText');

    if (!navigator.bluetooth) {
        alert("Web Bluetooth is not supported on this browser. Please use Google Chrome or Edge.");
        return;
    }

    try {
        if (btText) btText.textContent = "Searching...";
        
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'PelviCheck' }],
            optionalServices: [PELVI_SERVICE_UUID]
        });

        bluetoothDevice.addEventListener('gattserverdisconnected', onDeviceDisconnected);

        gattServer = await bluetoothDevice.gatt.connect();
        const service = await gattServer.getPrimaryService(PELVI_SERVICE_UUID);
        postureCharacteristic = await service.getCharacteristic(ANGLE_CHARACTERISTIC_UUID);

        await postureCharacteristic.startNotifications();
        postureCharacteristic.addEventListener('characteristicvaluechanged', handleLiveSensorData);

        if (btBtn) btBtn.className = "px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition";
        if (btText) btText.textContent = "Belt Connected";

        alert("PelviCheck Belt connected successfully! Live sensor stream active.");

    } catch (error) {
        console.error("Bluetooth Connection Failed:", error);
        if (btText) btText.textContent = "Connect Belt";
        if (btBtn) btBtn.className = "px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-2 transition";
    }
}

function handleLiveSensorData(event) {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const liveAngle = parseFloat(decoder.decode(value)).toFixed(1);

    const angleDisplay = document.getElementById('angleValue');
    if (angleDisplay) angleDisplay.textContent = liveAngle;

    const statusBadge = document.getElementById('statusBadge');
    if (statusBadge && liveAngle) {
        if (liveAngle >= 7 && liveAngle <= 13) {
            statusBadge.textContent = "Normal Standing Alignment";
            statusBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300";
        } else if (liveAngle > 13) {
            statusBadge.textContent = "Anterior Pelvic Tilt";
            statusBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300";
        } else {
            statusBadge.textContent = "Posterior Pelvic Tilt";
            statusBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300";
        }
    }
}

function onDeviceDisconnected() {
    const btBtn = document.getElementById('btConnectBtn');
    const btText = document.getElementById('btStatusText');

    if (btBtn) btBtn.className = "px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-2 transition";
    if (btText) btText.textContent = "Connect Belt";

    alert("PelviCheck Belt disconnected. Please reconnect your device.");
}

// Role Dashboard Switcher
function selectUserRole(role) {
    currentUserRole = role;
    
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));

    const activePortal = document.getElementById(`portal-${role}`);
    if (activePortal) activePortal.classList.remove('hidden');

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
            roleBadge.textContent = isPatientSubscribed ? 'PATIENT (SUBSCRIBED)' : 'PATIENT (NOT SUBSCRIBED)';
            roleBadge.className = 'text-xs bg-brand-mint text-brand-dark px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
            if (patientPayBtn) patientPayBtn.classList.remove('hidden');
        }
    }
}

function acceptDisclaimer() {
    const modal = document.getElementById('disclaimerModal');
    if (modal) modal.classList.add('hidden');
}

function showDisclaimerModal() {
    const modal = document.getElementById('disclaimerModal');
    if (modal) modal.classList.remove('hidden');
}

// EXPOSE TO GLOBAL SCOPE FOR HTML INLINE EVENTS
window.openRoleSelectModal = openRoleSelectModal;
window.closeRoleSelectModal = closeRoleSelectModal;
window.openAuthModalForRole = openAuthModalForRole;
window.closeAuthModal = closeAuthModal;
window.switchToSignUp = switchToSignUp;
window.switchToSignIn = switchToSignIn;
window.handleLoginSubmit = handleLoginSubmit;
window.handleSignUpSubmit = handleSignUpSubmit;
window.processSubscriptionCheckout = processSubscriptionCheckout;
window.closePaymentModal = closePaymentModal;
window.selectPlan = selectPlan;
window.confirmPayment = confirmPayment;
window.triggerUploadPrompt = triggerUploadPrompt;
window.triggerCameraPrompt = triggerCameraPrompt;
window.triggerDemoPrompt = triggerDemoPrompt;
window.closeDemoGuide = closeDemoGuide;
window.confirmLoadDemo = confirmLoadDemo;
window.closeSetupGuidelines = closeSetupGuidelines;
window.proceedToSource = proceedToSource;
window.connectPelviBelt = connectPelviBelt;
window.acceptDisclaimer = acceptDisclaimer;
window.showDisclaimerModal = showDisclaimerModal;
