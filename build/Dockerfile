FROM node:15.14-buster

LABEL maintainer "Dennis Boeckmann <dev@dbck.de>"
LABEL description "This image reads mqtt messages from a mqtt broker and inserts it into a timescaledb."

ARG TARGETPLATFORM
ARG BUILDPLATFORM

ENV MQTT_HOST=mqtt
ENV MQTT_PORT=1883
ENV PGHOST=localhost
ENV PGPORT=5432
ENV PGDATABASE=postgres
ENV PGUSER=postgres
ENV PGPASSWORD=

RUN echo "I am running on $BUILDPLATFORM, building for $TARGETPLATFORM"

WORKDIR /app
COPY root/app/package.json /app/
COPY root/app/app.js /app/
RUN npm install
CMD [ "node", "app.js" ]
