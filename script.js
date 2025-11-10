// You can add interactivity here later
console.log("Welcome to Spawell!");
// === BOOKING FORM HANDLER ===
const form = document.getElementById("bookingForm");
const msg = document.getElementById("confirmationMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // optional: quick phone sanity-check (10–13 digits)
  const phone = form.elements["phone"].value.trim();
  if (!/^\+?\d{10,13}$/.test(phone)) {
    alert("Please enter a valid phone number (digits only).");
    return;
  }

  // collect form data as a plain object
  const payload = Object.fromEntries(new FormData(form).entries());

  // optional: normalize date to ISO string
  if (payload.date) {
    try { payload.date = new Date(payload.date).toISOString(); } catch {}
  }

  // UX: disable button while sending
  const btn = form.querySelector('button[type="submit"]');
  const oldBtnText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Submitting...";

  try {
    const res = await fetch("/api/submit-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      form.reset();
      msg.style.display = "block";
      // hide message after a few seconds (optional)
      setTimeout(() => (msg.style.display = "none"), 5000);
    } else {
      alert("Error: " + (data.detail || data.error || "Unknown error"));
    }
  } catch (err) {
    alert("Network error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = oldBtnText;
  }
});
