forever(() => {
    console.logValue("rain", modules.weatherbitRain.precipitation())
    console.logValue("wind speed", modules.weatherbitWindSpeed.windSpeed())    
    pause(5000)
})