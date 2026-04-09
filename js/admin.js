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
        clearForm();
        loadProducts();
    });
}

// ===============================
// CLEAR FORM
// ===============================
function clearForm() {
    document.getElementById("name").value = "";
    document.getElementById("code").value = "";
    document.getElementById("price").value = "";
    document.getElementById("stock").value = "";
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

            data.forEach(p => {

                container.innerHTML += `
                <div class="product-item">
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
                `;
            });
        });
}

// ===============================
// UPDATE FIELD
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
    .then(() => loadProducts());
}

// ===============================
// SCANNER
// ===============================
function startAdminScanner() {

    const codeReader = new ZXing.BrowserMultiFormatReader();

    codeReader.decodeFromVideoDevice(null, "adminScanner", (result, err) => {

        if (result) {

            const scannedCode = result.text;

            document.getElementById("code").value = scannedCode;

            fetch(`${API}/${scannedCode}?storeId=${storeId}`)
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
                .then(product => {

                    document.getElementById("name").value = product.name;
                    document.getElementById("price").value = product.price;
                    document.getElementById("stock").value = product.stock;

                })
                .catch(() => {
                    // no alert → smooth UX
                });

            codeReader.reset();
        }
    });
}

// ===============================
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// INIT
loadProducts();