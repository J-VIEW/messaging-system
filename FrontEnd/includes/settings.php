<?php
// Validate and sanitize input data
$username = htmlspecialchars($input['username'] ?? '', ENT_QUOTES, 'UTF-8');
$email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
$gender = htmlspecialchars($input['gender'] ?? '', ENT_QUOTES, 'UTF-8');
$currentPassword = $input['current_password'] ?? '';
$newPassword = $input['new_password'] ?? '';

// Check if the user exists
$checkQuery = "SELECT * FROM users WHERE user_id = :user_id LIMIT 1";
$checkData = [':user_id' => $_SESSION['user_id']];
$checkResult = $DB->read_from_db($checkQuery, $checkData);

if (!is_array($checkResult) || count($checkResult) == 0) {
    $response = [
        'data_type' => 'error_msg',
        'message' => 'User not found.'
    ];
    return;
}

$user = $checkResult[0];

// Prepare data for update
$data = [
    'user_id' => $_SESSION['user_id'],
    'username' => $username,
    'email' => $email,
    'gender' => $gender,
];

// Handle password change if requested
if (!empty($currentPassword) && !empty($newPassword)) {
    if ($currentPassword !== $user['password']) {
        $response = [
            'data_type' => 'error_msg',
            'message' => 'Current password is incorrect.'
        ];
        return;
    }
    $data['password'] = $newPassword;
}

// Handle profile picture
if (isset($input['remove_profile_pic']) && $input['remove_profile_pic'] == '1') {
    // Set default image based on gender
    $default_image_path = getDefaultImage($gender);
    $data['image'] = file_get_contents($default_image_path);
    $data['image_filename'] = str_replace(PROJECT_ROOT, WEB_ROOT, $default_image_path);
} elseif (isset($input['profile_pic'])) {
    // New profile picture uploaded
    $imageData = base64_decode($input['profile_pic']);
    $filename = $_SESSION['user_id'] . '_' . time() . '.jpg';
    $fullPath = PROJECT_ROOT . '/FrontEnd/User-Interface/images/' . $filename;
    file_put_contents($fullPath, $imageData);
    $data['image'] = $imageData;
    $data['image_filename'] = WEB_ROOT . '/FrontEnd/User-Interface/images/' . $filename;
}

// Construct the update query
$query = "UPDATE users SET username = :username, email = :email, gender = :gender";
if (isset($data['image'])) {
    $query .= ", image = :image, image_filename = :image_filename";
}
if (isset($data['password'])) {
    $query .= ", password = :password";
}
$query .= " WHERE user_id = :user_id";

// Execute the update
$result = $DB->write_to_db($query, $data);

if ($result) {
    // Update session data
    $_SESSION['username'] = $username;
    $_SESSION['email'] = $email;
    $_SESSION['gender'] = $gender;

    // Fetch the updated user data
    $fetchQuery = "SELECT * FROM users WHERE user_id = :user_id LIMIT 1";
    $fetchResult = $DB->read_from_db($fetchQuery, [':user_id' => $_SESSION['user_id']]);
    if (is_array($fetchResult) && count($fetchResult) > 0) {
        $updatedUser = $fetchResult[0];
        // Prepare response
        $response = [
            'data_type' => 'success',
            'message' => 'Settings updated successfully.',
            'username' => $updatedUser['username'],
            'email' => $updatedUser['email'],
            'gender' => $updatedUser['gender'],
            'user_id' => $updatedUser['user_id'],
            'image' => base64_encode($updatedUser['image'])
        ];
        // If an old profile picture was replaced, delete it
        if (isset($data['image']) && $user['image_filename'] !== $default_image_path) {
            $oldImagePath = PROJECT_ROOT . $user['image_filename'];
            if (file_exists($oldImagePath)) {
                unlink($oldImagePath);
            }
        }
    } else {
        $response = [
            'data_type' => 'error_msg',
            'message' => 'Failed to fetch updated user data.'
        ];
    }
} else {
    $response = [
        'data_type' => 'error_msg',
        'message' => 'Failed to update settings.'
    ];
}