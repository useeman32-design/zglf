#!/usr/bin/env bash
# ZGLF Local Preview Launcher (Mac / Linux)
# Requires PHP 8+ on PATH
echo ""
echo " =============================================="
echo "  ZGLF Website — Local Preview"
echo " =============================================="
echo ""
echo " Public site:  http://localhost:8080/"
echo " Admin panel:  http://localhost:8080/admin/"
echo " Admin login:  admin / admin123"
echo ""
echo " Press Ctrl+C to stop."
echo ""
chmod -R 777 uploads/ 2>/dev/null
php -S 0.0.0.0:8080 router.php
