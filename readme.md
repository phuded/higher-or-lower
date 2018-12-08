```
CREATE TABLE `player` (
  `name` varchar(20) DEFAULT NULL,
  `fname` varchar(20) DEFAULT NULL,
  `surname` varchar(20) DEFAULT NULL,
  `max_correct` int(11) DEFAULT NULL,
  `max_incorrect` int(11) DEFAULT NULL,
  `max_finger` int(11) DEFAULT NULL,
  `last_played` datetime DEFAULT NULL,
  UNIQUE KEY `name` (`name`)
)
```

```
server {
    server_name drink-higher-lower.com;

    location / {
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