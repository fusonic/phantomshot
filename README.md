# PhantomShot

PhantomShot is a simple JavaScript library that enables you to take predefined screenshots from web pages using the headless WebKit PhantomJS. Viewports and screenshot URLs are defined in a configuration file.

* Shoot multiple screenshots in a row
* Define custom viewport sizes and device pixel ratios
* Take screenshots of pages that require login
* Only save portions of the screen (clipping)

## Usage

# Basic

First create a config file (take a look at `sample-config.json` for some inspiration). Then call the script from command line:

```bash
phantomjs phantomshot.js [path-to-config-file]
```

Make sure you are cd'd to the directory of the config file, otherwise it won't work.

# The config file

TBD

# Shooting a page that requires login

Add a small block of login information to your `config.json`:

```json
"login": {
    "url": "/login",
    "script": "login-script.js"
}
```

Before taking screenshots the specified URL will be called. After pageload the login script will be injected into the page. It should fill the required form fields and sumit the login form (see `sample-login.js`). PhantomShot starts taking screenshots after the login has been performed.

## Misc

### About PhantomJS

PhantomJS is a headless WebKit with JavaScript API. You should use the most recent version 2 to get web font support and accurate rendering like in your modern desktop browser.

Just grab a binary from [the download page](http://phantomjs.org/download.html) or [create a custom build](http://phantomjs.org/build.html).

