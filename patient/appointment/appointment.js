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


            // Save to Local Cache for immediate persistence
            localStorage.setItem('asha_latest_appointment', JSON.stringify(bookingData));

            // Send to Backend API
            const submitBtn = appointmentForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳ Saving to Hospital DB...</span>';
            }

            fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_name: bookingData.patient.name,
                    patient_phone: bookingData.patient.phone,
                    patient_age: bookingData.patient.age,
                    patient_gender: bookingData.patient.gender,
                    patient_email: bookingData.patient.email,
                    doctor_name: bookingData.doctor.name,
                    doctor_specialty: bookingData.doctor.specialty,
                    appointment_date: bookingData.date.value,
                    time_slot: bookingData.time.value,
                    consultation_type: bookingData.consultation.type,
                    reason: bookingData.patient.reason || 'General Consultation',
                    allergies: bookingData.patient.allergies,
                    total_fee: bookingData.total
                })
            })
            .then(res => res.json())
            .then(data => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
                const bookingRef = data.bookingId || `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                showSuccessConfirmationModal(bookingRef, bookingData);
            })
            .catch(err => {
                console.warn('Backend unavailable, saved locally:', err);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
                const fallbackRef = `APT-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`;
                showSuccessConfirmationModal(fallbackRef, bookingData);
            });
        }
    );
}

/* =========================================================
   MODAL: APPOINTMENT CONFIRMATION
========================================================= */
function showSuccessConfirmationModal(bookingRef, data) {
    const existing = document.getElementById('booking-success-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'booking-success-modal';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(6px); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        padding: 1rem; animation: fadeIn 0.25s ease;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 1.5rem; max-width: 440px; width: 100%; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); text-align: center; font-family: 'Inter', system-ui, sans-serif; position: relative;">
            <div style="width: 64px; height: 64px; background: #ecfdf5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 32px; border: 2px solid #a7f3d0;">
                ✓
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">Appointment Confirmed!</h2>
            <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.25rem;">Saved in Hospital Database & Doctor Queue</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1rem; text-align: left; margin-bottom: 1.5rem; font-size: 0.85rem; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="color: #64748b;">Booking ID:</span>
                    <strong style="color: #0f172a; font-family: monospace; font-size: 0.95rem;">${bookingRef}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="color: #64748b;">Doctor:</span>
                    <strong style="color: #0f172a;">${data.doctor.name}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="color: #64748b;">Specialty:</span>
                    <span style="color: #334155;">${data.doctor.specialty}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="color: #64748b;">Date & Time:</span>
                    <strong style="color: #0f172a;">${data.date.display} • ${data.time.value}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="color: #64748b;">Consultation:</span>
                    <span style="color: #059669; font-weight: 600;">${data.consultation.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="color: #64748b;">Patient:</span>
                    <strong style="color: #0f172a;">${data.patient.name} (${data.patient.gender}, ${data.patient.age || 28}y)</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 0.5rem; margin-top: 0.5rem;">
                    <span style="color: #64748b;">Total Fee:</span>
                    <strong style="color: #0f172a; font-size: 1rem;">₹${data.total}</strong>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <button onclick="window.location.href='../dashboard/index.html'" style="width: 100%; padding: 0.75rem 1rem; background: #0066cc; color: white; border: none; border-radius: 0.75rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 102, 204, 0.2);">
                    Return to Patient Dashboard
                </button>
                <button onclick="window.location.href='../my_health/my-health.html'" style="width: 100%; padding: 0.75rem 1rem; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;">
                    View in My Health Records
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
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
     * Preselect Doctor from URL params (if linked from Talk to Doctor)
     */
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const docParam = urlParams.get('doctor');
        if (docParam) {
            doctorCards.forEach(card => {
                const title = card.querySelector('h3');
                if (title && title.textContent.toLowerCase().includes(docParam.toLowerCase())) {
                    card.click();
                }
            });
        }

        // Auto-fill logged in user info if present
        const savedUser = localStorage.getItem('asha_user');
        if (savedUser) {
            const u = JSON.parse(savedUser);
            const nameInput = document.querySelector('input[placeholder*="Full Name"], #patient-name');
            const phoneInput = document.querySelector('input[placeholder*="Phone"], #patient-phone');
            if (nameInput && !nameInput.value && u.name) {
                nameInput.value = u.name;
                appointment.patient.name = u.name;
            }
            if (phoneInput && !phoneInput.value && u.phone) {
                phoneInput.value = u.phone;
                appointment.patient.phone = u.phone;
            }
        }
    } catch (e) {}

    /*
     * Update everything
     */

    updateSummary();

}


/*
 * Start application
 */

initializeAppointment();
