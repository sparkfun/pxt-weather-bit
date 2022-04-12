forever(() => {
    console.logValue("rain", modules.weatherbitRain.precipitation())
    console.logValue("wind", modules.weatherbitWindSpeed.windSpeed())    
    pause(1000)
})