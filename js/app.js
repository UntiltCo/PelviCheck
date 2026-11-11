// Global Application State Variables
let currentUserRole = null; 
let pendingAction = null;

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    // Itago muna ang lahat ng portals sa simula
    document.querySelectorAll('.role-portal').forEach(portal => portal.classList.add('hidden'));
    
    // Ipakita ang Role Selection Gateway
    openRoleSelectModal();
});

// Role Gateway Modals
function openRoleSelectModal() {
    document.getElementById('roleSelectModal').classList.remove('hidden');
}

function closeRoleSelectModal() {
    document.getElementById('roleSelectModal').classList.add('hidden');
}

// Click Trigger kapag pinindot ang Patient, Doctor, o Admin card
function openAuthModalForRole(role) {
    document.getElementById('selectedRoleInput').value = role;
    
    const titleEl = document.getElementById('authModalTitle');
    if (titleEl) {
        titleEl.textContent = `Sign In as ${role.toUpperCase()}`;
    }

    // Itago ang Role Selector, Ipakita ang Auth Pop-up Modal
    closeRoleSelectModal();
    document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    openRoleSelectModal(); // Bumalik sa role picker kung mag-close
}

// Handle Form Login Submit
function handleLoginSubmit(event) {
    event.preventDefault();
    const role = document.getElementById('selectedRoleInput').value;
    
    // Isara ang Auth Modal at buksan ang dashboard
    document.getElementById('authModal').classList.add('hidden');
    selectUserRole(role);
}

// Switch View to Selected Dashboard
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
    if (roleBadge) {
        roleBadge.textContent = role === 'admin' ? 'ADMIN' : (role === 'doctor' ? 'CLINIC / DOCTOR' : 'PATIENT');
        roleBadge.className = `text-xs px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
            role === 'admin' ? 'bg-red-600 text-white' : 
            role === 'doctor' ? 'bg-brand-deep text-white' : 'bg-brand-mint text-brand-dark'
        }`;
    }
}
