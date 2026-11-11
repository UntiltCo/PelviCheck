// Firebase SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    sendEmailVerification, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBkJ-jTh-OBMPsquAf1t18PcRTYY_dWxc",
    authDomain: "pelvicheck-pro.firebaseapp.com",
    projectId: "pelvicheck-pro",
    storageBucket: "pelvicheck-pro.firebasestorage.app",
    messagingSenderId: "513013512051",
    appId: "1:513013512051:web:37ee0a5755dd8f44917706",
    measurementId: "G-WBF467RWGF"
};

let app, auth;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (e) {
    console.warn("Firebase Init fallback active.");
}

// System Configurations
const EXCLUSIVE_ADMIN_EMAIL = "23-06638@g.batstate-u.edu.ph";

// Store Registered Doctors Approval Status
let doctorAccounts = [
    { name: "Dr. Sarah Gomez", email: "dr.gomez@clinic.com", isApproved: true },
    { name: "Dr. Mark Santos", email: "dr.santos@hospital.com", isApproved: false }
];

// Dummy Patient Data (3 People) with Daily Calendar Progress Logs
const dummyPatients = [
    {
        id: "p1",
        name: "John Doe",
        age: 34,
        condition: "Anterior Pelvic Tilt",
        subscription: "Subscribed (Monthly)",
        lastAngle: "16.4°",
        logs: {
            "2026-11-01": { status: "scanned", angle: 17.2 },
            "2026-11-03": { status: "scanned", angle: 16.8 },
            "2026-11-05": { status: "scanned", angle: 16.4 },
            "2026-11-08": { status: "scanned", angle: 16.5 },
            "2026-11-10": { status: "scanned", angle: 16.4 }
        }
    },
    {
        id: "p2",
        name: "Maria Santos",
        age: 28,
        condition: "Normal Alignment",
        subscription: "Subscribed (Monthly)",
        lastAngle: "9.8°",
        logs: {
            "2026-11-02": { status: "scanned", angle: 10.1 },
            "2026-11-04": { status: "scanned", angle: 9.9 },
            "2026-11-07": { status: "scanned", angle: 9.8 }
        }
    },
    {
        id: "p3",
        name: "Juan Dela Cruz",
        age: 42,
        condition: "Posterior Pelvic Tilt",
        subscription: "Single Pass",
        lastAngle: "5.2°",
        logs: {
            "2026-11-06": { status: "scanned", angle: 5.2 }
        }
    }
];

// Application State
let currentUserRole = 'patient'; 
let pendingAction = null;
let isPatientSubscribed = false; 

// Web Bluetooth State
let bluetoothDevice = null;
let gattServer = null;
let postureCharacteristic = null;
const PELVI_SERVICE_UUID = '0000181a-0000-1000-8000-00805f9b34fb';
const ANGLE_CHARACTERISTIC_UUID = '00002a58-0000-1000-8000-00805f9b34fb';

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));
    openRoleSelectModal();
});

// Modal Gateway Functions
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

// AUTHENTICATION LOGIC WITH STRICT ADMIN & DOCTOR CHECKS
async function handleLoginSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();

    // 1. STRICT SINGLE ADMIN CHECK
    if (role === 'admin' && email !== EXCLUSIVE_ADMIN_EMAIL) {
        alert(`ACCESS DENIED!\n\nOnly the authorized system owner account (${EXCLUSIVE_ADMIN_EMAIL}) can sign in to the Admin Dashboard.`);
        return;
    }

    // 2. DOCTOR APPROVAL CHECK
    if (role === 'doctor') {
        const doc = doctorAccounts.find(d => d.email === email);
        if (doc && !doc.isApproved) {
            alert(`APPROVAL PENDING!\n\nYour Doctor account (${email}) has not been approved by the System Admin yet. Please wait for Admin authorization.`);
            return;
        } else if (!doc) {
            doctorAccounts.push({ name: "Dr. New User", email: email, isApproved: false });
            alert(`APPROVAL REQUIRED!\n\nYour account has been registered. Please request the System Admin to approve your account before signing in.`);
            return;
        }
    }

    alert(`Welcome back to PelviCheck Pro!`);
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.add('hidden');
    selectUserRole(role);
}

async function handleSignUpSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    const name = document.getElementById('signUpName').value;
    const email = document.getElementById('signUpEmail').value.trim().toLowerCase();

    if (role === 'admin' && email !== EXCLUSIVE_ADMIN_EMAIL) {
        alert(`REGISTRATION DENIED!\n\nAdmin registration is restricted. Only ${EXCLUSIVE_ADMIN_EMAIL} is recognized as Admin.`);
        return;
    }

    if (role === 'doctor') {
        doctorAccounts.push({ name: name, email: email, isApproved: false });
        alert(`REGISTRATION SUCCESSFUL!\n\nYour Doctor profile has been submitted. You cannot access the workspace until the System Admin approves your account.`);
        switchToSignIn();
        return;
    }

    alert(`REGISTRATION SUCCESSFUL!\n\nAccount created for ${email}. You may now Sign In.`);
    switchToSignIn();
}

