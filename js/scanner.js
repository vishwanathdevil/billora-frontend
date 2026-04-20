// =======================
// GLOBALS
// =======================
window.selectedStoreId = localStorage.getItem("selectedStoreId") || 1;

let scannedCode = null;
let isScanning = false;
let currentProduct = null;
let quantity = 1;

const codeReader = new ZXing.BrowserMultiFormatReader();


// =======================
// 🚀 START SCANNER
// =======================
function startScanner() {

    const videoElement = document.getElementById("scanner");

    if (!videoElement) {
        console.error("Video element missing");
        return;
    }

    try {
        codeReader.reset();
    } catch (e) {}

    isScanning = true;

    codeReader.decodeFromVideoDevice(null, videoElement, (result, err) => {

        if (result && isScanning) {

            scannedCode = result.text;
            isScanning = false;
            codeReader.reset();

            fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${window.selectedStoreId}`)
                .then(res => res.json())
                .then(product => {

                    currentProduct = product;

                    document.getElementById("productName").innerText = product.name;
                    document.getElementById("productPrice").innerText = product.price;

                    quantity = 1;
                    document.getElementById("quantity").innerText = quantity;

                    updateSubtotal();
                })
                .catch(() => alert("Product not found ❌"));
        }

        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error(err);
        }
    });
}


// =======================
// 🛒 ADD TO CART
// =======================
function addToCart() {

    const user = JSON.parse(localStorage.getItem("user"));
    let sessionId = localStorage.getItem("sessionId");

    // ✅ CREATE SESSION IF NOT EXISTS
    if (!sessionId) {
        sessionId = Date.now();
        localStorage.setItem("sessionId", sessionId);
        localStorage.setItem("role", "MAIN");
    }

    if (!currentProduct) {
        alert("Scan product first ❌");
        return;
    }

    fetch("https://billora-backend-9kyk.onrender.com/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: currentProduct.name,
            code: currentProduct.code,
            price: currentProduct.price,
            quantity: quantity,
            sessionId: Number(sessionId),
            owner: user?.username,
            role: "MAIN",
            completed: true
        })
    })
    .then(() => alert("Added to cart ✅"))
    .catch(() => alert("Failed ❌"));
}


// =======================
// 🔘 BUTTON FUNCTIONS (GLOBAL)
// =======================
window.addScannedToCart = function () {
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

window.goBack = function () {
    window.location.href = "store.html";
};


// =======================
// ➕ / ➖ QTY
// =======================
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
// 💰 SUBTOTAL
// =======================
function updateSubtotal() {
    const price = parseFloat(document.getElementById("productPrice").innerText) || 0;
    document.getElementById("subtotal").innerText = price * quantity;
}


// =======================
// 🚀 AUTO START
// =======================
document.addEventListener("DOMContentLoaded", function () {
    startScanner();
});