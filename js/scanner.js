window.selectedStoreId = 1;

console.log("ZXING Scanner code loaded");

let scannedCode = null;
let isScanning = false;

const codeReader = new ZXing.BrowserMultiFormatReader();

function startScanner() {

    const scannerDiv = document.getElementById("scanner");
    if (!scannerDiv) return;

    isScanning = true;

    codeReader.reset(); // reset any previous state

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