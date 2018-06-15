# weatherbit [![Build Status](https://travis-ci.org/sparkfun/pxt-weather-bit.svg?branch=master)](https://travis-ci.org/sparkfun/pxt-weather-bit)

To use this package, go to https://makecode.microbit.org, click ``Add package`` and search for **weatherbit**.

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

At the start of any program which will use the 
weather meter data (Wind Speed, Wind Direction, Rain) 
place the ``|start wind monitoring|`` and ``|start rain monitoring|`` 
in a ``|on start|`` block. 

```blocks
weatherbit.startWindMonitoring();
weatherbit.startRainMonitoring();
weatherbit.startWeatherMonitoring()
```

### Atmospheric Data (BME280)

The BME280 sensor onboard the weather:bit communicates via I2C. The data is returned as a number which can be stored in a variable, shown on the LED matrix, or sent serially to OpenLog. 
* ``|temperature|``block returns a 4 digit number, when divided by 100 will provide the temperature in degree C with two decimals.
* ``|humidity|`` block returns a 5 digit number, when divided by 1024 will provide the percent Relative Humidity.
* ``|altitude|`` block returns altitude in meters rounded to the nearest whole number-given P0=1013.25hPa at seal level. (Absolute Altitude)
* ``|pressure|``block returns an 8 digit number, when divided by 256 will provide the pressure in Pa. Diving again by 100 will provide measurement in hPa.


```blocks
basic.forever(() => {
    weatherbit.startWeatherMonitoring()
})
basic.showNumber(weatherbit.temperature())
basic.showNumber(weatherbit.pressure())
basic.showNumber(weatherbit.humidity())
basic.showNumber(weatherbit.altitude())

```

### Aquaponics Data 

The two central screw terminal blocks on the weather:bit provide space for the Soil Moisture Sensor and the DS18B20 Waterproof Temperature Sensor. Use the logical plug-in blocks to read 
the soil moisture and temperature of the garden system.
* ``|soil moisture|`` block returns a value between 0 and 1023. 0 being totally dry and 1023 being as wet as water. 
* ``|soil temperature|`` block a 4 digit number, when divided by 100 provides the temperature in hundreths of a degree centigrade. 

```blocks
basic.forever(() => {
    basic.showNumber(weatherbit.soilTemperature())
    basic.showNumber(weatherbit.soilMoisture())
})
```

### Weather Meter Data

Using SparkFun's Weather Meters it is possible to obtain wind speed, inches of rain, and wind direction using weather:bit. 
* ``|wind speed|`` returns an integer-the wind speed in mph.
* ``|wind direction|`` returns a string corresponding to the direction of the wind. (N, S, E, W, NE, NW, SE, SW)
* ``|rain|`` returns an integer - inches of rain.

```blocks
basic.forever(() => {
    basic.showNumber(weatherbit.windSpeed())
    basic.showString(weatherbit.windDirection())
    basic.pause(300)
    // serial.writeValue("wind direction",
    // weatherbit.windDirection())
    basic.showNumber(weatherbit.rain())
})
weatherbit.startRainMonitoring()
```

### Serial Logging with OpenLog

OpenLog is meant to be mated with the weather:bit with the SD card facing into the board. Make sure the RXI on Openlog connects to TXO on the weather:bit. 
Using the ``|serial redirect|`` block
choose TX as P15 and RX as P14 at a baud rate of 9600. 
The firmware on OpenLog will do the rest! 
When you want to review the data simple open the txt file created by OpenLog to view the data. 

Example Project:
The following project will read all atmospheric sensor data from the BME280 on button A press, will read all weather meter data on button B press, and aquaponics data on Button A+B press 
with all values from all sensors logged to OpenLog. 

```blocks
input.onButtonPressed(Button.AB, () => {
    basic.showNumber(weatherbit.soilTemperature())
    serial.writeValue("soil temperature", weatherbit.soilTemperature())
    basic.showNumber(weatherbit.soilMoisture())
    serial.writeValue("soil moisture", weatherbit.soilMoisture())
})
input.onButtonPressed(Button.A, () => {
    basic.showNumber(weatherbit.temperature())
    serial.writeValue("temperature", weatherbit.temperature())
    basic.showNumber(weatherbit.humidity())
    serial.writeValue("humidity", weatherbit.humidity())
    basic.showNumber(weatherbit.pressure())
    serial.writeValue("pressure", weatherbit.pressure())
    basic.showNumber(weatherbit.altitude())
    serial.writeValue("altitude", weatherbit.altitude())
})
input.onButtonPressed(Button.B, () => {
    basic.showNumber(weatherbit.windSpeed())
    serial.writeValue("wind speed", weatherbit.windSpeed())
    basic.showString(weatherbit.windDirection())
    basic.pause(300)
    // serial.writeValue("wind direction",
    // weatherbit.windDirection())
    basic.showNumber(weatherbit.rain())
    serial.writeValue("rain", weatherbit.rain())
})
weatherbit.startRainMonitoring()
weatherbit.startWindMonitoring()
weatherbit.startWeatherMonitoring()
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
