// ==========================================
// ASHA HEALTHCARE ABOUT PAGE
// ==========================================


// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");


menuToggle.addEventListener("click", () => {

    navMenu.classList.toggle("open");

});


// Close mobile menu after clicking a link

document.querySelectorAll("#navMenu a").forEach(link => {

    link.addEventListener("click", () => {

        navMenu.classList.remove("open");

    });

});


// ==========================================
// SCROLL REVEAL
// ==========================================

const revealElements =
    document.querySelectorAll(".reveal");


const observer = new IntersectionObserver(

    (entries, observer) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                observer.unobserve(entry.target);

            }

        });

    },

    {
        threshold: 0.12
    }

);


revealElements.forEach(element => {

    observer.observe(element);

});
