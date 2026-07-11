console.log("AUTH JS LOADED");

window.user = JSON.parse(localStorage.getItem("user"));

const currentPage = window.location.pathname.split("/").pop();

const protectedPages = [
    "home.html",
    "store.html",
    "scanner.html",
    "cart.html",
    "payment.html",
    "bills.html"
];

// Protect pages
if (protectedPages.includes(currentPage) && !window.user) {
    window.location.href = "index.html";
}

// Redirect if already logged in
if (currentPage === "index.html" && window.user) {
    window.location.href = window.user.role === "CASHIER" ? "cashier.html" : "home.html";
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

console.log("NAV JS LOADED");

function goHome() { window.location.href = "home.html"; }
function goToScanner() { window.location.href = "scanner.html"; }
function goToCart() { window.location.href = "cart.html"; }
function goToBills() { window.location.href = "bills.html"; }

function goToStore() { 
    localStorage.setItem("mode", "SOLO");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("sessionCreator");
    localStorage.removeItem("role");
    window.location.href = "store.html"; 
}

function goToGroup() { 
    localStorage.setItem("mode", "GROUP");
    window.location.href = "group-setup.html"; 
}

function goBack() {
    const page = window.location.pathname;

    if (page.includes("scanner.html")) {
        window.location.href = "store.html";
    } else if (page.includes("cart.html")) {
        window.location.href = "scanner.html";
    } else if (page.includes("payment.html")) {
        window.location.href = "cart.html";
    } else if (page.includes("bills.html")) {
        window.location.href = "home.html";
    } else {
        window.location.href = "home.html";
    }
}

if (!user && protectedPages.includes(currentPage)) {
    window.location.href = "index.html";
}

// 🔥 ADD THIS
if (user && currentPage === "index.html") {
    if (user.role === "ADMIN") window.location.href = "admin.html";
    else if (user.role === "CASHIER") window.location.href = "cashier.html";
    else window.location.href = "home.html";
}

/* ================================
   🌙 THEME & UI LOGIC FOR HOME
================================ */
document.addEventListener("DOMContentLoaded", () => {
    if (currentPage === "home.html" && window.user) {
        document.getElementById("welcomeText").innerText = `👋 Welcome back, ${window.user.name || window.user.username}!`;
        
        // Setup Profile
        document.getElementById("profileName").innerText = window.user.name || "Customer";
        document.getElementById("profileUsername").innerText = "@" + window.user.username;
        document.getElementById("profileNumber").value = window.user.number || "Not provided";
        document.getElementById("profileEmail").value = window.user.email || "Not provided";
        
        // Load Theme
        if (localStorage.getItem("theme") === "light") {
            document.body.classList.add("light-mode");
            document.getElementById("themeIcon").setAttribute("data-lucide", "sun");
        }
        if (window.lucide) lucide.createIcons();
    }
});

function toggleTheme() {
    const isLight = document.body.classList.toggle("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    document.getElementById("themeIcon").setAttribute("data-lucide", isLight ? "sun" : "moon");
    lucide.createIcons();
}

function showProfile() { document.getElementById("profileModal").style.display = "flex"; }
function closeProfile() { document.getElementById("profileModal").style.display = "none"; }

function showHelp() {
    if (window.Swal) Swal.fire({ title: 'Help & FAQ', text: 'For help with shopping, simply scan the barcodes of items. If you need assistance, please approach the cashier.', icon: 'info', background: 'var(--bg-glass)', color: 'var(--text-primary)' });
    else alert("Help: Scan barcodes to shop!");
}

function showContact() {
    if (window.Swal) Swal.fire({ title: 'Contact Us', html: '<p>Email: support@billora.com</p><p>Phone: +1 800 BILLORA</p>', icon: 'success', background: 'var(--bg-glass)', color: 'var(--text-primary)' });
    else alert("Contact: support@billora.com");
}

function deleteAccountLocal() {
    if (window.Swal) {
        Swal.fire({
            title: 'Wipe Device Data?',
            text: "This will remove your account from this device. You can get all your data back anytime by re-registering with the exact same mobile number!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, wipe it!',
            background: 'var(--bg-glass)',
            color: 'var(--text-primary)'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                window.location.href = "index.html";
            }
        });
    } else {
        if(confirm("Wipe device data? You can restore it later by entering your number again.")) {
            localStorage.clear();
            window.location.href = "index.html";
        }
    }
}