# DiffVisualizer

![Version](https://img.shields.io/github/package-json/v/W3D3/DiffVisualizer.svg) 
[![Build Status](https://travis-ci.com/W3D3/DiffVisualizer.svg?branch=master)](https://travis-ci.com/W3D3/DiffVisualizer)

## Installation

### via NPM

- Clone repo
- `npm install`
- `npm start`
- Visit [localhost:9999](localhost:9999) (or change port in `config/default.json`)

### via Docker

- Clone repo
- Run `./scripts/docker-build.sh` (not tested on Windows) or build and tag an image yourself
- Run the generated image

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
