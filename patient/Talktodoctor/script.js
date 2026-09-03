/* =========================================================
   PULSECARE TALK TO DOCTOR
   JavaScript
========================================================= */


/* =========================================================
   1. TOAST
========================================================= */

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

let toastTimer;


function showToast(message) {

    toastMessage.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);
}


/* =========================================================
   2. FIND DOCTOR BUTTON
========================================================= */

const findDoctorBtn =
    document.getElementById("findDoctorBtn");


findDoctorBtn.addEventListener("click", () => {

    document
        .getElementById("doctors")
        .scrollIntoView({
            behavior: "smooth"
        });

});


/* =========================================================
   3. MY CONSULTATIONS
========================================================= */

const myConsultationsBtn =
    document.getElementById("myConsultationsBtn");


myConsultationsBtn.addEventListener("click", () => {

    document
        .getElementById("records")
        .scrollIntoView({
            behavior: "smooth"
        });

});


/* =========================================================
   4. QUICK TRIAGE
========================================================= */

const quickTriageBtn =
    document.getElementById("quickTriageBtn");


quickTriageBtn.addEventListener("click", () => {

    showToast(
        "Connecting you to the Quick Triage desk..."
    );

});


/* =========================================================
   5. BROWSE SPECIALISTS
========================================================= */

const browseSpecialistsBtn =
    document.getElementById("browseSpecialistsBtn");


browseSpecialistsBtn.addEventListener("click", () => {

    document
        .getElementById("specialties")
        .scrollIntoView({
            behavior: "smooth"
        });

});


/* =========================================================
   6. DOCTOR SEARCH
========================================================= */

const doctorSearch =
    document.getElementById("doctorSearch");

const specialtyFilter =
    document.getElementById("specialtyFilter");

const sortDoctors =
    document.getElementById("sortDoctors");

const availableToggle =
    document.getElementById("availableToggle");


let selectedMode = "all";

let availableOnly = false;


const doctorCards =
    document.querySelectorAll(".doctor-card");


function filterDoctors() {

    const searchValue =
        doctorSearch.value
            .toLowerCase()
            .trim();

    const specialty =
        specialtyFilter.value;


    doctorCards.forEach(card => {

        const name =
            card.dataset.name.toLowerCase();

        const cardSpecialty =
            card.dataset.specialty;

        const mode =
            card.dataset.mode;

        const available =
            card.dataset.available === "true";


        const matchesSearch =
            name.includes(searchValue) ||
            cardSpecialty.includes(searchValue);


        const matchesSpecialty =
            specialty === "all" ||
            cardSpecialty === specialty;


        const matchesMode =
            selectedMode === "all" ||
            mode === selectedMode;


        const matchesAvailability =
            !availableOnly ||
            available;


        const shouldShow =
            matchesSearch &&
            matchesSpecialty &&
            matchesMode &&
            matchesAvailability;


        card.style.display =
            shouldShow ? "" : "none";

    });

}


/* Search */

doctorSearch.addEventListener(
    "input",
    filterDoctors
);


/* Specialty */

specialtyFilter.addEventListener(
    "change",
    filterDoctors
);


/* =========================================================
   7. SORT DOCTORS
========================================================= */

sortDoctors.addEventListener(
    "change",
    () => {

        const value =
            sortDoctors.value;

        const container =
            document.getElementById(
                "instantDoctors"
            );

        const cards =
            [...container.querySelectorAll(
                ".doctor-card"
            )];


        cards.sort((a, b) => {

            const ratingA =
                Number(a.dataset.rating);

            const ratingB =
                Number(b.dataset.rating);

            const priceA =
                Number(a.dataset.price);

            const priceB =
                Number(b.dataset.price);


            if (value === "rating") {

                return ratingB - ratingA;

            }


            if (value === "price-low") {

                return priceA - priceB;

            }


            if (value === "price-high") {

                return priceB - priceA;

            }


            return 0;

        });


        cards.forEach(card => {

            container.appendChild(card);

        });

    }
);


/* =========================================================
   8. CONSULTATION MODE FILTER
========================================================= */

const modeFilters =
    document.querySelectorAll(".filter");


modeFilters.forEach(filter => {

    filter.addEventListener("click", () => {

        modeFilters.forEach(item => {

            item.classList.remove("active");

        });


        filter.classList.add("active");


        selectedMode =
            filter.dataset.mode;


        filterDoctors();


        showToast(
            selectedMode === "all"
                ? "Showing all consultation types"
                : `Showing ${selectedMode} consultations`
        );

    });

});


/* =========================================================
   9. AVAILABLE NOW FILTER
========================================================= */