// ADMIN DASHBOARD RENDERING & CALENDAR PROGRESS
function renderAdminDashboard() {
    // Populate Patient Dropdown
    const selector = document.getElementById('adminPatientSelector');
    if (selector) {
        selector.innerHTML = dummyPatients.map(p => `<option value="${p.id}">${p.name} (${p.condition})</option>`).join('');
    }
    renderAdminPatientCalendar();
    renderDoctorApprovals();
}

function renderAdminPatientCalendar() {
    const selector = document.getElementById('adminPatientSelector');
    const selectedId = selector ? selector.value : "p1";
    const patient = dummyPatients.find(p => p.id === selectedId) || dummyPatients[0];

    // Render Calendar Days for Nov 2026
    const grid = document.getElementById('patientCalendarGrid');
    if (grid) {
        let html = '';
        for (let i = 1; i <= 30; i++) {
            const dateStr = `2026-11-${i < 10 ? '0' + i : i}`;
            const log = patient.logs[dateStr];
            if (log) {
                html += `<div class="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-300" title="${log.angle}°">${i}<div class="text-[8px]">${log.angle}°</div></div>`;
            } else {
                html += `<div class="p-2 rounded-lg bg-gray-100 text-gray-400 border border-gray-200">${i}</div>`;
            }
        }
        grid.innerHTML = html;
    }

    // Render Summary Card
    const summary = document.getElementById('adminPatientSummary');
    if (summary) {
        summary.innerHTML = `
            <div class="font-bold text-brand-dark">${patient.name} (Age: ${patient.age})</div>
            <div class="text-brand-dark/70">Plan: <span class="font-semibold text-brand-deep">${patient.subscription}</span></div>
            <div class="text-brand-dark/70">Latest Angle: <span class="font-bold text-emerald-700">${patient.lastAngle}</span></div>
        `;
    }
}

