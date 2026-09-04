/* =========================================================
   Asha CARE APPOINTMENT SYSTEM
========================================================= */


/* =========================================================
   1. APPLICATION STATE
========================================================= */

const appointment = {

    doctor: {
        name: "Dr. Ananya Sharma",
        specialty: "General Physician",
        price: 500
    },

    date: {
        value: "2026-09-04",
        display: "Fri, 04 Sep 2026"
    },

    time: {
        value: "10:30 AM"
    },

    consultation: {
        type: "clinic",
        name: "In-Clinic Visit",
        price: 500
    },

    patient: {
        name: "",
        age: "",
        gender: "female",
        phone: "",
        email: "",
        reason: "",
        allergies: ""
    },

    platformFee: 20

};


/* =========================================================
   2. DOM ELEMENTS
========================================================= */

const doctorCards =
    document.querySelectorAll(".doctor-card");

const dateItems =
    document.querySelectorAll(".date-item");

const timeSlots =
    document.querySelectorAll(".time-grid button");

const consultationOptions =
    document.querySelectorAll(".consultation-option");

const appointmentForm =
    document.querySelector("#appointment-form");

const totalPrice =
    document.querySelector(".summary-total strong:last-child");


/* =========================================================
   3. DOCTOR SELECTION
========================================================= */

doctorCards.forEach(card => {

    card.addEventListener("click", () => {

        /*
         * Remove selection from every doctor
         */

        doctorCards.forEach(item => {
            item.classList.remove("is-selected");

            const badge =
                item.querySelector(".selected-badge");

            if (badge) {
                badge.remove();
            }
        });


        /*
         * Select clicked doctor
         */

        card.classList.add("is-selected");


        /*
         * Add selected badge
         */

        const header =
            card.querySelector(".doctor-header");

        if (header) {

            const badge =
                document.createElement("span");

            badge.className = "selected-badge";

            badge.textContent = "✓ Selected";

            header.appendChild(badge);
        }


        /*
         * Get doctor information
         */

        const name =
            card.querySelector(".doctor-header h3")
                ?.textContent
                .trim();

        const specialtyText =
            card.querySelector(".doctor-header p")
                ?.textContent
                .trim();

        const priceText =
            card.querySelector(".doctor-price")
                ?.textContent
                .trim();


        /*
         * Convert price text:
         *
         * "₹500 / visit"
         *
         * into:
         *
         * 500
         */

        const price =
            Number(
                priceText
                    ?.replace(/[^\d]/g, "")
            ) || 0;


        /*
         * Update application state
         */

        appointment.doctor.name =
            name || appointment.doctor.name;

        appointment.doctor.specialty =
            specialtyText
                ?.split("•")[0]
                .trim()
                || appointment.doctor.specialty;

        appointment.doctor.price = price;


        /*
         * Update consultation price if
         * in-clinic mode is selected.
         */

        if (
            appointment.consultation.type === "clinic"
        ) {

            appointment.consultation.price =
                price;
        }


        updateSummary();

    });

});


/* =========================================================
   4. DATE SELECTION
========================================================= */

dateItems.forEach(date => {

    date.addEventListener("click", () => {

        /*
         * Don't allow disabled dates
         */

        if (date.disabled) {
            return;
        }


        /*
         * Remove selected state
         */

        dateItems.forEach(item => {
            item.classList.remove("selected");
        });


        /*
         * Select current date
         */

        date.classList.add("selected");


        /*
         * Read date
         */

        const day =
            date.querySelector("strong")
                ?.textContent
                .trim();

        const month =
            date.querySelector("small")
                ?.textContent
                .trim();

        const weekday =
            date.querySelector("span")
                ?.textContent
                .trim();


        /*
         * Store date
         */

        appointment.date.value =
            `${month}-${day}`;

        appointment.date.display =
            `${weekday}, ${day} ${month} 2026`;


        updateSummary();

    });

});


/* =========================================================
   5. TIME SLOT SELECTION
========================================================= */

timeSlots.forEach(slot => {

    slot.addEventListener("click", () => {

        /*
         * Ignore disabled slots
         */

        if (slot.disabled) {
            return;
        }


        /*
         * Remove selected state
         *
         * Only within the complete
         * time-slot section.
         */

        timeSlots.forEach(item => {
            item.classList.remove("selected");

            /*
             * Remove checkmark if our
             * JavaScript previously added it.
             */

            if (
                item.dataset.originalText
            ) {

                item.textContent =
                    item.dataset.originalText;
            }
        });


        /*
         * Save original text
         */

        if (!slot.dataset.originalText) {

            slot.dataset.originalText =
                slot.textContent.trim();
        }


        /*
         * Select slot
         */

        slot.classList.add("selected");


        /*
         * Add checkmark
         */

        slot.textContent =
            `✓ ${slot.dataset.originalText}`;


        /*
         * Update state
         */

        appointment.time.value =
            slot.dataset.originalText;


        updateSummary();

    });

});


