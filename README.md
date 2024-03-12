# dungeon-autogen

This is an implentation of a frontend React application that automatically generates a dungeon that can be used in virtual table top games like Dungeons and Dragons, Pathfinder, etc. You are able to specify the dimensions of the generated dungeon, control the number of rooms generated, space between rooms, and sparsity of the map. You are able to upload images to be used as the background or foreground of the map. The map can also be exported as a png file or a dd2vtt file which is known as the Universal VTT file which is supported in a variety of online table top applications like Roll20 or FoundryVTT.

## 1. Installation

Install [docker compose](https://docs.docker.com/compose/install/) and run the command `docker compose up` in the root directory of the project.

## 2. Code Structure

    - .github/workflows

      - Contains CI/CD workflows
        - CICD_PROD.yml
          -Builds Dockerfile and installs it on a running Digital Ocean droplet which is open to the web

    - client

      - Contains all the frontend code for the application

        - public
          - Standard set of files for React applications
        - src

          - Source code of the frontend client

            - features

              - contains the components that are rendered in the application
                - map
                  - the main component of the application
                    - Control.js
                      - Logic dictating the behavior and appears of the menu that allows you to control the generation of the map as well as import/export tools
                    - generationUtils.js
                      - Functions that handle the generation logic for the maps
                    - Grid.js
                      - Used to generate the HTML of the grid/map
                    - Map.js
                      - The logic/display of the entire map including surrounding whitespace
                    - mapSlice.js
                      - a Redux slice that handles defining the application "state" and how that translates to its appearance

            - styles
              - contains custom scss/css for the application
            - App.css
              - extra css for the application
            - App.js
              - React application entry point
            - App.test.js
              - Unused
            - index.js
              - HTML root page
            - setupTests.js
              - Unused
            - store.js
              - Redux store for the application

        - Dockerfile
          - Dockerfile that is used for the CI/CD pipeline
        - package-lock.json/package.json
          - npm installation/script information

    - docker-compose.yml
      - Another way that is used to containerize the application which can be used in local development
    - package.json
      - npm installation information
