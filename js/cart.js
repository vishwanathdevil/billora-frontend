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

    cart.forEach(i => {

        const t = i.price * i.quantity;
        total += t;

        box.innerHTML += `
        <div>
            <h4>${i.name}</h4>
            ₹ ${i.price}
            <br>Qty: ${i.quantity}
            <br>Total: ₹ ${t}

            ${isMain ? `
            <button onclick="update(${i.id}, ${i.quantity+1})">+</button>
            <button onclick="update(${i.id}, ${i.quantity-1})">-</button>
            <button onclick="removeItem(${i.id})">Remove</button>
            ` : ""}
        </div><hr>
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