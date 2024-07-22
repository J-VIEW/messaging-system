<?php
$email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $input['password'] ?? '';

// Check if the email exists and the password is correct
$checkQuery = "SELECT * FROM users WHERE email = :email LIMIT 1";
$checkData = [
    ':email' => $email
];
$checkResult = $DB->read_from_db($checkQuery, $checkData);

if (is_array($checkResult) && count($checkResult) > 0) {
    $user = reset($checkResult); // Get the first element of the array
    if ($password === $user['password']) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['gender'] = $user['gender'];
    
        $response = [
            'data_type' => 'success',
            'message' => 'Login successful',
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'gender' => $user['gender'],
            'image' => base64_encode($user['image'])
        ];
    } else {
        // Password is incorrect
        $response = [
            'data_type' => 'error_msg',
            'message' => 'Incorrect password.'
        ];
    }
} else {
    // Email doesn't exist
    $response = [
        'data_type' => 'error_msg',
        'message' => 'Email not found.'
    ];
}