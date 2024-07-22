<?php

// Validate and sanitize input data
$username = htmlspecialchars($input['username'] ?? '', ENT_QUOTES, 'UTF-8');
$email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $input['password'] ?? '';
$gender = htmlspecialchars($input['gender'] ?? '', ENT_QUOTES, 'UTF-8');
$smtp_email = $input['smtp_email'] ?? '';
$smtp_password = $input['smtp_password'] ?? '';

// Check if the email is from kabarak.ac.ke domain
if (!preg_match('/@kabarak\.ac\.ke$/', $email)) {
    $response = [
        'data_type' => 'error_msg',
        'message' => 'Please use a valid @kabarak.ac.ke email address.'
    ];
    return;
}

// Check for duplicate email or username
$checkQuery = "SELECT * FROM users WHERE email = :email OR username = :username";
$checkData = [
    ':email' => $email,
    ':username' => $username
];
$checkResult = $DB->read_from_db($checkQuery, $checkData);

if (is_array($checkResult) && count($checkResult) > 0) {
    $response = [
        'data_type' => 'error_msg',
        'message' => 'Email or username already exists.'
    ];
} else {
    // Generating a 20-digit ID user_id using the Database class method
    $user_id = $DB->generate_id(20);

    // Set default image based on gender
    $default_image_path = getDefaultImage($gender);

if ($default_image_path !== false) {
    $image_content = file_get_contents($default_image_path);
    if ($image_content === false) {
        error_log("Failed to read image content from: " . $default_image_path);
        $response = [
            'data_type' => 'error_msg',
            'message' => 'Failed to read default image.'
        ];
        return;
    }
} else {
    $response = [
        'data_type' => 'error_msg',
        'message' => 'Default image not found.'
    ];
    return;
}

    // Generate verification token
    $token = bin2hex(random_bytes(16));

    $data = [
        'user_id' => $user_id,
        'username' => $username,
        'email' => $email,
        'password' => $password,
        'gender' => $gender,
        'image' => $image_content,
        'image_filename' => str_replace(PROJECT_ROOT, WEB_ROOT, $default_image_path),
        'date' => date("Y-m-d H:i:s"),
        'online' => 0,
        'token' => $token,
        'verified' => 0,
        'interests' => json_encode([])
    ];

    $query = "INSERT INTO users (user_id, username, email, gender, password, image, image_filename, date, online, token, verified, interests) 
        VALUES (:user_id, :username, :email, :gender, :password, :image, :image_filename, :date, :online, :token, :verified, :interests)";
    $result = $DB->write_to_db($query, $data);

    if ($result) {
        if (sendVerificationEmail($email, $token, $smtp_email, $smtp_password)) {
            $response = [
                'data_type' => 'verification_needed',
                'message' => 'Please check your email for the verification code.',
                'user_id' => $user_id
            ];
        } else {
            $response = [
                'data_type' => 'error_msg',
                'message' => 'Failed to send verification email. Please try again.'
            ];
        }
    } else {
        $response = [
            'data_type' => 'error_msg',
            'message' => 'Your signup failed'
        ];
    }
}
 