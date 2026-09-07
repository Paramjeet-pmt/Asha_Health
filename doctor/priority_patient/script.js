/* =====================================================
   TOAST
===================================================== */

const toast = document.getElementById("toast");

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* =====================================================
   SYNC BUTTON
===================================================== */

const syncButton = document.getElementById("syncButton");
const syncText = document.getElementById("syncText");

let syncing = true;

syncButton.addEventListener("click", () => {

    if (syncing) {
        showToast("Sync completed successfully");

        syncText.textContent = "Synced";
        syncing = false;

        syncButton.style.background = "#d8f7e8";
        syncButton.style.color = "#137045";
    } else {

        syncText.textContent = "Syncing";
        syncing = true;

        syncButton.style.background = "#ccfaf4";
        syncButton.style.color = "#175a58";

        showToast("Syncing patient data...");

        setTimeout(() => {

            syncText.textContent = "Synced";
            syncing = false;

            syncButton.style.background = "#d8f7e8";
            syncButton.style.color = "#137045";

            showToast("Patient data synced");

        }, 1500);
    }

});


/* =====================================================
   FILTER BUTTON
===================================================== */

const filterButton = document.getElementById("filterButton");

filterButton.addEventListener("click", () => {

    const cards = document.querySelectorAll(".patient-card");

    cards.forEach(card => {

        card.style.transition = "transform 0.3s";

        card.style.transform = "scale(0.98)";

        setTimeout(() => {
            card.style.transform = "scale(1)";
        }, 200);

    });

    showToast("Showing priority patients");

});


/* =====================================================
   ROLE BUTTON
===================================================== */

const roleButton = document.getElementById("roleButton");

roleButton.addEventListener("click", () => {

    showToast("Current role: Healthcare Worker");

});


/* =====================================================
   VIEW EHR
===================================================== */

function viewEHR(patientName) {

    showToast(`Opening EHR for ${patientName}`);

}


/* =====================================================
   ESCALATE PATIENT
===================================================== */

function escalatePatient(patientName) {

    const confirmed = confirm(
        `Escalate ${patientName} to emergency services (108)?`
    );

    if (confirmed) {

        showToast(
            `${patientName} escalated successfully`
        );

    }

}


/* =====================================================
   SCHEDULE VISIT
===================================================== */

function scheduleVisit(patientName) {

    showToast(
        `Visit scheduling opened for ${patientName}`
    );

}


/* =====================================================
   BOTTOM NAVIGATION
===================================================== */

function changeTab(button, tabName) {

    // Remove active state
    document
        .querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });

    // Add active state
    button.classList.add("active");

    showToast(`${tabName} selected`);

}


/* =====================================================
   CARD HOVER EFFECT
===================================================== */

document
    .querySelectorAll(".patient-card")
    .forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.style.transition =
                "box-shadow 0.25s, transform 0.25s";

            card.style.boxShadow =
                "0 12px 35px rgba(0,0,0,0.07)";

            card.style.transform =
                "translateY(-2px)";

        });

        card.addEventListener("mouseleave", () => {

            card.style.boxShadow =
                "0 2px 4px rgba(0,0,0,0.02), 0 8px 25px rgba(0,0,0,0.02)";

            card.style.transform =
                "translateY(0)";

        });

    });
