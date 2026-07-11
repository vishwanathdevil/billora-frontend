const BASE_URL = "https://billora-backend-9kyk.onrender.com";

function showPopup(title, text, icon) {
    if (window.Swal) {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonColor: 'var(--accent-primary)',
            confirmButtonText: 'Okay',
            background: 'var(--bg-glass)',
            color: 'var(--text-primary)',
            customClass: { popup: 'glass-card' }
        });
    } else {
        alert(title + ": " + text);
    }
}

function showLoader(state) {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = state ? "flex" : "none";
    }
}

async function sendOtp() {
    const number = document.getElementById("number").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!username || !password || !number) {
        return showPopup("Missing Details", "Username, Password, and Mobile Number are required.", "warning");
    }

    if (password !== confirmPassword) {
        return showPopup("Password Mismatch", "The passwords do not match. Please try again.", "error");
    }

    if (number.length < 10) {
        return showPopup("Invalid Number", "Please enter a valid mobile number.", "warning");
    }

    const btn = document.getElementById("sendOtpBtn");
    btn.disabled = true;
    btn.innerText = "Sending...";
    showLoader(true);

    try {
        const res = await fetch(`${BASE_URL}/api/users/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ number })
        });

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        
        if (!res.ok) {
            const errorMsg = (data && data.message) ? data.message : (typeof data === 'string' ? data : "Failed to send OTP");
            throw new Error(errorMsg);
        }

        // Hide send button, show OTP form
        btn.style.display = "none";
        document.getElementById("otpForm").style.display = "block";
        
        // Show OTP to user for easy testing
        showPopup("OTP Sent", `Since live SMS requires billing setup, your mock OTP is: ${data.otp}`, "info");
        
    } catch (err) {
        showPopup("Error", err.message, "error");
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="send"></i> Send OTP`;
        if (window.lucide) lucide.createIcons();
    } finally {
        showLoader(false);
    }
}

async function verifyAndRegister() {
    const name = document.getElementById("name").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const number = document.getElementById("number").value.trim();
    const otp = document.getElementById("otp").value.trim();

    if (!otp || otp.length < 4) {
        return showPopup("Invalid OTP", "Please enter the 4-digit OTP.", "warning");
    }

    const btn = document.getElementById("registerBtn");
    btn.disabled = true;
    btn.innerText = "Verifying...";
    showLoader(true);

    try {
        const res = await fetch(`${BASE_URL}/api/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username, email, password, number, otp })
        });
        
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        
        if (!res.ok) {
            const errorMsg = (data && data.message) ? data.message : (typeof data === 'string' ? data : "Registration failed");
            throw new Error(errorMsg);
        }

        // Successfully registered or restored!
        // Save to localStorage just like login
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("storeId", data.storeId || 1);
        
        showPopup("Success", "Account verified successfully!", "success");
        
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1500);
        
    } catch (err) {
        showPopup("Error", err.message || "Failed to verify OTP", "error");
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="check-circle"></i> Verify & Register`;
        if (window.lucide) lucide.createIcons();
    } finally {
        showLoader(false);
    }
}
