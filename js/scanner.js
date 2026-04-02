window.selectedStoreId = 1;

console.log("ZXING Scanner code loaded");

let scannedCode = null;
let isScanning = false;

const codeReader = new ZXing.BrowserMultiFormatReader();

function startScanner() {

    codeReader.reset(); // reset any previous state

    const scannerDiv = document.getElementById("scanner");
    if (!scannerDiv) return;

    isScanning = true;

    codeReader.decodeFromVideoDevice(null, "scanner", (result, err) => {

        if (result && isScanning) {

            scannedCode = result.text;
            console.log("Scanned:", scannedCode);

            // stop after successful scan
            isScanning = false;
            codeReader.reset();

            fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${selectedStoreId}`)
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
                .then(product => {

                    document.getElementById("productName").innerText = product.name;
                    document.getElementById("productPrice").innerText = product.price;
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

// ✅ GLOBAL FUNCTIONS (buttons)
window.addScannedToCart = function () {
    if (!scannedCode) return alert("Scan first");
    addToCart(scannedCode);
};

window.restartScanner = function () {
    scannedCode = null;
    isScanning = true;

    document.getElementById("productName").innerText = "Scan a product";
    document.getElementById("productPrice").innerText = "0";

    startScanner();
};

window.goToCart = function () {
    window.location.href = "cart.html";
};


// ✅ AUTO START
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded, starting scanner");
    startScanner();
});

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
