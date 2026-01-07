// Utility to get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
    }
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, name, phone, address })
        });
        const data = await res.json();

        if (data.success) {
            alert('Registration successful! Please login.');
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
    }
}

// Dashboard Init
async function initDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userNameDisplay').textContent = user.name;
    document.getElementById('userRoleDisplay').textContent = user.role.toUpperCase();

    // Show appropriate section based on role
    if (user.role === 'admin') {
        document.getElementById('adminSection').style.display = 'block';
        loadAllUsers();
    } else {
        document.getElementById('memberSection').style.display = 'block';
        loadUserProfile(user.id);
    }
}

// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// MEMBER FUNCTIONS ---------------------------

async function loadUserProfile(id) {
    const res = await fetch(`/api/users/${id}`);
    if (res.ok) {
        const user = await res.json();
        // prefill form
        document.getElementById('editName').value = user.name;
        document.getElementById('editPhone').value = user.phone;
        document.getElementById('editAddress').value = user.address;
        document.getElementById('editPassword').value = user.password;
    }
}

async function updateProfile(e) {
    e.preventDefault();
    const user = getCurrentUser();

    const updatedData = {
        username: user.username, // Keep existing username
        name: document.getElementById('editName').value,
        phone: document.getElementById('editPhone').value,
        address: document.getElementById('editAddress').value,
        password: document.getElementById('editPassword').value
    };

    const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
    });

    if (res.ok) {
        alert('Profile updated successfully!');
        // Update local storage user data partially for consistency in UI greeting
        user.name = updatedData.name;
        localStorage.setItem('user', JSON.stringify(user));
        document.getElementById('userNameDisplay').textContent = user.name;
    } else {
        alert('Update failed');
    }
}

async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;

    const user = getCurrentUser();
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });

    if (res.ok) {
        alert('Account deleted.');
        logout();
    } else {
        alert('Failed to delete account');
    }
}

// ADMIN FUNCTIONS ---------------------------

async function loadAllUsers(query = '') {
    const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
    const users = await res.json();
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';

    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.username}</td>
            <td>${u.name}</td>
            <td>${u.phone}</td>
            <td>${u.address}</td>
            <td>${u.password}</td>
            <td>
                <button class="action-btn" onclick="adminEditUser(${u.id})">Edit</button>
                <button class="action-btn danger" onclick="adminDeleteUser(${u.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleSearch() {
    const query = document.getElementById('searchInput').value;
    loadAllUsers(query);
}

async function adminDeleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
        loadAllUsers(); // Refresh list
    } else {
        alert('Failed to delete user');
    }
}

// Modal Functions
const modal = document.getElementById('editUserModal');
const editForm = document.getElementById('editUserForm');

function closeModal() {
    modal.style.display = 'none';
}

// Close modal if clicked outside
window.onclick = function (event) {
    if (event.target == modal) {
        closeModal();
    }
}

if (editForm) {
    editForm.addEventListener('submit', saveAdminEdit);
}

async function adminEditUser(id) {
    try {
        const res = await fetch(`/api/users/${id}`);
        const user = await res.json();

        // Populate Modal
        document.getElementById('modalUserId').value = user.id;
        document.getElementById('modalUsername').value = user.username;
        document.getElementById('modalName').value = user.name;
        document.getElementById('modalPhone').value = user.phone || '';
        document.getElementById('modalAddress').value = user.address || '';
        document.getElementById('modalPassword').value = user.password;

        // Show Modal
        modal.style.display = 'block';
    } catch (err) {
        console.error(err);
        alert('Failed to load user data');
    }
}

async function saveAdminEdit(e) {
    e.preventDefault();

    const id = document.getElementById('modalUserId').value;
    const updatedData = {
        username: document.getElementById('modalUsername').value,
        name: document.getElementById('modalName').value,
        phone: document.getElementById('modalPhone').value,
        address: document.getElementById('modalAddress').value,
        password: document.getElementById('modalPassword').value
    };

    try {
        const res = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const data = await res.json();
        if (data.success) {
            alert('User updated successfully!');
            closeModal();
            loadAllUsers(); // Refresh table
        } else {
            alert(data.message || 'Update failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while updating');
    }
}
