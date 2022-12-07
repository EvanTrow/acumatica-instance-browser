# Acumatica-Instance-Browser

Creates an HTML file in the root of your IIS site to navigate to multiple Acumatica instances - **_Only works with Windows_**

# Requirements

-   [NodeJS](https://nodejs.org/en/download/)

# Use

```shell
npm start
```

# Screenshots

![Use](./doc/screenshot01.png 'Example')

# Configuration

You can change parameters by editing the `config.json` file:

| Property                | What it do?                                  |
| ----------------------- | -------------------------------------------- |
| htmlOutput              | Where the html file will be saved            |
| instanceInstallLocation | Install location of your Acumatica instances |
| openInNewTab            | Opens new tab when you click on an instance  |
