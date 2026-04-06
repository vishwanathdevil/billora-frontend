console.log("LOGIN JS LOADED");

/* ================================
   🔐 LOGIN + REGISTER ONLY
================================ */

function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) return alert("Enter details");

    fetch("https://billora-backend-9kyk.onrender.com/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "home.html";
    });
}

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) return alert("Enter details");

    fetch("https://billora-backend-9kyk.onrender.com/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
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
    });
}