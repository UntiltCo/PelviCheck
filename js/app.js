// Firebase Imports (Script must be loaded as type="module" in index.html)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

// Firebase Configuration (Replace with your actual Firebase project keys)
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "pelvicheck-pro.firebaseapp.com",
    projectId: "pelvicheck-pro"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Global State Variables
let currentUserRole = null; 
let pendingAction = null;

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

// Modal Navigation Handlers
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
            alert(`ACCESS DENIED!\n\nYour email (${email}) is not verified yet.\n\nPlease check your Gmail inbox and click the verification link before logging in.`);
            return;
        }

        alert(`Welcome back!`);
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.classList.add('hidden');
        selectUserRole(role);
    } catch (error) {
        alert("Sign In Error: " + error.message);
    }
}

// FIREBASE AUTH: SIGN UP (Sends real verification link to Gmail inbox)
async function handleSignUpSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    const email = event.target.querySelector('input[type="email"]').value.trim().toLowerCase();
    const password = event.target.querySelector('input[type="password"]').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send official verification email to user's Gmail
        await sendEmailVerification(user);

        alert(`REGISTRATION SUCCESSFUL!\n\nA verification link was sent to ${email}.\n\nPlease check your Gmail Inbox (or Spam folder) and click the link to activate your account.`);
        
        switchToSignIn();
    } catch (error) {
        alert("Sign Up Error: " + error.message);
    }
}

// Role Dashboard Selector
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
            roleBadge.textContent = 'PATIENT (SUBSCRIBED)';
            roleBadge.className = 'text-xs bg-brand-mint text-brand-dark px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
            if (patientPayBtn) patientPayBtn.classList.remove('hidden');
        }
    }
}

// Seamless Web Bluetooth Integration
async function connectPelviBelt() {
    const btBtn = document.getElementById('btConnectBtn');
    const btText = document.getElementById('btStatusText');

    if (!navigator.bluetooth) {
        alert("Web Bluetooth is not supported in this browser. Please use Chrome or Edge.");
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

        alert("PelviCheck Belt connected successfully!");

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

    alert("PelviCheck Belt disconnected.");
}

// Expose functions to global window object for HTML inline onclick/onsubmit attributes
window.openRoleSelectModal = openRoleSelectModal;
window.closeRoleSelectModal = closeRoleSelectModal;
window.openAuthModalForRole = openAuthModalForRole;
window.closeAuthModal = closeAuthModal;
window.switchToSignUp = switchToSignUp;
window.switchToSignIn = switchToSignIn;
window.handleLoginSubmit = handleLoginSubmit;
window.handleSignUpSubmit = handleSignUpSubmit;
window.connectPelviBelt = connectPelviBelt;
