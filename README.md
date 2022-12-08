# Acumatica-Instance-Browser

Creates an HTML file in the root of your IIS site to navigate to multiple Acumatica instances - **_Only works with Windows_**

## Use

To start the script just run the [executable file](https://github.com/EvanTrow/acumatica-instance-browser/releases):

```shell
acumatica-instance-browser.exe
```

## Screenshots

![Use](./doc/screenshot01.png 'Example')

## Configuration

You can change parameters by editing the `config.json` file:

| Property                | What it do?                                  |
| ----------------------- | -------------------------------------------- |
| htmlOutput              | Where the html file will be saved            |
| instanceInstallLocation | Install location of your Acumatica instances |
| openInNewTab            | Opens new tab when you click on an instance  |

# Development

## Requirements

-   [NodeJS](https://nodejs.org/en/download/)

## Install NodeJS Dependencies

```shell
npm install
npm install pgk -g
```

## Running

```shell
npm start
```

## Build Executable

Build exe file to `dist/` directory

```shell
npm run build
```
