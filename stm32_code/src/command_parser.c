#include "command_parser.h"
#include "string.h"
#include "dma.h"
#include "uart.h"
#include "dac.h"
#include "waveform.h"

typedef enum {
	INIT,
	READY,
	STOP_DMA,
	RECEIVING,
	START_DMA
} command_parser_state_t;

#define COMMAND_BUFFER_SIZE (2 + SAMPLES_BUFFER_SIZE * 2)


/*
 * private variables declarations
 */

static command_parser_state_t state;
static uint8_t command_buffer[COMMAND_BUFFER_SIZE];
static int command_buffer_index;

/*
 * private functions declarations
 */

static void init_watchdog();
static void feed_watchdog();

/*
 * function definitions
 */

void command_parser_init() {
	command_buffer_index = 0;

	// TODO: start watchdog timer
	init_watchdog();
	state = INIT;
}

static void init_watchdog() {
	// TODO
}

void command_parser_start() {
	feed_watchdog();

	char latest_byte;
	while (1) {
		switch (state) {
			case INIT:
				uart_init_uart();
				dac_init();
				dma_init((waveform_t*) command_buffer);
				state = READY;
				break;
			case READY:
				if (uart_get_received_byte(&latest_byte)) {
					if (latest_byte == START_BYTE) {
						state = STOP_DMA;
					}
				}
				break;
			case STOP_DMA:
				dma_stop();
				state = RECEIVING;
				break;
			case RECEIVING:
				if (uart_get_received_byte(&latest_byte)) {
					command_buffer[command_buffer_index++] = latest_byte;
					if (command_buffer_index >= COMMAND_BUFFER_SIZE) {
						state = START_DMA;
					}
				}
				break;
			case START_DMA:
				dma_start();
				state = READY;
				break;
			default:
				state = INIT;
				break;
		}
	}

}

static void feed_watchdog() {
	// TODO
}
