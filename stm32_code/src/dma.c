#include "stm32f4xx.h"
#include "macro_utiles.h"
#include "waveform.h"
#include "dma.h"

#define TIM2_PERIOD_SECONDS			1 / 100000
#define TIM2_PREVIOUS_PRESCALERS 	2
#define TIM2_PRESCALER 				1
#define TIM2_AUTO_RELOAD			(SystemCoreClock / (TIM2_PREVIOUS_PRESCALERS * TIM2_PRESCALER)) * TIM2_PERIOD_SECONDS

/*
static int buffer[20] = {
		0, 100, 200, 300, 400, 500, 600, 700, 800, 900,
		900, 800, 700, 600, 500, 400, 300, 200, 100, 0
};*/
static waveform_t* waveform;


void TIM2_IRQHandler() {
	TIM2->SR &= ~BIT0;
	volatile tim2status2 = TIM2->SR;
	volatile int k = 1;
}

void DMA1_Stream1_IRQHandler() {
	  volatile int dmaStatusH = DMA1->HISR;
	  volatile int dmaStatusL = DMA1->LISR;
	  for (volatile int i = 0; i < 2; i++);
}

void dma_init(waveform_t* p_waveform) {
	waveform = p_waveform;

	// TIM2 for generating DMA requests
	// using channel 3, stream 5


	/*
	 * Init TIM2
	 */
	RCC->APB1ENR |= BIT0; // enable TIM2 clock
	TIM2->PSC = TIM2_PRESCALER - 1;
	TIM2->ARR = TIM2_AUTO_RELOAD - 1;
	NVIC->ISER[0] |= BIT28; // TIM2 global interrupt
	TIM2->DIER |=
			BIT14 // Trigger DMA request enable
			| BIT8 // Update DMA request enable
			| BIT0 // UNSURE: TIM2 Update interrupt enable TODO
			;
	TIM2->CR1 |= BIT0; //TIM2 counter enable
	// TODO: is ARPE necessary?, is URS useful?

	TIM2->CR2 |= BIT3 // TIM2 send DMA request when update event occurs
			;

	volatile tim2status = TIM2->SR;
	/*
	 * Init DMA
	 */
	// TODO: make sure EN bit (BIT0) is false by setting + polling it
	RCC->AHB1ENR |= BIT21; // enable DMA1 clock
	// NVIC->ISER[0] |= BIT16; // DMA1 Stream 5 global interrupt
	NVIC->ISER[0] |= BIT12; // DMA1 Stream 1 global interrupt
	DMA1_Stream1->CR |=
			(BIT25 | BIT26) // Channel 3 selection
			| BIT16 // medium priority
			| BIT13 // 16 bit words on memory
			| BIT11 // 16 bits words on peripheral
			| BIT10 // Memory pointer incremented after each transfer
			| BIT8 // circular mode enabled
			| BIT6 // Memory to peripheral
			;

	// TODO: Mburst?
	DMA1_Stream1->NDTR = 20; // number of data items TODO
	DMA1_Stream1->PAR = (uint32_t) &(DAC->DHR12R1); // DAC_DHR12R1 address
	DMA1_Stream1->M0AR = (uint32_t) &(waveform->samples);


	DMA1_Stream1->FCR |=
			// BIT7 // enable fifo error interrupt
			BIT2 // direct mode disabled
			| BIT1 // Threshold 3/4 fifo
			;


	// enable stream at the end only
	/*DMA1_Stream1->CR |=
			BIT0; // enable stream
*/
}

void dma_stop()
{
	DMA1_Stream1->CR &= ~BIT0;
	while (DMA1_Stream1->CR & BIT0) {};

	// clear previous interrupt flags
	DMA1->LIFCR |= (0b1111 << 24) |
			(0b11111 << 18) |
			(0b1 << 16) |
			(0b1111 << 8) |
			(0b11111 << 2) |
			(0b1);
	DMA1->HIFCR |= (0b1111 << 24) |
			(0b11111 << 18) |
			(0b1 << 16) |
			(0b1111 << 8) |
			(0b11111 << 2) |
			(0b1);

}

void dma_start()
{
	DMA1_Stream1->NDTR = waveform->used_size;
	DMA1_Stream1->CR |= BIT0;
}

