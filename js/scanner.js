// ✅ GLOBAL STORE ID
window.selectedStoreId = localStorage.getItem("selectedStoreId") || 1;

console.log("ZXING Scanner code loaded");

let scannedCode = null;
let isScanning = false;
let currentProduct = null;
let quantity = 1;

// ✅ ZXING READER
const codeReader = new ZXing.BrowserMultiFormatReader();

function startScanner() {

    const videoElement = document.getElementById("scanner");

    if (!videoElement) return;

    codeReader.reset();
    isScanning = true;

    codeReader.decodeFromVideoDevice(null, videoElement, (result, err) => {

        if (result && isScanning) {

            scannedCode = result.text;
            isScanning = false;
            codeReader.reset();

            fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${window.selectedStoreId}`)
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
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
    });
}

// =======================
// 🛒 ADD TO CART (FIXED)
// =======================
function addToCart() {

    const user = JSON.parse(localStorage.getItem("user"));
    let sessionId = localStorage.getItem("sessionId");

    // ✅ SOLO → AUTO CREATE SESSION
    if (!sessionId) {
        sessionId = Date.now();
        localStorage.setItem("sessionId", sessionId);
        localStorage.setItem("role", "MAIN");
        localStorage.setItem("mode", "SOLO");
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
            sessionId: Number(sessionId),   // ✅ ALWAYS SEND
            owner: user?.username,
            role: "MAIN"                   // ✅ SOLO = MAIN
        })
    })
    .then(() => alert("Added to cart ✅"))
    .catch(() => alert("Failed ❌"));
}

// =======================
// UI
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

function updateSubtotal() {
    const price = parseFloat(document.getElementById("productPrice").innerText) || 0;
    document.getElementById("subtotal").innerText = price * quantity;
}

window.goToCart = function () {
    window.location.href = "cart.html";
};

document.addEventListener("DOMContentLoaded", startScanner);