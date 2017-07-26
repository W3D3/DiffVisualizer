# DiffVisualizer #

![v 1.6](https://img.shields.io/badge/version-1.5.4-brightgreen.svg) [![Codeship](https://img.shields.io/codeship/01939780-4ced-0135-0db8-1a20c3f2c8a7.svg)](https://app.codeship.com/projects/232991)

### Installation ###

* Clone repo
* ` npm install `
* ` npm start`
* Visit localhost:9999 (or change port in config/default.json)

### Development ###

If you are actively changing things in the src folder:

* ` npm run dev ` (autocompile on change, server autorestart on save)
* Visit localhost:9999

### Docker ###

to build an up to date tagged version of this Application as a docker container you just have to run

` npm run docker-build `

and to push it to the private registry (`swdyn.isys.uni-klu.ac.at:5000`)

` npm run docker-push `

#### old method

This repo contains a dockerfile. To build a docker container and add it to your registry follow these steps:

We will use the image name of `wedenigc/diffviz` and the remote registry `swdyn.isys.uni-klu.ac.at:5000` in this example but these are interchangable!

* `docker build -t wedenigc/diffviz .`

(Optionally push it to the registry, not needed for using it locally)

* `docker tag wedenigc/diffviz swdyn.isys.uni-klu.ac.at:5000/wedenigc/diffviz`
* `docker push swdyn.isys.uni-klu.ac.at:5000/wedenigc/diffviz`

Finally create a container based on the image with name "my-diffviz-container"

* `docker run -d -p 80:9999 --name "my-diffviz-container"
swdyn.isys.uni-klu.ac.at:8080/wedenigc/diffviz `
