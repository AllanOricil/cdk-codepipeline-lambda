# Project Title

[![Build status](https://img.shields.io/docker/cloud/build/username/projectname)](https://hub.docker.com/r/username/projectname/builds)

A brief description of your project here.

## Requirements

- Docker

## Running the project

The application runs in a Docker container. 

1. To build the Docker image, navigate to the directory containing the Dockerfile, and run:

    ```bash
    docker build -t my_docker_image .
    ```

2. After the image build completes, you can run the image as a container:

    ```bash
    docker run -p 8080:80 -d my_docker_image
    ```

    Replace `8080:80` with the port mapping appropriate to your application.

3. Navigate to `http://localhost:8080` in your web browser (or whichever port you mapped to).

## Docker hub

The docker image is also available on Docker Hub:

```bash
docker pull username/projectname
