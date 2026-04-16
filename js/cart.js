const BASE = "https://billora-backend-9kyk.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));
const sessionId = localStorage.getItem("sessionId");
const role = localStorage.getItem("role");
const sessionCreator = localStorage.getItem("sessionCreator");
const mode = localStorage.getItem("mode");

// ✅ MAIN CHECK
const isMain =
    mode === "SOLO" ||
    role === "MAIN" ||
    user?.username === sessionCreator;

// LOAD
if (isMain) loadMain();
else loadChild();

// =======================
// LOAD MAIN
// =======================
function loadMain() {

    // ✅ SOLO
    if (mode === "SOLO") {
        fetch(`${BASE}/api/cart/user/${user.username}`)
            .then(res => res.json())
            .then(cart => render(cart, true))
            .catch(() => render([], true));
        return;
    }

    // ✅ GROUP
    if (!sessionId) {
        render([], true);
        return;
    }

    fetch(`${BASE}/api/cart/main/${sessionId}`)
        .then(res => res.json())
        .then(cart => render(cart, true))
        .catch(() => render([], true));
}

// =======================
// LOAD CHILD
// =======================
function loadChild() {

    fetch(`${BASE}/api/cart/child/${sessionId}/${user.username}`)
        .then(res => res.json())
        .then(cart => render(cart, false))
        .catch(() => render([], false));
}

// =======================
// RENDER
// =======================
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

    if (mode === "SOLO" || isMainUser) {
        payBtn.style.display = "block";
        completeBtn.style.display = "none";
    } else {
        payBtn.style.display = "none";
        completeBtn.style.display = "block";
    }
}

// =======================
// ACTIONS
// =======================
function update(id, qty) {
    if (qty < 1) return;

    fetch(`${BASE}/api/cart/update/${id}/${qty}`, {
        method: "PUT"
    }).then(() => location.reload());
}

function removeItem(id) {
    fetch(`${BASE}/api/cart/${id}`, {
        method: "DELETE"
    }).then(() => location.reload());
}

function completeCart() {
    fetch(`${BASE}/api/cart/complete/${sessionId}/${user.username}`, {
        method: "PUT"
    }).then(() => location.reload());
}

// ✅ FIXED CLEAR
function clearCart() {

    if (mode === "SOLO") {
        fetch(`${BASE}/api/cart/user/${user.username}`, {
            method: "DELETE"
        }).then(() => location.reload());
    } else {
        fetch(`${BASE}/api/cart/session/${sessionId}`, {
            method: "DELETE"
        }).then(() => location.reload());
    }
}

function goToPayment() {
    window.location.href = "payment.html";
}