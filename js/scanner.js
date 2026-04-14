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

    const videoElement = document.getElementById("scanner");

    if (!videoElement) {
        console.error("Video element not found");
        return;
    }

    codeReader.reset();

    isScanning = true;

    codeReader.decodeFromVideoDevice(
        null,
        videoElement, // ✅ PASS ELEMENT NOT STRING
        (result, err) => {

            if (result && isScanning) {

                scannedCode = result.text;
                console.log("Scanned:", scannedCode);

                isScanning = false;
                codeReader.reset();

                fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${window.selectedStoreId}`)
                    .then(res => {
                        if (!res.ok) throw new Error();
                        return res.json();
                    })
                    .then(product => {

                        currentProduct = product; // 🔥 SAVE CURRENT PRODUCT

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
        }
    );
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
// 🛒 ADD TO CART (UPDATED FOR SHARED CART)
// =======================
let currentProduct = null; // 🔥 ADD AT TOP

function addToCart() {

    const sessionId = localStorage.getItem("sessionId");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!sessionId) {
        alert("Session not found ❌");
        return;
    }

    if (!currentProduct) {
        alert("Scan product first ❌");
        return;
    }

    fetch("https://billora-backend-9kyk.onrender.com/api/cart", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: currentProduct.name,
            code: currentProduct.code,
            price: currentProduct.price,
            quantity: quantity,
            sessionId,
            owner: user?.username
        })
    })
    .then(() => {
        alert("Added to cart ✅");
    })
    .catch(() => {
        alert("Failed ❌");
    });
}

// =======================
// 🌐 GLOBAL BUTTON FUNCTIONS
// =======================
window.addScannedToCart = function () {
    if (!currentProduct)
        return alert("Scan first");
    addToCart();
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