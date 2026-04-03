console.log("APP JS LOADED");
console.log("JS FILE LOADED");

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

    cart.forEach((item, index) => {

        const price = Number(item.price);
        const qty = Number(item.quantity);

        const itemTotal = price * qty;
        total += itemTotal;

        cartItems.innerHTML += `
            <div>
                <h4>${item.name}</h4>
                <p>₹ ${price}</p>

                <div>
                    <button onclick="decreaseCartQty(${index})">-</button>
                    <span>${qty}</span>
                    <button onclick="increaseCartQty(${index})">+</button>
                </div>

                <p>Subtotal: ₹ ${itemTotal}</p>
            </div><hr>
        `;
    });

    cartTotal.innerText = total;
}
window.increaseCartQty = function (index) {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart[index].quantity++;

    localStorage.setItem("cart", JSON.stringify(cart));

    loadCart(); // 🔥 refresh UI
};

window.decreaseCartQty = function (index) {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        // remove item if qty = 1
        cart.splice(index, 1);
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    loadCart(); // 🔥 refresh UI
};


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

function payNow() {

    fetch("https://billora-backend-9kyk.onrender.com/api/payment/create-order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            amount: total
        })
    })
    .then(res => res.json())
    .then(order => {

        const options = {
            key: "rzp_test_SYKrnMrPo4MNDv",
            amount: order.amount,
            currency: "INR",
            name: "Billora",
            description: "Store Payment",
            order_id: order.id,

            handler: function (response) {

                // 🔥 STEP 1: VERIFY PAYMENT WITH BACKEND
                fetch("https://billora-backend-9kyk.onrender.com/api/payment/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    })
                })
                .then(res => res.json())
                .then(data => {

                    if (data.status === "success") {

                        // 🔥 STEP 2: UPDATE BILL ONLY AFTER VERIFIED PAYMENT
                        fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${currentBillId}/pay/UPI`, {
                            method: "PUT"
                        })
                        .then(() => {
                            alert("Payment Successful ✅");
                            finishPayment();
                        });

                    } else {
                        alert("Payment verification failed ❌");
                    }
                })
                .catch(() => {
                    alert("Verification error ❌");
                });
            },

            modal: {
                ondismiss: function () {
                    console.log("Payment popup closed");
                }
            },

            theme: {
                color: "#3399cc"
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    })
    .catch(() => {
        alert("Order creation failed ❌");
    });
}

// ===== SCANNER CODE START =====

// ===== SCANNER CODE END =====
// if (currentPage === "scanner.html") startScanner();

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
}