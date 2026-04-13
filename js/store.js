console.log("STORE JS LOADED");

function loadStores() {
    fetch("https://billora-backend-9kyk.onrender.com/api/stores")
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

    const sessionId = localStorage.getItem("sessionId");

    if (sessionId) {
        fetch("https://billora-backend-9kyk.onrender.com/api/session/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: sessionId,
                storeId: storeId
            })
        })
        .then(res => {
            if (!res.ok) throw new Error("Session start failed");
            return res.json();
        })
        .then(() => {
            localStorage.setItem("selectedStoreId", storeId);
            window.location.href = "scanner.html";
        })
        .catch(() => alert("Failed to start session ❌"));
    } else {
        localStorage.setItem("selectedStoreId", storeId);
        window.location.href = "scanner.html";
    }
}

if (window.location.pathname.includes("store.html")) {
    loadStores();
}