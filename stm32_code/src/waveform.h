#ifndef WAVEFORM_H_
#define WAVEFORM_H_

#include "stm32f4xx.h"

#define SAMPLES_BUFFER_SIZE 8192

#pragma pack(2)
typedef struct {
	uint16_t used_size;
	uint16_t samples[SAMPLES_BUFFER_SIZE];
} waveform_t;


#endif /* WAVEFORM_H_ */
