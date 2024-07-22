<?php
// Destroy the session and logout the user
session_destroy();
$response = [
    'data_type' => 'success',
    'message' => 'Logout successful.'
];