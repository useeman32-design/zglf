<?php
// PHP built-in dev-server router
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
$path=rtrim($path,'/');
// Uploaded media files: serve directly
if(strpos($path,'/uploads/')===0){$f=__DIR__.$path;if(is_file($f)){return false;}}
// Static images/events at root: serve
if(preg_match('#^/(images|events|favicon\.)#',$path)){$f=__DIR__.$path;if(is_file($f))return false;}
// API requests go to index.php
if(strpos($path,'/api')===0 || $path==='/api'){require __DIR__.'/api/index.php';exit;}
// Admin SPA: anything under /admin serves admin/index.html (unless it's a real file like admin.css / admin.js)
if(strpos($path,'/admin')===0){
  $file=__DIR__.$path;
  if($path==='/admin' || !is_file($file)){require __DIR__.'/admin/index.html';exit;}
  return false; // serve real static file (css, js, images, etc.)
}
// Static files: serve if exists
$file=__DIR__.$path;
if($path==='' || $path==='/'){require __DIR__.'/index.html';exit;}
if(is_file($file)){return false;}
// If path looks like SPA route (no extension), serve public index.html
if(!pathinfo($path,PATHINFO_EXTENSION)){require __DIR__.'/index.html';exit;}
return false;
