FROM node

RUN mkdir -p /opt/higherorlower

COPY package.json /opt/higherorlower/
COPY config.json /opt/higherorlower/
COPY .babelrc /opt/higherorlower/

COPY public /opt/higherorlower/public
COPY src /opt/higherorlower/src

WORKDIR /opt/higherorlower/

RUN yarn install --ignore-engines --production=true --non-interactive
RUN yarn build

ENTRYPOINT ["yarn", "serve"]

EXPOSE 8080
