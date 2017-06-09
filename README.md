# DiffVisualizer #

![v 1.4](https://img.shields.io/badge/version-1.4-brightgreen.svg)

### Installation ###

* Download repo
* ` npm install `
* ` npm start ` /  ` npm run dev ` for autorestart on save
* Visit localhost:9999 

### Docker ###

This repo contains a dockerfile. To build a docker container and add it to your registry follow these steps:

We will use the image name of `wedenigc/diffviz` and the remote registry `swdyn.isys.uni-klu.ac.at:5000` in this example but these are interchangable!

* `docker build -t wedenigc/diffviz .`

(Optionally push it to the registry, not needed for using it locally)

* `docker tag wedenigc/diffviz swdyn.isys.uni-klu.ac.at:5000/wedenigc/diffviz`
* `docker push swdyn.isys.uni-klu.ac.at:5000/wedenigc/diffviz`

Finally create a container based on the image with name "my-diffviz-container"

* `docker run -d -p 80:9999 --name "my-diffviz-container" 
swdyn.isys.uni-klu.ac.at:5000/wedenigc/diffviz `