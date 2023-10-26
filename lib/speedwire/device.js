class Device {

	constructor(config, parent) {

		this.config = config;
		this.parent = parent;


		this.parent.log.debug("device constructor called ");

		this.cmdheader = "534D4100000402A00000000100";
		this.esignature = "001060650EA0";
		this.anySusyId = "FFFF";
		this.anySerial = "FFFFFFFF";
		this.mySusyId = "0078";
		this.mySerial = "3803E8C8";
		this.dgram = require("dgram");
		this.pktId = 480;
		this.SystemLanguage;
		this.nameTranslation;

		this.commands = {
			EnergyProduction: {	/* Used */
				command: this.littleEndianHex("54000200"),
				first: this.littleEndianHex("00260100"),
				last: this.littleEndianHex("002622FF"),
				label: "SPOT_ETODAY, SPOT_ETOTA"
			},
			SpotDCPower: { /* Used */
				command: this.littleEndianHex("53800200"),
				first: this.littleEndianHex("00251E00"),
				last: this.littleEndianHex("00251EFF"),
				label: "SPOT_PDC1, SPOT_PDC2"
			},
			SpotDCVoltage: { /* Used */
				command: this.littleEndianHex("53800200"),
				first: this.littleEndianHex("00451F00"),
				last: this.littleEndianHex("004521FF"),
				label: "SPOT_UDC1, SPOT_UDC2, SPOT_IDC1, SPOT_IDC2"
			},
			SpotACPower: { /* Used */
				command: this.littleEndianHex("51000200"),
				first: this.littleEndianHex("00464000"),
				last: this.littleEndianHex("004642FF"),
				label: "SPOT_PAC1, SPOT_PAC2, SPOT_PAC3"
			},
			SpotACVoltage: { /* Used */
				command: this.littleEndianHex("51000200"),
				first: this.littleEndianHex("00464800"),
				last: this.littleEndianHex("004655FF"),
				label: "POT_UAC1, SPOT_UAC2, SPOT_UAC3, SPOT_IAC1, SPOT_IAC2, SPOT_IAC3"
			},
			SpotGridFrequency: { /* Used */
				command: this.littleEndianHex("51000200"),
				first: this.littleEndianHex("00465700"),
				last: this.littleEndianHex("004657FF"),
				label: "SPOT_FREQ"
			},
			MaxACPower: { /* Used */
				command: this.littleEndianHex("51000200"),
				first: this.littleEndianHex("00411E00"),
				last: this.littleEndianHex("004120FF"),
				label: "INV_PACMAX1, INV_PACMAX2, INV_PACMAX3"
			},
			MaxACPower2: {
				command: this.littleEndianHex("51000200"),
				first: this.littleEndianHex("00832A00"),
				last: this.littleEndianHex("00832AFF"),
				label: "NV_PACMAX1_2"
			},
			SpotACTotalPower: { /* Used */
				command: this.littleEndianHex("51000200"),
				first: this.littleEndianHex("00263F00"),
				last: this.littleEndianHex("00263FFF"),
				label: "SPOT_PACTOT"
			},
			TypeLabel: { /* Used */
				command: this.littleEndianHex("58000200"),
				first: this.littleEndianHex("00821E00"),
				last: this.littleEndianHex("008220FF"),
				label: "INV_NAME, INV_TYPE, INV_CLASS"
			},
			SoftwareVersion: { /* Used */
				command: this.littleEndianHex("58000200"),
				first: this.littleEndianHex("00823400"),
				last: this.littleEndianHex("008234FF"),
				label: "INV_SWVERSION"
			},
			DeviceStatus: { /* Unused */
				command: this.littleEndianHex("51800200"),
				first: this.littleEndianHex("00214800"),
				last: this.littleEndianHex("002148FF"),
				label: "INV_STATUS"
			},
			GridRelayStatus: { /* Unused */
				command: this.littleEndianHex("51800200"),
				first: this.littleEndianHex("00416400"),
				last: this.littleEndianHex("004164FF"),
				label: "INV_GRIDRELAY"
			},
			OperationTime: { /* Unused */
				command: this.littleEndianHex("54000200"),
				first: this.littleEndianHex("00462E00"),
				last: this.littleEndianHex("00462FFF"),
				label: "SPOT_OPERTM, SPOT_FEEDTM"
			},
			BatteryChargeStatus: { /* Unused */
				command: this.littleEndianHex("51000200"),
				first: this.littleEndianHex("00295A00"),
				last: this.littleEndianHex("00295AFF"),
				label: " "
			},
			BatteryInfo: { /* Unused*/
				command: this.littleEndianHex("51000200"),
				first: this.littleEndianHex("00491E00"),
				last: this.littleEndianHex("00495DFF"),
				label: " "
			},
			InverterTemperature: { /* Used */
				command: this.littleEndianHex("52000200"),
				first: this.littleEndianHex("00237700"),
				last: this.littleEndianHex("002377FF"),
				label: "INV_TEMP"
			},
			sbftest: {
				command: this.littleEndianHex("64020200"),
				first: this.littleEndianHex("00618C00"),
				last: this.littleEndianHex("00618FFF"),
				label: " "
			}
		};

		this.parent.log.debug("device constructor done ");

	}

	async prepare() {
		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:

		this.parent.log.debug("prepare ");

		this.parent.log.info("config ip: " + this.config.IP);
		this.parent.log.info("config port: " + this.config.Port);
		this.parent.log.info("config user: " + this.config.User);
		this.parent.log.info("config password: " + this.config.Password);
		this.client = this.dgram.createSocket("udp4");
		this.HOST = this.config.IP;
		this.PORT = this.config.Port;

		this.client.on("message", (msg, rinfo) => {
			const tmp = this.bin2hex(msg);
			this.parent.log.debug("server got data " + msg + " " + JSON.stringify(rinfo));
			this.decodeData(tmp);
		});

		this.client.on("listening", () => {
			const address = this.client.address();
			this.parent.log.debug(`server listening ${address.address}:${address.port}`);
		});

		const obj = await this.parent.getForeignObjectAsync("system.config");
		this.SystemLanguage = obj.common.language;

		const path = __dirname.replace("/lib/speedwire", "");
		this.nameTranslation = require(path + "/admin/i18n/" + this.SystemLanguage + "/translations.json");

		this.parent.log.warn("got translation file " + JSON.stringify(this.nameTranslation));
	}


	async getData() {
		//client.bind(PORT);
		this.login(this.config.User, this.config.Password, this.client);
		this.sendCommand("sbftest", this.client);
		this.sendCommand("TypeLabel", this.client);
		//this.sendCommand("SoftwareVersion");
		this.sendCommand("EnergyProduction", this.client);
		this.sendCommand("SpotDCVoltage", this.client);
		this.sendCommand("SpotDCPower", this.client);
		this.sendCommand("SpotACPower", this.client);
		this.sendCommand("SpotACVoltage", this.client);
		this.sendCommand("SpotACTotalPower", this.client);
		this.sendCommand("MaxACPower", this.client);
		this.sendCommand("SpotGridFrequency", this.client);
		this.sendCommand("InverterTemperature", this.client);
		this.logout(this.client);
		// Force terminate after 5min
		//this.waitCallBack();
	}


	translateName(strName) {
		if (this.nameTranslation[strName]) {
			return this.nameTranslation[strName];
		} else {
			this.parent.log.warn("could not translate " + strName);
			return strName;
		}
	}

	// Logout
	logout(socket) {
		const cmdheader = "534D4100000402A00000000100";
		const pktlength = "22";
		const esignature = "0010606508A0";
		//const encpasswd = "888888888888888888888888";
		const cmdId = "0E01FDFF" + "FFFFFFFF" + "00000000";
		//const timeStamp = Math.floor(Date.now() / 1000).toString(16);

		let cmd = cmdheader + pktlength + esignature + this.ByteOrderShort(this.anySusyId) + this.ByteOrderLong(this.anySerial);

		cmd = cmd + "0003" + this.ByteOrderShort(this.mySusyId) + this.ByteOrderLong(this.mySerial) + "0003" + "00000000" + this.decimalToHex(this.pktId++, 4) + cmdId;
		const cmdBytes = this.hex2bin(cmd);
		const that = this;
		socket.send(cmdBytes, 0, cmdBytes.length, this.PORT, this.HOST, function (err, bytes) {
			if (err) throw err;
			that.parent.log.debug("logout UDP message sent to " + that.HOST + ":" + that.PORT + " : " + cmd);
		});
		//callBackCount++;
	}

	// Login to inverter
	login(user, password, socket) {
		const cmdheader = "534D4100000402A00000000100";
		const pktlength = "3A";
		const esignature = "001060650EA0";
		const encpasswd = "888888888888888888888888";
		const arrayencpasswd = encpasswd.split("");
		const cmdId = "0C04FDFF" + "07000000" + "84030000";
		//var pass = "0000";
		//const arraypass = password.split("");
		const timeStamp = Math.floor(Date.now() / 1000).toString(16);

		for (let i = 0; i < password.length; i++) {
			const tmp = (parseInt((arrayencpasswd.slice(i * 2, i * 2 + 2).join("")), 16) + parseInt(password.charCodeAt(i))).toString(16).slice("");
			arrayencpasswd.splice(i * 2, 2, tmp[0], tmp[1]);
		}
		let cmd = cmdheader + pktlength + esignature + this.ByteOrderShort(this.anySusyId) + this.ByteOrderLong(this.anySerial);
		cmd = cmd + "0001" + this.ByteOrderShort(this.mySusyId) + this.ByteOrderLong(this.mySerial) + "0001" + "00000000" + this.decimalToHex(this.pktId++, 4) + cmdId + timeStamp + "00000000" + arrayencpasswd.join("") + "00000000";
		const cmdBytes = this.hex2bin(cmd);

		const that = this;
		socket.send(cmdBytes, 0, cmdBytes.length, this.PORT, this.HOST, function (err, bytes) {
			if (err) throw err;
			that.parent.log.debug("login UDP message sent to " + that.HOST + ":" + that.PORT + " : " + cmd);
			//     client.close();
		});
		//this.callBackCount++;
	}

	sendCommand(which, socket) {
		this.parent.log.debug("called command : " + which);
		const command = this.commands[which]["command"];
		const first = this.commands[which]["first"];
		const last = this.commands[which]["last"];
		const ctrl2 = "0000";
		let cmd = "534d4100";

		// Build packet header
		cmd += "000402a0";
		cmd += "00000001";
		cmd += "LEGT";  // Placeholder for Packet length
		cmd += "00106065";		// ETH Signature

		cmd += "09";
		cmd += "A0";
		cmd += this.ByteOrderShort(this.anySusyId);
		cmd += this.ByteOrderLong(this.anySerial);
		cmd += ctrl2;
		cmd += this.ByteOrderShort(this.mySusyId);
		cmd += this.ByteOrderLong(this.mySerial);
		cmd += ctrl2;
		cmd += "0000";
		cmd += "0000";
		cmd += this.decimalToHex(this.pktId++, 4);		// Packet ID (TODO use pcktID counter)
		cmd += command;
		cmd += first;
		cmd += last;
		cmd += "00000000";

		cmd = cmd.replace("LEGT", this.decimalToHex((cmd.length / 2 - 20), 4));
		this.parent.log.debug("cmd : " + cmd);

		const cmdBytes = this.hex2bin(cmd);
		const that = this;
		socket.send(cmdBytes, 0, cmdBytes.length, this.PORT, this.HOST, function (err, bytes) {
			if (err) throw err;
			that.parent.log.debug("UDP message sent to " + that.HOST + ":" + that.PORT);
			// client.close();
		});
		//this.callBackCount++;
	}

	littleEndianHex(hex) {
		let result = "";
		let len = hex.length;

		while (len > 0) {
			len = len - 2;
			result += hex.substr(len, 2);
		}
		//this.parent.log.debug(hex);
		//this.parent.log.debug(result);
		return result;
	}

	d2h(d) {
		let s = (+d).toString(16);
		if (s.length < 2) {
			s = "0" + s;
		}
		return s;
	}

	hex2bin(hex) {
		return new Buffer(hex, "hex");
	}

	bin2hex(bin) {
		return new Buffer(bin, "ascii").toString("hex");
	}

	hexToBytes(hex) {
		const bytes = [];
		for (let c = 0; c < hex.length - 1; c += 2) {
			this.parent.log.debug(hex.substr(c, 2));
			bytes.push(parseInt(hex.substr(c, 2), 16));
		}
		//return String.fromCharCode.apply(String, bytes);
		return bytes;
	}

	ByteOrderShort(s) {
		const array = s.split("");
		const output = array.slice(2, 4).join("") + array.slice(0, 2).join("");
		return output;
	}

	// Convert Little Endian hex string to big Endian
	// Currently 32 bit fixed
	ByteOrderLong(s) {
		const array = s.split("");
		const output = array.slice(6, 8).join("") + array.slice(4, 6).join("") + array.slice(2, 4).join("") + array.slice(0, 2).join("");
		return output;
	}

	async decodeData(hex) {
		this.parent.log.debug("decodeData input : " + hex);

		let loop = true;
		let pointer = 108;
		//const long = 4; // 32 bit
		let value;

		const cmdLength = hex.length;
		while (loop) {
			const tmp = this.get32Bit(this.ByteOrderLong(hex.substr(pointer, 8)));
			pointer += 8;
			//const timestamp = this.get32Bit(hex.substr(pointer, 8));
			pointer += 8;
			const code = tmp & 0x00ffff00;
			const cls = tmp & 0xff;
			const dataType = code >> 24;
			const cmd = code.toString(16).toUpperCase();

			if (cmd === "262200" || cmd === "260100") {
				value = this.get64Bit(this.ByteOrderLong(hex.substr(pointer, 16)));
			} else {
				value = this.get32Bit(this.ByteOrderLong(hex.substr(pointer, 8)));
			}

			this.parent.log.debug("code : " + code);
			this.parent.log.debug("cls : " + cls);
			this.parent.log.debug("dataType : " + dataType);
			this.parent.log.debug("cmd : " + cmd + " value: " + value);

			if (cmd === "251E00") {
				this.parent.log.debug("SPOT_PDC" + cls + " : " + value);
				pointer += 40;
			} else if (cmd === "821E00") {	/* Device class */
				const devClass = value;
				const type = devClass & 0x00FFFFFF;
				this.parent.log.debug("type : " + type);
				pointer += 64;
			} else if (cmd === "821F00") { /* Device class */
				const tmp = value & 0x00FFFFFF;
				if (tmp != 16777214) {
					await this.updateState("", "INV_CLASS", this.translateName("INV_CLASS"), "string", "string", this.translateName(tmp.toString()), "");
					//this.parent.log.debug("INV_CLASS : " + this.translateName(tmp.toString()));
				}
				pointer += 64;
			} else if (cmd === "822000") {
				const tmp = value & 0x00FFFFFF;
				if (tmp != 16777214) {
					await this.updateState("", "INV_TYPE", this.translateName("INV_TYPE"), "string", "string", this.translateName(tmp.toString()), "");
					//this.parent.log.debug("INV_TYPE : " + this.translateName(tmp.toString()));
				}
				pointer += 64;
			} else if (cmd === "823400") {	/* Software Version etc. */
				this.parent.log.debug("INV_SWVER");
				pointer += 40;
			} else if (cmd === "263F00") {
				/* this.parent.log.debug("SPOT_PACTOT : " + value); */
				await this.updateState("", "SPOT_PACTOT", this.translateName("SPOT_PACTOT"), "number", "value", value / 1000, "kW");
				pointer += 40;
			} else if (cmd === "464000") {
				/* this.parent.log.debug("SPOT_PAC1 : " + value); */
				await this.updateState("", "SPOT_PAC1", this.translateName("SPOT_PAC1"), "number", "value", value / 1000, "kW");
				pointer += 40;
			} else if (cmd === "464100") {
				/* this.parent.log.debug("SPOT_PAC2 : " + value); */
				await this.updateState("", "SPOT_PAC2", this.translateName("SPOT_PAC2"), "number", "value", value / 1000, "kW");
				pointer += 40;
			} else if (cmd === "464200") {
				/* this.parent.log.debug("SPOT_PAC3 : " + value); */
				await this.updateState("", "SPOT_PAC3", this.translateName("SPOT_PAC3"), "number", "value", value / 1000, "kW");
				pointer += 40;
			} else if (cmd === "464800") {
				/* this.parent.log.debug("SPOT_UAC1 : " + value); */
				await this.updateState("", "SPOT_UAC1", this.translateName("SPOT_UAC1"), "number", "value", value / 100, "V");
				pointer += 40;
			} else if (cmd === "464900") {
				/* this.parent.log.debug("SPOT_UAC2 : " + value); */
				await this.updateState("", "SPOT_UAC2", this.translateName("SPOT_UAC2"), "number", "value", value / 100, "V");
				pointer += 40;
			} else if (cmd === "464A00") {
				/* this.parent.log.debug("SPOT_UAC3 : " + value); */
				await this.updateState("", "SPOT_UAC3", this.translateName("SPOT_UAC3"), "number", "value", value / 100, "V");
				pointer += 40;
			} else if (cmd === "465000") {
				/* this.parent.log.debug("SPOT_IAC1 : " + value); */
				await this.updateState("", "SPOT_IAC1", this.translateName("SPOT_IAC1"), "number", "value", value / 1000, "A");
				pointer += 40;
			} else if (cmd === "465100") {
				/* this.parent.log.debug("SPOT_IAC2 : " + value); */
				await this.updateState("", "SPOT_IAC2", this.translateName("SPOT_IAC2"), "number", "value", value / 1000, "A");
				pointer += 40;
			} else if (cmd === "465200") {
				/* this.parent.log.debug("SPOT_IAC3 : " + value); */
				await this.updateState("", "SPOT_IAC3", this.translateName("SPOT_IAC3"), "number", "value", value / 1000, "A");
				//this.setState("SPOT_IAC3", value);
				pointer += 40;
			} else if (cmd === "465300") {
				/* this.parent.log.debug("SPOT_IAC1_2 : " + value); */
				await this.updateState("", "SPOT_IAC1_2", this.translateName("SPOT_IAC1_2"), "number", "value", value / 1000, "A");
				pointer += 40;
			} else if (cmd === "465400") {
				/* this.parent.log.debug("SPOT_IAC2_2 : " + value); */
				await this.updateState("", "SPOT_IAC2_2", this.translateName("SPOT_IAC2_2"), "number", "value", value / 1000, "A");
				pointer += 40;
			} else if (cmd === "465500") {
				/* this.parent.log.debug("SPOT_IAC3_2 : " + value); */
				await this.updateState("", "SPOT_IAC3_2", this.translateName("SPOT_IAC3_2"), "number", "value", value / 1000, "A");
				pointer += 40;
			} else if (cmd === "452100") {
				/* this.parent.log.debug("SPOT_IDC"+cls+" : " + value); */
				await this.updateState("", "SPOT_IDC" + cls, this.translateName("SPOT_IDC" + cls), "number", "value", value / 1000, "A");
				pointer += 40;
			} else if (cmd === "411E00") {
				/* this.parent.log.debug("SPOT_PACMAX1 : " + value); */
				await this.updateState("", "SPOT_PACMAX1", this.translateName("SPOT_PACMAX1"), "number", "value", value / 1000, "kW");
				pointer += 40;
			} else if (cmd === "411F00") {
				/* this.parent.log.debug("SPOT_PACMAX2 : " + value); */
				await this.updateState("", "SPOT_PACMAX2", this.translateName("SPOT_PACMAX2"), "number", "value", value / 1000, "kW");
				pointer += 40;
			} else if (cmd === "412000") {
				/* this.parent.log.debug("SPOT_PACMAX3 : " + value); */
				await this.updateState("", "SPOT_PACMAX3", this.translateName("SPOT_PACMAX3"), "number", "value", value / 1000, "kW");
				pointer += 40;
			} else if (cmd === "451F00") {
				/* dapter.log.debug("SPOT_UDC"+cls+" : " + value); */
				await this.updateState("", "SPOT_UDC" + cls, this.translateName("SPOT_UDC" + cls), "number", "value", value / 100, "V");
				pointer += 40;
			} else if (cmd === "465700") {
				await this.updateState("", "SPOT_FREQ", this.translateName("SPOT_FREQ"), "number", "value", value / 100, "Hz");
				pointer += 40;
			} else if (cmd === "237700") {
				await this.updateState("", "INV_TEMP", this.translateName("INV_TEMP"), "number", "value.temperature", value / 100, "C°");
				pointer += 40;
			} else if (cmd === "262200") {
				/* this.parent.log.debug("SPOT_ETODAY : " + value); */
				await this.updateState("", "SPOT_ETODAY", this.translateName("SPOT_ETODAY"), "number", "value", value / 1000, "kW");
				pointer += 16;
			} else if (cmd === "260100") {
				/* this.parent.log.debug("SPOT_ETOTAL : " + value); */
				await this.updateState("", "SPOT_ETOTAL", this.translateName("SPOT_ETOTAL"), "number", "value", value / 1000, "kW");
				pointer += 16;
			} else {
				if (pointer >= cmdLength) {
					this.parent.log.debug("End of input");
					loop = false;
				} else {
					this.parent.log.warn("unknown cmd : " + cmd + " cmdLength : " + cmdLength + " pointer : " + pointer + " hex : " + hex);
					loop = false;
				}
			}
		}
		//callBackCount--;
	}

	get32Bit(hex) {
		if (hex.toUpperCase() === "80000000" || hex.toUpperCase() === "FFFFFFFF") {
			return 0;
		}
		return parseInt(hex, 16);
	}

	get64Bit(hex) {
		this.parent.log.debug("get64Bit : " + hex);
		/* 	if (hex.toUpperCase() === "80000000" || hex.toUpperCase() === "FFFFFFFF") {
			return 0;
		} */
		return parseInt(hex, 16);
	}

	decimalToHex(d, padding) {
		let hex = Number(d).toString(16);
		padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

		while (hex.length < padding) {
			hex = "0" + hex;
		}
		return hex;
	}

	async updateState(group, tag, transTag, type, role, value, unit) {

		const obj = {
			type: "state",
			common: {
				name: transTag,
				type: type,
				role: role,
				unit: unit
			},
			native: {}
		};

		let name = this.config.Ip;

		if (this.config.Name != null && this.config.Name.length > 0) {
			name = this.config.Name.replace(this.parent.FORBIDDEN_CHARS, "_");
		}
		name = name + "." + tag;

		await this.CreateObject(name, obj);

		await this.parent.setStateAsync(
			name,
			{ val: value, ack: true }
		);
	}


	async CreateObject(key, obj) {

		const obj_new = await this.parent.getObjectAsync(key);
		//adapter.log.warn("got object " + JSON.stringify(obj_new));

		if (obj_new != null) {

			if ((obj_new.common.role != obj.common.role
				|| obj_new.common.type != obj.common.type
				|| (obj_new.common.unit != obj.common.unit && obj.common.unit != null)
				|| obj_new.common.read != obj.common.read
				|| obj_new.common.write != obj.common.write
				|| obj_new.common.name != obj.common.name)
				&& obj.type === "state"
			) {
				this.parent.log.warn("change object " + JSON.stringify(obj) + " " + JSON.stringify(obj_new));
				await this.parent.extendObject(key, {
					common: {
						name: obj.common.name,
						role: obj.common.role,
						type: obj.common.type,
						unit: obj.common.unit,
						read: obj.common.read,
						write: obj.common.write
					}
				});
			}
		}
		else {
			await this.parent.setObjectNotExistsAsync(key, obj);
		}
	}

}
module.exports = {
	Device
};