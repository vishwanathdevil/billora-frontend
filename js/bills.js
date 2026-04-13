console.log("BILLS JS LOADED");

const user = JSON.parse(localStorage.getItem("user"));
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const itemsList = document.getElementById("items");
const usernameEl = document.getElementById("username");
const totalEl = document.getElementById("total");
const statusEl = document.getElementById("status");

// ===============================
// 🔥 CASE 1: SINGLE BILL
// ===============================
function loadSingleBill(billId) {

    fetch(`https://billora-backend-9kyk.onrender.com/api/bills/id/${billId}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {

            usernameEl.innerText = data.username || "-";
            totalEl.innerText = data.total || 0;
            statusEl.innerText = data.status || "-";

            itemsList.innerHTML = "";

            (data.items || []).forEach(item => {

                const name = item.name || "Unknown";
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;

                const li = document.createElement("li");
                li.innerText = `${name} x${qty} - ₹${price * qty}`;
                itemsList.appendChild(li);
            });
        })
        .catch(() => alert("Bill not found ❌"));
}

// ===============================
// 🔥 CASE 2: ALL USER BILLS
// ===============================
function loadAllBills() {

    fetch(`https://billora-backend-9kyk.onrender.com/api/bills/user/${user.username}`)
        .then(res => res.json())
        .then(data => {

            usernameEl.innerText = user.username;
            itemsList.innerHTML = "";

            let total = 0;

            if (!Array.isArray(data)) {
                console.error("Invalid response:", data);
                return;
            }

            data.forEach(bill => {

                total += Number(bill.total) || 0;

                const li = document.createElement("li");
                li.innerText = `Bill #${bill.id} - ₹${bill.total}`;
                li.style.cursor = "pointer";

                li.onclick = () => {
                    window.location.href = `bills.html?id=${bill.id}`;
                };

                itemsList.appendChild(li);
            });

            totalEl.innerText = total;
            statusEl.innerText = "All Bills";
        })
        .catch(err => console.error(err));
}

// ===============================
// 🚀 INIT
// ===============================
if (window.location.pathname.includes("bills.html")) {

    if (id) {
        loadSingleBill(id);
    } else {
        loadAllBills();
    }
}