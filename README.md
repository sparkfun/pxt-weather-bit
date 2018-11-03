# weatherbit *en chantier*

*Ce package est toujours en développement et sujet à modification.*

[![Build Status](https://travis-ci.org/sparkfun/pxt-weather-bit.svg?branch=master)](https://travis-ci.org/sparkfun/pxt-weather-bit)

To use this package, go to https://makecode.microbit.org, click ``Add package`` and search for **weatherbit**.

## Utilisation

Ce paquet prend en charge le périphérique ** weather:bit ** de SparkFun.

* [Compteurs météo] (https://www.sparkfun.com/products/8942)
* [Capteur d'humidité du sol] (https://www.sparkfun.com/products/13322) (Lecture analogique) & [Capteur de température du sol DS18B20] (https://www.sparkfun.com/products/11050) (1- fil numérique lu)
* Surveillance atmosphérique avec le capteur [BME280] (https://cdn.sparkfun.com/assets/learn_tutorials/4/1/9/BST-BME280_DS001-10.pdf) intégré (I2C)
* Température
* Humidité
* Pression
* Altitude

 ### Micro:bit broches utilisés

 Les micro-broches suivantes sont utilisées pour la surveillance météorologique, atmosphérique et aquaponique:

	 * `` P0`` - Données de ll'humidité du sol
	 * `` P1`` - Direction du vent
	 * `` P2`` - Données de pluie (en pouces)
	 * `` P8`` - Données de vitesse du vent
	 * `` P12`` - Données de température
	 * `` P14`` - RXI (UART)
	 * `` P15`` - TXO (UART)
	 * `` P16`` - Puissance d'humidité du sol
	 * `` P19`` - BME280 I2C - SCL
	 * `` P20`` - BME280 I2C - SDA

### Fonction de configuration
Au début de tout programme qui utilisera les données du capteur BME280 (pression, humidité, altitude, température), placez la "surveillance météo" dans un bloc "Toujours".
On ignore pour le moment pourquoi ce bloc ne fonctionne pas dans le bloc "Au démarrage".

### Démarrer les fonctions de surveillance

Au début de tout programme qui utilisera les données météorologiques (vitesse du vent, direction du vent, pluie) placez le `` | démarrer la surveillance du vent | `` et `` | commencer la surveillance de la pluie | `` dans un bloc `` | | on start | ``.

`` `blocs
weatherbit.startWindMonitoring ();
weatherbit.startRainMonitoring ();
weatherbit.startWeatherMonitoring ()
```
### Données atmosphériques (BME280)

Le capteur BME280 intégré à la météo:bit communique via I2C. Les données sont renvoyées sous forme de nombre pouvant être stocké dans une variable, affichée sur la matrice de voyants ou envoyé en série à OpenLog.
Le bloc * `` | temperature | `` retourne un nombre à 4 chiffres. Divisé par 100, la température en degrés C avec deux décimales.
Le bloc * `` | humidite | `` renvoie un nombre à 5 chiffres, divisé par 1024, il fournit le pourcentage d'humidité relative.
* Le bloc `` | | altitude | `` renvoie l'altitude en mètres arrondie au nombre entier le plus proche donné P0 = 1013.25hPa au niveau du joint. (Altitude absolue)
Le bloc * `` | pressure | `` renvoie un nombre à 8 chiffres, lorsqu'il est divisé par 256, fournira la pression en Pa. Une plongée à nouveau de 100 fournira une mesure en hPa.


`` `blocs
basic.forever (() => {
	weatherbit.startWeatherMonitoring ()
	})
basic.showNumber (weatherbit.temperature ())
basic.showNumber (weatherbit.pressure ())
basic.showNumber (weatherbit.humidity ())
basic.showNumber (weatherbit.altitude ())

`` `

### Données Aquaponiques

Les deux bornes à vis centraux du weather:bit offrent un espace pour le capteur d'humidité du sol et le capteur de température étanche DS18B20. Utilisez les blocs de plug-ins logiques pour lire
l'humidité du sol et la température du système de jardin.
* Le bloc `` | | humidité du sol | `` renvoie une valeur comprise entre 0 et 1023. 0 étant totalement sec et 1023 étant aussi humide que de l'eau.
* `` | sol temperature | `` bloque un nombre à 4 chiffres, divisé par 100, donne la température en centièmes de degré centigrades.

`` `blocs
basic.forever (() => {
	basic.showNumber (weatherbit.soilTemperature ())
	    basic.showNumber (weatherbit.soilMoisture ())
	    })
`` `

### Données météo

Les indicateurs méteo permettent d’obtenir la vitesse du vent, les  centimètres de pluie et la direction du vent à l’aide de weather:bit.
* `` | wind speed | `` renvoie un entier - la vitesse du vent en mph.
* `` | wind direction | `` renvoie une chaîne correspondant à la direction du vent. (N, S, E, O, NE, NO, SE, SO)
* `` | | rain | `` renvoie un entier - pouces de pluie.

`` `blocs
basic.forever (() => {
	basic.showNumber (weatherbit.windSpeed ​​())
	    basic.showString (weatherbit.windDirection ())
	        base.pause (300)
	            // serial.writeValue ("direction du vent",
								   // weatherbit.windDirection ())
				basic.showNumber (weatherbit.rain ())
				})
				weatherbit.startRainMonitoring ()
				`` `
				### Journalisation en série avec OpenLog

				OpenLog est conçu pour être adapté à la météo:bit avec la carte SD face au tableau. Assurez-vous que le RXI sur Openlog se connecte à TXO sur la météo:bit.
				Utilisation du bloc `` | serial redirect | ``
				choisissez TX en tant que P15 et RX en tant que P14 à une vitesse de transmission de 9600.
				Le firmware sur OpenLog fera le reste!
				Lorsque vous souhaitez examiner les données, ouvrez simplement le fichier txt créé par OpenLog pour afficher les données.

				Exemple de projet:
					Le projet suivant lira toutes les données des capteurs atmosphériques du BME280 sur le bouton A, lira toutes les données de météo sur le bouton B et les données aquaponiques sur les boutons A + B.
					avec toutes les valeurs de tous les capteurs connectés à OpenLog.

					`` `blocs
					input.onButtonPressed (Button.AB, () => {
						basic.showNumber (weatherbit.soilTemperature ())
						    serial.writeValue ("température du sol", weatherbit.soilTemperature ())
						        basic.showNumber (weatherbit.soilMoisture ())
						            serial.writeValue ("humidité du sol", weatherbit.soilMoisture ())
						            })
					input.onButtonPressed (Button.A, () => {
						basic.showNumber (weatherbit.temperature ())
						    serial.writeValue ("temperature", weatherbit.temperature ())
						        basic.showNumber (weatherbit.humidity ())
						            serial.writeValue ("humidité ", weatherbit.humidity ())
						                basic.showNumber (weatherbit.pressure ())
						                    serial.writeValue ("pressure", weatherbit.pressure ())
						                        basic.showNumber (weatherbit.altitude ())
						                            serial.writeValue ("altitude", weatherbit.altitude ())
						                            })
					input.onButtonPressed (Button.B, () => {
						basic.showNumber (weatherbit.windSpeed ​​())
						    serial.writeValue ("vitesse du vent", weatherbit.windSpeed ​​())
						        basic.showString (weatherbit.windDirection ())
						            base.pause (300)
						                // serial.writeValue ("direction du vent",
											// weatherbit.windDirection ())
										basic.showNumber (weatherbit.rain ())
										    serial.writeValue ("pluie", weatherbit.rain ())
										    })
										weatherbit.startRainMonitoring ()
										weatherbit.startWindMonitoring ()
										weatherbit.startWeatherMonitoring ()
										serial.redirect (
											SerialPin.P15,
											SerialPin.P14,
											BaudRate.BaudRate9600
											)
										`` `

										## Licence

										MIT

										## Cibles prises en charge

										* pour PXT / microbit
