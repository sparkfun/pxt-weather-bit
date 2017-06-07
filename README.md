# weatherbit

TODO: To use this package, go to https://pxt.microbit.org, click ``Add package`` and search for **weatherbit**.

### ~ hint

Not currently integrated into pxt.  It must be manually added.  This package is still under development and subject to changes.

## Usage

The package adds support for the **weather:bit** add-on board from SparkFun.

* [Weather Meters](https://www.sparkfun.com/products/8942)
* [Soil Moisture Sensor](https://www.sparkfun.com/products/13322) (Analog Read) & [DS18B20 Soil Temperature Sensor](https://www.sparkfun.com/products/11050) (1-wire Digital Read)
* Atmospheric Monitoring with the onboard [BME280](https://cdn.sparkfun.com/assets/learn_tutorials/4/1/9/BST-BME280_DS001-10.pdf) sensor (I2C)
	* Temperature
	* Humidity
	* Pressure
	* Altitude	

### Micro:bit Pins Used 

The following micro:bit pins are used for weather, atmospheric and aquaponics monitoring:  

* ``P0`` -- Soil Mositure Data 
* ``P1`` -- Wind Direction 
* ``P2`` -- Rain Data (in inches)
* ``P8`` -- Wind Speed Data 
* ``P12`` -- Temperature Data 
* ``P14`` -- RXI (UART)
* ``P15`` -- TXO (UART)
* ``P16`` -- Soil Moisture Power 
* ``P19`` -- BME280 I2C - SCL
* ``P20`` -- BME280 I2C - SDA 

### Set Up Function
At the start of any program which will use the BME280 Sensor data (Pressure, Humidity, Altitude, Temperature) place the "Set up Weather Monitoring" in a "Forever" block. 
It is unknown at this time why this block will not work in the "On Start" block. 

### Start Monitoring Functions 
At the start of any program which will use the Weather Meter data (Wind Speed, Wind Direction, Rain) place the "Start Wind Monitoring" and "Start Rain Monitoring" in a "on start" block. 

```blocks
weatherbit.startWindMonitoring();
weatherbit.startRainMonitoring();
```

### Atmospheric Data (BME280)

The BME280 sensor onboard the weather:bit communicates via I2C. The data is returned as a number which can be stored in a variable, shown on the LED matrix, or sent serially to OpenLog. 
* ``Temperature``block returns a 4 digit number, when divided by 100 will provide the temperature in degree C with two decimals.
* ``Humidity`` block returns a 5 digit number, when divided by 1024 will provide the percent Relative Humidity.
* ``Alititude`` block returns altitude in meters rounded to the nearest whole number-given P0=1013.25hPa at seal level. (Absolute Altitude)
* ``Pressure ``block returns an 8 digit number, when divided by 256 will provide the pressure in Pa. Diving again by 100 will provide measurement in hPa.


### Aquaponics Data 

The two central screw terminal blocks on the weather:bit provide space for the Soil Moisture Sensor and the DS18B20 Waterproof Temperature Sensor. Use the logical plug-in blocks to read 
the soil moisture and temperature of the garden system.
* ``Soil Moisture`` block returns a value between 0 and 1023. 0 being totally dry and 1023 being as wet as water. 
* ``Soil Temperature`` block a 4 digit number, when divided by 100 provides the temperature in hundreths of a degree centigrade. 

### Weather Meter Data

Using SparkFun's Weather Meters it is possible to obtain wind speed, inches of rain, and wind direction using weather:bit. 
* ``Wind Speed`` returns an integer-the wind speed in mph.
* ``Wind Direction`` returns a string corresponding to the direction of the wind. (N, S, E, W, NE, NW, SE, SW)
* ``Rain`` returns an integer - inches of rain.

### Serial Logging with OpenLog

OpenLog is meant to be mated with the weather:bit with the SD card facing into the board. Make sure the RXI on Openlog connects to TXO on the weather:bit. Using the "serial redirect" block
choose TX as P15 and RX as P14 at a baud rate of 9600. The firmware on OpenLog will do the rest! When you want to review the data simple open the txt file created by OpenLog to view the data. 

Example Project:
The following project will read all atmospheric sensor data from the BME280 on button A press, will read all weather meter data on button B press, and aquaponics data on Button A+B press 
with all values from all sensors logged to OpenLog. 

```blocks
	let BME_Altitude = 0
	let Rain = 0
	let BME_Pressure = 0
	let Wind_Dir = ""
	let BME_Humidity = 0
	let Soil_Moisture = 0
	let Wind_Speed = 0
	let BME_TEMP = 0
	let Soil_Temperature = 0
	basic.forever(() => {
		weatherbit.setupBME280()
	})
	input.onButtonPressed(Button.AB, () => {
		Soil_Temperature = weatherbit.readSoilTemp()
		basic.showNumber(Soil_Temperature)
		serial.writeLine("Soil Temperature:")
		serial.writeNumber(Soil_Temperature)
		Soil_Moisture = weatherbit.readSoilMoisture()
		basic.showNumber(Soil_Moisture)
		serial.writeLine("Soil Moisture:")
		serial.writeNumber(Soil_Moisture)
	})
	input.onButtonPressed(Button.A, () => {
		BME_TEMP = weatherbit.getTemperature()
		basic.showNumber(weatherbit.getTemperature())
		serial.writeLine("BME TEMP:")
		serial.writeNumber(BME_TEMP)
		BME_Humidity = weatherbit.getHumidity()
		basic.showNumber(weatherbit.getHumidity())
		serial.writeLine("BME Humidity:")
		serial.writeNumber(BME_Humidity)
		BME_Pressure = weatherbit.getPressure()
		basic.showNumber(weatherbit.getPressure())
		serial.writeLine("BME Pressure:")
		serial.writeNumber(BME_Pressure)
		BME_Altitude = weatherbit.getAltitude()
		basic.showNumber(weatherbit.getAltitude())
		serial.writeLine("BME Altitude:")
		serial.writeNumber(BME_Altitude)
	})
	input.onButtonPressed(Button.B, () => {
		Wind_Speed = weatherbit.readWindSpeed()
		basic.showNumber(weatherbit.readWindSpeed())
		serial.writeLine("Wind speed:")
		serial.writeNumber(Wind_Speed)
		Wind_Dir = weatherbit.readWindDir()
		basic.showString(weatherbit.readWindDir())
		basic.pause(300)
		serial.writeLine("Wind Direction:")
		serial.writeString(Wind_Dir)
		Rain = weatherbit.readRain()
		basic.showNumber(Rain)
		serial.writeLine("Inches of Rain:")
		serial.writeNumber(Rain)
	})
	weatherbit.startRainMonitoring()
	weatherbit.startWindMonitoring()
	serial.redirect(
	SerialPin.P15,
	SerialPin.P14,
	BaudRate.BaudRate9600
	)
```

## License

MIT

## Supported targets

* for PXT/microbit


