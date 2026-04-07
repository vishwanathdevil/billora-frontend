let stompClient = null;

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
    // CREATE BILL (ONLY IF NO ID)
    // ===============================
    if (!currentBillId) {
        fetch("https://billora-backend-9kyk.onrender.com/api/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: user?.username || "Guest",
                items: cart.map(i => i.name),
                total: total,
                storeId: selectedStoreId
            })
        })
        .then(res => res.json())
        .then(bill => {

            currentBillId = bill.id;

            const qrUrl = `${window.location.origin}/payment.html?id=${bill.id}`;

            QRCode.toCanvas(qrUrl,{width:250}, function (err, canvas) {
                qrContainer.innerHTML = "";
                qrContainer.appendChild(canvas);
            });
        });
    } else {
        // If already has billId (QR opened), still show QR
        const qrUrl = `${window.location.origin}/payment.html?id=${currentBillId}`;
        QRCode.toCanvas(qrUrl,{width:250}, function (err, canvas) {
            qrContainer.innerHTML = "";
            qrContainer.appendChild(canvas);
        });
    }

    // ===============================
    // CONNECT WEBSOCKET
    // ===============================
    connectCustomerSocket();

    // ===============================
    // PAY NOW
    // ===============================
    window.payNow = function () {

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

                    fetch("https://billora-backend-9kyk.onrender.com/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            billId: currentBillId
                        })
                    });
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
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

            // ENABLE BUTTON
            if (bill.id == currentBillId && bill.status === "PAYMENT_PENDING") {
                document.getElementById("payBtn").disabled = false;
            }

            // SUCCESS
            if (bill.id == currentBillId && bill.status === "PAID") {
                alert("Payment Successful ✅");
                window.location.href = `bills.html?id=${currentBillId}`;
            }
        });
    });
}