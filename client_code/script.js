const SAMPLES_BUFFER_SIZE = 8192; // 16-bit words
const COMMAND_BUFFER_SIZE = 2 + SAMPLES_BUFFER_SIZE * 2; // bytes
const START_BYTE = 0xAA;
const LITTLE_ENDIAN_MODE = true;

const MIN_SAMPLES = 20;
const MAX_SAMPLES = 8192;
const DMA_FREQUENCY = 100000; // Hz
const MAX_DAC_VALUE = 0x0FFF; // 12 bits DAC

const MAX_VOLTAGE = 2.68;

const WAVEFORM_CANVAS_WIDTH = 400;
const WAVEFORM_CANVAS_HEIGHT = 100;

let waveformTypeElement = () => document.getElementById("waveform-type");
let errorMessagesElement = () => document.getElementById("error-messages");
let waveformCanvasElement = () => document.getElementById("waveform-canvas");

let connectWrapperElement = () => document.getElementById("connect-wrapper");
let configWrapperElement = () => document.getElementById("config-wrapper");
let uploadButtonElement = () => document.getElementById("upload-button");
let uploadMessageElement = () => document.getElementById("upload-message");

let minVoltageElement = () => document.getElementById("min-voltage");
let maxVoltageElement = () => document.getElementById("max-voltage");
let port = null;

let selectedSampleCount = getFrequencies()[0][0];

/**
 * SERIAL COMM
 */
function init() {
    if ("serial" in navigator){

    } else {
        errorMessagesElement().innerText = "Votre navigateur ne supporte pas Web Serial API. Veuillez utiliser une" +
            "version récente de Chrome, Firefox ou Edge.";
    }
}

async function connect() {
    port = await navigator.serial.requestPort(); // TODO: add filters
    await port.open({
        baudRate: 19200,
        dataBits: 8,
        parity: "none"
    })
    connectWrapperElement().style.display = "none";
    configWrapperElement().style.display = "flex";
}

async function uploadWaveform(selectedSampleCount) {
    // lock
    uploadButtonElement().disabled = "true"
    uploadMessageElement().style.display = "block"

    // generate
    let waveform;
    switch (waveformTypeElement().value) {
        case "square":
            waveform = getSquareWaveform();
            break;
        case "triangle":
            waveform = getTriangleWaveform();
            break;
        case "sine":
            waveform = getSineWaveform();
            break;
        default:
            waveform = getSineWaveform();
    }

    // display
    displayWaveform(waveform);

    // send data

    if (port) {
        const writer = port.writable.getWriter();
        const usedSize = waveform.length;
        const commandBuffer = new ArrayBuffer(COMMAND_BUFFER_SIZE);
        const commandBufferView = new DataView(commandBuffer, 0);
        commandBufferView.setUint16(0, usedSize, LITTLE_ENDIAN_MODE);

        for (let i = 0; i < waveform.length; i++) {
            commandBufferView.setUint16(2 + i * 2, waveform[i], LITTLE_ENDIAN_MODE);
        }
        await writer.write(new Uint8Array([START_BYTE]));
        await writer.write(new Uint8Array(commandBuffer));
        writer.releaseLock();
    }

    // unlock
    uploadButtonElement().disabled = ""
    uploadMessageElement().style.display = "none"
}

/**
 * WAVEFORMS
 */

const frequenciesSelect = () => document.getElementById("waveform-frequency");

document.addEventListener("DOMContentLoaded", () => {
    getFrequencies().forEach(([sampleCount, frequency]) => {
        const option = document.createElement("option");
        option.value = `${sampleCount}`;
        option.innerText = `${frequency.toFixed(2)} Hz`;
        frequenciesSelect().appendChild(option);
    })
    frequenciesSelect().onchange = () => {
        selectedSampleCount = parseInt(frequenciesSelect().value);
    }
});

function getFrequencies() {
    let frequencies = [];
    for (let sampleCount = MIN_SAMPLES; sampleCount <= MAX_SAMPLES; sampleCount = Math.floor(sampleCount * 1.25)) {
        frequencies.push([sampleCount, (DMA_FREQUENCY / sampleCount)]);
    }
    return frequencies;
}

function getSquareWaveform() {
    let waveform = [];
    for (let i = 0; i < Math.floor(selectedSampleCount / 2); i++) {
        waveform.push(getDacValue(1));
    }
    for (let i = Math.floor(selectedSampleCount / 2); i < selectedSampleCount; i++) {
        waveform.push(getDacValue(0));
    }
    return waveform;
}

function getTriangleWaveform() {
    let waveform = [];
    const halfPeriod = Math.floor(selectedSampleCount / 2);
    for (let i = 0; i < halfPeriod; i++) {
        waveform.push(getDacValue(i / halfPeriod));
    }
    for (let i = 0; i < halfPeriod; i++) {
        waveform.push(getDacValue((halfPeriod - i) / halfPeriod));
    }
    console.log(waveform)
    return waveform;
}

function getSineWaveform() {
    let waveform = [];
    for (let i = 0; i < selectedSampleCount; i++) {
        waveform.push(getDacValue(0.5 + 0.5 * Math.sin(i * 2 * Math.PI / selectedSampleCount)))
    }
    return waveform;
}

function getDacValue(value) {
    return Math.floor(MAX_DAC_VALUE * (parseFloat(minVoltageElement().value) + (parseFloat(maxVoltageElement().value) - parseFloat(minVoltageElement().value)) * value) / MAX_VOLTAGE);
}

/**
 * Display
 */

document.addEventListener("DOMContentLoaded", () => {
    waveformCanvasElement().height = WAVEFORM_CANVAS_HEIGHT;
    waveformCanvasElement().width = WAVEFORM_CANVAS_WIDTH;
})

function displayWaveform(waveform) {
    const context = waveformCanvasElement().getContext("2d");
    context.clearRect(0, 0, WAVEFORM_CANVAS_WIDTH, WAVEFORM_CANVAS_HEIGHT);
    context.beginPath();
    context.imageSmoothingEnabled = false;
    context.strokeStyle = "#ff7600";
    context.fillStyle = "#d9d9d9";
    context.lineWidth = 3;
    for (let i = 0; i < waveform.length - 1; i++) {
        context.moveTo(WAVEFORM_CANVAS_WIDTH * i / MAX_SAMPLES, WAVEFORM_CANVAS_HEIGHT - WAVEFORM_CANVAS_HEIGHT * waveform[i] / MAX_DAC_VALUE);
        context.lineTo(WAVEFORM_CANVAS_WIDTH * (i + 1) / MAX_SAMPLES, WAVEFORM_CANVAS_HEIGHT - WAVEFORM_CANVAS_HEIGHT * waveform[i + 1] / MAX_DAC_VALUE);
    }
    context.fillRect(0, 0, WAVEFORM_CANVAS_WIDTH * waveform.length / MAX_SAMPLES, WAVEFORM_CANVAS_HEIGHT)
    context.stroke();
}
