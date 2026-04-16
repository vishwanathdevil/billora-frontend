const BASE = "https://billora-backend-9kyk.onrender.com";

// ===============================
// 🔑 USER + SESSION
// ===============================
const user = window.user || JSON.parse(localStorage.getItem("user"));
const sessionId = localStorage.getItem("sessionId");
const role = localStorage.getItem("role");
const sessionCreator = localStorage.getItem("sessionCreator");

// ✅ FIX: detect MAIN correctly
const isMain =
    role === "MAIN" ||              // group main
    !sessionId ||                  // solo user
    user?.username === sessionCreator;

// ===============================
// 🚀 LOAD CART
// ===============================
if (isMain) loadMain();
else loadChild();

function loadMain() {

    // ✅ SOLO USER SUPPORT
    if (!sessionId) {
        fetch(`${BASE}/api/cart/user/${user.username}`)
            .then(res => res.json())
            .then(cart => render(cart, true))
            .catch(() => render([], true));
        return;
    }

    fetch(`${BASE}/api/cart/main/${sessionId}`)
        .then(res => res.json())
        .then(cart => render(cart, true))
        .catch(() => render([], true));
}

function loadChild() {

    fetch(`${BASE}/api/cart/child/${sessionId}/${user.username}`)
        .then(res => res.json())
        .then(cart => render(cart, false))
        .catch(() => render([], false));
}

// ===============================
// 🎨 RENDER
// ===============================
function render(cart, isMainUser) {

    let total = 0;
    const box = document.getElementById("cartItems");
    box.innerHTML = "";

    if (!Array.isArray(cart)) cart = [];

    let grouped = {};

    cart.forEach(i => {
        const owner = i.owner || "You";

        if (!grouped[owner]) grouped[owner] = [];
        grouped[owner].push(i);
    });

    for (let owner in grouped) {

        box.innerHTML += `<div class="card"><h3>👤 ${owner}</h3>`;

        grouped[owner].forEach(i => {

            const t = i.price * i.quantity;
            total += t;

            box.innerHTML += `
            <div>
                <h4>${i.name}</h4>
                ₹ ${i.price}
                <br>Qty: ${i.quantity}
                <br>Total: ₹ ${t}

                ${isMainUser ? `
                <div>
                    <button onclick="update(${i.id}, ${i.quantity + 1})">+</button>
                    <button onclick="update(${i.id}, ${i.quantity - 1})">-</button>
                    <button onclick="removeItem(${i.id})">Remove</button>
                </div>
                ` : ""}
            </div><hr>
            `;
        });

        box.innerHTML += `</div>`;
    }

    document.getElementById("cartTotal").innerText = total;

    const payBtn = document.getElementById("payBtn");
    const completeBtn = document.getElementById("completeBtn");

    // ✅ SAFE UI HANDLING
    if (isMainUser) {
        if (payBtn) payBtn.style.display = "block";
        if (completeBtn) completeBtn.style.display = "none";
    } else {
        if (payBtn) payBtn.style.display = "none";
        if (completeBtn) completeBtn.style.display = "block";
    }
}

// ===============================
// 🔄 UPDATE
// ===============================
function update(id, qty) {
    if (qty < 1) return;

    fetch(`${BASE}/api/cart/update/${id}/${qty}`, {
        method: "PUT"
    }).then(() => location.reload());
}

// ===============================
// ❌ REMOVE
// ===============================
function removeItem(id) {
    fetch(`${BASE}/api/cart/${id}`, {
        method: "DELETE"
    }).then(() => location.reload());
}

// ===============================
// 📤 CHILD → MAIN
// ===============================
function completeCart() {

    fetch(`${BASE}/api/cart/complete/${sessionId}/${user.username}`, {
        method: "PUT"
    })
    .then(() => {
        alert("Sent to main cart ✅");
        location.reload();
    });
}

// ===============================
// 🧹 CLEAR
// ===============================
function clearCart() {

    // ✅ GROUP SESSION
    if (sessionId) {

        // 🔥 OPTION 1: Clear only current user's items (RECOMMENDED)
        fetch(`${BASE}/api/cart/clear/${sessionId}/${user.username}`, {
            method: "DELETE"
        })
        .then(() => location.reload());

    } 
    else {

        // ✅ SOLO USER
        fetch(`${BASE}/api/cart/user/${user.username}`, {
            method: "DELETE"
        })
        .then(() => location.reload());
    }
}

// ===============================
// 💳 PAYMENT
// ===============================
function goToPayment() {

    if (!isMain) {
        alert("Only main user can pay ❌");
        return;
    }

    window.location.href = "payment.html";
}