function renderDoctorApprovals() {
    const container = document.getElementById('adminDoctorApprovalList');
    if (!container) return;

    container.innerHTML = doctorAccounts.map((doc, idx) => `
        <div class="p-3 bg-white rounded-xl border border-brand-mint/30 flex items-center justify-between">
            <div>
                <div class="font-bold text-xs text-brand-dark">${doc.name}</div>
                <div class="text-[11px] text-brand-dark/70">${doc.email}</div>
            </div>
            ${doc.isApproved ? 
                `<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">Approved</span>` : 
                `<button type="button" onclick="approveDoctor(${idx})" class="text-[10px] bg-brand-deep hover:bg-brand-dark text-white px-3 py-1 rounded-lg font-bold">Approve</button>`
            }
        </div>
    `).join('');
}

function approveDoctor(index) {
    doctorAccounts[index].isApproved = true;
    alert(`Doctor '${doctorAccounts[index].name}' has been approved! They can now sign in.`);
    renderDoctorApprovals();
}

function renderDoctorPortal() {
    const container = document.getElementById('doctorPatientList');
    if (!container) return;

    container.innerHTML = dummyPatients.map(p => `
        <div class="p-4 bg-brand-ice/40 rounded-2xl border border-brand-mint/40 space-y-2">
            <div class="font-bold text-brand-dark text-sm">${p.name}</div>
            <div class="text-xs text-brand-dark/70">Diagnosis: <strong>${p.condition}</strong></div>
            <div class="text-xs text-brand-dark/70">Latest Measurement: <strong>${p.lastAngle}</strong></div>
            <span class="inline-block text-[10px] bg-brand-mint/20 text-brand-deep font-bold px-2 py-0.5 rounded">Active Monitoring</span>
        </div>
    `).join('');
}

// ROLE SWITCHER
function selectUserRole(role) {
    currentUserRole = role;
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));

    const activePortal = document.getElementById(`portal-${role}`);
    if (activePortal) activePortal.classList.remove('hidden');

    const roleBadge = document.getElementById('userRoleBadge');
    const patientPayBtn = document.getElementById('patientPayBtn');

    if (roleBadge) {
        if (role === 'admin') {
            roleBadge.textContent = 'SYSTEM ADMIN';
            roleBadge.className = 'text-xs bg-red-600 text-white px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
            if (patientPayBtn) patientPayBtn.classList.add('hidden');
            renderAdminDashboard();
        } else if (role === 'doctor') {
            roleBadge.textContent = 'CLINIC / DOCTOR';
            roleBadge.className = 'text-xs bg-brand-deep text-white px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
            if (patientPayBtn) patientPayBtn.classList.add('hidden');
            renderDoctorPortal();
        } else {
            roleBadge.textContent = isPatientSubscribed ? 'PATIENT (SUBSCRIBED)' : 'PATIENT (NOT SUBSCRIBED)';
            roleBadge.className = 'text-xs bg-brand-mint text-brand-dark px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider';
            if (patientPayBtn) patientPayBtn.classList.remove('hidden');
        }
    }
}

// WEARABLE BLUETOOTH
async function connectPelviBelt() {
    const btBtn = document.getElementById('btConnectBtn');
    const btText = document.getElementById('btStatusText');
    const liveBeltBadge = document.getElementById('liveBeltBadge');

    if (!navigator.bluetooth) {
        alert("Web Bluetooth is not supported on this browser.");
        return;
    }

    try {
        if (btText) btText.textContent = "Searching...";
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'PelviCheck' }],
            optionalServices: [PELVI_SERVICE_UUID]
        });

        gattServer = await bluetoothDevice.gatt.connect();
        const service = await gattServer.getPrimaryService(PELVI_SERVICE_UUID);
        postureCharacteristic = await service.getCharacteristic(ANGLE_CHARACTERISTIC_UUID);

        await postureCharacteristic.startNotifications();
        postureCharacteristic.addEventListener('characteristicvaluechanged', handleLiveSensorData);

        if (btBtn) btBtn.className = "px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition";
        if (btText) btText.textContent = "Belt Connected";
        if (liveBeltBadge) {
            liveBeltBadge.textContent = "Belt Connected (Live Sensor)";
            liveBeltBadge.className = "text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300";
        }

        alert("PelviCheck Belt connected successfully!");

    } catch (error) {
        console.error(error);
        if (btText) btText.textContent = "Connect Belt";
    }
}

function handleLiveSensorData(event) {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const liveAngle = parseFloat(decoder.decode(value)).toFixed(1);

    const angleDisplay = document.getElementById('angleValue');
    if (angleDisplay) angleDisplay.textContent = liveAngle;
}

// SUBSCRIPTION CHECKOUT
function processSubscriptionCheckout() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) paymentModal.classList.remove('hidden');
}

function closePaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) paymentModal.classList.add('hidden');
}

function confirmPayment(gateway) {
    closePaymentModal();
    isPatientSubscribed = true;
    selectUserRole('patient');
    alert(`[PAYMENT SUCCESSFUL]\n\nThank you! Your payment via ${gateway} was received. You now have full access to Posture Scanning!`);
}

function triggerUploadPrompt() {
    if (currentUserRole === 'patient' && !isPatientSubscribed) {
        alert("SUBSCRIPTION REQUIRED!\n\nPlease subscribe to perform a posture scan.");
        processSubscriptionCheckout();
        return;
    }
    const input = document.getElementById('imageInput');
    if (input) input.click();
}

function triggerCameraPrompt() {
    if (currentUserRole === 'patient' && !isPatientSubscribed) {
        alert("SUBSCRIPTION REQUIRED!\n\nPlease subscribe to perform a posture scan.");
        processSubscriptionCheckout();
        return;
    }
    if (typeof openCameraModal === 'function') openCameraModal();
}
function triggerDemoPrompt() {
    if (typeof loadSampleImage === 'function') {
        loadSampleImage();
    } else {
        alert("Loading demo image...");
    }
}

function resetLandmarks() {
    if (typeof resetPoints === 'function') {
        resetPoints();
    }
}

window.triggerDemoPrompt = triggerDemoPrompt;
window.resetLandmarks = resetLandmarks;
// EXPOSE TO GLOBAL WINDOW SCOPE
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
window.confirmPayment = confirmPayment;
window.triggerUploadPrompt = triggerUploadPrompt;
window.triggerCameraPrompt = triggerCameraPrompt;
window.connectPelviBelt = connectPelviBelt;
window.renderAdminPatientCalendar = renderAdminPatientCalendar;
window.approveDoctor = approveDoctor;
let mediaStream = null;

// File Upload Handler Connection
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (typeof loadImageToCanvas === 'function') {
                loadImageToCanvas(e.target.result);
            }
        };
        reader.readAsDataURL(file);
    }
}

// Camera Modal Opening & WebCam Stream Trigger
async function openCameraModal() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('webcamVideo');
    if (!modal || !video) return;

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" }, 
            audio: false 
        });
        video.srcObject = mediaStream;
        modal.classList.remove('hidden');
    } catch (err) {
        alert("Camera Access Error: " + err.message + "\nPlease grant camera permission in your browser settings.");
    }
}

function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('webcamVideo');
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (video) video.srcObject = null;
    if (modal) modal.classList.add('hidden');
}

function capturePhotoFromWebcam() {
    const video = document.getElementById('webcamVideo');
    const captureCanvas = document.getElementById('captureCanvas');
    if (!video || !captureCanvas) return;

    captureCanvas.width = video.videoWidth || 640;
    captureCanvas.height = video.videoHeight || 480;

    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    const dataUrl = captureCanvas.toDataURL('image/png');
    
    if (typeof loadImageToCanvas === 'function') {
        loadImageToCanvas(dataUrl);
    }
    closeCameraModal();
}

// EXPOSE FUNCTIONS TO WINDOW SCOPE
window.handleImageUpload = handleImageUpload;
window.openCameraModal = openCameraModal;
window.closeCameraModal = closeCameraModal;
window.capturePhotoFromWebcam = capturePhotoFromWebcam;
