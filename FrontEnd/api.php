<?php
// Turn off error reporting for production
// ini_set('display_errors', 0);
// ini_set('log_errors', 1);
// error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

ini_set('log_errors', 1);
ini_set('error_log', './debug.log');

// Include necessary files
require_once '../BackEnd/initialize.php';

// Start output buffering
ob_start();

// Start the session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Set the content type to JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load Composer's autoloader
require_once __DIR__ . '/../vendor/autoload.php';

// Initialize the Database connection
$DB = Database::getInstance();

// Initialize the response object
$response = [];

// Increase max_allowed_packet size (if needed)
$DB->write_to_db("SET GLOBAL max_allowed_packet=16777216;", []);

// Process the data
try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $data_type = $input['data_type'] ?? null;
        $data = $input ?? [];
    
        if ($data_type === null) {
            echo json_encode(['data_type' => 'error_msg', 'message' => 'No data type provided.']);
            exit;
        }
        switch ($data_type) {
            case 'signup':
                include './includes/signup.php';
                break;                  

            case 'login':
                include './includes/login.php';
                break;

            case 'login_status':
                include './includes/login_status.php';
                break;

            case 'logout':
                include './includes/logout.php';
                break;

            case 'delete_profile_pic':
                include './includes/delete_profile_pic.php';
                break;    

            case "user_info":
                include './includes/user_info.php';
                break;

            case 'settings':
                include './includes/settings.php';
                break;

            case 'get_image':
                include './includes/get_image.php';
                break;

            case 'send_message':
                error_log("Received send_message request: " . json_encode($data));
                $receiver = $data['receiver'] ?? null;
                $message = $data['message'] ?? null;
                $file = $data['file'] ?? null;
                
                if (!isset($_SESSION['user_id'])) {
                    error_log("User not logged in. Session: " . json_encode($_SESSION));
                    echo json_encode(['success' => false, 'error' => 'User not logged in']);
                    exit;
                }
                
                $sender = $_SESSION['user_id'];
                $message = trim(htmlspecialchars($message));
                
                if (empty($message) && $file === null) {
                    echo json_encode(['success' => false, 'error' => 'Message cannot be empty']);
                    exit;
                }
                
                // Fetch sender's details
                $senderQuery = "SELECT username, image FROM users WHERE user_id = :sender_id";
                $senderDetails = $DB->read_from_db($senderQuery, [':sender_id' => $sender]);
                
                if (!$senderDetails) {
                    echo json_encode(['success' => false, 'error' => 'Failed to fetch sender details']);
                    exit;
                }
                
                $senderUsername = $senderDetails[0]['username'];
                $senderImage = $senderDetails[0]['image'];
                
                $msgId = $DB->generateMessageId();
                $date = date("Y-m-d H:i:s");
                
                $fileData = null;
                if ($file !== null) {
                    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime'];
                    $maxFileSize = 10 * 1024 * 1024;
            
                    if (!in_array($file['type'], $allowedTypes)) {
                        echo json_encode(['success' => false, 'error' => 'Invalid file type. Only JPEG, PNG, GIF images and MP4, MPEG, QuickTime videos are allowed.']);
                        exit;
                    }
            
                    $decodedFile = base64_decode($file['data']);
                    if (strlen($decodedFile) > $maxFileSize) {
                        echo json_encode(['success' => false, 'error' => 'File is too large. Maximum file size is 10 MB.']);
                        exit;
                    }
            
                    $uploadDir = './uploads/';
                    if (!file_exists($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
            
                    $fileName = uniqid() . '_' . $file['name'];
                    $filePath = $uploadDir . $fileName;
            
                    if (file_put_contents($filePath, $decodedFile)) {
                        $fileData = [
                            'name' => $fileName,
                            'path' => $filePath,
                            'type' => $file['type'],
                            'size' => strlen($decodedFile)
                        ];
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to upload file']);
                        exit;
                    }
                }
                
                $query = "INSERT INTO messages (msgid, sender, receiver, message, files, date, seen, received, deleted_sender, deleted_receiver) 
                            VALUES (:msgid, :sender, :receiver, :message, :files, :date, 0, 0, 0, 0)";
                
                $params = [
                    ':msgid' => $msgId,
                    ':sender' => $sender,
                    ':receiver' => $receiver,
                    ':message' => $message,
                    ':files' => $fileData ? json_encode($fileData) : null,
                    ':date' => $date
                ];
                
                $result = $DB->write_to_db($query, $params);
                
                if ($result) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Message sent successfully',
                        'msgid' => $msgId,
                        'timestamp' => $date,
                        'sender_username' => $senderUsername,
                        'sender_image' => base64_encode($senderImage)  // Encode the image data
                    ]);
                } else {
                    error_log("Failed to send message. DB error: " . $DB->getLastError());
                    echo json_encode(['success' => false, 'error' => 'Failed to send message']);
                }
                exit;
                break;

            case 'delete_message':
                $msgId = $input['msgid'] ?? null;
                $userId = $_SESSION['user_id'] ?? null;
            
                if (!$msgId || !$userId) {
                    echo json_encode(['success' => false, 'error' => 'Invalid request']);
                    exit;
                }
            
                $query = "UPDATE messages SET deleted_sender = 1 WHERE msgid = :msgid AND sender = :userId";
                $result = $DB->write_to_db($query, [':msgid' => $msgId, ':userId' => $userId]);
            
                if ($result) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Failed to delete message']);
                }
                break;
            
            case 'check_message_statuses':
                $contactId = $input['contact_id'] ?? null;
                $userId = $_SESSION['user_id'] ?? null;
            
                if (!$userId || !$contactId) {
                    echo json_encode(['success' => false, 'error' => 'Invalid request']);
                    exit;
                }
            
                $query = "SELECT msgid, seen FROM messages WHERE sender = :user_id AND receiver = :contact_id AND seen = 1";
                $result = $DB->read_from_db($query, [':user_id' => $userId, ':contact_id' => $contactId]);
            
                if ($result) {
                    $updatedMessages = array_map(function($msg) {
                        return ['msgid' => $msg['msgid'], 'status' => 'seen'];
                    }, $result);
                    echo json_encode(['success' => true, 'updated_messages' => $updatedMessages]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Failed to fetch message statuses']);
                }
                break;

            case 'check_new_messages':
                $contactId = $input['contact_id'] ?? null;
                $lastCheckTime = $input['last_check_time'] ?? null;
                $userId = $_SESSION['user_id'] ?? null;
            
                if (!$userId || !$contactId || !$lastCheckTime) {
                    echo json_encode(['success' => false, 'error' => 'Invalid request']);
                    exit;
                }
            
                $query = "SELECT * FROM messages 
                            WHERE receiver = :userId AND sender = :contactId AND date > :lastCheckTime
                            ORDER BY date ASC";
                $messages = $DB->read_from_db($query, [
                    ':userId' => $userId,
                    ':contactId' => $contactId,
                    ':lastCheckTime' => $lastCheckTime
                ]);
                
                $newMessages = array_map(function($message) {
                    return [
                        'msgid' => $message['msgid'],
                        'message' => $message['message'],
                        'files' => $message['files'],
                        'timestamp' => $message['date']
                    ];
                }, $messages);
                
                echo json_encode(['success' => true, 'new_messages' => $newMessages]);
                break;

            case 'mark_messages_seen':
                $contactId = $input['contact_id'] ?? null;
                $userId = $_SESSION['user_id'] ?? null;
            
                if (!$userId || !$contactId) {
                    echo json_encode(['success' => false, 'error' => 'Invalid request']);
                    exit;
                }
            
                $query = "UPDATE messages SET seen = 1 WHERE sender = :contact_id AND receiver = :user_id AND seen = 0";
                $result = $DB->write_to_db($query, [':contact_id' => $contactId, ':user_id' => $userId]);
            
                if ($result) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Failed to mark messages as seen']);
                }
                break;

            case 'get_chat_history':
                error_log("Received get_chat_history request: " . json_encode($input));
                $contactId = $input['contact_id'] ?? null;
                $userId = $_SESSION['user_id'] ?? null;
            
                error_log("User ID: $userId, Contact ID: $contactId");
            
                if (!$userId || !$contactId) {
                    error_log("Invalid request. Missing user ID or contact ID.");
                    echo json_encode(['success' => false, 'error' => 'Invalid request. Missing user ID or contact ID.']);
                    exit;
                }
            
                $query = "SELECT * FROM messages
                            WHERE (sender = :user_id AND receiver = :contact_id AND deleted_sender = 0) 
                            OR (sender = :contact_id AND receiver = :user_id AND deleted_receiver = 0)
                            ORDER BY date ASC";
                
                error_log("Executing query: $query");
                error_log("Query params: " . json_encode([':user_id' => $userId, ':contact_id' => $contactId]));
                
                $messages = $DB->read_from_db($query, [
                    ':user_id' => $userId,
                    ':contact_id' => $contactId,
                ]);
            
                error_log("Query result: " . json_encode($messages));
            
                if ($messages !== false) {
                    $response = [
                        'success' => true,
                        'messages' => $messages
                    ];
                    error_log("Sending response: " . json_encode($response));
                    echo json_encode($response);
                } else {
                    error_log("Failed to load chat history. DB error: " . $DB->getLastError());
                    echo json_encode([
                        'success' => false,
                        'error' => 'Failed to load chat history'
                    ]);
                }
                break;
                            
            case 'update_message_status':
                $msgIds = $input['msg_ids'] ?? null;
                $status = $input['status'] ?? null;
                $userId = $_SESSION['user_id'] ?? null;
            
                if (!$msgIds || !$status || !$userId) {
                    echo json_encode(['success' => false, 'error' => 'Invalid request']);
                    exit;
                }
            
                $placeholders = implode(',', array_fill(0, count($msgIds), '?'));
                $query = "UPDATE messages SET received = 1 WHERE msgid IN ($placeholders) AND receiver = ?";
                $params = array_merge($msgIds, [$userId]);
            
                $result = $DB->write_to_db($query, $params);
            
                if ($result) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Failed to update message status']);
                }
                break;

            case 'contacts':
            case 'get_contacts':
                include './includes/contacts.php';
                break;

            default:
                $response = [
                    'data_type' => 'error_msg',
                    'message' => 'Invalid data type.'
                ];
                break;
        }
    } else {
        $response = [
            'data_type' => 'error_msg',
            'message' => 'No data type provided.'
        ];
    }
    
} catch (Exception $e) {
    error_log("Error in API: " . $e->getMessage());
    $response = [
        'data_type' => 'error_msg',
        'message' => 'An unexpected error occurred. Please try again later.'
    ];
}

ob_end_clean();
echo json_encode($response);
exit;
?>