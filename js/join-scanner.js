let html5QrCode = null;

function startScanner() {

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },

        (decodedText) => {

            console.log("QR:", decodedText);

            try {
                // extract sessionId from URL
                const url = new URL(decodedText);
                const sessionId = url.searchParams.get("id");

                if (!sessionId) throw new Error();

                // stop scanner
                html5QrCode.stop().then(() => {

                    // redirect to join
                    window.location.href = `join.html?id=${sessionId}`;
                });

            } catch {
                alert("Invalid QR ❌");
            }
        },

        () => {}
    );
}

// 🔙 BACK
function goBack() {
    window.location.href = "group.html";
}

// 🚀 START
startScanner();