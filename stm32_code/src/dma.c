#include "stm32f4xx.h"
#include "macro_utiles.h"

#define TIM2_PERIOD_SECONDS			0.5
#define TIM2_PREVIOUS_PRESCALERS 	2
#define TIM2_PRESCALER 				1
#define TIM2_AUTO_RELOAD			(SystemCoreClock / (TIM2_PREVIOUS_PRESCALERS * TIM2_PRESCALER)) * TIM2_PERIOD_SECONDS

static int buffer[20] = {
		0, 100, 200, 300, 400, 500, 600, 700, 800, 900,
		900, 800, 700, 600, 500, 400, 300, 200, 100, 0
};

void dma_init() {
	// TIM2 for generating DMA requests
	// using channel 3, stream 5


	/*
	 * Init TIM2
	 */
	RCC->APB1ENR |= BIT0; // enable TIM2 clock
	TIM2->PSC = TIM2_PRESCALER - 1;
	TIM2->ARR = (TIM2_AUTO_RELOAD - 1)/500; //TODO
	NVIC->ISER[0] |= BIT28; // TIM2 global interrupt
	TIM2->DIER |=
			BIT14 // Trigger DMA request enable
			| BIT8 // Update DMA request enable
			;
	TIM2->CR1 |= BIT0; //TIM2 counter enable

	/*
	 * Init DMA
	 */
	// TOOD: set prescaler
	RCC->AHB1ENR |= BIT21; // enable DMA1 clock
	NVIC->ISER[0] |= BIT16; // DMA1 Stream 5 global interrupt
	DMA1_Stream5->CR |=
			(BIT25 | BIT26) // Channel 3 selection
			| BIT16 // medium priority
			| BIT13 // 16 bit words on memory
			| BIT12 // 32 bits words on peripheral
			| BIT10 // Memory pointer incremented after each transfer
			| BIT8 // circular mode enabled
			| BIT6 // Memory to peripheral
			;

	// TODO: Mburst?
	DMA1_Stream5->NDTR = 20; // number of data items TODO
	// DMA1_Stream5->PAR = ((uint32_t) DAC) + 0x08; // DAC_DHR12R1 address
	DMA1_Stream5->PAR = &(DAC->DHR12R1); // DAC_DHR12R1 address
	DMA1_Stream5->M0AR = buffer;

	DMA1_Stream5->FCR |= BIT7 // enable fifo error interrupt
			;

	// enable stream at the end only
	DMA1_Stream5->CR |=
			BIT0; // enable stream
}
