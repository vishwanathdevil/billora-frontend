// 🔐 CASHIER PROTECTION
const cashierUser = JSON.parse(localStorage.getItem("user"));

if (!cashierUser || cashierUser.role !== "CASHIER") {
    alert("Access Denied ❌");
    window.location.href = "index.html";
}

// ------------------------------

const container = document.getElementById("ordersContainer");

// 🔹 Fetch all orders
async function loadOrders() {
    try {
        const res = await fetch("https://billora-backend-9kyk.onrender.com/api/bills");
        const orders = await res.json();

        container.innerHTML = "";

        orders.forEach(order => {
            const div = document.createElement("div");
            div.className = "order-card";

            div.innerHTML = `
                <h3>Order #${order.id}</h3>
                <p>User: ${order.username}</p>
                <p>Total: ₹${order.total}</p>
                <p style="color:${order.status === 'PAID' ? 'green' : 'red'}">
                    Status: ${order.status}
                </p>
                ${
                    order.status === "PENDING"
                        ? `<button onclick="markPaid(${order.id})">Mark as Paid</button>`
                        : `<p style="color: green;">✔ Paid</p>`
                }
            `;

            container.appendChild(div);
        });

    } catch (err) {
        console.error("Error loading orders:", err);
    }
}

// 🔹 Mark order as paid
async function markPaid(id) {
    try {
        await fetch(`https://billora-backend-9kyk.onrender.com/api/bills/${id}/pay`, {
            method: "PUT"
        });

        alert("Payment marked as PAID ✅");
        loadOrders();

    } catch (err) {
        console.error("Error updating payment:", err);
    }
}

// 🔹 Auto load
loadOrders();
setInterval(loadOrders, 5000);

// 🚪 Logout
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}