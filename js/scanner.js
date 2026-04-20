function addToCart() {

    const user = JSON.parse(localStorage.getItem("user"));
    const sessionId = localStorage.getItem("sessionId");

    if (!sessionId) {
        alert("Session missing ❌");
        return;
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
            completed: true   // ✅ IMPORTANT (so it shows in main cart)
        })
    })
    .then(() => alert("Added to cart ✅"))
    .catch(() => alert("Failed ❌"));
}
// ✅ ADD TO CART
window.addScannedToCart = function () {
    addToCart();
};

// ✅ RESTART
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

// ✅ GO TO CART
window.goToCart = function () {
    window.location.href = "cart.html";
};

// ✅ BACK
window.goBack = function () {
    window.location.href = "store.html";
};
document.addEventListener("DOMContentLoaded", function () {
    startScanner();
});