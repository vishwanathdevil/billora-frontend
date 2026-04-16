const role = localStorage.getItem("role");

if (role !== "MAIN") {
    alert("Only main user can access payment ❌");
    window.location.href = "cart.html";
}

let stompClient = null;

const BASE = "https://billora-backend-9kyk.onrender.com";

// ===============================
// TOAST
// ===============================
function showToast(msg) {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.background = "#333";
        toast.style.color = "#fff";
        toast.style.padding = "10px 20px";
        toast.style.borderRadius = "8px";
        document.body.appendChild(toast);
    }

    toast.innerText = msg;
    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 2000);
}

// ===============================
// AUTH / ROLE
// ===============================
const role = localStorage.getItem("role");
const sessionId = localStorage.getItem("sessionId");
const user = JSON.parse(localStorage.getItem("user"));

// ❌ BLOCK CHILD FROM PAYMENT
if (role !== "MAIN") {
    alert("Only main user can access payment ❌");
    window.location.href = "cart.html";
}

// ===============================
// GET BILL ID FROM URL
// ===============================
const urlParams = new URLSearchParams(window.location.search);
let currentBillId = urlParams.get("id");

// ===============================
// PAYMENT PAGE LOGIC
// ===============================
if (document.getElementById("payBtn")) {

    const qrContainer = document.getElementById("qrContainer");
    const totalEl = document.getElementById("payTotal");

    // ===============================
    // FETCH MAIN CART (NO localStorage ❌)
    // ===============================
    fetch(`${BASE}/api/cart/main/${sessionId}`)
    .then(res => res.json())
    .then(cart => {

        let total = 0;
        cart.forEach(i => total += i.price * i.quantity);

        totalEl.innerText = total;

        // ===============================
        // CREATE BILL
        // ===============================
        if (!currentBillId) {
            return fetch(`${BASE}/api/bills`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user?.username || "Guest",
                    items: cart.map(i => ({
                        name: i.name,
                        quantity: i.quantity,
                        price: i.price,
                        owner: i.owner
                    })),
                    total: total
                })
            })
            .then(res => res.json())
            .then(bill => {
                currentBillId = bill.id;
                generateQR(qrContainer);
                startPolling();
            });
        } else {
            generateQR(qrContainer);
            startPolling();
        }

        // ===============================
        // PAY NOW
        // ===============================
        window.payNow = function () {

            const btn = document.getElementById("payBtn");
            btn.disabled = true;
            btn.innerText = "Processing...";

            fetch(`${BASE}/api/payment/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: total })
            })
            .then(res => res.json())
            .then(order => {

                const options = {
                    key: "rzp_test_SYKrnMrPo4MNDv",
                    amount: order.amount,
                    currency: "INR",
                    order_id: order.id,

                    handler: function (response) {

                        fetch(`${BASE}/api/payment/verify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                billId: currentBillId
                            })
                        }).catch(() => {
                            console.log("Verify fallback");
                        });
                    }
                };

                const rzp = new Razorpay(options);
                rzp.open();
            })
            .catch(() => {
                btn.disabled = false;
                btn.innerText = "Pay Now";
                alert("Payment failed ❌");
            });
        };

    });

    // ===============================
    // SOCKET
    // ===============================
    connectCustomerSocket();
}

// ===============================
// QR GENERATION
// ===============================
function generateQR(container) {
    const qrUrl = `${window.location.origin}/payment.html?id=${currentBillId}`;
    QRCode.toCanvas(qrUrl, { width: 250 }, function (err, canvas) {
        container.innerHTML = "";
        container.appendChild(canvas);
    });
}

// ===============================
// WEBSOCKET
// ===============================
function connectCustomerSocket() {

    const socket = new SockJS(`${BASE}/ws`);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function () {

        console.log("Customer WebSocket Connected ✅");

        stompClient.subscribe("/topic/bills", function (message) {

            const bill = JSON.parse(message.body);

            if (bill.id == currentBillId && bill.status === "PAYMENT_PENDING") {
                document.getElementById("payBtn").disabled = false;
            }

            if (bill.id == currentBillId && bill.status === "PAID") {

                // 🔥 CLEAR ALL CARTS AFTER PAYMENT
                fetch(`${BASE}/api/cart/session/${sessionId}`, {
                    method: "DELETE"
                });

                showToast("Payment Successful ✅");

                window.location.href = `bills.html?id=${currentBillId}`;
            }
        });
    });
}

// ===============================
// FALLBACK POLLING
// ===============================
function startPolling() {

    setInterval(async () => {

        if (!currentBillId) return;

        try {
            const res = await fetch(`${BASE}/api/bills/id/${currentBillId}`);
            const bill = await res.json();

            if (bill.status === "PAID") {

    fetch(`${BASE}/api/cart/session/${sessionId}`, {
        method: "DELETE"
    });

    showToast("Payment Successful ✅");

    const mode = localStorage.getItem("mode");
    const role = localStorage.getItem("role");

if (mode === "GROUP" && role === "MAIN") {
    window.location.href = `bills.html?id=${currentBillId}`;
} else {
    window.location.href = "home.html";
}
}

        } catch (err) {
            console.log("Polling retry...");
        }

    }, 3000);
}