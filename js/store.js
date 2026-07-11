const BASE = "https://billora-backend-9kyk.onrender.com";

function loadStores() {

    fetch(`${BASE}/api/stores`)
        .then(res => res.json())
        .then(stores => {

            const container =
                document.getElementById("storeList");

            container.innerHTML = "";

            stores.forEach(store => {

                container.innerHTML += `
                    <div class="glass-card text-center" style="cursor: pointer; padding: 20px;" onclick="selectStore(${store.id})">
                        <div style="background: rgba(59, 130, 246, 0.1); width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
                            <i data-lucide="store" style="color: var(--accent-primary); width: 24px; height: 24px;"></i>
                        </div>
                        <h4 style="margin:0; font-size: 16px;">${store.name}</h4>
                    </div>
                `;
            });
            // Re-initialize icons for newly added elements
            if(window.lucide) {
                window.lucide.createIcons();
            }
        });
}

function selectStore(storeId) {

    localStorage.setItem("selectedStoreId", storeId);

    const mode = localStorage.getItem("mode");
    const role = localStorage.getItem("groupRole");
    const sessionId = localStorage.getItem("sessionId");

    if (mode === "GROUP" && role === "MAIN" && sessionId) {
        // Update session with storeId
        fetch(`${BASE}/api/session/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: sessionId,
                storeId: storeId
            })
        }).then(() => {
            window.location.href = "scanner.html";
        }).catch(err => {
            console.error(err);
            alert("Failed to start group session for this store.");
        });
    } else {
        window.location.href = "scanner.html";
    }
}

loadStores();