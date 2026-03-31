// 🔐 CASHIER PROTECTION
const cashierUser = JSON.parse(localStorage.getItem("user"));

if (!cashierUser || cashierUser.role !== "CASHIER") {
    alert("Access Denied ❌");
    window.location.href = "index.html";
}

// ------------------------------

const container = document.getElementById("ordersContainer");

let html5QrCode;

// 📷 START QR SCANNER
function startCashierScanner() {

    container.innerHTML = "<h3>📷 Scan Customer QR</h3>";

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

            // 🔥 HANDLE BOTH CASES
            if (decodedText.includes("id=")) {
                // QR contains URL
                const url = new URL(decodedText);
                billId = url.searchParams.get("id");
            } else {
                // QR contains only ID
                billId = decodedText;
            }

            if (!billId) {
                alert("Invalid QR ❌");
                return;
            }

            try {
                const res = await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${billId}`);
                const bill = await res.json();

                showBill(bill);

                html5QrCode.stop();

            } catch (err) {
                console.error(err);
                alert("Bill not found ❌");
            }
        },

        (errorMessage) => {
            // ignore scan errors
        }
    );
}

// 🧾 SHOW BILL
function showBill(bill) {

    container.innerHTML = `
        <h2>🧾 Bill #${bill.id}</h2>
        <p><b>User:</b> ${bill.username}</p>
        <p><b>Total:</b> ₹${bill.total}</p>
        <p><b>Status:</b> ${bill.status}</p>

        <h3>Items:</h3>
        <ul>
            ${bill.items.map(item => `<li>${item}</li>`).join("")}
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

async function payOnline(id) {
    await markPaid(id);
}

async function payCash(id) {
    await markPaid(id);
}

// 💰 MARK PAID
async function markPaid(id) {

    try {
        await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${id}/pay`, {
            method: "PUT"
        });

        alert("Payment Done ✅");

        restartScanner();

    } catch (err) {
        console.error(err);
        alert("Error updating payment ❌");
    }
}

// 🔁 RESTART SCANNER
function restartScanner() {

    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            container.innerHTML = "";
            startCashierScanner();
        });
    } else {
        startCashierScanner();
    }
}

// 🚪 LOGOUT
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

// 🚀 AUTO START
startCashierScanner();