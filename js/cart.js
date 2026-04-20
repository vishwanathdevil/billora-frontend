const BASE = "https://billora-backend-9kyk.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));
const sessionId = localStorage.getItem("sessionId");

// LOAD
loadCart();

function loadCart() {

    if (!sessionId) {
        render([]);
        return;
    }

    fetch(`${BASE}/api/cart/main/${sessionId}`)
        .then(res => res.json())
        .then(cart => render(cart))
        .catch(() => render([]));
}

// RENDER
function render(cart) {

    let total = 0;
    const box = document.getElementById("cartItems");
    box.innerHTML = "";

    if (!Array.isArray(cart)) cart = [];

    cart.forEach(i => {

        const t = i.price * i.quantity;
        total += t;

        box.innerHTML += `
        <div class="card">
            <h4>${i.name}</h4>
            ₹ ${i.price}
            <br>Qty: ${i.quantity}
            <br>Total: ₹ ${t}

            <div>
                <button onclick="update(${i.id}, ${i.quantity + 1})">+</button>
                <button onclick="update(${i.id}, ${i.quantity - 1})">-</button>
                <button onclick="removeItem(${i.id})">Remove</button>
            </div>
        </div><hr>
        `;
    });

    document.getElementById("cartTotal").innerText = total;
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

// CLEAR
function clearCart() {
    fetch(`${BASE}/api/cart/session/${sessionId}`, {
        method: "DELETE"
    }).then(() => location.reload());
}

// PAYMENT
function goToPayment() {
    window.location.href = "payment.html";
}