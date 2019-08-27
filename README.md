# DiffVisualizer ![DiffViz Logo](https://raw.githubusercontent.com/W3D3/DiffVisualizer/master/public/favicon-32x32.png)

![Version](https://img.shields.io/github/package-json/v/W3D3/DiffVisualizer.svg) 
[![Build Status](https://travis-ci.com/W3D3/DiffVisualizer.svg?branch=master)](https://travis-ci.com/W3D3/DiffVisualizer)

DiffVisualizer alias DiffViz is an open-source visualization software for displaying diffs. DiffViz does not come with a webservice so to try out DiffViz you can use the example [DiffWebservice](https://github.com/W3D3/diffwebservice) that hosts the Google DiffMatchPatch algorithm or use it as a template to code your own.

## Installation

### via NPM

- Clone repo
- `npm install`
- Change Config (See "Configuration")
- `npm start`
- Visit [localhost:9999](localhost:9999) (or change port in `config/default.json`)

### via Docker

- Clone repo
- Change Config (See "Configuration")
- Run `bash ./scripts/docker-build` (needs git bash/native bash on Windows) or build and tag an image yourself
- Run the generated image

## Development

If you are actively changing things in the src folder:

- `npm run dev` (autocompiles on change, server autorestarts on save)
- Visit [localhost:9999](localhost:9999)

## Configuration

Before starting the application/building a docker container of it, it is important for some config values to be adjusted. Just open ``config/default.json`` or a copy of it and adjust the follwing values:

-  auth
    - user : GitHub Username of the user to authenticate the API, to use no authentication remove the auth object
    - pass : Token of the GitHub User to authenticate. Generate one at https://github.com/settings/tokens and make sure to restrict access to public / private repositories.

Following values can, but don't need to be changed:

- server
    - port : The port that the web-application will be running on
- client
    - apibase: The URL of the webservice that will be used to generate diffs

## Docker

to build an up to date tagged version of this Application as a docker container you just have to run

`npm run docker-build`

and to push it to the private registry (`swdyn.isys.uni-klu.ac.at:5000`)

`npm run docker-push`

and to combine those two things just run `npm run deploy`

## Citations

If you happen to use DiffViz in your research, please cite us:

```
@INPROCEEDINGS{8530084, 
author={V. {Frick} and C. {Wedenig} and M. {Pinzger}}, 
booktitle={2018 IEEE International Conference on Software Maintenance and Evolution (ICSME)}, 
title={DiffViz: A Diff Algorithm Independent Visualization Tool for Edit Scripts}, 
year={2018}, 
volume={}, 
number={}, 
pages={705-709}, 
keywords={data visualisation;trees (mathematics);DiffViz;Diff algorithm independent visualization tool;edit scripts;interactive visualization tool;abstract syntax trees;mini-map;node matching;Tools;Visualization;Computer bugs;Navigation;Java;Syntactics;Software algorithms;tool demo;visualization;edit scripts}, 
doi={10.1109/ICSME.2018.00081}, 
ISSN={2576-3148}, 
month={Sep.},}
```
