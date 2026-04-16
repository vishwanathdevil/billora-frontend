const BASE = "https://billora-backend-9kyk.onrender.com";

const sessionId = localStorage.getItem("sessionId");
const user = window.user;
const role = localStorage.getItem("role");

const isMain = role === "MAIN";

// LOAD
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

// RENDER
function render(cart, isMainUser) {

    let total = 0;
    const box = document.getElementById("cartItems");
    box.innerHTML = "";

    if (!Array.isArray(cart)) cart = [];

    let grouped = {};

    cart.forEach(i => {
        if (!grouped[i.owner]) grouped[i.owner] = [];
        grouped[i.owner].push(i);
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
                    <button onclick="update(${i.id}, ${i.quantity+1})">+</button>
                    <button onclick="update(${i.id}, ${i.quantity-1})">-</button>
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

    if (isMainUser) {
        payBtn.style.display = "block";
        completeBtn.style.display = "none";
    } else {
        payBtn.style.display = "none";
        completeBtn.style.display = "block";
    }
}

// UPDATE
function update(id, qty) {
    if (qty < 1) return;

    fetch(`${BASE}/api/cart/update/${id}/${qty}`, {
        method: "PUT"
    }).then(() => location.reload());
}

// REMOVE
function removeItem(id) {
    fetch(`${BASE}/api/cart/${id}`, {
        method: "DELETE"
    }).then(() => location.reload());
}

// CHILD → MAIN
function completeCart() {
    fetch(`${BASE}/api/cart/complete/${sessionId}/${user.username}`, {
        method: "PUT"
    })
    .then(() => {
        alert("Sent to main cart ✅");
        location.reload();
    });
}

// CLEAR (ONLY MAIN)
function clearCart() {

    if (!isMain) {
        alert("Only main user can clear ❌");
        return;
    }

    fetch(`${BASE}/api/cart/session/${sessionId}`, {
        method: "DELETE"
    }).then(() => location.reload());
}

// PAYMENT
function goToPayment() {

    if (!isMain) {
        alert("Only main user can pay ❌");
        return;
    }

    window.location.href = "payment.html";
}