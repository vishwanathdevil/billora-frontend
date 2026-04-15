const BASE = "https://billora-backend-9kyk.onrender.com";

// ===============================
// 🔑 SESSION + USER
// ===============================
const sessionId = localStorage.getItem("sessionId");
const user = JSON.parse(localStorage.getItem("user"));
const sessionCreator = localStorage.getItem("sessionCreator");

// ✅ MAIN USER CHECK
const isMain = user?.username === sessionCreator;

// ===============================
// 🚀 LOAD CART
// ===============================
if (isMain) loadMain();
else loadChild();

function loadMain() {
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
// 🎨 RENDER CART
// ===============================
function render(cart, isMainUser) {

    let total = 0;
    const box = document.getElementById("cartItems");
    box.innerHTML = "";

    if (!Array.isArray(cart)) cart = [];

    cart.forEach(i => {

        const t = i.price * i.quantity;
        total += t;

        const isOwner = i.owner === user?.username;

        box.innerHTML += `
        <div class="cart-item">

            <h4>${i.name}</h4>

            <p>₹ ${i.price}</p>
            <p>Qty: ${i.quantity}</p>
            <p>Total: ₹ ${t}</p>

            <p style="font-size:12px; color:#aaa;">
                Added by: ${i.owner || "Unknown"}
                ${isOwner 
                    ? '<span style="color:#4CAF50;"> (You)</span>' 
                    : '<span style="color:orange;"> (Member)</span>'}
            </p>

            ${isMainUser ? `
            <div style="margin-top:8px;">
                <button onclick="update(${i.id}, ${i.quantity + 1})">+</button>
                <button onclick="update(${i.id}, ${i.quantity - 1})">-</button>
                <button onclick="removeItem(${i.id})">Remove</button>
            </div>
            ` : ""}

        </div>
        <hr>
        `;
    });

    // ===============================
    // 💰 TOTAL
    // ===============================
    document.getElementById("cartTotal").innerText = total;

    // ===============================
    // 🔘 BUTTON CONTROL (FIXED)
    // ===============================
    const payBtn = document.getElementById("payBtn");
    const completeBtn = document.getElementById("completeBtn");

    if (isMainUser) {
        if (payBtn) payBtn.style.display = "block";
        if (completeBtn) completeBtn.style.display = "none";
    } else {
        if (payBtn) payBtn.style.display = "none";
        if (completeBtn) completeBtn.style.display = "block";
    }
}

// ===============================
// 🔄 UPDATE QTY
// ===============================
function update(id, qty) {
    if (qty < 1) return;

    fetch(`${BASE}/api/cart/update/${id}/${qty}`, {
        method: "PUT"
    })
    .then(() => location.reload());
}

// ===============================
// ❌ REMOVE ITEM
// ===============================
function removeItem(id) {
    fetch(`${BASE}/api/cart/${id}`, {
        method: "DELETE"
    })
    .then(() => location.reload());
}

// ===============================
// 📤 CHILD → MAIN (SEND CART)
// ===============================
function completeCart() {

    fetch(`${BASE}/api/cart/complete/${sessionId}/${user.username}`, {
        method: "PUT"
    })
    .then(() => {
        alert("Sent to main cart ✅");
        location.reload();
    })
    .catch(() => alert("Failed ❌"));
}

// ===============================
// 🧹 CLEAR CART (MAIN ONLY)
// ===============================
function clearCart() {

    if (!isMain) {
        alert("Only main user can clear cart ❌");
        return;
    }

    fetch(`${BASE}/api/cart/session/${sessionId}`, {
        method: "DELETE"
    })
    .then(() => location.reload());
}

// ===============================
// 💳 PAYMENT (MAIN ONLY)
// ===============================
function goToPayment() {

    if (!isMain) {
        alert("Only main user can pay ❌");
        return;
    }

    if (!sessionId) {
        alert("Session not found ❌");
        return;
    }

    window.location.href = "payment.html";
}