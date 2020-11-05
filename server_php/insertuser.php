<?php
include("./connectdatabase.php");//데이터베이스와 연결

//클라이언트에서 넘어온 회원 정보
$account = $_POST['account'];
$password =hash("sha256",$_POST['password']) ;
$name = $_POST['name'];
$department = $_POST['department'];

$grade = $_POST['gradeNumber'];
$gradeNumber = $_POST['gradeNumber'];

$email = $_POST['email'];
$student_number = $_POST['StudentNumber'];
$StudentNumber = $_POST['StudentNumber'];






//쿼리문
$sql="
    INSERT INTO user(account, password, name, department, grade, email, student_number)
    VALUES (
      '$account',
      '$password',
      '$name',
      '$department',
      '$grade',
      '$email',
      '$StudentNumber'
    )
    ";
$result=mysqli_query($conn, $sql);

if($result===true){
  echo "회원가입이 완료되었습니다.";
}

 ?>