availableToggle.addEventListener(
    "click",
    () => {

        availableOnly =
            !availableOnly;


        availableToggle.classList.toggle(
            "active",
            availableOnly
        );


        filterDoctors();


        showToast(
            availableOnly
                ? "Showing doctors available now"
                : "Showing all doctors"
        );

    }
);


/* =========================================================
   10. SPECIALTY BUTTONS
========================================================= */

const specialtyCards =
    document.querySelectorAll(
        ".specialty-card"
    );


specialtyCards.forEach(card => {

    card.addEventListener("click", () => {

        const specialty =
            card.dataset.specialty;


        specialtyFilter.value =
            specialty;


        filterDoctors();


        document
            .getElementById("doctors")
            .scrollIntoView({
                behavior: "smooth"
            });


        showToast(
            `Showing ${card.innerText.trim()} doctors`
        );

    });

});


/* =========================================================
   11. DOCTOR TALK NOW / BOOK BUTTONS
========================================================= */

const doctorActionButtons =
    document.querySelectorAll(
        ".doctor-action, [data-doctor]"
    );


doctorActionButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const doctor =
                button.dataset.doctor;


            if (!doctor) {
                return;
            }


            showToast(
                `Connecting you with ${doctor}...`
            );


            setTimeout(() => {

                document
                    .getElementById(
                        "consultations"
                    )
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }, 700);

        }
    );

});


/* =========================================================
   12. CHAT
========================================================= */

const chatForm =
    document.getElementById("chatForm");

const chatInput =
    document.getElementById("chatInput");

const chatMessages =
    document.getElementById("chatMessages");


chatForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const message =
            chatInput.value.trim();


        if (!message) {
            return;
        }


        /* Create message */

        const messageElement =
            document.createElement("div");


        messageElement.className =
            "message patient-message";


        messageElement.innerHTML = `

            <div>

                <p>
                    ${escapeHTML(message)}
                </p>

                <small>
                    You · ${getCurrentTime()}
                </small>

            </div>

            <div class="message-avatar">
                👤
            </div>

        `;


        chatMessages.appendChild(
            messageElement
        );


        chatInput.value = "";


        /* Scroll */

        chatMessages.scrollTop =
            chatMessages.scrollHeight;


        showToast(
            "Message sent"
        );

    }
);


/* =========================================================
   13. HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

}


/* =========================================================
   14. CURRENT TIME
========================================================= */

function getCurrentTime() {

    const now =
        new Date();


    return now.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   15. END CONSULTATION
========================================================= */

const endConsultationBtn =
    document.getElementById(
        "endConsultationBtn"
    );


endConsultationBtn.addEventListener(
    "click",
    () => {

        const confirmEnd =
            confirm(
                "Are you sure you want to end this consultation?"
            );


        if (!confirmEnd) {
            return;
        }


        const activeConsultation =
            document.querySelector(
                ".active-consultation"
            );


        activeConsultation.style.opacity =
            "0.55";


        endConsultationBtn.disabled =
            true;


        endConsultationBtn.textContent =
            "✓ Consultation Ended";


        showToast(
            "Consultation ended successfully"
        );

    }
);


/* =========================================================
   16. CONSULTATION TIMER
========================================================= */

const consultTimer =
    document.getElementById(
        "consultTimer"
    );


let elapsedSeconds =
    8 * 60 + 50;


setInterval(() => {

    elapsedSeconds++;


    const minutes =
        Math.floor(
            elapsedSeconds / 60
        );

    const seconds =
        elapsedSeconds % 60;


    consultTimer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}, 1000);


/* =========================================================
   17. MOBILE NAVIGATION
========================================================= */

const mobileNavLinks =
    document.querySelectorAll(
        ".mobile-bottom-nav a"
    );


mobileNavLinks.forEach(link => {

    link.addEventListener(
        "click",
        () => {

            mobileNavLinks.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            link.classList.add("active");

        }
    );

});


/* =========================================================
   18. CONSULTATION TYPE CLICK
========================================================= */

const consultationTypes =
    document.querySelectorAll(
        ".consult-type-card"
    );


consultationTypes.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            const mode =
                card.dataset.consultMode;


            const filter =
                document.querySelector(
                    `.filter[data-mode="${mode}"]`
                );


            if (filter) {

                filter.click();

            }


            document
                .getElementById("doctors")
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );

});


/* =========================================================
   19. VIEW PROFILE BUTTONS
========================================================= */

const profileButtons =
    document.querySelectorAll(
        ".verified-card .btn-light"
    );


profileButtons.forEach(button => {

    if (
        button.textContent
            .toLowerCase()
            .includes("view profile")
    ) {

        button.addEventListener(
            "click",
            () => {

                showToast(
                    "Doctor profile selected"
                );

            }
        );

    }

});


/* =========================================================
   20. INITIAL STATE
========================================================= */

filterDoctors();
