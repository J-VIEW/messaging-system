function isValidKabarakEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@kabarak\.ac\.ke$/;
  return re.test(String(email).toLowerCase());
}

document.addEventListener("DOMContentLoaded", function () {
  const genderLabels = document.querySelectorAll("#gender_div label");
  genderLabels.forEach((label) => {
    label.addEventListener("click", function () {
      genderLabels.forEach((l) => l.classList.remove("selected"));
      this.classList.add("selected");
    });
  });

  let myform = document.querySelector("#myform");

  myform.addEventListener("submit", function (event) {
    event.preventDefault();

    let username = myform.querySelector('input[name="username"]').value;
    let email = myform.querySelector('input[name="email"]').value;
    let password = myform.querySelector('input[name="password"]').value;
    let confirmPassword = myform.querySelector(
      'input[name="confirm_password"]'
    ).value;
    let gender = myform.querySelector('input[name="gender"]:checked').value;

    if (!isValidKabarakEmail(email)) {
      showErrorMessage("Please use a valid @kabarak.ac.ke email address.");
      return;
    }

    if (password !== confirmPassword) {
      showErrorMessage("Passwords do not match. Please try again.");
      return;
    }

    if (password.length < 8) {
      showErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    let formData = {
      username: username,
      email: email,
      gender: gender,
      password: password,
      smtp_email: myform.querySelector('input[name="smtp_email"]').value,
      smtp_password: myform.querySelector('input[name="smtp_password"]').value,
      data_type: "signup",
    };

    console.log("Data being sent:", formData);

    send_data(formData);
  });

  function send_data(formData) {
    const url = "./api.php";

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.text())
      .then((text) => {
        try {
          const result = JSON.parse(text);
          handle_result(result);
        } catch (error) {
          console.error("Failed to parse JSON:", text);
          // Try to extract the last valid JSON object from the response
          const jsonObjects = text.match(/\{[^}]+\}/g);
          if (jsonObjects && jsonObjects.length > 0) {
            try {
              const lastValidJson = JSON.parse(
                jsonObjects[jsonObjects.length - 1]
              );
              handle_result(lastValidJson);
            } catch (innerError) {
              console.error("Failed to parse extracted JSON:", innerError);
              showErrorMessage("An error occurred. Please try again later.");
            }
          } else {
            showErrorMessage("An error occurred. Please try again later.");
          }
        }
      })
      .catch((error) => {
        showErrorMessage("An error occurred. Please try again later.");
        console.error("Error:", error);
      });
  }
});

function handle_result(result) {
  console.log("Received result:", result);
  if (result.data_type === "verification_needed") {
    console.log("Verification needed");
    showSuccessMessage(result.message);
    setTimeout(() => {
      window.location.href = `./verify.php?user_id=${result.user_id}`;
    }, 1000);
  } else if (result.data_type === "success") {
    console.log("Login/Signup successful");
    // Store all user data consistently
    sessionStorage.setItem("user_id", result.user_id);
    sessionStorage.setItem("username", result.username);
    sessionStorage.setItem("user_email", result.email);
    sessionStorage.setItem("user_gender", result.gender);
    sessionStorage.setItem("user_image", result.image);

    showSuccessMessage(result.message);
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 1000);
  } else if (result.data_type === "error_msg") {
    console.log("Login/Signup failed:", result.message);
    showErrorMessage(result.message);
    //resetPasswordField();
  } else {
    console.log("Unexpected result type:", result);
    showErrorMessage("An unexpected error occurred. Please try again.");
    //resetPasswordField();
  }
}

// function resetPasswordField() {
//   const passwordField = document.querySelector('input[name="password"]');
//   const confirmPasswordField = document.querySelector('input[name="confirm_password"]');
//   if (passwordField) passwordField.value = '';
//   if (confirmPasswordField) confirmPasswordField.value = '';
// }

function showSuccessMessage(message) {
  const submitButton = document.querySelector("#signup_button");
  if (submitButton) {
    submitButton.value = message;
    submitButton.disabled = true;
    setTimeout(() => {
      submitButton.disabled = false;
      submitButton.value = "Sign Up";
    }, 3000);
  } else {
    console.error("Error: Element with ID 'signup_button' not found");
  }
}

function showErrorMessage(message) {
  const errorMessageDiv = document.querySelector("#error_msg");
  if (errorMessageDiv) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = "block";
    setTimeout(() => {
      errorMessageDiv.style.display = "none";
      resetForm();
    }, 2000);
  } else {
    console.error("Error: Element with ID 'error_msg' not found");
  }
}

function resetForm() {
  const myform = document.querySelector("#myform");
  if (myform) {
    myform.reset();
  } else {
    console.error("Error: Form not found");
  }
}
