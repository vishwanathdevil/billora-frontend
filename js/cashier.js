// 🔐 CASHIER PROTECTION
const cashierUser = JSON.parse(localStorage.getItem("user"));

if (!cashierUser || cashierUser.role !== "CASHIER") {
    alert("Access Denied ❌");
    window.location.href = "index.html";
}

const storeId = cashierUser.storeId;
// ------------------------------

const container = document.getElementById("ordersContainer");

let html5QrCode = null;
let currentBillId = null;
let lastScanTime = 0; // ✅ FIXED (global)

// 📷 START QR SCANNER
function startCashierScanner() {

    container.innerHTML = `
        <h3>📷 Scan Customer QR</h3>
        <div id="reader"></div>
    `;

    // clean previous instance
    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        html5QrCode.clear().catch(() => {});
        html5QrCode = null;
    }

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10, // ✅ optimized
            qrbox: { width: 250, height: 250 }
        },

        async (decodedText) => {

            // 🚫 prevent multiple scans
            if (Date.now() - lastScanTime < 2000) return;
            lastScanTime = Date.now();

            console.log("QR:", decodedText);

            let billId;

            try {
                // ✅ FIXED parsing (robust)
                if (decodedText.includes("id=")) {
                    const match = decodedText.match(/id=(\d+)/);
                    billId = match ? match[1] : null;
                } else {
                    billId = decodedText;
                }
            } catch {
                alert("Invalid QR ❌");
                resetScanner();
                return;
            }

            if (!billId) {
                alert("Invalid QR ❌");
                resetScanner();
                return;
            }

            currentBillId = billId;

            try {
                const res = await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${billId}`);

                if (!res.ok) throw new Error();

                const bill = await res.json();

                // 🏬 STORE VALIDATION
                if (bill.storeId !== storeId) {
                    alert("This bill does not belong to your store ❌");
                    resetScanner();
                    return;
                }

                // ✅ STOP CAMERA PROPERLY
                if (html5QrCode) {
                    await html5QrCode.stop();
                    await html5QrCode.clear(); // 🔥 IMPORTANT
                    html5QrCode = null;
                }

                showBill(bill);

            } catch (err) {
                console.error(err);
                alert("Bill not found ❌");
                resetScanner();
            }
        },

        () => {} // ignore scan errors
    );
}



// 🔁 RESET SCANNER SAFELY
function resetScanner() {

    currentBillId = null;

    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        html5QrCode.clear().catch(() => {});
        html5QrCode = null;
    }

    container.innerHTML = "<h3>🔄 Restarting scanner...</h3>";

    setTimeout(() => {
        startCashierScanner();
    }, 1500); // ✅ FIXED delay
}

// 🧾 SHOW BILL
function showBill(bill) {

    container.innerHTML = `
        <h2>🧾 Bill #${bill.id}</h2>
        <p><b>User:</b> ${bill.username || "Guest"}</p>
        <p><b>Total:</b> ₹${bill.total}</p>
        <p><b>Status:</b> ${bill.status}</p>

        <h3>Items:</h3>
        <ul>
            ${bill.items?.map(item => 
                `<li>${item.name} x${item.quantity} - ₹${item.price * item.quantity}</li>`
            ).join("")}
        </ul>

        ${
            bill.status === "PENDING"
                ? `
                <button onclick="payOnline(${bill.id})">📱 UPI Payment</button>
                <button onclick="payCash(${bill.id})">💵 Cash Payment</button>
                `
                : `<p style="color:green;">✔ Already Paid</p>`
        }

        <br><br>
        <button onclick="restartScanner()">🔁 Scan Another</button>
    `;
}

function showWaitingUI(id) {
    container.innerHTML = `
        <h2>🧾 Bill #${id}</h2>
        <h3 style="color:orange;">Waiting for customer payment ⏳</h3>

        <button onclick="cancelUPI()">❌ Cancel & Switch to Cash</button>
    `;
}

function cancelUPI() {
    alert("UPI Cancelled → Use Cash");
    restartScanner();
}

// 📱 UPI PAYMENT
async function payOnline(id) {

    try {

        await fetch(`https://billora-backend-9kyk.onrender.com/api/payment/start/${id}`, {
            method: "POST"
        });

        alert("Waiting for customer payment ⏳");

        showWaitingUI(id);
        startPaymentListener(id);

    } catch (err) {
        console.error(err);
        alert("UPI Error ❌");
    }
}

// polling
function startPaymentListener(id) {

    const interval = setInterval(async () => {

        try {
            const res = await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${id}`);
            const bill = await res.json();

            if (bill.status === "PAID") {

                clearInterval(interval);

                alert("Payment Successful ✅");

                resetFlow();
            }

        } catch (err) {
            console.error("Polling error:", err);
        }

    }, 2000);
}

// 💵 CASH PAYMENT
async function payCash(id) {

    try {
        await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${id}/pay/CASH`, {
            method: "PUT"
        });

        alert("Cash Payment Done ✅");

        resetFlow();

    } catch (err) {
        console.error(err);
        alert("Cash Payment Failed ❌");
    }
}

// 🔁 RESET FLOW
function resetFlow() {

    currentBillId = null;

    container.innerHTML = "<h3>🔄 Ready for next customer...</h3>";

    setTimeout(() => {
        startCashierScanner();
    }, 1500);
}

// 🔁 RESTART
function restartScanner() {

    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        html5QrCode.clear().catch(() => {});
        html5QrCode = null;
    }

    setTimeout(() => {
        startCashierScanner();
    }, 1000);
}

// 🚪 LOGOUT
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

// 🚀 AUTO START
startCashierScanner();

// ===== WEBSOCKET =====
let stompClient = null;

function connectWebSocket() {

    const socket = new SockJS("https://billora-backend-9kyk.onrender.com/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function () {

        console.log("Connected to WebSocket ✅");

        stompClient.subscribe("/topic/bills", function (message) {

            const bill = JSON.parse(message.body);

            if (bill.status === "PAID") {
                alert("Customer Paid ✅");
                resetFlow();
            }
        });
    });
}

connectWebSocket();