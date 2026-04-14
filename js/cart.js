console.log("CART JS LOADED");

const BASE = "https://billora-backend-9kyk.onrender.com";

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
    };
}

function addToCart(code) {

    const sessionId = localStorage.getItem("sessionId");
    const storeId = localStorage.getItem("selectedStoreId");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!sessionId) return alert("Join group first ❌");

    fetch(`${BASE}/api/products/${code}?storeId=${storeId}`)
        .then(res => res.json())
        .then(product => {

            body: JSON.stringify({
    name: product.name,
    code: product.code,
    price: product.price,
    quantity: 1,
    sessionId,
    owner: user.username
})
        })
        .then(() => alert("Added ✅"));
}

function loadCart() {

    const sessionId = localStorage.getItem("sessionId");
    const user = JSON.parse(localStorage.getItem("user"));

    fetch(`${BASE}/api/cart/${sessionId}`)
        .then(res => res.json())
        .then(cart => {

            const cartItems = document.getElementById("cartItems");
            const cartTotal = document.getElementById("cartTotal");

            cartItems.innerHTML = "";

            let total = 0;

            cart.forEach(item => {
                const t = item.price * item.quantity;
                total += t;

                cartItems.innerHTML += `
                    <div>
                        <p>${item.name}</p>
                        <p>₹ ${item.price}</p>
                        <p>Qty: ${item.quantity}</p>
                        <p>Total: ₹ ${t}</p>
                    </div><hr>
                `;
            });

            cartTotal.innerText = total;
        });
}

function clearCart() {

    const sessionId = localStorage.getItem("sessionId");

    fetch(`${BASE}/api/cart/${sessionId}`, {
        method: "DELETE",
        headers: authHeaders()
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        location.reload();
    });
}

if (window.location.pathname.includes("cart.html")) {
    loadCart();
}

// PAYMENT
function goToPayment() {
    const total = document.getElementById("cartTotal").innerText;
    if (!total || total == "0") return alert("Cart empty ❌");
    window.location.href = "payment.html";
}