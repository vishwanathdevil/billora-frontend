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


async function stopScannerSafe() {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
        } catch (e) {}
        try {
            await html5QrCode.clear();
        } catch (e) {}
        html5QrCode = null;
    }
}

// 📷 START QR SCANNER (🔥 UPGRADED FOR LAPTOP)
async function startCashierScanner() {

    await stopScannerSafe();

    container.innerHTML = `
        <div class="glass-card text-center mb-3">
            <h3 class="mb-3">📷 Scan Customer QR</h3>
            <div id="reader" style="width:100%; max-width:300px; margin:auto; border-radius:12px; overflow:hidden; border:2px solid var(--accent-primary);"></div>
        </div>
    `;

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

                        await stopScannerSafe();

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
async function resetScanner() {

    currentBillId = null;

    await stopScannerSafe();

    container.innerHTML = "<h3>🔄 Restarting scanner...</h3>";

    setTimeout(() => {
        startCashierScanner();
    }, 1500);
}


// 🧾 SHOW BILL
function showBill(bill) {

    container.innerHTML = `
        <div class="glass-card mb-3">
            <h2 style="font-size: 22px;" class="mb-2">🧾 Bill #${bill.id}</h2>
            <div class="flex-between mb-1" style="border-bottom: 1px solid var(--glass-border); padding-bottom:10px;">
                <span style="color:var(--text-secondary);">Customer:</span> 
                <span style="font-weight:600;">${bill.username || "Guest"}</span>
            </div>
            <div class="flex-between mb-1" style="border-bottom: 1px solid var(--glass-border); padding-bottom:10px;">
                <span style="color:var(--text-secondary);">Status:</span> 
                <span style="font-weight:600; color: ${bill.status === 'PAID' ? 'var(--accent-success)' : 'var(--accent-danger)'}">${bill.status}</span>
            </div>
            
            <h3 class="mt-3 mb-2" style="font-size:16px;">Items (${bill.items?.length || 0}):</h3>
            <div style="max-height: 200px; overflow-y: auto; padding-right: 5px;">
                ${bill.items?.map(item => `
                    <div class="item-card mb-1">
                        <div style="flex:1;">
                            <div style="font-weight:600; font-size:14px;">${item.name}</div>
                            <div style="font-size:12px; color:var(--text-secondary);">₹${item.price} &times; ${item.quantity}</div>
                        </div>
                        <div style="font-weight:700;">₹${item.price * item.quantity}</div>
                    </div>
                `).join("")}
            </div>

            <div class="flex-between mt-3 mb-3" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: var(--radius-sm);">
                <span style="font-weight: 700;">Total Amount:</span>
                <span style="color: var(--accent-success); font-weight: 800; font-size: 24px;">₹${bill.total}</span>
            </div>

            ${
                bill.status === "PENDING"
                    ? `
                    <div class="grid-2">
                        <button class="btn btn-primary" onclick="payOnline(${bill.id})"><i data-lucide="smartphone"></i> UPI / Online</button>
                        <button class="btn btn-success" onclick="payCash(${bill.id})"><i data-lucide="banknote"></i> Cash Received</button>
                    </div>
                    `
                    : `<div style="text-align:center; padding:15px; background: rgba(16, 185, 129, 0.1); color: var(--accent-success); border-radius: 8px; font-weight: 700;"><i data-lucide="check-circle" style="vertical-align: middle; margin-right:5px;"></i> Already Paid</div>`
            }
            
            <button class="btn btn-secondary mt-3" onclick="restartScanner()"><i data-lucide="refresh-cw"></i> Scan Next Customer</button>
        </div>
    `;
    if(window.lucide) window.lucide.createIcons();
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
        <div class="glass-card text-center mb-3">
            <h2 class="mb-2">🧾 Bill #${id}</h2>
            <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: var(--radius-sm); color: #f59e0b;">
                <div class="spinner" style="border-top-color: #f59e0b; margin: 0 auto 15px auto;"></div>
                <h3 style="margin:0;">Waiting for customer payment ⏳</h3>
                <p style="font-size:12px; margin-top:5px; color:var(--text-secondary);">Ask customer to check their phone</p>
            </div>
            <button class="btn btn-secondary mt-3" onclick="restartScanner()">Cancel & Scan Again</button>
        </div>
    `;
}


// polling
function startPaymentListener(id) {

    const interval = setInterval(async () => {

        if (currentBillId != id) {
            clearInterval(interval);
            return;
        }

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

    container.innerHTML = `
        <div class="glass-card text-center mb-3">
            <div class="spinner" style="margin: 0 auto 15px auto;"></div>
            <h3>🔄 Ready for next customer...</h3>
        </div>
    `;

    setTimeout(() => {
        startCashierScanner();
    }, 1500);
}


// 🔁 RESTART
async function restartScanner() {

    await stopScannerSafe();

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

            if (currentBillId && parseInt(bill.id) === parseInt(currentBillId) && bill.status === "PAID") {
                alert("Customer Paid ✅");
                resetFlow();
            }
        });
    });
}

connectWebSocket();