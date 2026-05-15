const BASE = "https://billora-backend-9kyk.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));

// ===============================
// LOAD CART TOTAL
// ===============================
async function loadPayment() {

    try {

        const res = await fetch(`${BASE}/api/cart/user/${user.username}`);
        const cart = await res.json();

        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
        });

        document.getElementById("payTotal").innerText = total;

        generateQR(total);

        // ===============================
        // PAY BUTTON
        // ===============================
        window.payNow = async function () {

            const btn = document.getElementById("payBtn");

            btn.disabled = true;
            btn.innerText = "Processing...";

            try {

                const orderRes = await fetch(`${BASE}/api/payment/create-order`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        amount: total
                    })
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

                        // ✅ SAVE BILL
                        await fetch(`${BASE}/api/bills`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                username: user.username,
                                total: total,
                                paymentId: response.razorpay_payment_id,
                                paymentMode: "ONLINE",
                                status: "PAID"
                            })
                        });

                        // ✅ CLEAR CART
                        await fetch(`${BASE}/api/cart/user/${user.username}`, {
                            method: "DELETE"
                        });

                        alert("Payment Successful ✅");

                        window.location.href = "bills.html";
                    }

                };

                const rzp = new Razorpay(options);

                rzp.open();

                btn.disabled = false;
                btn.innerText = "Pay Now";

            } catch (err) {

                console.log(err);

                btn.disabled = false;
                btn.innerText = "Pay Now";

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
function generateQR(total) {

    const qrContainer = document.getElementById("qrContainer");

    qrContainer.innerHTML = "";

    QRCode.toCanvas(
        `upi://pay?pa=test@upi&pn=Billora&am=${total}&cu=INR`,
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