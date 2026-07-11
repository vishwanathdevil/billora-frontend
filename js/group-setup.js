const BASE = "https://billora-backend-9kyk.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "index.html";
}

let html5QrCode = null;

// ===============================
// PARENT FLOW
// ===============================
async function startAsParent() {
    document.getElementById("roleSelection").style.display = "none";
    document.getElementById("parentView").style.display = "block";
    
    // Set modes
    localStorage.setItem("mode", "GROUP");
    localStorage.setItem("groupRole", "MAIN");
    
    try {
        const res = await fetch(`${BASE}/api/session/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                createdBy: user.username,
                status: "CREATED"
            })
        });
        
        const session = await res.json();
        localStorage.setItem("sessionId", session.id);
        
        document.getElementById("sessionIdDisplay").innerText = session.id;
        
        // Generate QR code
        const qrContainer = document.getElementById("sessionQrContainer");
        qrContainer.innerHTML = "";
        
        QRCode.toCanvas(`SESSION:${session.id}`, { width: 180 }, function (err, canvas) {
            if (!err) {
                qrContainer.appendChild(canvas);
            }
        });
        
    } catch (err) {
        console.error(err);
        alert("Failed to create session.");
    }
}

// ===============================
// CHILD FLOW
// ===============================
function startAsChild() {
    document.getElementById("roleSelection").style.display = "none";
    document.getElementById("childView").style.display = "block";
    
    localStorage.setItem("mode", "GROUP");
    localStorage.setItem("groupRole", "CHILD");
    
    html5QrCode = new Html5Qrcode("reader");
    
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            const cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[0].id;
            
            html5QrCode.start(
                cameraId,
                { fps: 15, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    if (decodedText.startsWith("SESSION:")) {
                        const sessionId = decodedText.split(":")[1];
                        
                        html5QrCode.stop().then(async () => {
                            localStorage.setItem("sessionId", sessionId);
                            
                            try {
                                const res = await fetch(`${BASE}/api/session/${sessionId}`);
                                const session = await res.json();
                                
                                if (session.storeId) {
                                    localStorage.setItem("selectedStoreId", session.storeId);
                                    alert("Successfully joined session " + sessionId);
                                    window.location.href = "scanner.html";
                                } else {
                                    alert("Parent hasn't selected a store yet. Please wait and scan again!");
                                    startAsChild(); // restart scanner
                                }
                            } catch (err) {
                                alert("Failed to join session. Please try again.");
                                startAsChild();
                            }
                        });
                    }
                },
                () => {}
            );
        }
    }).catch(err => {
        console.error(err);
        alert("Camera access denied.");
    });
}
