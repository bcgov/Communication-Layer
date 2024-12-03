# Project Batey Communication Layer

A node.js app to communicate between Forms solution and ICM.

## Description

This app is intended as a connector between forms and ICM. It uses a keycloak client/secret ID to auhtenticate and accesses ICM end points to get/post data. It will also be used as a connector between ICM form generation and the form solution.

## Getting Started

### Dependencies

- npm version 10.2.4 or higher
- node.js 20.11.1 or higher

### Installing

- Clone the Repo locally

```
git clone https://github.com/bzimonjaSDPR/commlayer.git
```

- Install the Node Modules

```
npm install
```

- Once install is done, copy .env.example to .env and update it with real values

```
cp .env.example .env
```

- Create a 'common' directory and add data.xml file to it to enable /xml endpoint

```
mkdir common
touch common/data.xml
```

### Executing program

- From the command line, start the server

```
npm run dev
```

## Help

- there are currently three endpoints:
  - /status - will just return an OK message
  - /api - will strip out the part of request after /api, append it to the ENDPOINTURL .env variable, authenticate with keycloak server and send a request, then forward the response back as JSON
  - /xml - will pull a data file from /common/data.xml and return it as an XML file

## Authors

- BZ

## Version History

- 0.1.0
  - Initial Release
