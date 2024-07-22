<?php
require_once '../BackEnd/config.php';

class Database
{
    private static $instance = null;
    private $con;

    // Constructor
    private function __construct()
    {
        $this->con = $this->connect();
    }

    // Singleton pattern: Get instance of Database
    public static function getInstance()
    {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    // Connect to Database
    private function connect()
    {
        $dsn = "mysql:host=" . DBHOST . ";dbname=" . DBNAME;

        try {
            $connection = new PDO($dsn, DBUSER, DBPASS);
            $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $connection;
        } catch (PDOException $e) {
            error_log("Connection failed: " . $e->getMessage(), 0);
            die("Database connection error.");
        }
    }

    // Check if the connection is still alive
    private function checkConnection()
    {
        try {
            $this->con->getAttribute(PDO::ATTR_SERVER_INFO);
        } catch (PDOException $e) {
            if ($e->getCode() == 2006) { // MySQL server has gone away
                $this->con = $this->connect();
            } else {
                throw $e;
            }
        }
    }

    // Write to Database
    public function write_to_db($query, $data_array = [])
    {
        $this->checkConnection();
        $statement = $this->con->prepare($query);
        foreach ($data_array as $key => &$value) {
            if (is_null($value)) {
                $type = PDO::PARAM_NULL;
            } elseif (is_bool($value)) {
                $type = PDO::PARAM_BOOL;
            } elseif (is_int($value)) {
                $type = PDO::PARAM_INT;
            } elseif (is_string($value)) {
                $type = PDO::PARAM_STR;
            } else {
                $type = PDO::PARAM_LOB;
            }
            $statement->bindValue($key, $value, $type);
        }
        $result = $statement->execute();
        if (!$result) {
            error_log("SQL Error: " . print_r($statement->errorInfo(), true));
        }
        return $result;
    }

    // Read from Database
    public function read_from_db($query, $data_array = [])
    {
        $this->checkConnection();
        $statement = $this->con->prepare($query);
        foreach ($data_array as $key => &$value) {
            $type = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $statement->bindValue($key, $value, $type);
        }
        $statement->execute();
        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    // Generate a random ID
    public function generate_id($max)
    {
        $rand = "";
        $rand_count = rand(4, $max);

        for ($i = 0; $i < $rand_count; $i++) {
            $random_no = rand(0, 9);
            $rand .= $random_no;
        }

        return (int)$rand;
    }

    // Get a single row
    public function get_row($query, $data_array = [])
    {
        $this->checkConnection();
        $statement = $this->con->prepare($query);
        $statement->execute($data_array);
        return $statement->fetch(PDO::FETCH_ASSOC);
    }

    // Count rows
    public function count_rows($query, $data_array = [])
    {
        $this->checkConnection();
        $statement = $this->con->prepare($query);
        $statement->execute($data_array);
        return $statement->rowCount();
    }

    // Begin a transaction
    public function begin_transaction()
    {
        $this->checkConnection();
        $this->con->beginTransaction();
    }

    // Commit a transaction
    public function commit_transaction()
    {
        $this->con->commit();
    }

    // Rollback a transaction
    public function rollback_transaction()
    {
        $this->con->rollBack();
    }

    public function generateMessageId($length = 20) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $msgId = '';
        for ($i = 0; $i < $length; $i++) {
            $msgId .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $msgId;
    }

}

