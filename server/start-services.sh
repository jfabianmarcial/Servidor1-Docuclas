#!/bin/bash
./auth-service &
./topic-service &
./doc-service &
./admin-service &
uvicorn main:app --host 0.0.0.0 --port 8090 &
wait