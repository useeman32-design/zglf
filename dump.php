<?php
// Generate the SQL dump from the current database
require __DIR__.'/api/config.php';
$db=db();
$tables=[];
$r=$db->query("SHOW TABLES");foreach($r as $row){$tables[]=array_values($row)[0];}
$out="-- ZGLF Database Export\n-- Generated: ".date('Y-m-d H:i:s')."\n-- PHP Version: ".phpversion()."\n\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\nCREATE DATABASE IF NOT EXISTS `zglf` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE `zglf`;\n\n";
foreach($tables as $t){
  $cr=$db->query("SHOW CREATE TABLE `$t`")->fetch();
  $out.= "DROP TABLE IF EXISTS `$t`;\n".$cr['Create Table'].";\n\n";
  $rows=$db->query("SELECT * FROM `$t`")->fetchAll(PDO::FETCH_ASSOC);
  if($rows){
    $cols=array_keys($rows[0]);
    $out.="INSERT INTO `$t` (`".implode('`,`',$cols)."`) VALUES\n";
    $vals=[];
    foreach($rows as $r){
      $vs=[];foreach($r as $v){$vs[]=$v===null?'NULL':$db->quote($v);}
      $vals[]="(".implode(',',$vs).")";
    }
    $out.=implode(",\n",$vals).";\n\n";
  }
}
$out.="SET FOREIGN_KEY_CHECKS=1;\n";
file_put_contents(__DIR__.'/zglf_database.sql',$out);
echo "Export complete: ".strlen($out)." bytes\n";
echo "Tables: ".implode(', ',$tables)."\n";
