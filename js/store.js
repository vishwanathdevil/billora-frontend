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

    const mode = localStorage.getItem("mode");
    const sessionId = localStorage.getItem("sessionId");

    // 🟡 GROUP FLOW
    if (mode === "GROUP" && sessionId) {

        fetch("https://billora-backend-9kyk.onrender.com/api/session/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: sessionId,
                storeId: storeId
            })
        })
        .then(res => res.json())
        .then(() => {
            localStorage.setItem("selectedStoreId", storeId);
            window.location.href = "scanner.html";
        });

    } 
    else {

        // 🟢 SOLO FLOW (FORCED CLEAN)
        localStorage.setItem("mode", "SOLO");
        localStorage.removeItem("sessionId");
        localStorage.removeItem("sessionCreator");
        localStorage.setItem("role", "MAIN");

        localStorage.setItem("selectedStoreId", storeId);
        window.location.href = "scanner.html";
    }
}

if (window.location.pathname.includes("store.html")) {
    loadStores();
}
if (!localStorage.getItem("role")) {
    localStorage.setItem("role", "MAIN");
}