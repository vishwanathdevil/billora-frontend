console.log("APP JS LOADED");

/* ================================
   🔐 AUTH + SESSION
================================ */

const user = JSON.parse(localStorage.getItem("user"));
const currentPage = window.location.pathname.split("/").pop();

const protectedPages = [
    "home.html",
    "store.html",
    "scanner.html",
    "cart.html",
    "payment.html",
    "bills.html"
];

// Protect pages
if (protectedPages.includes(currentPage) && !user) {
    window.location.href = "index.html";
}

// Redirect if already logged in
if (currentPage === "index.html" && user) {
    window.location.href = user.role === "CASHIER" ? "cashier.html" : "home.html";
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

/* ================================
   🏬 NAVIGATION
================================ */

function goHome() { window.location.href = "home.html"; }
function goToStore() { window.location.href = "store.html"; }
function goToScanner() { window.location.href = "scanner.html"; }
function goToCart() { window.location.href = "cart.html"; }
function goToBills() { window.location.href = "bills.html"; }

/* ================================
   🏬 STORE
================================ */

function loadStores() {
    fetch("https://billora-backend-9kyk.onrender.com/api/stores")
        .then(res => res.json())
        .then(stores => {

            const container = document.getElementById("storeList");
            if (!container) return;

            container.innerHTML = "";

            stores.forEach(store => {
                container.innerHTML += `
                    <button onclick="selectStore(${store.id})">
                        ${store.name}
                    </button>
                `;
            });
        });
}

// 🔥 LEADER STORE SELECT → ACTIVATE SESSION
function selectStore(storeId) {

    const sessionId = localStorage.getItem("sessionId");

    // update backend session
    if (sessionId) {
        fetch("https://billora-backend-9kyk.onrender.com/api/session/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId: sessionId,
                storeId: storeId
            })
        });
    }

    localStorage.setItem("selectedStoreId", storeId);

    window.location.href = "scanner.html";
}

if (currentPage === "store.html") loadStores();

/* ================================
   🛒 ADD TO SHARED CART
================================ */

function addToCart(code) {

    const sessionId = localStorage.getItem("sessionId");
    const storeId = localStorage.getItem("selectedStoreId");

    if (!sessionId) {
        alert("Join or create group first ❌");
        return;
    }

    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${code}?storeId=${storeId}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(product => {

            return fetch("https://billora-backend-9kyk.onrender.com/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: product.name,
                    code: product.code,
                    price: product.price,
                    quantity: 1,
                    storeId: storeId,
                    sessionId: sessionId
                })
            });
        })
        .then(res => {
            if (!res.ok) throw new Error();
            alert("Added to shared cart ✅");
        })
        .catch(() => {
            alert("Product not found ❌");
        });
}

/* ================================
   🛒 LOAD SHARED CART
================================ */

function loadCart() {

    const sessionId = localStorage.getItem("sessionId");

    if (!sessionId) {
        alert("No active cart ❌");
        return;
    }

    fetch(`https://billora-backend-9kyk.onrender.com/api/cart/${sessionId}`)
        .then(res => res.json())
        .then(cart => {

            const cartItems = document.getElementById("cartItems");
            const cartTotal = document.getElementById("cartTotal");

            if (!cartItems) return;

            cartItems.innerHTML = "";

            let total = 0;

            cart.forEach(item => {

                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                cartItems.innerHTML += `
                    <div>
                        <h4>${item.name}</h4>
                        <p>₹ ${item.price}</p>
                        <p>Qty: ${item.quantity}</p>
                        <p>Subtotal: ₹ ${itemTotal}</p>
                    </div><hr>
                `;
            });

            cartTotal.innerText = total;
        });
}

if (currentPage === "cart.html") loadCart();

/* ================================
   🧾 BILL HISTORY
================================ */

function loadBills() {

    fetch(`https://billora-backend-9kyk.onrender.com/api/bills/user/${user.username}`)
        .then(res => res.json())
        .then(data => {

            const container = document.getElementById("billsList");
            if (!container) return;

            container.innerHTML = "";

            data.forEach(bill => {
                container.innerHTML += `
                    <div>
                        <h3>Bill #${bill.id}</h3>
                        <p>Total: ₹${bill.total}</p>
                        <p>
                            ${bill.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
                        </p>
                    </div><hr>
                `;
            });
        });
}

/* ================================
   🔙 BACK NAVIGATION
================================ */

function goBack() {

    const page = window.location.pathname;

    if (page.includes("scanner.html")) {
        window.location.href = "store.html";
    }
    else if (page.includes("cart.html")) {
        window.location.href = "scanner.html";
    }
    else if (page.includes("payment.html")) {
        window.location.href = "cart.html";
    }
    else if (page.includes("bills.html")) {
        window.location.href = "home.html";
    }
    else {
        window.location.href = "home.html";
    }
}

/* ================================
   👥 GROUP SESSION (LEADER)
================================ */

function createGroupSession() {

    fetch("https://billora-backend-9kyk.onrender.com/api/session/create", {
        method: "POST"
    })
    .then(res => res.json())
    .then(data => {

        const sessionId = data.sessionId || data.id;

        localStorage.setItem("sessionId", sessionId);

        const qrUrl = `${window.location.origin}/join.html?id=${sessionId}`;

        const canvas = document.getElementById("qrCanvas");

        if (canvas) {
            QRCode.toCanvas(canvas, qrUrl);
        } else {
            // fallback (your current behavior)
            document.body.innerHTML = "<h3>Share this QR</h3>";
            QRCode.toCanvas(qrUrl, function (err, canvasEl) {
                document.body.appendChild(canvasEl);
            });
        }
    });
}