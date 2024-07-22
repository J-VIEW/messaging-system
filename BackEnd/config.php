<?php
// Database configuration
define('DBUSER', 'root');
define('DBPASS', '');
define('DBNAME', 'mychat_db');
define('DBHOST', 'localhost');

// Application settings

define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif']);
define('DEFAULT_MALE_AVATAR', 'User-Interface/icons/male.jpg');
define('DEFAULT_FEMALE_AVATAR', 'User-Interface/icons/female.jpeg');


// Define constants if they are not already defined
if (!defined('MAX_FILE_SIZE')) {
    define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
}

if (!defined('PROJECT_ROOT')) {
    define('PROJECT_ROOT', realpath($_SERVER['DOCUMENT_ROOT'] . '/messaging-system'));
}

if (!defined('WEB_ROOT')) {
    define('WEB_ROOT', '/messaging-system');
}


// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1);