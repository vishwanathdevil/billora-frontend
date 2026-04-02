console.log("Scanner code loaded");

let scannedCode = null;
let isScannerRunning = false;
let isProcessing = false;

function startScanner() {

    const scannerDiv = document.getElementById("scanner");
    if (!scannerDiv) return;

    if (isScannerRunning) {
        Quagga.stop();
        Quagga.offDetected();
        isScannerRunning = false;
    }

    Quagga.init({
        inputStream: {
            type: "LiveStream",
            target: scannerDiv,
            constraints: {
                facingMode: "environment"
            }
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader"]
        }
    }, function (err) {

        if (err) {
            console.error("Quagga error:", err);
            return;
        }

        console.log("Camera started ✅");
        Quagga.start();
        isScannerRunning = true;
    });

    Quagga.offDetected();

    Quagga.onDetected(function (res) {

        if (isProcessing) return;
        isProcessing = true;

        scannedCode = res.codeResult.code;

        fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${selectedStoreId}`)
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(product => {

                document.getElementById("productName").innerText = product.name;
                document.getElementById("productPrice").innerText = product.price;

                Quagga.stop();
                isScannerRunning = false;
            })
            .catch(() => {
                alert("Product not found ❌");
                isProcessing = false;
            });
    });
}


// ✅ MAKE FUNCTIONS GLOBAL (VERY IMPORTANT)
window.addScannedToCart = function () {
    if (!scannedCode) return alert("Scan first");
    addToCart(scannedCode);
};

window.restartScanner = function () {
    scannedCode = null;
    isProcessing = false;
    startScanner();
};

window.goToCart = function () {
    window.location.href = "cart.html";
};


// ✅ AUTO START CAMERA
window.onload = function () {
    startScanner();
};
