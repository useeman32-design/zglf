# Deploy ZGLF to cPanel (HostAfrica / DomainKing)

## 1. Point your domain to HostAfrica nameservers
In Namecheap → Domain List → zeeglowlinkfoundation.org → Manage → Nameservers → Custom DNS:
```
ns1.host-ww.net
ns2.host-ww.net
```
Wait 30 min – 24 hours for DNS to propagate.

## 2. In cPanel, BEFORE cloning:
1. **MySQL® Databases**:
   - Create new database: e.g. `hostabc_zglf` (your cPanel username prefix is auto-added)
   - Create new user: e.g. `hostabc_zglf` with a strong password — SAVE this password
   - Add user to database → check ALL PRIVILEGES
2. **MultiPHP Manager**: set zeeglowlinkfoundation.org to PHP 8.0 or 8.1.

## 3. Clone repo via cPanel Terminal:
```bash
cd ~/public_html
# Remove default cPanel placeholder (if any)
rm -f index.html.* default.php.* comingsoon.html 2>/dev/null
# Clone ZGLF into current folder
git clone https://github.com/useeman32-design/zglf.git .
# Make uploads writable
chmod -R 755 uploads
```

If your main domain is in a subfolder (e.g. ~/public_html/zglf/), clone into that subfolder instead and access via `https://zeeglowlinkfoundation.org/zglf/cpanel-install.php`.

## 4. Run the installer:
Visit **https://zeeglowlinkfoundation.org/cpanel-install.php** in your browser.
Fill in:
- DB Host: `localhost`
- DB Name: the database you created (e.g. `hostabc_zglf`)
- DB User: the user you created
- DB Pass: the password you set
- Choose admin username/password

Click **Install ZGLF**. Wait 5 seconds.

## 5. AFTER INSTALL SUCCEEDS — DELETE installer:
In cPanel File Manager, **delete cpanel-install.php**. Leaving it is a security risk.

## 6. You're done:
- Public site: https://zeeglowlinkfoundation.org/
- Admin dashboard: https://zeeglowlinkfoundation.org/admin/
- Login with the admin username/password you chose.

## 7. (Optional) Pulling future updates via Terminal:
```bash
cd ~/public_html
git pull origin main
```
Your uploads/ and api/.env.php are gitignored so they won't be overwritten.

## Troubleshooting
- **404 on admin/pages**: make sure .htaccess was uploaded (File Manager → Settings → Show hidden files).
- **Upload fails 500**: check uploads/ folder permissions (755), ensure PHP GD extension is enabled in cPanel.
- **White screen**: set PHP to 8.0+; check cPanel Error Logs.
