let stompClient = null;

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
// GET BILL ID FROM URL
// ===============================
const urlParams = new URLSearchParams(window.location.search);
let currentBillId = urlParams.get("id");

// STORE ID
const selectedStoreId = localStorage.getItem("selectedStoreId") || 1;

// ===============================
// PAYMENT PAGE LOGIC
// ===============================
if (document.getElementById("payBtn")) {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const user = JSON.parse(localStorage.getItem("user"));

    const qrContainer = document.getElementById("qrContainer");
    const totalEl = document.getElementById("payTotal");

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    totalEl.innerText = total;

    // ===============================
    // CREATE BILL
    // ===============================
    if (!currentBillId) {
        fetch("https://billora-backend-9kyk.onrender.com/api/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: user?.username || "Guest",
                items: cart.map(i => ({
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price
                })),
                total: total,
                storeId: selectedStoreId
            })
        })
        .then(res => res.json())
        .then(bill => {

            currentBillId = bill.id;

            const qrUrl = `${window.location.origin}/payment.html?id=${bill.id}`;

            QRCode.toCanvas(qrUrl, { width: 250 }, function (err, canvas) {
                qrContainer.innerHTML = "";
                qrContainer.appendChild(canvas);
            });

            startPolling(); // ✅ fallback
        });
    } else {
        const qrUrl = `${window.location.origin}/payment.html?id=${currentBillId}`;
        QRCode.toCanvas(qrUrl, { width: 250 }, function (err, canvas) {
            qrContainer.innerHTML = "";
            qrContainer.appendChild(canvas);
        });

        startPolling(); // ✅ fallback
    }

    // ===============================
    // CONNECT WEBSOCKET
    // ===============================
    connectCustomerSocket();

    // ===============================
    // PAY NOW
    // ===============================
    window.payNow = function () {

        const btn = document.getElementById("payBtn");
        btn.disabled = true;
        btn.innerText = "Processing...";

        fetch("https://billora-backend-9kyk.onrender.com/api/payment/create-order", {
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

                    // 🔥 VERIFY PAYMENT
                    fetch("https://billora-backend-9kyk.onrender.com/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            billId: currentBillId
                        })
                    })
                    .then(() => {
                        // fallback polling will handle success
                        console.log("Verify sent");
                    })
                    .catch(() => {
                        console.log("Verify failed, polling fallback active");
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
}

// ===============================
// WEBSOCKET
// ===============================
function connectCustomerSocket() {

    const socket = new SockJS("https://billora-backend-9kyk.onrender.com/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function () {

        console.log("Customer WebSocket Connected ✅");

        stompClient.subscribe("/topic/bills", function (message) {

            const bill = JSON.parse(message.body);

            console.log("Bill update:", bill);

            if (bill.id == currentBillId && bill.status === "PAYMENT_PENDING") {
                document.getElementById("payBtn").disabled = false;
            }

            if (bill.id == currentBillId && bill.status === "PAID") {

                localStorage.removeItem("cart");

                showToast("Payment Successful ✅");

                window.location.href = `bills.html?id=${currentBillId}`;
            }
        });
    });
}

// ===============================
// 🔥 FALLBACK POLLING (CRITICAL FIX)
// ===============================
function startPolling() {

    setInterval(async () => {

        if (!currentBillId) return;

        try {
            const res = await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${currentBillId}`);
            const bill = await res.json();

            if (bill.status === "PAID") {

                localStorage.removeItem("cart");

                showToast("Payment Successful ✅");

                window.location.href = `bills.html?id=${currentBillId}`;
            }

        } catch (err) {
            console.log("Polling retry...");
        }

    }, 3000);
}