const BASE = "https://billora-backend-9kyk.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));

// ===============================
// LOAD CART TOTAL
// ===============================
async function loadPayment() {

    try {

        const mode = localStorage.getItem("mode");
        const role = mode === "GROUP" ? localStorage.getItem("groupRole") : "SOLO";
        
        let url = `${BASE}/api/cart/user/${user.username}`;
        if (mode === "GROUP" && role === "MAIN") {
            const sessionId = localStorage.getItem("sessionId");
            url = `${BASE}/api/cart/session/${sessionId}`;
        }
        
        const res = await fetch(url);
        const cart = await res.json();

        if (!cart || cart.length === 0) {
            alert("Cart is empty!");
            window.location.href = "cart.html";
            return;
        }

        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
        });

        document.getElementById("payTotal").innerText = total;

        // 🔥 CREATE PENDING BILL IMMEDIATELY
        const billRes = await fetch(`${BASE}/api/bills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: user.username,
                total: total,
                storeId: window.selectedStoreId || localStorage.getItem("selectedStoreId") || 1,
                items: cart.map(i => ({
                    name: i.name,
                    code: i.code,
                    price: i.price,
                    quantity: i.quantity
                }))
            })
        });

        const pendingBill = await billRes.json();

        // GENERATE CASHIER QR (ID)
        generateQR(pendingBill.id);

        // ===============================
        // PAY ONLINE BUTTON (Razorpay)
        // ===============================
        window.payNow = async function () {

            const btn = document.getElementById("payBtn");
            btn.disabled = true;
            btn.innerText = "Processing...";

            try {
                const orderRes = await fetch(`${BASE}/api/payment/create-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: total })
                });

                const order = await orderRes.json();

                const options = {
                    key: "rzp_test_SYKrnMrPo4MNDv",
                    amount: order.amount,
                    currency: "INR",
                    order_id: order.id,
                    name: "Billora",
                    description: "Bill Payment",
                    handler: async function (response) {

                        // ✅ UPDATE EXISTING BILL
                        await fetch(`${BASE}/api/bills/${pendingBill.id}/pay/ONLINE`, {
                            method: "PUT"
                        });

                        // ✅ CLEAR CART
                        let clearUrl = `${BASE}/api/cart/user/${user.username}`;
                        if (mode === "GROUP" && role === "MAIN") {
                            const sessionId = localStorage.getItem("sessionId");
                            clearUrl = `${BASE}/api/cart/session/${sessionId}`;
                        }
                        
                        await fetch(clearUrl, { method: "DELETE" });

                        alert("Payment Successful ✅");
                        window.location.href = `bills.html?id=${pendingBill.id}`;
                    }
                };

                const rzp = new Razorpay(options);
                rzp.open();

                btn.disabled = false;
                btn.innerText = "Pay Online";

            } catch (err) {
                console.log(err);
                btn.disabled = false;
                btn.innerText = "Pay Online";
                alert("Payment Failed ❌");
            }
        };

    } catch (err) {
        console.log(err);
        alert("Failed to load payment ❌");
    }
}

// ===============================
// QR GENERATOR
// ===============================
function generateQR(billId) {
    const qrContainer = document.getElementById("qrContainer");
    qrContainer.innerHTML = "";

    QRCode.toCanvas(
        `id=${billId}`,
        { width: 220 },
        function (err, canvas) {
            if (!err) {
                qrContainer.appendChild(canvas);
            }
        }
    );
}

// ===============================
// START
// ===============================
loadPayment();