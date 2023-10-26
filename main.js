/**
 *
 * sma-speedwire adapter
 *
 *
 *  file io-package.json comments:
 *
 *  {
 *      "common": {
 *          "name":         "sma-speedwire",                  // name has to be set and has to be equal to adapters folder name and main file name excluding extension
 *          "version":      "0.0.0",                    // use "Semantic Versioning"! see http://semver.org/
 *          "title":        "Node.js sma-speedwire Adapter",  // Adapter title shown in User Interfaces
 *          "authors":  [                               // Array of authord
 *              "name <mail@sma-speedwire.com>"
 *          ]
 *          "desc":         "sma-speedwire adapter",          // Adapter description shown in User Interfaces. Can be a language object {de:"...",ru:"..."} or a string
 *          "platform":     "Javascript/Node.js",       // possible values "javascript", "javascript/Node.js" - more coming
 *          "mode":         "daemon",                   // possible values "daemon", "schedule", "subscribe"
 *          "schedule":     "0 0 * * *"                 // cron-style schedule. Only needed if mode=schedule
 *          "loglevel":     "info"                      // Adapters Log Level
 *      },
 *      "native": {                                     // the native object is available via adapter.config in your adapters code - use it for configuration
 *          "test1": true,
 *          "test2": 42
 *      }
 *  }
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

const utils = require("@iobroker/adapter-core");
const Device = require("./lib/speedwire/device").Device;

class sma_speedwire extends utils.Adapter {

	constructor(options) {
		super({
			...options,
			name: "sma-speedwire",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));


		this.Devices = [];


	}

	destructor() {
		this.log.debug("destructor called ");
	}

	// is called when adapter shuts down - callback has to be called under any circumstances!
	onUnload(callback) {
		try {

			if (this.readTimerId != null) {
				clearInterval(this.readTimerId);
				this.readTimerId = null;
			}

			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}

	// is called if a subscribed object changes
	async onObjectChange(id, state) {
		// Warning, obj can be null if it was deleted
		this.log.info("objectChange " + id + " " + JSON.stringify(state));
	}

	// is called if a subscribed state changes
	async onStateChange(id, state) {
		// Warning, state can be null if it was deleted
		this.log.info("stateChange " + id + " " + JSON.stringify(state));

		// you can use the ack flag to detect if it is status (true) or command (false)
		if (state && !state.ack) {
			this.log.info("ack is not set!");
		}
	}

	// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
	async onMessage(obj) {
		if (typeof obj == "object" && obj.message) {
			if (obj.command == "send") {
				// e.g. send email or pushover or whatever
				this.log.debug("send command");

				// Send response in callback if required
				if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
			}
		}
	}

	// is called when databases are connected and adapter received configuration.
	// start here!
	async onReady() {

		if (this.config.devices != null) {
			for (let i = 0; i < this.config.devices.length; i++) {

				this.log.debug("creating device " + JSON.stringify(this.config.devices[i]));

				if (this.config.devices[i].Active) {
					const d = new Device(this.config.devices[i], this);
					this.Devices.push(d);
				}
			}

			this.log.debug("devices created " + this.Devices.length);

			await this.prepare();
			this.log.debug("devices prepared ");
			await this.main();

			let IntervallTimer = this.config.IntervallTimer;
			if (IntervallTimer == null || IntervallTimer < 10) {
				this.log.warn("setting intervall timer to 10 sec");
				IntervallTimer = 10;
			}

			this.log.debug("start intervall timer " + IntervallTimer + " sec");

			this.readTimerId = setInterval(this.main.bind(this), IntervallTimer * 1000);
		}
		else {
			this.log.error("no device configured, please check settings " + JSON.stringify(this.config));
		}
	}

	async prepare() {
		if (this.Devices != null) {
			for (let i = 0; i < this.Devices.length; i++) {
				await this.Devices[i].prepare();
			}
		}
	}

	async main() {
		if (this.Devices != null) {
			for (let i = 0; i < this.Devices.length; i++) {
				await this.Devices[i].getData();
			}
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	*/
	module.exports = (options) => new sma_speedwire(options);
} else {
	// otherwise start the instance directly
	new sma_speedwire();
}