/* =========================================================
   6. CONSULTATION MODE
========================================================= */

consultationOptions.forEach(option => {

    option.addEventListener("click", () => {

        const radio =
            option.querySelector(
                'input[type="radio"]'
            );

        if (!radio) {
            return;
        }


        /*
         * Select radio
         */

        radio.checked = true;


        /*
         * Remove selected class
         */

        consultationOptions.forEach(item => {
            item.classList.remove("selected");
        });


        /*
         * Select current option
         */

        option.classList.add("selected");


        /*
         * Get consultation information
         */

        const type =
            radio.value;

        const price =
            Number(
                radio.dataset.price
            ) || 0;


        const name =
            option.querySelector(
                ".mode-content strong"
            )?.textContent.trim();


        /*
         * Update state
         */

        appointment.consultation.type =
            type;

        appointment.consultation.name =
            name || "";

        appointment.consultation.price =
            price;


        updateSummary();

    });

});


/* =========================================================
   7. GENDER
========================================================= */

const genderInputs =
    document.querySelectorAll(
        'input[name="gender"]'
    );

genderInputs.forEach(input => {

    input.addEventListener("change", () => {

        appointment.patient.gender =
            input.value;

        updateSummary();

    });

});


/* =========================================================
   8. PATIENT FORM
========================================================= */

const fullName =
    document.querySelector("#full-name");

const age =
    document.querySelector("#age");

const phone =
    document.querySelector("#phone");

const email =
    document.querySelector("#email");

const reason =
    document.querySelector("#reason");

const allergies =
    document.querySelector("#allergies");


/*
 * Update patient state whenever
 * user types.
 */

function updatePatientData() {

    appointment.patient.name =
        fullName?.value.trim() || "";

    appointment.patient.age =
        age?.value.trim() || "";

    appointment.patient.phone =
        phone?.value.trim() || "";

    appointment.patient.email =
        email?.value.trim() || "";

    appointment.patient.reason =
        reason?.value.trim() || "";

    appointment.patient.allergies =
        allergies?.value.trim() || "";

}


[
    fullName,
    age,
    phone,
    email,
    reason,
    allergies
].forEach(input => {

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        updatePatientData
    );

});


/* =========================================================
   9. TOTAL PRICE
========================================================= */

function calculateTotal() {

    return (
        appointment.consultation.price +
        appointment.platformFee
    );

}


/* =========================================================
   10. UPDATE SUMMARY
========================================================= */

function updateSummary() {

    /*
     * Make sure patient data is current
     */

    updatePatientData();


    /*
     * Doctor
     */

    const summaryDoctor =
        document.querySelector(
            ".summary-item:nth-child(1) strong"
        );

    if (summaryDoctor) {

        summaryDoctor.innerHTML = `
            ${appointment.doctor.name}
            <small>
                ${appointment.doctor.specialty}
            </small>
        `;
    }


    /*
     * Date + Time
     */

    const summarySchedule =
        document.querySelector(
            ".summary-item:nth-child(2) strong"
        );

    if (summarySchedule) {

        summarySchedule.innerHTML = `
            ${appointment.date.display}
            <small>
                ${appointment.time.value}
            </small>
        `;
    }


    /*
     * Consultation
     */

    const summaryMode =
        document.querySelector(
            ".summary-item:nth-child(3) strong"
        );

    if (summaryMode) {

        summaryMode.innerHTML = `
            ${appointment.consultation.name}
            <small>
                ${
                    appointment.consultation.type === "clinic"
                        ? "CityCare Super Specialty Hospital"
                        : "Asha HealthCare"
                }
            </small>
        `;
    }


    /*
     * Patient
     */

    const summaryPatient =
        document.querySelector(
            ".summary-item:nth-child(4) strong"
        );

    if (summaryPatient) {

        const gender =
            appointment.patient.gender === "female"
                ? "Female"
                : appointment.patient.gender === "male"
                    ? "Male"
                    : "Other";

        summaryPatient.innerHTML = `
            ${
                appointment.patient.name ||
                "Patient"
            }

            <small>
                ${
                    appointment.patient.age ||
                    "--"
                }, ${gender}
            </small>
        `;
    }


    /*
     * Consultation fee
     */

    const pricingRows =
        document.querySelectorAll(
            ".summary-pricing div"
        );


    if (pricingRows.length >= 2) {

        const consultationFee =
            pricingRows[0].querySelector("strong");

        const platformFee =
            pricingRows[1].querySelector("strong");


        if (consultationFee) {

            consultationFee.textContent =
                `₹${appointment.consultation.price}`;
        }


        if (platformFee) {

            platformFee.textContent =
                `₹${appointment.platformFee}`;
        }

    }


    /*
     * Total
     */

    const total =
        calculateTotal();


    if (totalPrice) {

        totalPrice.textContent =
            `₹${total}`;
    }


    /*
     * Update booking button
     */

    const bookButton =
        document.querySelector(".primary-button");

    if (bookButton) {

        bookButton.innerHTML = `
            ✓ Confirm & Book Appointment
            <span>(₹${total})</span>
        `;
    }

}


