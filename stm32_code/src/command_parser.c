#include "command_parser.h"
#include "string.h"

typedef enum {
	READY,
	RECEIVING,
	DONE
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
	state = READY;
	command_buffer_index = 0;

	// TODO: start watchdog timer
	init_watchdog();
}

static void init_watchdog() {
	// TODO
}

void command_parser_push_byte(uint8_t byte) {
	feed_watchdog();

	switch (state) {
	case READY:
		if (byte == START_BYTE) {
			state = RECEIVING;
		}
		break;
	case RECEIVING:
		command_buffer[command_buffer_index++] = byte;
		if (command_buffer_index >= COMMAND_BUFFER_SIZE) {
			state = DONE;
		}
		break;
	case DONE:
		if (byte == START_BYTE) {
			state = RECEIVING;
		}
		break;
	default:
		break;
	}
}

static void feed_watchdog() {
	// TODO
}

int command_parser_get_latest_waveform(waveform_t* latest_waveform) {
	if (state == DONE) {
		memcpy(latest_waveform, command_buffer, COMMAND_BUFFER_SIZE);
	}
	return 0;
}
