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

        const btn = document.getElementById("payBtn");
        btn.disabled = true;
        btn.innerText = "Waiting for Cashier...";
        
        let paymentTriggered = false;

        // ===============================
        // POLL BILL STATUS
        // ===============================
        const interval = setInterval(async () => {
            if (paymentTriggered) return; // Stop polling if Razorpay is open
            
            try {
                const statusRes = await fetch(`${BASE}/api/bills/id/${pendingBill.id}`);
                const updatedBill = await statusRes.json();
                
                // If Cashier authorized Online Payment
                if (updatedBill.status === "WAITING" && btn.disabled) {
                    btn.disabled = false;
                    btn.innerText = "Pay Online";
                }
                
                // If Cashier received Cash
                if (updatedBill.status === "PAID") {
                    clearInterval(interval);
                    
                    // ✅ CLEAR CART
                    let clearUrl = `${BASE}/api/cart/user/${user.username}`;
                    if (mode === "GROUP" && role === "MAIN") {
                        const sessionId = localStorage.getItem("sessionId");
                        clearUrl = `${BASE}/api/cart/session/${sessionId}`;
                    }
                    await fetch(clearUrl, { method: "DELETE" });

                    if (window.Swal) {
                        Swal.fire({
                            title: 'Payment Successful',
                            text: 'Your payment was confirmed by the cashier.',
                            icon: 'success',
                            confirmButtonColor: 'var(--accent-primary)',
                            background: 'var(--bg-glass)',
                            color: 'var(--text-primary)'
                        }).then(() => {
                            window.location.href = `bills.html?id=${pendingBill.id}`;
                        });
                    } else {
                        alert("Payment Confirmed by Cashier ✅");
                        window.location.href = `bills.html?id=${pendingBill.id}`;
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000);

        // ===============================
        // PAY ONLINE BUTTON (Razorpay)
        // ===============================
        window.payNow = async function () {
            paymentTriggered = true;
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

                        if (window.Swal) {
                            Swal.fire({
                                title: 'Payment Successful',
                                text: 'Your online payment was successful.',
                                icon: 'success',
                                confirmButtonColor: 'var(--accent-primary)',
                                background: 'var(--bg-glass)',
                                color: 'var(--text-primary)'
                            }).then(() => {
                                window.location.href = `bills.html?id=${pendingBill.id}`;
                            });
                        } else {
                            alert("Payment Successful ✅");
                            window.location.href = `bills.html?id=${pendingBill.id}`;
                        }
                    }
                };

                const rzp = new Razorpay(options);
                rzp.open();

                btn.disabled = false;
                btn.innerText = "Pay Online";

            } catch (err) {
                console.log(err);
                paymentTriggered = false;
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