console.log("APP JS LOADED");

// 🔐 SESSION CHECK
const appUser = JSON.parse(localStorage.getItem("user"));

const protectedPages = [
    "home.html",
    "store.html",
    "scanner.html",
    "cart.html",
    "payment.html",
    "bills.html"
];

let currentPage = window.location.pathname.split("/").pop();

// 🚫 Block access if not logged in
if (protectedPages.includes(currentPage)) {
    if (!appUser) {
        window.location.href = "index.html";
    }
}

// 🔁 Redirect if already logged in (ONLY for index page)
if (currentPage === "index.html" && appUser) {
    if (appUser.role === "CASHIER") {
        window.location.href = "cashier.html";
    } else {
        window.location.href = "home.html";
    }
}

// 📝 REGISTER
function register() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Enter username & password");
        return;
    }

    fetch("https://billora-backend-9kyk.onrender.com/api/users/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(user => {
        localStorage.setItem("user", JSON.stringify(user));
        alert("Registered & Logged in ✅");
        window.location.href = "home.html";
    });
}

// 🔑 LOGIN
function login() {

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Enter username & password");
        return;
    }

    fetch("https://billora-backend-9kyk.onrender.com/api/users/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(async (res) => {

        let text = await res.text();

        if (!res.ok) {
            alert(text); // 🔥 show exact error
            throw new Error(text);
        }

        let user = JSON.parse(text);

        // ✅ ONLY SESSION STORAGE (clean)
        localStorage.setItem("user", JSON.stringify(user));

        // ✅ Redirect
        if (user.role === "CASHIER") {
            window.location.href = "cashier.html";
        } else {
            window.location.href = "home.html";
        }
    })
    .catch(err => {
        console.error(err);
        alert("Login failed: " + err.message);
    });
}

// 🚪 LOGOUT
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

// 🏬 NAV
function goToStore() { window.location.href = "store.html"; }
function goToBills() { window.location.href = "bills.html"; }
function goHome() { window.location.href = "home.html"; }

// 🏬 STORE
let selectedStore = "";

function selectStore(storeName) {
    selectedStore = storeName;
    document.getElementById("trolleySection").style.display = "block";
}

function startShopping() {
    let trolley = document.getElementById("trolleyNumber").value.trim();

    localStorage.setItem("storeName", selectedStore);
    localStorage.setItem("trolleyNumber", trolley);
    localStorage.setItem("cart", JSON.stringify([]));

    window.location.href = "scanner.html";
}

// ➕ ADD TO CART
function addToCart(code) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${code}`)
        .then(res => res.json())
        .then(product => {

            let existing = cart.find(item => item.code === code);

            if (existing) existing.quantity++;
            else cart.push({ ...product, quantity: 1 });

            localStorage.setItem("cart", JSON.stringify(cart));
            loadCart();
        });
}

// 🛒 LOAD CART
function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let html = "";
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;

        html += `
            <div>
                <h4>${item.name}</h4>
                <p>₹ ${item.price}</p>
                <p>Qty: ${item.quantity}</p>
            </div><hr>
        `;
    });

    document.getElementById("cartItems").innerHTML = html;
    document.getElementById("cartTotal").innerText = total;
}

// 💳 GENERATE QR
function generateQR() {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        alert("Cart empty");
        return;
    }

    let user = JSON.parse(localStorage.getItem("user"));

    fetch("https://billora-backend-9kyk.onrender.com/api/bills", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: user.username,
            items: cart.map(i => i.name),
            total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
        })
    })
    .then(res => res.json())
    .then(bill => {

        let qrUrl = `${window.location.origin}/bills.html?id=${bill.id}`;

        QRCode.toCanvas(qrUrl, function (err, canvas) {
            document.getElementById("qrContainer").innerHTML = "";
            document.getElementById("qrContainer").appendChild(canvas);
        });
    });
}

// 🧾 LOAD BILLS
function loadBills() {

    let user = JSON.parse(localStorage.getItem("user"));

    fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${user.username}`)
        .then(res => res.json())
        .then(data => {

            let html = "";

            data.forEach(bill => {
                html += `
                    <div>
                        <h3>Bill ID: ${bill.id}</h3>
                        <p>Total: ₹ ${bill.total}</p>
                        <p>${bill.items.join(", ")}</p>
                        <hr>
                    </div>
                `;
            });

            document.getElementById("billsList").innerHTML = html;
        });
}

// 🔍 SCANNER VARIABLES
let scannedCode = null;

// 🎥 START SCANNER
function startScanner() {

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner'),
            constraints: {
                facingMode: "environment"
            }
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader"]
        }
    }, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function (result) {

        scannedCode = result.codeResult.code;

        console.log("Scanned:", scannedCode);

        // 🔥 Fetch product
        fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}`)
            .then(res => res.json())
            .then(product => {

                document.getElementById("productName").innerText = product.name;
                document.getElementById("productPrice").innerText = product.price;

                Quagga.stop(); // stop after scan
            })
            .catch(() => {
                alert("Product not found");
            });
    });
}

// ➕ ADD SCANNED PRODUCT
function addScannedToCart() {

    if (!scannedCode) {
        alert("Scan a product first");
        return;
    }

    addToCart(scannedCode);
    alert("Added to cart ✅");
}

// 🔁 RESTART SCANNER
function restartScanner() {
    scannedCode = null;
    document.getElementById("productName").innerText = "Scan a product";
    document.getElementById("productPrice").innerText = "0";

    startScanner();
}

// 🛒 GO TO CART
function goToCart() {
    window.location.href = "cart.html";
}

// 🚀 AUTO START SCANNER (ONLY ON SCANNER PAGE)
if (currentPage === "scanner.html") {
    startScanner();
}