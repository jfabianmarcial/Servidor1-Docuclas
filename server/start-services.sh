#!/bin/bash
./auth-service &
./topic-service &
./doc-service &
./admin-service &
/usr/local/bin/envoy -c /etc/envoy/envoy.yaml &
wait