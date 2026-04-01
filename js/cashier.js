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

// 📷 START QR SCANNER
let isScanning = true;

function startCashierScanner() {

    container.innerHTML = "<h3>📷 Scan Customer QR</h3>";

    // 🔥 reset flags
    isScanning = true;

    // clean previous instance
    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        html5QrCode = null;
    }

    html5QrCode = new Html5Qrcode("ordersContainer");

    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },

        async (decodedText) => {

            // 🚫 prevent multiple scans
            if (!isScanning) return;
            isScanning = false;

            console.log("QR:", decodedText);

            let billId;

            try {
                if (decodedText.includes("id=")) {
                    const url = new URL(decodedText);
                    billId = url.searchParams.get("id");
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

                console.log("Bill Store:", bill.storeId, "Cashier Store:", storeId);

                // 🏬 STORE VALIDATION
                if (bill.storeId !== storeId) {
                    alert("This bill does not belong to your store ❌");
                    resetScanner();
                    return;
                }

                // ✅ stop scanner safely
                if (html5QrCode) {
                    try {
                        await html5QrCode.stop();
                    } catch {}
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
        html5QrCode = null;
    }

    setTimeout(() => {
        startCashierScanner();
    }, 1000);
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
            ${bill.items?.map(item => `<li>${item}</li>`).join("") || "<li>No items</li>"}
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

// 📱 UPI PAYMENT (Approve only)
async function payOnline(id) {

    try {
        await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${id}/pay/UPI`, {
            method: "PUT"
        });

        alert("Waiting for customer payment ⏳");

        // ❌ DO NOT RESET HERE
        // resetFlow();  ← REMOVE THIS

        startPaymentListener(id); // ✅ start waiting

    } catch (err) {
        console.error(err);
        alert("UPI Error ❌");
    }
}

// payment listener (polling)
function startPaymentListener(id) {

    const interval = setInterval(async () => {

        try {
            const res = await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${id}`);
            const bill = await res.json();

            if (bill.status === "PAID") {

                clearInterval(interval);

                alert("Payment Successful ✅");

                resetFlow(); // ✅ NOW reset scanner
            }

        } catch (err) {
            console.error("Polling error:", err);
        }

    }, 2000); // every 2 sec
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

// 🔁 RESET FLOW (BEST PRACTICE)
function resetFlow() {

    currentBillId = null;

    container.innerHTML = "<h3>🔄 Ready for next customer...</h3>";

    setTimeout(() => {
        startCashierScanner();
    }, 1000);
}

// 🔁 RESTART MANUAL
    function restartScanner() {

    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        html5QrCode = null;
    }

    setTimeout(() => {
        startCashierScanner();
    }, 500);
}

// 🚪 LOGOUT
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

// 🚀 AUTO START
startCashierScanner();