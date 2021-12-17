#ifndef COMMAND_PARSER_H_
#define COMMAND_PARSER_H_

#include "waveform.h"
#include "stm32f4xx.h"

#define START_BYTE 0xAA

void command_parser_init();
void command_parser_start();

#endif /* COMMAND_PARSER_H_ */
