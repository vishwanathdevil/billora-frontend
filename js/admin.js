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
                <div class="item-card" style="display: flex; flex-direction: column; align-items: stretch; gap: 10px;">
                    <div class="flex-between">
                        <h4 style="margin: 0; font-size: 16px;">${p.name}</h4>
                        <button class="btn-icon" style="width: 32px; height: 32px; border-color: rgba(239, 68, 68, 0.2); color: var(--accent-danger);" onclick="deleteProduct(${p.id})">
                            <i data-lucide="trash-2" style="width: 16px;"></i>
                        </button>
                    </div>
                    
                    <div style="font-size: 12px; color: var(--text-secondary);">Code: ${p.code}</div>

                    <div class="grid-2 mt-1">
                        <div>
                            <label style="font-size: 12px; color: var(--text-secondary);">Price (₹)</label>
                            <input type="number" class="input-simple" style="margin-bottom:0; padding: 10px;" value="${p.price}" onchange="updateField(${p.id}, this.value, 'price')">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: var(--text-secondary);">Stock</label>
                            <input type="number" class="input-simple" style="margin-bottom:0; padding: 10px;" value="${p.stock}" onchange="updateField(${p.id}, this.value, 'stock')">
                        </div>
                    </div>
                </div>
                `;
            });

            if (window.lucide) {
                window.lucide.createIcons();
            }
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
                    // Product not found locally. Try fetching from OpenFoodFacts API.
                    fetch(`https://world.openfoodfacts.org/api/v0/product/${scannedCode}.json`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.status === 1 && data.product && data.product.product_name) {
                                document.getElementById("name").value = data.product.product_name;
                                // Highlight price field for the admin to type
                                document.getElementById("price").focus();
                            }
                        })
                        .catch(err => console.error("External lookup failed", err));
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