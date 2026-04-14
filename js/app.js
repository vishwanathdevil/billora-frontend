console.log("AUTH JS LOADED");

window.user = JSON.parse(localStorage.getItem("user"));

const currentPage = window.location.pathname.split("/").pop();

const protectedPages = [
    "home.html",
    "store.html",
    "scanner.html",
    "cart.html",
    "payment.html",
    "bills.html"
];

// Protect pages
if (protectedPages.includes(currentPage) && !window.user) {
    window.location.href = "index.html";
}

// Redirect if already logged in
if (currentPage === "index.html" && window.user) {
    window.location.href = window.user.role === "CASHIER" ? "cashier.html" : "home.html";
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

console.log("NAV JS LOADED");

function goHome() { window.location.href = "home.html"; }
function goToStore() { window.location.href = "store.html"; }
function goToScanner() { window.location.href = "scanner.html"; }
function goToCart() { window.location.href = "cart.html"; }
function goToBills() { window.location.href = "bills.html"; }
function goToGroup() { window.location.href = "group.html"; }

function goBack() {
    const page = window.location.pathname;

    if (page.includes("scanner.html")) {
        window.location.href = "store.html";
    } else if (page.includes("cart.html")) {
        window.location.href = "scanner.html";
    } else if (page.includes("payment.html")) {
        window.location.href = "cart.html";
    } else if (page.includes("bills.html")) {
        window.location.href = "home.html";
    } else {
        window.location.href = "home.html";
    }
}