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
let lastScanTime = 0;


// 📷 START QR SCANNER (🔥 UPGRADED FOR LAPTOP)
function startCashierScanner() {

    container.innerHTML = `
        <h3>📷 Scan Customer QR</h3>
        <div id="reader" style="width:300px;margin:auto;"></div>
    `;

    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        html5QrCode.clear().catch(() => {});
        html5QrCode = null;
    }

    html5QrCode = new Html5Qrcode("reader");

    // 🔥 GET CAMERA LIST (IMPORTANT FOR LAPTOP)
    Html5Qrcode.getCameras().then(devices => {

        if (devices && devices.length) {

            // 👉 Prefer back camera, fallback to any
            const cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[0].id;

            html5QrCode.start(
                cameraId,
                {
                    fps: 15,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: 1.0,
                    disableFlip: false // 🔥 IMPORTANT FOR SCREEN QR
                },

                async (decodedText) => {

                    if (Date.now() - lastScanTime < 2000) return;
                    lastScanTime = Date.now();

                    console.log("QR:", decodedText);

                    let billId;

                    try {
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

                        if (bill.storeId !== storeId) {
                            alert("This bill does not belong to your store ❌");
                            resetScanner();
                            return;
                        }

                        if (html5QrCode) {
                            await html5QrCode.stop();
                            await html5QrCode.clear();
                            html5QrCode = null;
                        }

                        showBill(bill);

                    } catch (err) {
                        console.error(err);
                        alert("Bill not found ❌");
                        resetScanner();
                    }
                },

                () => {}
            );

        } else {
            document.getElementById("reader").innerText = "No camera found ❌";
        }

    }).catch(err => {
        console.error(err);
        document.getElementById("reader").innerText = "Camera access denied ❌";
    });
}


// 🔁 RESET SCANNER
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
    }, 1500);
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
        alert("UPI Error ❌");
    }
}

function showWaitingUI(id) {
    container.innerHTML = `
        <h2>🧾 Bill #${id}</h2>
        <h3 style="color:orange;">Waiting for customer payment ⏳</h3>
    `;
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

        } catch {}

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

    } catch {
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


// 🚀 START
startCashierScanner();


// ===== WEBSOCKET =====
let stompClient = null;

function connectWebSocket() {

    const socket = new SockJS("https://billora-backend-9kyk.onrender.com/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function () {

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