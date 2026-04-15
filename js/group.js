// 📷 MEMBER FLOW
function scanGroup() {
    window.location.href = "join-scanner.html";
}console.log("GROUP JS LOADED");

function createGroupSession() {

    const user = JSON.parse(localStorage.getItem("user"));

    fetch("https://billora-backend-9kyk.onrender.com/api/session/create", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ createdBy: user.username })
    })
    .then(res => res.json())
    .then(data => {

        const sessionId = data.id;

        localStorage.setItem("sessionCreator", user.username);
        localStorage.setItem("sessionId", sessionId);
        localStorage.setItem("role", "MAIN");

        const qrUrl = `${window.location.origin}/join.html?id=${sessionId}`;

        document.body.innerHTML = `
            <h2>Scan QR</h2>
            <div id="qrBox"></div>
            <button onclick="startGroupShopping()">Continue</button>
        `;

        QRCode.toCanvas(qrUrl, (err, canvas) => {
            document.getElementById("qrBox").appendChild(canvas);
        });
    });
}

function startGroupShopping() {
    window.location.href = "store.html";
}