#!/bin/bash
./auth-service &
./topic-service &
./doc-service &
./admin-service &
wait