/* =========================================================
   11. FORM VALIDATION
========================================================= */

function validateAppointment() {

    updatePatientData();


    const errors = [];


    /*
     * Doctor
     */

    if (!appointment.doctor.name) {

        errors.push(
            "Please select a doctor."
        );

    }


    /*
     * Date
     */

    if (!appointment.date.value) {

        errors.push(
            "Please select an appointment date."
        );

    }


    /*
     * Time
     */

    if (!appointment.time.value) {

        errors.push(
            "Please select a time slot."
        );

    }


    /*
     * Consultation
     */

    if (!appointment.consultation.type) {

        errors.push(
            "Please select consultation mode."
        );

    }


    /*
     * Name
     */

    if (!appointment.patient.name) {

        errors.push(
            "Please enter the patient's name."
        );

    }


    /*
     * Age
     */

    if (!appointment.patient.age) {

        errors.push(
            "Please enter the patient's age."
        );

    }


    /*
     * Phone
     */

    if (!appointment.patient.phone) {

        errors.push(
            "Please enter a phone number."
        );

    }


    /*
     * Email
     */

    if (!appointment.patient.email) {

        errors.push(
            "Please enter an email address."
        );

    }


    return errors;

}


/* =========================================================
   12. FORM SUBMISSION
========================================================= */

if (appointmentForm) {

    appointmentForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            /*
             * Native browser validation
             */

            if (!appointmentForm.checkValidity()) {

                appointmentForm.reportValidity();

                return;

            }


            /*
             * Custom validation
             */

            const errors =
                validateAppointment();


            if (errors.length > 0) {

                alert(
                    errors.join("\n")
                );

                return;

            }


            /*
             * Create booking object
             */

            const bookingData = {

                doctor: {
                    ...appointment.doctor
                },

                date: {
                    ...appointment.date
                },

                time: {
                    ...appointment.time
                },

                consultation: {
                    ...appointment.consultation
                },

                patient: {
                    ...appointment.patient
                },

                platformFee:
                    appointment.platformFee,

                total:
                    calculateTotal(),

                createdAt:
                    new Date().toISOString()

            };


            /*
             * For now we're showing the
             * result in console.
             *
             * Later this can be sent to
             * your backend API.
             */

            console.log(
                "Appointment:",
                bookingData
            );


            /*
             * User confirmation
             */

            alert(
                `Appointment confirmed!\n\n` +

                `Doctor: ${bookingData.doctor.name}\n` +

                `Date: ${bookingData.date.display}\n` +

                `Time: ${bookingData.time.value}\n` +

                `Mode: ${bookingData.consultation.name}\n` +

                `Total: ₹${bookingData.total}`
            );

        }
    );

}


/* =========================================================
   13. INITIALIZE
========================================================= */

function initializeAppointment() {

    /*
     * Set initial doctor
     */

    const selectedDoctor =
        document.querySelector(
            ".doctor-card.is-selected"
        );

    if (selectedDoctor) {

        selectedDoctor.classList.add(
            "is-selected"
        );

    }


    /*
     * Set initial date
     */

    const selectedDate =
        document.querySelector(
            ".date-item.selected"
        );

    if (selectedDate) {

        selectedDate.classList.add(
            "selected"
        );

    }


    /*
     * Set initial time
     */

    const selectedTime =
        document.querySelector(
            ".time-grid button.selected"
        );

    if (selectedTime) {

        appointment.time.value =
            selectedTime.textContent
                .replace("✓", "")
                .trim();

        selectedTime.dataset.originalText =
            appointment.time.value;

    }


    /*
     * Set initial consultation
     */

    const selectedConsultation =
        document.querySelector(
            ".consultation-option.selected"
        );

    if (selectedConsultation) {

        const radio =
            selectedConsultation.querySelector(
                'input[type="radio"]'
            );

        if (radio) {

            appointment.consultation.type =
                radio.value;

            appointment.consultation.price =
                Number(
                    radio.dataset.price
                ) || 0;

        }

    }


    /*
     * Update everything
     */

    updateSummary();

}


/*
 * Start application
 */

initializeAppointment();
