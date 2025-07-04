# Deploy on Contabo Ubuntu Linux

## Install Docker
sudo apt update
sudo apt install -y docker.io

## Start Docker and enable on boot
sudo systemctl start docker
sudo systemctl enable docker

## Optional: allow your user to run Docker without sudo
sudo usermod -aG docker $USER


## Install AWS CLI v2
sudo apt install -y unzip curl
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

## Confirm it's working
aws --version


## Configure AWS credentials
aws configure


## Create `deploy.sh` script and `deploy.env` with the following variables:
AWS_REGION=
ECR_REPO=
IMAGE_TAG=
CONTAINER_NAME=

## And make sure that script is executable:
chmod +x ./deploy.sh

## Create `.env` file with the required env variables and add deployment SSH public key to the server.
