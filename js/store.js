const BASE = "https://billora-backend-9kyk.onrender.com";

function loadStores() {
    fetch(`${BASE}/api/stores`)
        .then(res => res.json())
        .then(stores => {
            const container = document.getElementById("storeList");
            if (!container) return;

            container.innerHTML = "";

            stores.forEach(store => {
                container.innerHTML += `
                    <button onclick="selectStore(${store.id})">
                        ${store.name}
                    </button>
                `;
            });
        });
}

function selectStore(storeId) {

    // ✅ ALWAYS CREATE NEW SESSION (SOLO)
    const sessionId = Date.now();

    localStorage.setItem("sessionId", sessionId);
    localStorage.setItem("role", "MAIN");

    localStorage.setItem("selectedStoreId", storeId);

    window.location.href = "scanner.html";
}

if (window.location.pathname.includes("store.html")) {
    loadStores();
}