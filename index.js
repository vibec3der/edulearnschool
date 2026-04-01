"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	form.classList.add("top-search");

					  const input = form.querySelector("input[type='text']");
	input.classList.add("active");

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

	let wispUrl = localStorage.getItem("wispUrl");
	let transportType = localStorage.getItem("transport");

	if (transportType !== "epoxy" && transportType !== "libcurl") {
		transportType = "libcurl";
		localStorage.setItem("transport", transportType);
	}

	let transportPath;
	let transportConfig;

	if (transportType === "epoxy") {
		transportPath = "/epoxy/index.mjs";
		transportConfig = [{ wisp: wispUrl }];
	} else {
		transportPath = "/libcurl/index.mjs";
		transportConfig = [{ websocket: wispUrl }];
	}

	if ((await connection.getTransport()) !== transportPath) {
		await connection.setTransport(transportPath, transportConfig);
	}

	const oldFrame = document.getElementById("sj-frame");

	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";

	if (oldFrame) {
		document.body.replaceChild(frame.frame, oldFrame);
	} else {
		document.body.appendChild(frame.frame);
	}

	frame.go(url);
});