const BASE = "https://billora-backend-9kyk.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));

loadCart();

// ===============================
// LOAD CART
// ===============================
function loadCart() {
    const mode = localStorage.getItem("mode");
    const role = mode === "GROUP" ? localStorage.getItem("groupRole") : "SOLO";
    
    // Hide Pay button for children
    if (role === "CHILD") {
        document.getElementById("payBtn").style.display = "none";
    }

    let url = `${BASE}/api/cart/user/${user.username}`;
    
    // Parent sees the whole session cart
    if (mode === "GROUP" && role === "MAIN") {
        const sessionId = localStorage.getItem("sessionId");
        url = `${BASE}/api/cart/session/${sessionId}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(cart => render(cart, role))
        .catch(() => render([], role));
}

// ===============================
// RENDER
// ===============================
function render(cart, role) {

    let total = 0;
    const box = document.getElementById("cartItems");
    box.innerHTML = "";

    if (!Array.isArray(cart)) cart = [];

    cart.forEach(i => {

        const t = i.price * i.quantity;
        total += t;
        
        const ownerTag = (role === "MAIN" && localStorage.getItem("mode") === "GROUP") 
            ? `<div style="display:inline-block; margin-bottom: 5px; background: rgba(59, 130, 246, 0.15); color: var(--accent-primary); padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;"><i data-lucide="user" style="width:10px; height:10px; margin-right:3px; vertical-align:middle;"></i>${i.owner}</div>` 
            : ``;

        box.innerHTML += `
        <div class="item-card">
            <div style="flex: 1;">
                ${ownerTag}
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

    document.getElementById("cartTotal").innerText = total;
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

    const mode = localStorage.getItem("mode");
    const role = mode === "GROUP" ? localStorage.getItem("groupRole") : "SOLO";
    
    let url = `${BASE}/api/cart/user/${user.username}`;
    
    // Parent clears the whole session cart
    if (mode === "GROUP" && role === "MAIN") {
        const sessionId = localStorage.getItem("sessionId");
        url = `${BASE}/api/cart/session/${sessionId}`;
    }

    fetch(url, {
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