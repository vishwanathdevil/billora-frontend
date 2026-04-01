console.log("APP JS LOADED");
let selectedStoreId = localStorage.getItem("storeId") || 1;

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

/* ================================
   📝 AUTH FUNCTIONS
================================ */

function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) return alert("Enter details");

    fetch("https://billora-backend-9kyk.onrender.com/api/users/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "home.html";
    });
}

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) return alert("Enter details");

    fetch("https://billora-backend-9kyk.onrender.com/api/users/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(user => {
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = user.role === "CASHIER" ? "cashier.html" : "home.html";
    })
    .catch(() => alert("Login failed"));
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
function goToPayment() { window.location.href = "payment.html"; }
function goToBills() {
    window.location.href = "bills.html";
}

/* ================================
   🏬 STORE
================================ */

let selectedStore = "";

function startShopping() {
    localStorage.setItem("storeName", selectedStore);
    localStorage.setItem("cart", JSON.stringify([]));
    window.location.href = "scanner.html";
}

function selectStore(id) {
    localStorage.setItem("storeId", id);
    window.location.href = "scanner.html";
}

/* ================================
   🛒 CART
================================ */

function addToCart(code) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${code}?storeId=${selectedStoreId}`)
        .then(res => res.json())
        .then(product => {

            const existing = cart.find(i => i.code === code);

            if (existing) {
                existing.quantity++;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            alert("Added to cart ✅");
        });
}

function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    if (!cartItems) return;

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;

        cartItems.innerHTML += `
            <div>
                <h4>${item.name}</h4>
                <p>₹ ${item.price}</p>
                <p>Qty: ${item.quantity}</p>
            </div><hr>
        `;
    });

    cartTotal.innerText = total;
}

function clearCart() {
    localStorage.removeItem("cart");
    localStorage.removeItem("qrGenerated");
    alert("Cart cleared");
    window.location.reload();
}

// Auto load cart
if (currentPage === "cart.html") loadCart();

/* ================================
   💳 PAYMENT PAGE (QR + STATUS)
================================ */

if (currentPage === "payment.html") {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
const user = JSON.parse(localStorage.getItem("user"));

const qrContainer = document.getElementById("qrContainer");
const totalEl = document.getElementById("payTotal");

let currentBillId = null;

// 🧾 TOTAL
let total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
totalEl.innerText = total;

// 🔥 CREATE BILL
fetch("https://billora-backend-9kyk.onrender.com/api/bills", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
        username: user.username,
        items: cart.map(i => i.name),
        total: total,
        storeId: selectedStoreId
    })
})
.then(res => res.json())
.then(bill => {

    currentBillId = bill.id;

    const qrUrl = `${window.location.origin}/payment.html?id=${bill.id}`;

    // ✅ FIX QR
    QRCode.toCanvas(qrUrl, function (err, canvas) {
        qrContainer.innerHTML = "";
        qrContainer.appendChild(canvas);
    });

    startStatusCheck();
});

// 🔁 STATUS CHECK
function startStatusCheck() {

    setInterval(() => {

        fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${currentBillId}`)
            .then(res => res.json())
            .then(bill => {

                // 💰 CASH → AUTO SUCCESS
                if (bill.paymentMode === "CASH") {
                    alert("Cash Payment Successful ✅");
                    finishPayment();
                }

                // 📱 UPI → ENABLE BUTTON
                if (bill.paymentMode === "UPI") {
                    document.getElementById("payBtn").disabled = false;
                }

            });

    }, 3000);
}

// 💳 CUSTOMER PAY BUTTON
function payNow() {
    alert("Payment Successful ✅");
    finishPayment();
}

// 🧹 CLEANUP
function finishPayment() {
    localStorage.removeItem("cart");
    window.location.href = "home.html";
}
}

/* ================================
   🔍 SCANNER
================================ */

let scannedCode = null;

function startScanner() {

    Quagga.init({
        inputStream: {
            type: "LiveStream",
            target: document.getElementById("scanner"),
            constraints: { facingMode: "environment" }
        },
        decoder: { readers: ["code_128_reader", "ean_reader"] }
    }, err => {
        if (err) return console.error(err);
        Quagga.start();
    });

    Quagga.onDetected(res => {

        scannedCode = res.codeResult.code;

        fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${selectedStoreId}`)
            .then(res => res.json())
            .then(product => {

                document.getElementById("productName").innerText = product.name;
                document.getElementById("productPrice").innerText = product.price;

                Quagga.stop();
            })
            .catch(() => alert("Product not found"));
    });
}

function addScannedToCart() {
    if (!scannedCode) return alert("Scan first");
    addToCart(scannedCode);
}

function restartScanner() {
    scannedCode = null;
    startScanner();
}

// Auto start scanner
if (currentPage === "scanner.html") startScanner();

/* ================================
   🧾 BILL HISTORY
================================ */

function loadBills() {

    fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${user.username}`)
        .then(res => res.json())
        .then(data => {

            const container = document.getElementById("billsList");
            container.innerHTML = "";

            data.forEach(bill => {
                container.innerHTML += `
                    <div>
                        <h3>Bill #${bill.id}</h3>
                        <p>Total: ₹${bill.total}</p>
                        <p>${bill.items.join(", ")}</p>
                    </div><hr>
                `;
            });
        });
}