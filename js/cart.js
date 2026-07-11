const BASE = "https://billora-backend-9kyk.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));

loadCart();

// ===============================
// LOAD CART
// ===============================
function loadCart() {

    fetch(`${BASE}/api/cart/user/${user.username}`)
        .then(res => res.json())
        .then(cart => render(cart))
        .catch(() => render([]));
}

// ===============================
// RENDER
// ===============================
function render(cart) {

    let total = 0;

    const box = document.getElementById("cartItems");

    box.innerHTML = "";

    if (!Array.isArray(cart)) cart = [];

    cart.forEach(i => {

        const t = i.price * i.quantity;

        total += t;

        box.innerHTML += `
        box.innerHTML += `
        <div class="item-card">
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px 0;">${i.name}</h4>
                <div style="font-size: 13px; color: var(--text-secondary);">₹${i.price} &times; ${i.quantity}</div>
                <div style="font-weight: 700; color: var(--accent-success); margin-top: 5px;">₹${t}</div>
            </div>

            <div class="flex-row" style="background: rgba(0,0,0,0.2); border-radius: 20px; padding: 4px;">
                <button class="btn-icon" style="width: 32px; height: 32px;" onclick="update(${i.id}, ${i.quantity - 1})">
                    <i data-lucide="minus" style="width: 16px;"></i>
                </button>
                <span style="font-weight: 600; width: 24px; text-align: center;">${i.quantity}</span>
                <button class="btn-icon" style="width: 32px; height: 32px;" onclick="update(${i.id}, ${i.quantity + 1})">
                    <i data-lucide="plus" style="width: 16px;"></i>
                </button>
            </div>
            
            <button class="btn-icon" style="width: 35px; height: 35px; border-color: rgba(239, 68, 68, 0.2); color: var(--accent-danger); margin-left: 10px;" onclick="removeItem(${i.id})">
                <i data-lucide="trash-2" style="width: 16px;"></i>
            </button>
        </div>
        `;
    });

    if(window.lucide) {
        window.lucide.createIcons();
    }

    document.getElementById("cartTotal").innerText =
        total;
}

// ===============================
// UPDATE
// ===============================
function update(id, qty) {

    if (qty < 1) return;

    fetch(`${BASE}/api/cart/update/${id}/${qty}`, {
        method: "PUT"
    })
    .then(() => loadCart());
}

// ===============================
// REMOVE
// ===============================
function removeItem(id) {

    fetch(`${BASE}/api/cart/${id}`, {
        method: "DELETE"
    })
    .then(() => loadCart());
}

// ===============================
// CLEAR
// ===============================
function clearCart() {

    fetch(`${BASE}/api/cart/user/${user.username}`, {
        method: "DELETE"
    })
    .then(() => loadCart());
}

// ===============================
// PAYMENT
// ===============================
function goToPayment() {
    window.location.href = "payment.html";
}