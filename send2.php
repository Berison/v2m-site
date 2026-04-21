<?php

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
// error_reporting(E_ALL);

// Load .env
$envFile = '/opt/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
        putenv(trim($line));
    }
}

// Let s define our Root Dir
define('ROOT_DIR', realpath(__DIR__).'/');

// Import PHPMailer classes into the global namespace
// These must be at the top of your script, not inside a function
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\POP3;
//use autoload;

require_once ROOT_DIR.'class/PHPMailer/Exception.php';
require_once ROOT_DIR.'class/PHPMailer/PHPMailer.php';
require_once ROOT_DIR.'class/PHPMailer/SMTP.php';
require_once ROOT_DIR.'class/PHPMailer/POP3.php';
require_once ROOT_DIR.'autoload.php';

// $secret = getenv('RECAPTCHA_SECRET');

// If the form submission includes the "g-captcha-response" field
// Create an instance of the service using your secret
// $recaptcha = new \ReCaptcha\ReCaptcha($secret);

// If file_get_contents() is locked down on your PHP installation to disallow
// its use with URLs, then you can use the alternative request method instead.
// This makes use of fsockopen() instead.
//  $recaptcha = new \ReCaptcha\ReCaptcha($secret, new \ReCaptcha\RequestMethod\SocketPost());
// Make the call to verify the response and also pass the user's IP address

// $response = $recaptcha->setExpectedHostname($_SERVER['SERVER_NAME'])
//                       ->verify($_POST['g-recaptcha-response'], $_SERVER['REMOTE_ADDR']);

// if ($response->isSuccess()) {
if (true) {
    $mail = new PHPMailer(true);                              // Passing `true` enables exceptions
    try {
        //Server settings
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER;                     //Enable verbose debug output
        $mail->SMTPDebug = 0;                     //Disable verbose debug output
        $mail->isSMTP();                                           //Send using SMTP
        $mail->Host       = 'mail.v2minc.com';                     //Set the SMTP server to send through
        $mail->SMTPAuth   = true;                                  //Enable SMTP authentication
        $mail->Username   = 'info@v2minc.com';                     //SMTP username
        $mail->Password   = getenv('SMTP_PASSWORD');                    //SMTP password
        $mail->SMTPSecure = 'tls';        //Enable implicit TLS encryption
        $mail->Port       = 587;
        // $mail->SMTPOptions = array(
        //     'ssl' => array(
        //         'verify_peer' => false,
        //         'verify_peer_name' => false,
        //         'allow_self_signed' => true
        //     )
        // );                                   //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`
        
        //Recipients
        $mail->setFrom('info@v2minc.com', 'Mailer');
        $mail->addAddress('info@v2minc.com', 'Ceo V2M');     //Add a recipient
        //$mail->addAddress('ellen@example.com');               //Name is optional
        // $mail->addReplyTo('john@example.com', 'Information');
        // $mail->addCC('opensirius@gmail.com');
        //$mail->addBCC('bcc@example.com');

        //Attachments
        //$mail->addAttachment('/var/tmp/file.tar.gz');         //Add attachments
        //$mail->addAttachment('/tmp/image.jpg', 'new.jpg');    //Optional name    
            
        if ($_POST['action'] == 'contact-form') {
            $type = ($_POST['action']);
            $name = ($_POST['name']);
            $email = ($_POST['email']);
            $company = ($_POST['company']);
            $message = ($_POST['message']);
        
            $data = array(
                'Тип формы:' => $type,
                'Имя:' => $name,
                'Компания:' => $company,
                'Почта:' => $email,
                'Текст обращения:' => $message,
            );
        }

        if ($_POST['action'] == 'download-report') {
            $type = ($_POST['action']);
            $name = ($_POST['name']);
            $email = ($_POST['email']);
            $company = ($_POST['company']);
        
            $data = array(
                'Тип формы:' => $type,
                'Имя:' => $name,
                'Почта:' => $email,
                'Компания:' => $company,
            );

            $mail->addAttachment(ROOT_DIR . 'V2M-report.pdf');  //Add report
        }

        if ($_POST['action'] == 'mini-game-form') {
            $type = ($_POST['action']);
            $name = ($_POST['name']);
            $email = ($_POST['email']);
        
            $data = array(
                'Тип формы:' => $type,
                'Имя:' => $name,
                'Почта:' => $email,
            );
        }
        
        $mailText = '';
        foreach($data as $key => $value) {
            $mailText .= "<b>".$key."</b> ".$value."<br>";
        };
        
        //Content
        $mail->isHTML(true);    // Set email format to HTML
        $mail->CharSet = "utf-8";
        $mail->Subject = 'V2M website form';
        $mail->Body    = '<h2>V2M</h2><br>'.$mailText;
        //$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';
    
        $mail->send();
        
        setcookie("v2m-sendform", 'send');
        // header('Location: https://v2minc.com/#game');
    
    } catch (phpmailerException $e) {
        echo $e->errorMessage(); //Pretty error messages from PHPMailer
    } catch (Exception $e) {
        echo $e->errorMessage();
        setcookie("v2m-sendform", 'error');
        // header('Location: https://v2minc.com/#game');
    }

    //Отправка email с отчетом
    if ($_POST['action'] == 'download-report') {
        $mail = new PHPMailer(true);                              // Passing `true` enables exceptions

        try {
            //Server settings
            // $mail->SMTPDebug = SMTP::DEBUG_SERVER;                     //Enable verbose debug output
            $mail->SMTPDebug = 0;                     //Enable verbose debug output
            $mail->isSMTP();                                           //Send using SMTP
            $mail->Host       = 'mail.v2minc.com';                     //Set the SMTP server to send through
            $mail->SMTPAuth   = true;                                  //Enable SMTP authentication
            $mail->Username   = 'info@v2minc.com';                     //SMTP username
            $mail->Password   = getenv('SMTP_PASSWORD');                    //SMTP password
            $mail->SMTPSecure = 'tls';        //Enable implicit TLS encryption
            $mail->Port       = 587;
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );

            $type = ($_POST['action']);
            $name = ($_POST['name']);
            $email = ($_POST['email']);
            $company = ($_POST['company']);

            //Recipients
            $mail->setFrom('info@v2minc.com', 'V2M');
            $mail->addAddress($email);     //Add a recipient
        
            $data = array(
                'Тип формы:' => $type,
                'Имя:' => $name,
                'Почта:' => $email,
                'Компания:' => $company,
            );

            $mail->addAttachment(ROOT_DIR . 'V2M-report.pdf');  //Add report
    
            $mailText = '';
            foreach($data as $key => $value) {
                // $mailText .= "<b>".$key."</b> ".$value."<br>";
            };

            $mailText .= 'The report is attached';
        
            //Content
            $mail->isHTML(true);    // Set email format to HTML
            $mail->CharSet = "utf-8";
            $mail->Subject = 'V2M website form';
            $mail->Body    = '<h2>V2M</h2><br>'.$mailText;
            //$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';
        
            $mail->send();
            
            setcookie("v2m-sendform", 'send');
            header('Location: https://v2minc.com/#game');
        
        } catch (phpmailerException $e) {
            echo $e->errorMessage(); //Pretty error messages from PHPMailer
        } catch (Exception $e) {
            echo $e->errorMessage();
            setcookie("v2m-sendform", 'error');
            // header('Location: https://v2minc.com/#game');
        }
    }
} else {
    // Отладка капчи
    echo "Captcha Error<br>";
    echo "Error codes: ";
    // print_r($response->getErrorCodes());
    echo "<br>Hostname: " . $_SERVER['SERVER_NAME'];
}


?>