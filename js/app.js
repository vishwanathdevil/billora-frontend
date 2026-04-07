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
                        <p>${bill.items.join(", ")}</p>
                    </div><hr>
                `;
            });
        });
}

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