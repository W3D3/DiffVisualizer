#!/bin/bash
# ------------------------------------------------------------------
# [wedenigc] Pull and Run DiffVisualizer
# ------------------------------------------------------------------

VERSION=0.1.0
SUBJECT=run-dv
USAGE="Usage: pullandrun 1.5.6 1.5.3 // stops the old container and starts a new one"

# --- Options processing -------------------------------------------
if [ $# == 0 ] ; then
    echo $USAGE
    exit 1;
fi

newver=$1
oldver=$2

# --- Locks -------------------------------------------------------
LOCK_FILE=/tmp/$SUBJECT.lock
if [ -f "$LOCK_FILE" ]; then
   echo "Script is already running"
   exit
fi

trap "rm -f $LOCK_FILE" EXIT
touch $LOCK_FILE

# --- Body --------------------------------------------------------
#  SCRIPT LOGIC GOES HERE
echo $newver
if docker pull swdyn.isys.uni-klu.ac.at:5000/diffvisualizer:$newver; then
  docker stop diffviz-$oldver
  if docker run -d -p 80:9999 --name "diffviz-$newver" swdyn.isys.uni-klu.ac.at:5000/diffvisualizer:$newver; then
    echo "Successfully pulled and ran container."
    docker ps -a
  fi
else
  echo "Could not pull container"
fi
# -----------------------------------------------------------------
