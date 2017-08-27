# Soundboard Builder

by Geoffrey Roberts <g.roberts@blackicemedia.com>

## Dependencies

* Node.js and npm
* [LAME](http://lame.sourceforge.net) command-line MP3 encoder

## Setup

* Copy `config/cmd.js.sample` to `config/cmd.js`
* Update paths to command-line utilities in `config/cmd.js`
* Run `npm install` to install dependencies

If you want to deploy the rendered files using Shipit (see Deployment):

* Remove the `.git` directory
* Check your local folder into a new (private?) git repo
* Update the `.gitignore` file to keep your config, build and shipit files
* Copy `shipitfile.js.sample` to `shipitfile.js`
* Update paths to command-line utilities in `shipitfile.js`

## Sample files

* `src/samples/(project name)` - all audio samples for a project

## Config

The main config files are here:

* `config/cmd.js` - paths to command line utilities
* `config/projects.js` - project descriptors

Each of these config files are normal Javascript objects. Sample
versions of each are available to help you prepare your own.

The `audioConfig` preferences are LAME-specific;
they use the configuration from the
[node-lame](https://github.com/TooTallNate/node-lame) package.

The `sounds` are a list of audio files, each with the key as their
unique ID. Each sound *must* have the following:

* a `source`, which is the name of a WAV file in
  `src/samples/(your project)`
* a `label`, which is text for the button

Each sound can optionally have a `config` object, which sets some
default parameters for the sound. For example, you can set `loop` to
`true` to make a sound loop, or set the `rate` to a number between 0.5
and 4 to make it play back at a different speed to how it normally would.

## Build

* Configure your projects in `config/projects.js`
* Add WAV audio files to `src/samples/(name of project)`
* Run `gulp` to build project

You'll see the compiled soundboard app in the `build` directory as a
HTML file. Open that in your browser to get started.

If you want to manually upload the results to a webserver, simply copy
everything in the `build` directory.

## Use

Tap buttons to play sounds. If it's a looped sound, it'll keep playing
until you tap the button again.

If you touch/click down and then drag up or down, you can either speed the
sound up or slow it down.

If you touch/click down and then drag left or right, you should be able to
pan the sound in stereo space. (The code's in there, but I haven't yet
observed it working. Sorry!)

## Deployment

Once build files have been rendered and checked into your local copy,
you can deploy the entire repo using
[Shipit](https://github.com/shipitjs/shipit),
which is kind of like Capistrano.

If you have a staging instance defined in your `shipitfile.js`,
you can deploy it using the follow command:

`shipit staging deploy`

Similarly, if you have a production instance:

`shipit production deploy`

## Development notes

* JS files are built using Browserify & Babel
  * Flow is used for type annotation
* CSS files are built using SASS
* Ended up using the command-line LAME tool for MP3 encoding because
  I don't know enough about streams yet to make a node-only encoding
  pipeline possible. Sorry
  * Seriously I'd like to change this

## TODO

* Either get rid of dependency on `node-lame` and clean up preference handling, or implement it
* Make more amenable to upstream updates without changing a whole bunch
  of git files
  * Separate out project & file storage
  * Separate out build destination
* Write tests
* Support more effects
  * Maybe use something more flexible than Howler for playback?
  * Actually get stereo panning working
  * I'd love a nice distortion effect tbh
* Use something friendlier than JS objects for config
  * YAML?
* Nicer UI to indicate drag area
* Move back to `<button>` elements if we can
