#include <dac.h>
#include "stm32f4xx.h"
#include "macro_utiles.h"


void dac_init(){
	// uses pin PA4

	RCC->AHB1ENR |= BIT0; // GPIOA clock enable
	RCC->APB1ENR |= BIT29; // DAC clock enable
	DAC->CR |= BIT0; // Enable DAC1
	DAC->CR |= BIT1; // Enable DAC1 output buffer
	DAC->CR |= BIT12; // DAC DMA enable
}

void dac_value(uint32_t value){
	DAC->DHR12R1 = value;
}
