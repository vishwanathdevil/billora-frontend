// 🔐 ADMIN CHECK
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "ADMIN") {
    alert("Access Denied ❌");
    window.location.href = "index.html";
}

const storeId = user.storeId;

// ➕ ADD PRODUCT
function addProduct() {

    const name = document.getElementById("name").value;
    const code = document.getElementById("code").value;
    const price = document.getElementById("price").value;

    if (!name || !code || !price) {
        alert("Enter all fields");
        return;
    }

    fetch("https://billora-backend-9kyk.onrender.com/api/products/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name,
            code,
            price,
            storeId
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("Product Added ✅");
        loadProducts();
    });
}

// 📦 LOAD PRODUCTS
function loadProducts() {

    fetch(`https://billora-backend-9kyk.onrender.com/api/products?storeId=${storeId}`)
        .then(res => res.json())
        .then(data => {

            const container = document.getElementById("productList");
            container.innerHTML = "";

            data.forEach(p => {
                container.innerHTML += `
    <div>
        <h4>${p.name}</h4>
        <p>Code: ${p.code}</p>
        <p>Price: ₹${p.price}</p>
        <button onclick="deleteProduct(${p.id})">Delete</button>
    </div><hr>
`;
            });
        });
}

// 🚪 LOGOUT
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// 🚀 AUTO LOAD
loadProducts();

function deleteProduct(id) {

    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${id}`, {
        method: "DELETE"
    })
    .then(() => {
        alert("Deleted ✅");
        loadProducts();
    });
}