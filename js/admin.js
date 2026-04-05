const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "ADMIN") {
    alert("Access Denied ❌");
    window.location.href = "index.html";
}

const storeId = user.storeId;
const API = "https://billora-backend-9kyk.onrender.com/api/products";

// ===============================
// ADD PRODUCT
// ===============================
function addProduct() {

    const name = document.getElementById("name").value;
    const code = document.getElementById("code").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;

    if (!name || !code || !price || !stock) {
        alert("Enter all fields ❌");
        return;
    }

    fetch(`${API}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            code,
            price,
            stock,
            storeId
        })
    })
    .then(() => {
        alert("Product Added ✅");
        loadProducts();
    });
}

// ===============================
// LOAD PRODUCTS
// ===============================
function loadProducts() {

    fetch(`${API}?storeId=${storeId}`)
        .then(res => res.json())
        .then(data => {

    const container = document.getElementById("productList");
    container.innerHTML = "";

    if (!Array.isArray(data)) {
        console.error("API Error:", data);
        container.innerHTML = "Failed to load products ❌";
        return;
    }

    data.forEach(p => {

                container.innerHTML += `
                <div>
                    <h4>${p.name}</h4>
                    <p>Code: ${p.code}</p>

                    <p>
                        Price: 
                        <input value="${p.price}" onchange="updateField(${p.id}, this.value, 'price')">
                    </p>

                    <p>
                        Stock: 
                        <input value="${p.stock}" onchange="updateField(${p.id}, this.value, 'stock')">
                    </p>

                    <button onclick="deleteProduct(${p.id})">Delete</button>
                </div>
                <hr>
                `;
            });
        });
}

// ===============================
// UPDATE PRODUCT FIELD
// ===============================
function updateField(id, value, field) {

    fetch(`${API}/${id}`)
        .then(res => res.json())
        .then(product => {

            product[field] = Number(value);

            return fetch(`${API}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(product)
            });
        })
        .then(() => loadProducts());
}

// ===============================
// DELETE
// ===============================
function deleteProduct(id) {

    fetch(`${API}/${id}`, {
        method: "DELETE"
    })
    .then(() => {
        alert("Deleted ✅");
        loadProducts();
    });
}

// ===============================
// LOGOUT
// ===============================
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// ===============================
// INIT
// ===============================
loadProducts();

let adminScanner = null;

function startAdminScanner() {

    const codeReader = new ZXing.BrowserMultiFormatReader();

    codeReader.decodeFromVideoDevice(null, "adminScanner", (result, err) => {

        if (result) {

            const scannedCode = result.text;

            document.getElementById("code").value = scannedCode;

            // 🔥 FAST API CALL
            fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${storeId}`)
                .then(res => {
                    if (!res.ok) throw new Error("Not found");
                    return res.json();
                })
                .then(product => {

                    // ✅ AUTO FILL EVERYTHING
                    document.getElementById("name").value = product.name;
                    document.getElementById("price").value = product.price;

                    alert("Product auto loaded ✅");
                })
                .catch(() => {

                    // 🔥 IF NOT FOUND → CREATE FROM API
                    fetch(`https://billora-backend-9kyk.onrender.com/api/products/${scannedCode}?storeId=${storeId}`)
                        .then(res => res.json())
                        .then(product => {

                            document.getElementById("name").value = product.name || "";
                            document.getElementById("price").value = product.price || "";

                            alert("Fetched from global DB 🌍");
                        })
                        .catch(() => {
                            alert("Enter product manually ❌");
                        });
                });

            codeReader.reset();
        }
    });
}