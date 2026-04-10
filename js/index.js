console.log("LOGIN JS LOADED");

/* ================================
   🔔 TOAST
================================ */
function showToast(msg) {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }

    toast.innerText = msg;
    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 2000);
}

/* ================================
   🔐 REGISTER
================================ */
function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) return showToast("Enter details");

    showLoader(true);

    fetch("https://billora-backend-9kyk.onrender.com/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "home.html";
    })
    .catch(() => showToast("Registration failed"))
    .finally(() => showLoader(false));
}

/* ================================
   🔐 LOGIN (PREMIUM UX)
================================ */
function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const btn = document.getElementById("loginBtn");

    if (!username || !password) return showToast("Enter details");

    // 🔥 UI START
    btn.disabled = true;
    btn.innerText = "⏳ Logging in...";
    showLoader(true);

    fetch("https://billora-backend-9kyk.onrender.com/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(async res => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data || "Login failed");
        }

        return data;
    })
    .then(user => {

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
        showToast("❌ " + err.message);
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