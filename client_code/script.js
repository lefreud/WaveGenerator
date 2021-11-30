const SAMPLES_BUFFER_SIZE = 8192; // 16-bit words
const COMMAND_BUFFER_SIZE = 2 + SAMPLES_BUFFER_SIZE * 2; // bytes
const START_BYTE = 0xAA;
const LITTLE_ENDIAN_MODE = true;

const MIN_SAMPLES = 20;
const MAX_SAMPLES = 8192;
const DMA_FREQUENCY = 1000; // Hz
const MAX_DAC_VALUE = 0x0FFF; // 12 bits DAC

let waveformTypeElement = () => document.getElementById("waveform-type");
let errorMessagesElement = document.getElementById("error-messages");
let writer = null;

let selectedSampleCount = getFrequencies()[0][0];

/**
 * SERIAL COMM
 */
function init() {
    if ("serial" in navigator){

    } else {
        errorMessagesElement.innerText = "Votre navigateur ne supporte pas Web Serial API. Veuillez utiliser une" +
            "version récente de Chrome, Firefox ou Edge.";
    }
}

async function connect() {
    const port = await navigator.serial.requestPort(); // TODO: add filters
    await port.open({
        baudRate: 19200,
        dataBits: 8,
        parity: "none"
    })
    writer = port.writable.getWriter();
}

async function uploadWaveform(selectedSampleCount) {
    if (writer) {
        const usedSize = selectedSampleCount;
        const commandBuffer = new ArrayBuffer(COMMAND_BUFFER_SIZE);
        const commandBufferView = new DataView(commandBuffer, 0);
        commandBufferView.setUint16(0, usedSize, LITTLE_ENDIAN_MODE);


        let waveform = null;
        switch (waveformTypeElement().value) {
            case "square":
                waveform = getSquareWaveform();
                break;
            case "triangle":
                waveform = getTriangleWaveform();
                break;
        }
        for (let i = 0; i < waveform.length; i++) {
            commandBufferView.setUint16(2 + i * 2, waveform[i], LITTLE_ENDIAN_MODE);
        }

        debugger
        await writer.write(new Uint8Array([START_BYTE]));
        await writer.write(new Uint8Array(commandBuffer));
        writer.releaseLock();
    }
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
    for (let sampleCount = MIN_SAMPLES; sampleCount <= MAX_SAMPLES; sampleCount+=1000) {
        frequencies.push([sampleCount, (DMA_FREQUENCY / sampleCount)]);
    }
    return frequencies;
}

function getSquareWaveform() {
    let waveform = [];
    for (let i = 0; i < Math.floor(selectedSampleCount / 2); i++) {
        waveform.push(MAX_DAC_VALUE);
    }
    for (let i = Math.floor(selectedSampleCount / 2); i < selectedSampleCount; i++) {
        waveform.push(0x0000);
    }
    return waveform;
}

function getTriangleWaveform() {
    let waveform = [];
    const halfPeriod = Math.floor(selectedSampleCount / 2);
    for (let i = 0; i < halfPeriod; i++) {
        waveform.push(Math.floor(MAX_DAC_VALUE * i / halfPeriod));
    }
    for (let i = 0; i < halfPeriod; i++) {
        waveform.push(Math.floor(MAX_DAC_VALUE * (halfPeriod - i) / halfPeriod));
    }
    return waveform;
}
