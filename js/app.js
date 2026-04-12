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
function goToGroup() {
    window.location.href = "group.html";
}

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

    if (sessionId) {

        fetch("https://billora-backend-9kyk.onrender.com/api/session/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessionId: sessionId,
                storeId: storeId
            })
        })
        .then(res => {
            if (!res.ok) throw new Error("Session start failed");
            return res.json();
        })
        .then(data => {
            console.log("Session activated:", data);

            // ✅ NOW REDIRECT AFTER SUCCESS
            localStorage.setItem("selectedStoreId", storeId);

            window.location.href = "scanner.html";
        })
        .catch(err => {
            console.error(err);
            alert("Failed to start session ❌");
        });

    } else {
        // normal flow (no group)
        localStorage.setItem("selectedStoreId", storeId);
        window.location.href = "scanner.html";
    }
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
                    sessionId: sessionId,
                    owner: user.username
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
    const user = JSON.parse(localStorage.getItem("user"));

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

            // 🧠 GROUP BY OWNER
            const grouped = {};

            cart.forEach(item => {
                const owner = item.owner || "unknown";

                if (!grouped[owner]) {
                    grouped[owner] = [];
                }

                grouped[owner].push(item);
            });

            // 👑 CHECK IF MAIN MEMBER
            const sessionCreator = localStorage.getItem("sessionCreator");

            const isMain = user.username === sessionCreator;

            // ===============================
            // 👨 MAIN MEMBER VIEW
            // ===============================
            if (isMain) {

                Object.values(grouped).forEach(memberItems => {

                    let cardTotal = 0;

                    let html = `<div style="
                        background:#1f1f1f;
                        padding:10px;
                        border-radius:10px;
                        margin-bottom:10px;
                    ">`;

                    memberItems.forEach(item => {

                        const itemTotal = item.price * item.quantity;
                        cardTotal += itemTotal;
                        total += itemTotal;

                        html += `
                            <p>${item.name} x${item.quantity} - ₹${itemTotal}</p>
                        `;
                    });

                    html += `<p><b>Subtotal: ₹${cardTotal}</b></p>`;
                    html += `</div>`;

                    cartItems.innerHTML += html;
                });
            }

            // ===============================
            // 👦 CHILD MEMBER VIEW
            // ===============================
            else {

                const myItems = cart.filter(i => i.owner === user.username);

                myItems.forEach(item => {

                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;

                    cartItems.innerHTML += `
                        <div>
                            <p>${item.name}</p>
                            <p>₹ ${item.price}</p>
                            <p>Qty: ${item.quantity}</p>
                            <p>Subtotal: ₹ ${itemTotal}</p>
                        </div><hr>
                    `;
                });
            }

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

    const user = JSON.parse(localStorage.getItem("user"));

    fetch("https://billora-backend-9kyk.onrender.com/api/session/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            createdBy: user.username
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Session creation failed");
        return res.json();
    })
    .then(data => {

    const sessionId = data.id || data.sessionId;

    const user = JSON.parse(localStorage.getItem("user")); // ✅ FIX

    // ✅ STORE CREATOR (MAIN MEMBER)
    localStorage.setItem("sessionCreator", user.username);

    // ✅ SAVE SESSION
    localStorage.setItem("sessionId", sessionId);

    const qrUrl = `${window.location.origin}/join.html?id=${sessionId}`;

    // ✅ UI
    document.body.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <h2>📱 Share this QR</h2>
            <div id="qrBox"></div>

            <br><br>

            <button onclick="startGroupShopping()" 
                style="padding:12px 20px; font-size:16px;">
                Continue ➡
            </button>
        </div>
    `;

    // ✅ QR GENERATION
    QRCode.toCanvas(qrUrl, function (err, canvas) {
        document.getElementById("qrBox").appendChild(canvas);
    });
})
    .catch(err => {
        console.error(err);
        alert("Failed to create group ❌");
    });
}
function startGroupShopping() {
    window.location.href = "store.html";
}