// Global Application State Variables
let currentUserRole = null; 
let pendingAction = null;

// Page Initialization - Sign In Modal Muna ang Lalabas
window.addEventListener('DOMContentLoaded', () => {
    // Itago muna ang lahat ng role portals
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));
    
    // Ipakita ang Sign In / Sign Up Modal
    openAuthModal();
});

// Auth Modal Controls
function openAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

// Function kapag nag-submit ng Sign In / Sign Up form
function handleLogin(event) {
    event.preventDefault();
    const selectedRole = document.getElementById('loginRoleSelect').value;
    
    // Matapos mag-login, buksan ang portal batay sa napiling role
    selectUserRole(selectedRole);
    closeAuthModal();
}

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

    // Update Header Badge
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
