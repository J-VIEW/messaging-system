document.addEventListener("DOMContentLoaded", function () {
  const myform = document.querySelector("#myform");

  myform.addEventListener("submit", function (event) {
    event.preventDefault();

    const inputs = myform.querySelectorAll("input");
    const data = {};

    inputs.forEach(function (input) {
      const key = input.name;

      switch (key) {
        case "password":
        case "email":
          data[key] = input.value.trim();
          break;
      }
    });

    if (validateForm(data)) {
      send_data(data, "login");
    }
  });
});

function validateForm(data) {
  if (!data.email || !data.password) {
    showErrorMessage("Please fill in all fields.");
    return false;
  }
  if (!isValidEmail(data.email)) {
    showErrorMessage("Please enter a valid email address.");
    return false;
  }
  return true;
}

function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

function send_data(data, type) {
  data.data_type = type;
  const url = "../FrontEnd/api.php";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((result) => {
      handle_result(result);
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred. Please try again later.");
    });
}

function handle_result(result) {
  console.log("Received result:", result);
  if (result.data_type === "success") {
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
    resetPasswordField();
  } else {
    console.log("Unexpected result type:", result);
    showErrorMessage("An unexpected error occurred. Please try again.");
    resetPasswordField();
  }
}

function showSuccessMessage(message) {
  const submitButton = document.querySelector("#login_button");
  if (submitButton) {
    submitButton.value = message;
    submitButton.disabled = true;
  } else {
    console.error("Error: Element with ID 'login_button' not found");
  }
}

function showErrorMessage(message) {
  const errorMessageDiv = document.querySelector("#error_msg");
  if (errorMessageDiv) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = "block";

    setTimeout(() => {
      errorMessageDiv.style.display = "none";
    }, 5000);
  } else {
    console.error("Error: Element with ID 'error_msg' not found");
  }
}

function resetPasswordField() {
  const passwordInput = document.querySelector("input[name='password']");
  if (passwordInput) {
    passwordInput.value = "";
  } else {
    console.error("Error: Password input field not found");
  }
}

// function checkLoginStatus() {
//   const userId = localStorage.getItem("user_id");
//   const username = localStorage.getItem("username");
//   if (userId && username) {
//     window.location.href = "./index.html";
//   }
// }
