// ✅ GLOBAL STORE ID
window.selectedStoreId = 1;

console.log("ZXING Scanner code loaded");

let scannedCode = null;
let isScanning = false;

// ✅ ZXING READER
const codeReader = new ZXing.BrowserMultiFormatReader();


// =======================
// 🚀 START SCANNER
// =======================
function startScanner() {

    codeReader.reset(); // stop previous camera

    const scannerDiv = document.getElementById("scanner");
    if (!scannerDiv) return;

    isScanning = true;

    codeReader.decodeFromVideoDevice(null, "scanner", (result, err) => {

        if (result && isScanning) {

            scannedCode = result.text;
            console.log("Scanned:", scannedCode);

            // stop scanning after success
            isScanning = false;
            codeReader.reset();

            fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${window.selectedStoreId}`)
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
                .then(product => {

                    document.getElementById("productName").innerText = product.name;
                    document.getElementById("productPrice").innerText = product.price;
                    quantity = 1;
                    document.getElementById("quantity").innerText = quantity;
                    updateSubtotal();
                })
                .catch(() => {
                    alert("Product not found ❌");
                });
        }

        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error(err);
        }
    });
}

window.increaseQty = function () {
    quantity++;
    document.getElementById("quantity").innerText = quantity;
    updateSubtotal();
};

window.decreaseQty = function () {
    if (quantity > 1) {
        quantity--;
        document.getElementById("quantity").innerText = quantity;
        updateSubtotal();
    }
};

// =======================
// 🛒 ADD TO CART
// =======================
function addToCart(code) {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${code}?storeId=${window.selectedStoreId}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(product => {

            const existing = cart.find(i => i.code === product.code);

            if (existing) {
                existing.quantity+= quantity;
            } else {
                cart.push({ ...product, quantity: quantity });
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            alert("Added to cart ✅");
        })
        .catch(() => {
            alert("Product not found ❌");
        });
}


// =======================
// 🌐 GLOBAL BUTTON FUNCTIONS
// =======================
window.addScannedToCart = function () {
    if (!scannedCode) return alert("Scan first");
    addToCart(scannedCode);
};

window.restartScanner = function () {
    scannedCode = null;
    isScanning = true;
    quantity = 1;

    document.getElementById("quantity").innerText = quantity;
    document.getElementById("subtotal").innerText = "0";
    document.getElementById("productName").innerText = "Scan a product";
    document.getElementById("productPrice").innerText = "0";

    startScanner();
};

window.goToCart = function () {
    window.location.href = "cart.html";
};


// =======================
// 📦 LOAD CART
// =======================
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

function updateSubtotal() {
    const price = parseFloat(document.getElementById("productPrice").innerText) || 0;
    const subtotal = price * quantity;

    document.getElementById("subtotal").innerText = subtotal;
}


// =======================
// 🧹 CLEAR CART
// =======================
function clearCart() {
    localStorage.removeItem("cart");
    alert("Cart cleared");
    window.location.reload();
}


// =======================
// 🚀 AUTO START
// =======================
document.addEventListener("DOMContentLoaded", function () {

    console.log("DOM loaded, starting scanner");

    startScanner();

    // detect current page safely
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "cart.html") {
        loadCart();
    }
});

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