
const COMMAND_BUFFER_SIZE = 8194;
const START_BYTE = 0xAA;

let errorMessagesElement = document.getElementById("error-messages");
let writer = null;

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

async function uploadWaveform() {
    if (writer) {
        const usedSize = 3;
        const commandBuffer = new Uint8Array(COMMAND_BUFFER_SIZE);
        commandBuffer[1] = usedSize & 0xFF;
        commandBuffer[2] = 0x12;
        commandBuffer[3] = 0x34;

        await writer.write(new Uint8Array([START_BYTE]));
        await writer.write(commandBuffer);
        writer.releaseLock();
    }
}
