# DiffVisualizer

![v 2.7.1](https://img.shields.io/badge/version-2.7.1-brightgreen.svg) [![Codeship](https://img.shields.io/codeship/01939780-4ced-0135-0db8-1a20c3f2c8a7.svg)](https://app.codeship.com/projects/232991)

## Installation

- Clone repo
- `npm install`
- `npm start`
- Visit [localhost:9999](localhost:9999) (or change port in config/default.json)

## Development

If you are actively changing things in the src folder:

- `npm run dev` (autocompiles on change, server autorestarts on save)
- Visit [localhost:9999](localhost:9999)

## Docker

to build an up to date tagged version of this Application as a docker container you just have to run

`npm run docker-build`

and to push it to the private registry (`swdyn.isys.uni-klu.ac.at:5000`)

`npm run docker-push`

and to combine those two things just run `npm run deploy`
