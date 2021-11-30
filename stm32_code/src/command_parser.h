#ifndef COMMAND_PARSER_H_
#define COMMAND_PARSER_H_

#include "waveform.h"
#include "stm32f4xx.h"

#define START_BYTE 0xAA

void command_parser_init();
void command_parser_push_byte(uint8_t byte);
int command_parser_get_latest_waveform(waveform_t* latest_waveform);

#endif /* COMMAND_PARSER_H_ */
