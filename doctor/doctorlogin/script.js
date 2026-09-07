document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  const forgotPassword = document.getElementById("forgotPassword");
  const ssoButton = document.getElementById("ssoButton");
  const registerLink = document.getElementById("registerLink");


  /* =========================
     SHOW / HIDE PASSWORD
  ========================= */

  togglePassword.addEventListener("click", () => {

    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    togglePassword.innerHTML = isPassword
      ? '<i class="fa-regular fa-eye"></i>'
      : '<i class="fa-regular fa-eye-slash"></i>';

    togglePassword.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password"
    );
  });


  /* =========================
     LOGIN VALIDATION
  ========================= */

  loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    let valid = true;


    // Email / Doctor ID validation
    if (email === "") {
      emailError.textContent = "Please enter your email or Doctor ID.";
      valid = false;
    }


    // Password validation
    if (password === "") {
      passwordError.textContent = "Please enter your password.";
      valid = false;
    } else if (password.length < 6) {
      passwordError.textContent =
        "Password must contain at least 6 characters.";
      valid = false;
    }


    if (!valid) {
      return;
    }


    /*
      Demo login.

      Replace this section with your real
      authentication API request.
    */

    const button = loginForm.querySelector(".sign-in-btn");

    button.disabled = true;
    button.textContent = "Signing In...";


    setTimeout(() => {

      alert("Login successful!");

      button.disabled = false;
      button.textContent = "Sign In";

    }, 1000);
  });


  /* =========================
     FORGOT PASSWORD
  ========================= */

  forgotPassword.addEventListener("click", (event) => {

    event.preventDefault();

    alert(
      "Password recovery would open here."
    );
  });


  /* =========================
     HOSPITAL SSO
  ========================= */

  ssoButton.addEventListener("click", () => {

    alert(
      "Hospital Single Sign-On would open here."
    );
  });


  /* =========================
     REGISTER
  ========================= */

  registerLink.addEventListener("click", (event) => {

    event.preventDefault();

    alert(
      "Doctor registration would open here."
    );
  });


  /* =========================
     REMOVE ERROR WHEN TYPING
  ========================= */

  emailInput.addEventListener("input", () => {
    emailError.textContent = "";
  });

  passwordInput.addEventListener("input", () => {
    passwordError.textContent = "";
  });

});
