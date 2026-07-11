console.log("LOGIN JS LOADED");

// ================================
// 🚀 AUTO-LOGIN
// ================================
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        if (user.role === "ADMIN") window.location.href = "admin.html";
        else if (user.role === "CASHIER") window.location.href = "cashier.html";
        else window.location.href = "home.html";
    }
});

/* ================================
   🔔 TOAST
================================ */
function showPopup(title, text, icon) {
    if (window.Swal) {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonColor: 'var(--accent-primary)',
            confirmButtonText: 'Okay',
            background: 'var(--bg-glass)',
            color: 'var(--text-primary)',
            customClass: {
                popup: 'glass-card'
            }
        });
    } else {
        alert(title + ": " + text);
    }
}

/* ================================
   🔐 REGISTER
================================ */
function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) return showPopup("Missing Details", "Please enter both username and password.", "warning");

    showLoader(true);

    fetch("https://billora-backend-9kyk.onrender.com/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(async res => {
        const text = await res.text();
        if (!res.ok) {
            throw new Error(text || "Registration failed");
        }
        return JSON.parse(text);
    })
    .then(data => {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "home.html";
    })
    .catch(err => {
        const msg = err.message.toLowerCase();
        if (msg.includes("already") || msg.includes("exists") || msg.includes("constraint")) {
            showPopup("Already Registered", "This username is already taken. Please try logging in instead.", "info");
        } else {
            showPopup("Registration Failed", err.message, "error");
        }
    })
    .finally(() => showLoader(false));
}

/* ================================
   🔐 LOGIN (PREMIUM UX)
================================ */
function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const btn = document.getElementById("loginBtn");

    if (!username || !password) return showPopup("Missing Details", "Please enter both username and password.", "warning");

    btn.disabled = true;
    btn.innerText = "⏳ Logging in...";
    showLoader(true);

    fetch("https://billora-backend-9kyk.onrender.com/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(async res => {
        const text = await res.text();
        if (!res.ok) {
            throw new Error(text || "Login failed");
        }
        return JSON.parse(text);
    })
    .then(data => {
        const user = data.user;
        const token = data.token;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("storeId", user.storeId);

        if (user.role === "ADMIN") {
            window.location.href = "admin.html";
        } else if (user.role === "CASHIER") {
            window.location.href = "cashier.html";
        } else {
            window.location.href = "home.html";
        }
    })
    .catch(err => {
        const msg = err.message.toLowerCase();
        if (msg.includes("not found") || msg.includes("bad credentials") || msg.includes("invalid")) {
            showPopup("Not Registered?", "We couldn't find an account with those details. Please register first!", "question");
        } else {
            showPopup("Login Failed", err.message, "error");
        }
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerText = "Login to shop";
        showLoader(false);
    });
}

/* ================================
   🔄 LOADER CONTROL
================================ */
function showLoader(state) {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = state ? "flex" : "none";
    }
}