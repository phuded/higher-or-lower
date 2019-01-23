```
server {
    server_name drink-higher-lower.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
    }

    location /ws {
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Proxy "";
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_pass http://127.0.0.1:8080;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/drink-higher-lower.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/drink-higher-lower.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
    if ($host = drink-higher-lower.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name drink-higher-lower.com;
    return 404; # managed by Certbot
}

server {
    if ($host = www.drink-higher-lower.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name www.drink-higher-lower.com;
    return 404; # managed by Certbot
}
```