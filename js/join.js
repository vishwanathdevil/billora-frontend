const params = new URLSearchParams(window.location.search);
const sessionId = params.get("id");

// ❌ INVALID LINK
if (!sessionId) {
    alert("Invalid group link ❌");
    window.location.href = "index.html";
}

// 🔐 CHECK LOGIN (IMPORTANT)
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    alert("Please login first 🔐");
    window.location.href = "index.html";
}

// ✅ SAVE SESSION
localStorage.setItem("sessionId", sessionId);
localStorage.setItem("mode", "GROUP");
localStorage.setItem("role", "CHILD");

// ⏳ WAIT LOOP
function waitForStart() {

    fetch(`https://billora-backend-9kyk.onrender.com/api/session/${sessionId}`)
        .then(res => {
            if (!res.ok) throw new Error("Session not found");
            return res.json();
        })
        .then(data => {

            console.log("Session:", data);

            // ✅ START CONDITION
            if (data.status === "ACTIVE" && data.storeId) {

                localStorage.setItem("selectedStoreId", data.storeId);

                window.location.href = "scanner.html";
            } 
            else {
                setTimeout(waitForStart, 2000);
            }
        })
        .catch(err => {
            console.error(err);

            document.querySelector(".status").innerText = "Session not found ❌";

            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        });
}

// 🚀 START
waitForStart();