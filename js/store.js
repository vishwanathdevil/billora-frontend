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
                    <button onclick="selectStore(${store.id})">
                        ${store.name}
                    </button>
                `;
            });
        });
}

function selectStore(storeId) {

    localStorage.setItem(
        "selectedStoreId",
        storeId
    );

    window.location.href = "scanner.html";
}

loadStores();