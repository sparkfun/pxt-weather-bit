

/**
 * Functions to operate the weather:bit
 */
//% color=#f44242 icon="&#xf37a;"
namespace weatherbit {	
	/**
	 * Reads the Moisture Level from the Soil Moisture Sensor. Must be placed in an event block (e.g. button A)
	 */
	//% blockId="ReadSoilMoisture" block="Read %Soil_Moisture_Level"
	export function SoilMoisture(): void {
		let Soil_Moisture = 0
		pins.digitalWritePin(DigitalPin.P16, 1)
		basic.pause(10)
		Soil_Data = pins.analogReadPin(AnalogPin.P0)
		basic.pause(100)
		basic.showNumber(Soil_Moisture)
		basic.pause(1000)
		pins.digitalWritePin(DigitalPin.P16, 0)
		basic.clearScreen()
		if (Soil_Moisture <= 50) 
			{
			basic.showLeds(`
			. # . # .
			. . . . .
			. # # # .
			# . . . #
			. . . . .
			`)
			basic.pause(5000)
			basic.showString("WATER ME!!")
			basic.pause(5000)
			}
		basic.clearScreen()
		if (Soil_Moisture > 50) 
			{
			basic.showLeds(`
			. # . # .
			. . . . .
			. . . . .
			# . . . #
			. # # # .
			`)
			basic.pause(5000)
			}
		basic.clearScreen()
	}
}
		
	
	