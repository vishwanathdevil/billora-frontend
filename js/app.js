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
    localStorage.setItem("storeId", user.storeId);

    if (user.role === "ADMIN") {
        window.location.href = "admin.html";
    } else if (user.role === "CASHIER") {
        window.location.href = "cashier.html";
    } else {
        window.location.href = "home.html";
    }
});
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
function goToBills() { window.location.href = "bills.html"; }

/* ================================
   🏬 STORE (FROM BACKEND)
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

function selectStore(id) {
    localStorage.setItem("storeId", id);
    window.location.href = "scanner.html";
}

// Auto load stores
if (currentPage === "store.html") loadStores();

/* ================================
   🛒 CART
================================ */

function addToCart(code) {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${code}?storeId=${selectedStoreId}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(product => {

            const existing = cart.find(i => i.code === product.code);

            if (existing) {
                existing.quantity++;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            alert("Added to cart ✅");
        })
        .catch(() => {
            console.log("Product not found once");
            alert("Product not found ❌");
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
    alert("Cart cleared");
    window.location.reload();
}

if (currentPage === "cart.html") loadCart();

/* ================================
   💳 PAYMENT
================================ */

if (currentPage === "payment.html") {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const user = JSON.parse(localStorage.getItem("user")); // ✅ FIX

    if (!cart.length) {
        alert("Cart empty ❌");
        window.location.href = "scanner.html";
    }

    const qrContainer = document.getElementById("qrContainer");
    const totalEl = document.getElementById("payTotal");

    let total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    totalEl.innerText = total;

    let currentBillId = null;
    let isFinished = false; // ✅ prevent multiple alerts

    // ✅ CREATE BILL
    fetch("https://billora-backend-9kyk.onrender.com/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: user?.username || "Guest",   // ✅ FIX
            items: cart.map(i => i.name),
            total: total,
            storeId: selectedStoreId
        })
    })
    .then(res => res.json())
    .then(bill => {

        currentBillId = bill.id;

        const qrUrl = `${window.location.origin}/payment.html?id=${bill.id}`;

        QRCode.toCanvas(qrUrl, function (err, canvas) {
            qrContainer.innerHTML = "";
            qrContainer.appendChild(canvas);
        });

        // ✅ POLLING (SAFE)
        const interval = setInterval(() => {

            if (isFinished) {
                clearInterval(interval);
                return;
            }

            fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${currentBillId}`)
                .then(res => res.json())
                .then(bill => {

                    // 💵 CASH
                    if (bill.paymentMode === "CASH") {
                        isFinished = true;
                        alert("Cash Payment Successful ✅");
                        finishPayment();
                    }

                    // 📱 UPI APPROVED
                    if (bill.paymentMode === "UPI") {
                        document.getElementById("payBtn").disabled = false;
                    }

                    // ✅ FINAL SUCCESS (after customer clicks pay)
                    if (bill.status === "PAID") {
                        isFinished = true;
                        alert("Payment Successful ✅");
                        finishPayment();
                    }

                })
                .catch(() => console.log("Polling error"));

        }, 3000);
    });


    // ✅ CUSTOMER CLICK PAY
    // function payNow() {
    //     fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${currentBillId}/pay/UPI`, {
    //         method: "PUT"
    //     }).then(() => {
    //         alert("Payment Successful ✅");
    //         finishPayment();
    //     });
    // }
function payNow() {

    const upiId = "test@upi"; // 🔥 replace with store UPI ID
    const name = "Billora Store";
    const amount = total;

    const upiUrl = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR`;

    // 🚀 open UPI apps
    window.location.href = upiUrl;
}

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

    let isProcessing = false; // 🔥 ADD THIS GLOBAL

Quagga.onDetected(res => {

    if (isProcessing) return; // 🚫 prevent multiple calls
    isProcessing = true;

    scannedCode = res.codeResult.code;

    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${selectedStoreId}`)
        .then(res => {

            console.log("SCANNED CODE:", scannedCode);
            console.log("STORE ID:", selectedStoreId);
            if (!res.ok) {
                throw new Error("Product not found");
            }

            return res.json();
        })
        .then(product => {

            document.getElementById("productName").innerText = product.name;
            document.getElementById("productPrice").innerText = product.price;

            Quagga.stop(); // ✅ stop scanner
        })
        .catch(() => {
            alert("Product not found ❌");

            // 🔥 allow scanning again AFTER alert
            setTimeout(() => {
                isProcessing = false;
            }, 1500);
        });
});
}

function addScannedToCart() {
    if (!scannedCode) return alert("Scan first");
    addToCart(scannedCode);
}

function restartScanner() {
    scannedCode = null;
    isProcessing = false; // reset processing flag
    startScanner();
}

if (currentPage === "scanner.html") startScanner();

/* ================================
   🧾 BILL HISTORY
================================ */

function loadBills() {

    fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${user.username}`)
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
                        <p>${bill.items.join(", ")}</p>
                    </div><hr>
                `;
            });
        });
}


//
function confirmPayment() {

    fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${currentBillId}/pay/UPI`, {
        method: "PUT"
    }).then(() => {
        alert("Payment Successful ✅");
        finishPayment();
    });
}