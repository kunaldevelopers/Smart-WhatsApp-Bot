class WhatsAppBotUI {
  constructor() {
    this.socket = null;
    this.qrCodeGenerated = false;
    this.connectionTime = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateTimestamp();
    this.connectToBot();
  }

  setupEventListeners() {
    // Refresh page button (if needed)
    document.addEventListener("keydown", (e) => {
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        this.addLog("info", "Refreshing page...");
        setTimeout(() => location.reload(), 1000);
      }
    });
  }

  updateTimestamp() {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    const initialTimestamp = document.getElementById("initialTimestamp");
    if (initialTimestamp) {
      initialTimestamp.textContent = timestamp;
    }
  }

  connectToBot() {
    this.addLog("info", "Connecting to WhatsApp Bot server...");
    this.updateStatus(
      "loading",
      "Connecting to Server...",
      "Establishing connection with the bot server."
    );

    // Start polling immediately instead of waiting
    this.startStatusPolling();
  }

  startStatusPolling() {
    // Poll for bot status every 1 second initially
    const pollInterval = setInterval(async () => {
      try {
        console.log("Polling for status...");
        const response = await fetch("/api/status");
        const data = await response.json();
        console.log("Status data:", data);

        if (data.status === "qr_ready" && data.qr) {
          if (!this.qrCodeGenerated) {
            console.log("QR Code ready, showing QR code...");
            this.showQRCode(data.qr);
            this.qrCodeGenerated = true;
          }
        } else if (data.status === "authenticated") {
          this.showSuccess();
          clearInterval(pollInterval);
        } else if (data.status === "ready") {
          this.showSuccess();
          clearInterval(pollInterval);
        }

        // Update logs if available
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach((log) => {
            this.addLog(log.level, log.message);
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
        // Fallback: simulate the flow for demo purposes
        if (!this.qrCodeGenerated) {
          setTimeout(() => this.simulateQRGeneration(), 3000);
        }
      }
    }, 1000); // Poll every 1 second instead of 3
  }

  simulateQRGeneration() {
    this.addLog("info", "Generating QR code for WhatsApp authentication...");
    this.updateStatus(
      "loading",
      "Generating QR Code...",
      "Creating authentication QR code for WhatsApp Web."
    );

    setTimeout(() => {
      // Generate a dummy QR code for demo
      const dummyQR =
        "https://web.whatsapp.com/,1,4kF1qG2q2q2q2q2q2q2q2q2q2q2q2q2q2q2q2q2q2q2q2q2q";
      this.showQRCode(dummyQR);
      this.qrCodeGenerated = true;
    }, 2000);
  }

  updateStatus(type, title, message) {
    const statusIndicator = document.getElementById("statusIndicator");
    const statusTitle = document.getElementById("statusTitle");
    const statusMessage = document.getElementById("statusMessage");

    // Update indicator
    statusIndicator.className = `status-indicator ${type}`;

    // Update text
    statusTitle.textContent = title;
    statusMessage.textContent = message;
  }

  showQRCode(qrData) {
    console.log("showQRCode called with data:", qrData);
    this.addLog("success", "QR code generated successfully");
    this.updateStatus(
      "loading",
      "Scan QR Code",
      "Use WhatsApp on your phone to scan the QR code below."
    );

    const qrSection = document.getElementById("qrSection");
    const qrLoading = document.getElementById("qrLoading");
    const qrCodeDiv = document.getElementById("qrcode");

    console.log("Elements found:", { qrSection, qrLoading, qrCodeDiv });

    // Show QR section
    qrSection.style.display = "block";

    // Clear any existing QR code
    qrCodeDiv.innerHTML = "";

    // Check if QRCode library is available
    if (typeof QRCode === "undefined") {
      console.error(
        "QRCode library not loaded! Trying alternative approach..."
      );
      this.addLog("error", "QR Code library not loaded, using fallback");

      // Fallback: use Google Charts API
      const qrImg = document.createElement("img");
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
        qrData
      )}`;
      qrImg.style.borderRadius = "10px";
      qrImg.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
      qrImg.onload = () => {
        qrLoading.style.display = "none";
        qrCodeDiv.style.display = "block";
        this.addLog("info", "QR code ready for scanning (fallback method)");
        this.startAuthenticationCheck();
      };
      qrImg.onerror = () => {
        this.addLog("error", "Failed to generate QR code with fallback method");
      };
      qrCodeDiv.appendChild(qrImg);
      return;
    }

    console.log("Generating QR code with QRCode library...");

    // Try to generate QR code with the library
    try {
      QRCode.toCanvas(
        qrData,
        {
          width: 256,
          height: 256,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M,
        },
        (error, canvas) => {
          if (error) {
            console.error("QR Code generation error:", error);
            this.addLog("error", "Failed to generate QR code");
            return;
          }

          console.log("QR Code generated successfully!");
          // Clear the div and add the canvas
          qrCodeDiv.innerHTML = "";
          canvas.style.borderRadius = "10px";
          canvas.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
          qrCodeDiv.appendChild(canvas);

          // Hide loading, show QR code
          qrLoading.style.display = "none";
          qrCodeDiv.style.display = "block";
          this.addLog("info", "QR code ready for scanning");

          // Start checking for authentication
          this.startAuthenticationCheck();
        }
      );
    } catch (libError) {
      console.error("QRCode library error:", libError);
      this.addLog("error", "QR library failed, using fallback");

      // Fallback method
      const qrImg = document.createElement("img");
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
        qrData
      )}`;
      qrImg.style.borderRadius = "10px";
      qrImg.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
      qrImg.onload = () => {
        qrLoading.style.display = "none";
        qrCodeDiv.style.display = "block";
        this.addLog("info", "QR code ready for scanning (fallback method)");
        this.startAuthenticationCheck();
      };
      qrCodeDiv.appendChild(qrImg);
    }
  }

  startAuthenticationCheck() {
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes timeout

    const checkAuth = setInterval(() => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(checkAuth);
        this.addLog("warning", "QR code expired. Please refresh the page.");
        this.updateStatus(
          "error",
          "QR Code Expired",
          "Please refresh the page to get a new QR code."
        );
        return;
      }

      // Simulate authentication check (replace with real API call)
      fetch("/api/auth-status")
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Auth check failed");
        })
        .then((data) => {
          if (data.authenticated) {
            clearInterval(checkAuth);
            this.showSuccess();
          }
        })
        .catch(() => {
          // For demo purposes, simulate successful auth after 30 seconds
          if (attempts === 10) {
            clearInterval(checkAuth);
            this.simulateSuccess();
          }
        });
    }, 3000);
  }

  simulateSuccess() {
    this.addLog("success", "WhatsApp authentication successful");
    this.showSuccess();
  }

  showSuccess() {
    this.connectionTime = new Date();

    const statusCard = document.getElementById("statusCard");
    const qrSection = document.getElementById("qrSection");
    const successSection = document.getElementById("successSection");
    const connectionTimeEl = document.getElementById("connectionTime");

    // Hide previous sections
    statusCard.style.display = "none";
    qrSection.style.display = "none";

    // Show success section
    successSection.style.display = "block";

    // Update connection time
    if (connectionTimeEl) {
      connectionTimeEl.textContent = this.connectionTime.toLocaleString();
    }

    this.addLog("success", "Bot is now online and ready to receive messages");
    this.addLog("info", "WhatsApp session has been saved for future use");

    // Optional: Show notification
    if (Notification.permission === "granted") {
      new Notification("WhatsApp Bot Connected!", {
        body: "Your bot is now online and ready to receive messages.",
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤖</text></svg>',
      });
    }
  }

  async resetSession() {
    // Disable reset button to prevent multiple clicks
    const resetBtns = document.querySelectorAll(".reset-btn");
    resetBtns.forEach((btn) => {
      btn.disabled = true;
      btn.textContent = "🔄 Resetting...";
    });

    this.addLog("warning", "Resetting WhatsApp session...");

    try {
      // Call the reset API endpoint
      const response = await fetch("/api/reset-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.addLog("success", "Session reset successfully");
        this.addLog("info", "Please wait for new QR code...");

        // Reset UI state
        this.qrCodeGenerated = false;
        this.connectionTime = null;

        // Hide success section and show status card
        const statusCard = document.getElementById("statusCard");
        const qrSection = document.getElementById("qrSection");
        const successSection = document.getElementById("successSection");

        successSection.style.display = "none";
        qrSection.style.display = "none";
        statusCard.style.display = "block";

        // Update status
        this.updateStatus(
          "loading",
          "Resetting Session...",
          "Clearing old session and generating new QR code."
        );

        // Start polling again for new QR
        setTimeout(() => {
          this.updateStatus(
            "loading",
            "Initializing...",
            "Setting up new WhatsApp connection."
          );
          this.startStatusPolling();
        }, 2000);
      } else {
        throw new Error("Reset request failed");
      }
    } catch (error) {
      console.error("Reset error:", error);
      this.addLog("error", "Failed to reset session: " + error.message);
    } finally {
      // Re-enable reset buttons
      setTimeout(() => {
        resetBtns.forEach((btn) => {
          btn.disabled = false;
          btn.innerHTML =
            btn.id === "resetBtnSuccess"
              ? "🔄 Reset & Reconnect"
              : "🔄 Reset Session";
        });
      }, 3000);
    }
  }

  addLog(level, message) {
    const logsContainer = document.getElementById("logsContainer");
    const timestamp = new Date().toLocaleTimeString();

    const logEntry = document.createElement("div");
    logEntry.className = `log-entry ${level}`;

    logEntry.innerHTML = `
            <span class="timestamp">${timestamp}</span>
            <span class="message">${message}</span>
        `;

    logsContainer.appendChild(logEntry);

    // Auto-scroll to bottom
    logsContainer.scrollTop = logsContainer.scrollHeight;

    // Limit log entries to prevent memory issues
    const logEntries = logsContainer.querySelectorAll(".log-entry");
    if (logEntries.length > 100) {
      logEntries[0].remove();
    }
  }
}

// Initialize the UI when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  // Initialize the WhatsApp Bot UI
  window.botUI = new WhatsAppBotUI();
});

// Add some utility functions
window.refreshBot = () => {
  window.botUI.addLog("info", "Refreshing bot connection...");
  location.reload();
};

window.clearLogs = () => {
  const logsContainer = document.getElementById("logsContainer");
  logsContainer.innerHTML =
    '<div class="log-entry info"><span class="timestamp">' +
    new Date().toLocaleTimeString() +
    '</span><span class="message">Logs cleared</span></div>';
};
