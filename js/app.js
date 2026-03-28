let scannedProduct = null;

// 🔒 Protect pages
const protectedPages = ["home.html", "store.html", "scanner.html", "cart.html", "payment.html", "bills.html"];

let currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
    let isLoggedIn = localStorage.getItem("loggedIn");
    if (!isLoggedIn) {
        window.location.href = "index.html";
    }
}

// 📝 REGISTER
function register() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Enter details");
        return;
    }

    fetch("https://billora-backend-9kyk.onrender.com/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.text())
    .then(data => {
        alert(data); // ✅ shows backend message
    })
    .catch(() => alert("Error"));
}

// 🔐 LOGIN
function login() {

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    // ✅ Validation
    if (!username || !password) {
        alert("Please enter username and password");
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

        // 🔥 HANDLE SERVER ERROR PROPERLY
        if (!res.ok) {
            console.error("Server Error:", text);
            alert("Login failed: " + text);
            throw new Error("Server error");
        }

        return text;
    })
    .then((data) => {

        console.log("Response:", data);

        alert(data); // show backend message

        if (data === "Login successful") {
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("currentUser", username);

            window.location.href = "home.html";
        }
    })
    .catch((err) => {
        console.error(err);
        alert("Server not responding or error occurred");
    });
}

// 🚪 LOGOUT
function logout() {
    localStorage.clear();
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

    if (!selectedStore) {
        alert("Select store");
        return;
    }

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

            if (existing) {
                existing.quantity++;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            updateTotal();
        });
}

// ➖ REMOVE QTY
function decreaseQty(code) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let item = cart.find(p => p.code === code);

    if (item) {
        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(p => p.code !== code);
        }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateTotal();
}

// ❌ REMOVE ITEM
function removeItem(code) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(p => p.code !== code);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// 💰 TOTAL
function updateTotal() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let total = 0;
    cart.forEach(item => total += item.price * item.quantity);

    let el = document.getElementById("totalAmount");
    if (el) el.innerText = total;
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

                <button onclick="decreaseQty('${item.code}')">➖</button>
                ${item.quantity}
                <button onclick="addToCart('${item.code}')">➕</button>

                <button onclick="removeItem('${item.code}')">Remove</button>
            </div><hr>
        `;
    });

    document.getElementById("cartItems").innerHTML = html;
    document.getElementById("cartTotal").innerText = total;
}

// 💳 GENERATE QR (NEW SYSTEM 🔥)
function generateQR() {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        alert("Cart empty");
        return;
    }

    let username = localStorage.getItem("currentUser");

    fetch("https://billora-backend-9kyk.onrender.com/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: username,
            items: cart.map(item => item.name),
            total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        })
    })
    .then(res => res.json())
    .then(data => {

        let cartId = data.id;

        let qrUrl = `https://billoraa.netlify.app/cart.html?id=${cartId}`;

        let container = document.getElementById("qrContainer");
        container.innerHTML = "";

        QRCode.toCanvas(qrUrl, function (err, canvas) {
            if (err) return alert("QR Error");
            container.appendChild(canvas);
        });

    });
}

// 🧾 LOAD BILLS
function loadBills() {

    let user = localStorage.getItem("currentUser");

    fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${user}`)
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

// 🔄 PAGE LOAD
window.onload = function () {

    if (currentPage === "cart.html") {
        loadCart();
    }

    if (currentPage === "bills.html") {
        loadBills();
    }

    if (currentPage === "scanner.html") {
        startScanner();
    }

}

// 💳 CHECKOUT (CASHIER)
function checkout() {

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    fetch(`https://billora-backend-9kyk.onrender.com/api/cart/checkout/${id}`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(() => {
        alert("Payment successful!");
        window.location.href = `bills.html?id=${id}`;
    });
}

// 🛒 GO TO CART
function goToCart() {
    window.location.href = "cart.html";
}

// 🔙 Go to scanner page
function goToScanner() {
    window.location.href = "scanner.html";
}

// 🧹 Clear cart
function clearCart() {
    localStorage.removeItem("cart");
    loadCart();
}

// 📷 START CAMERA SCANNER
function startScanner() {

    let isProcessing = false; // 🔥 prevent multiple scans

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
            readers: ["ean_reader", "code_128_reader", "upc_reader"]
        }
    }, function (err) {
        if (err) {
            alert("Camera error");
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function (data) {

        if (isProcessing) return; // 🔥 stop duplicate calls
        isProcessing = true;

        let code = data.codeResult.code;

        console.log("Scanned Code:", code);
        alert("Scanned Code: " + code);

        Quagga.stop();

        // 🔥 NORMALIZE CODE (REMOVE LEADING ZEROS)
        let normalizedCode = code.replace(/^0+/, "");

        fetch(`https://billora-backend-9kyk.onrender.com/api/products/${normalizedCode}`)
            .then(res => res.json())
            .then(product => {

                if (!product || !product.name) {
                    alert("Product not found in DB");
                    restartScanner();
                    return;
                }

                scannedProduct = product;

                document.getElementById("actionButtons").style.display = "block";
                document.getElementById("productBox").style.display = "block";
                document.getElementById("productName").innerText = product.name;
                document.getElementById("productPrice").innerText = product.price;

            })
            .catch(err => {
                console.error(err);
                alert("Error fetching product");
                restartScanner();
            });
    });
}
function restartScanner() {

    document.getElementById("productBox").style.display = "none";

    Quagga.offDetected(); // 🔥 remove old listeners
    Quagga.stop();

    startScanner(); // restart clean
}
// function startScanner() {

//     Quagga.init({
//         inputStream: {
//             name: "Live",
//             type: "LiveStream",
//             target: document.querySelector('#scanner'),
//             constraints: {
//                 facingMode: "environment"
//             }
//         },
//         decoder: {
//             readers: ["ean_reader", "code_128_reader", "upc_reader"]
//         }
//     }, function (err) {
//         if (err) {
//             alert("Camera error");
//             return;
//         }
//         Quagga.start();
//     });

//     Quagga.onDetected(function (data) {

//         let code = data.codeResult.code;

//         // 👉 Stop scanner after one scan
//         Quagga.stop();

//         // 👉 Fetch product from backend
//         fetch(`https://billora-backend-9kyk.onrender.com/api/products/${code}`)
//             .then(res => res.json())
//             .then(product => {

//                 scannedProduct = product;

//                 // 👉 Show product UI
//                 document.getElementById("productBox").style.display = "block";
//                 document.getElementById("productName").innerText = product.name;
//                 document.getElementById("productPrice").innerText = product.price;

//             })
//             .catch(() => {
//                 alert("Product not found");
//                 scanAgain();
//             });
//     });
// }