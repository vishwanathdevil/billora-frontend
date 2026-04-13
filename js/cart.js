console.log("CART JS LOADED");

function addToCart(code) {

    const sessionId = localStorage.getItem("sessionId");
    const storeId = localStorage.getItem("selectedStoreId");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!sessionId) {
        alert("Join or create group first ❌");
        return;
    }

    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${code}?storeId=${storeId}`)
        .then(res => res.json())
        .then(product => {

            return fetch("https://billora-backend-9kyk.onrender.com/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: product.name || "Unknown Product",
                    code: product.code,
                    price: Number(product.price) || 0,
                    quantity: 1,
                    storeId,
                    sessionId,
                    owner: user.username
                })
            });
        })
        .then(() => alert("Added to cart ✅"))
        .catch(() => alert("Product not found ❌"));
}

// LOAD CART (your fixed version)
function loadCart() {
    const sessionId = localStorage.getItem("sessionId");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!sessionId) return;

    fetch(`https://billora-backend-9kyk.onrender.com/api/cart/${sessionId}`)
        .then(res => res.json())
        .then(cart => {

            const cartItems = document.getElementById("cartItems");
            const cartTotal = document.getElementById("cartTotal");

            if (!Array.isArray(cart)) return;

            let total = 0;
            const grouped = {};

            cart.forEach(item => {
                const owner = item.owner || "unknown";
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 1;

                if (!grouped[owner]) grouped[owner] = [];
                grouped[owner].push({ ...item, price, quantity: qty });
            });

            const sessionCreator = localStorage.getItem("sessionCreator");
            const isMain = user.username === sessionCreator;

            cartItems.innerHTML = "";

            if (isMain) {
                Object.values(grouped).forEach(memberItems => {

                    let sub = 0;
                    let html = `<div class="cart-card">`;

                    memberItems.forEach(item => {
                        const t = item.price * item.quantity;
                        sub += t;
                        total += t;

                        html += `<p>${item.name} x${item.quantity} - ₹${t}</p>`;
                    });

                    html += `<b>Subtotal: ₹${sub}</b></div>`;
                    cartItems.innerHTML += html;
                });
            } else {
                cart
                    .filter(i => i.owner === user.username)
                    .forEach(item => {
                        const t = item.price * item.quantity;
                        total += t;

                        cartItems.innerHTML += `
                            <div>
                                <p>${item.name}</p>
                                <p>₹ ${item.price}</p>
                                <p>Qty: ${item.quantity}</p>
                                <p>Subtotal: ₹ ${t}</p>
                            </div><hr>
                        `;
                    });
            }

            cartTotal.innerText = total;
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

// CLEAR CART
function clearCart() {
    const sessionId = localStorage.getItem("sessionId");

    fetch(`https://billora-backend-9kyk.onrender.com/api/cart/${sessionId}`, {
        method: "DELETE"
    })
    .then(() => location.reload());
}