const BASE = "https://billora-backend-9kyk.onrender.com";

const sessionId = localStorage.getItem("sessionId");
const user = JSON.parse(localStorage.getItem("user"));

const isMain = localStorage.getItem("role") === "MAIN";

if (isMain) loadMain();
else loadChild();

function loadMain() {
    fetch(`${BASE}/api/cart/main/${sessionId}`)
        .then(res => res.json())
        .then(cart => render(cart, true));
}

function loadChild() {
    fetch(`${BASE}/api/cart/child/${sessionId}/${user.username}`)
        .then(res => res.json())
        .then(cart => render(cart, false));
}

function render(cart, isMain) {

    let total = 0;
    const box = document.getElementById("cartItems");
    box.innerHTML = "";

    if(!Array.isArray(cart)) cart=[];

    const currentUser = JSON.parse(localStorage.getItem("user"));

cart.forEach(i => {

    const t = i.price * i.quantity;
    total += t;

    const isOwner = i.owner === currentUser?.username;

    box.innerHTML += `
    <div class="cart-item">

        <h4>${i.name}</h4>

        <p>₹ ${i.price}</p>
        <p>Qty: ${i.quantity}</p>
        <p>Total: ₹ ${t}</p>

        <p style="font-size:12px; color:#aaa;">
            Added by: ${i.owner || "Unknown"}
            ${isOwner ? '<span style="color:#4CAF50;"> (You)</span>' : '<span style="color:orange;"> (Member)</span>'}
        </p>

        ${isMain ? `
        <div style="margin-top:8px;">
            <button onclick="update(${i.id}, ${i.quantity+1})">+</button>
            <button onclick="update(${i.id}, ${i.quantity-1})">-</button>
            <button onclick="removeItem(${i.id})">Remove</button>
        </div>
        ` : ""}

    </div>
    <hr>
    `;
});

    document.getElementById("cartTotal").innerText = total;

    if (!isMain) {
        document.getElementById("payBtn").style.display = "none";
        document.getElementById("completeBtn").style.display = "block";
    }
}

function update(id, qty) {
    if (qty < 1) return;
    fetch(`${BASE}/api/cart/update/${id}/${qty}`, { method: "PUT" })
        .then(() => location.reload());
}

function removeItem(id) {
    fetch(`${BASE}/api/cart/${id}`, { method: "DELETE" })
        .then(() => location.reload());
}

function completeCart() {
    fetch(`${BASE}/api/cart/complete/${sessionId}/${user.username}`, {
        method: "PUT"
    }).then(() => location.reload());
}
function clearCart() {
    fetch(`${BASE}/api/cart/session/${sessionId}`, {
        method: "DELETE"
    }).then(() => location.reload());
}
function goToPayment() {

    const sessionId = localStorage.getItem("sessionId");

    if (!sessionId) {
        alert("Session not found ❌");
        return;
    }

    // redirect to payment page
    window.location.href = "payment.html";
}