// 🔐 CASHIER PROTECTION
const cashierUser = JSON.parse(localStorage.getItem("user"));

if (!cashierUser || cashierUser.role !== "CASHIER") {
    alert("Access Denied ❌");
    window.location.href = "index.html";
}

// ------------------------------

const container = document.getElementById("ordersContainer");

let html5QrCode = null;
let currentBillId = null;

// 📷 START QR SCANNER
function startCashierScanner() {

    container.innerHTML = "<h3>📷 Scan Customer QR</h3>";

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
                return;
            }

            if (!billId) {
                alert("Invalid QR ❌");
                return;
            }

            currentBillId = billId;

            try {
                const res = await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${billId}`);
                const bill = await res.json();

                await html5QrCode.stop(); // stop before showing bill
                showBill(bill);

            } catch (err) {
                console.error(err);
                alert("Bill not found ❌");
            }
        },

        () => {} // ignore scan errors
    );
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

        alert("UPI Approved ✅");

        resetFlow();

    } catch (err) {
        console.error(err);
        alert("UPI Payment Failed ❌");
    }
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
    resetFlow();
}

// 🚪 LOGOUT
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

// 🚀 AUTO START
startCashierScanner();