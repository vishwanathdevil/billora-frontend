const BASE = "https://billora-backend-9kyk.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "index.html";
}

let html5QrCode = null;

// ===============================
// PARENT FLOW
// ===============================
function startAsParent() {
    // Set modes
    localStorage.setItem("mode", "GROUP");
    localStorage.setItem("groupRole", "MAIN");
    
    // Parent selects store FIRST
    window.location.href = "store.html";
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
