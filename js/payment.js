let stompClient = null;

// ===============================
// 🔥 GET BILL ID FROM URL
// ===============================
const urlParams = new URLSearchParams(window.location.search);
let currentBillId = urlParams.get("id");

// ===============================
// 💳 PAYMENT PAGE LOGIC
// ===============================
if (document.getElementById("payBtn")) {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const user = JSON.parse(localStorage.getItem("user"));

    const qrContainer = document.getElementById("qrContainer");
    const totalEl = document.getElementById("payTotal");

    let total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    totalEl.innerText = total;

    // ===============================
    // ✅ CREATE BILL ONLY IF NOT EXISTS
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

            QRCode.toCanvas(qrUrl, function (err, canvas) {
                qrContainer.innerHTML = "";
                qrContainer.appendChild(canvas);
            });
        });
    }

    // ===============================
    // 🔥 CONNECT WEBSOCKET
    // ===============================
    connectCustomerSocket();

    // ===============================
    // 💳 PAY NOW FUNCTION
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
                    });
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        });
    };
}

// ===============================
// 🔥 CUSTOMER WEBSOCKET (ONLY ONE)
// ===============================
function connectCustomerSocket() {

    const socket = new SockJS("https://billora-backend-9kyk.onrender.com/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function () {

        console.log("Customer WebSocket Connected ✅");

        stompClient.subscribe("/topic/bills", function (message) {

            const bill = JSON.parse(message.body);

            console.log("Bill update received:", bill);

            // 🔥 ENABLE PAY BUTTON
            if (bill.status === "PAYMENT_PENDING" && bill.id == currentBillId) {
                document.getElementById("payBtn").disabled = false;
            }

            // 🔥 PAYMENT SUCCESS
            if (bill.status === "PAID" && bill.id == currentBillId) {
                alert("Payment Successful ✅");
                window.location.href = "success.html";
            }
        });
    });
}