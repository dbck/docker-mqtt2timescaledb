const process = require('process');
const env=process.env;
const mqtt = require('mqtt');
const { Pool, Client } = require('pg')
const pm2 = require('pm2');
const pool = new Pool()
const mqttClient = mqtt.connect('mqtt://' + env.MQTT_HOST + ':' + env.MQTT_PORT);

process.on('SIGINT', () => {
  console.info("Interrupted")
  process.exit(0)
})

pm2.launchBus((err, bus) => {
    console.log('connected', bus);

    bus.on('process:exception', function(data) {
      console.log(arguments);
    });

    bus.on('log:err', function(data) {
      console.log('logged error',arguments);
    });

    bus.on('reconnect attempt', function() {
      console.log('Bus reconnecting');
    });

    bus.on('close', function() {
      console.log('Bus closed');
    });
});

mqttClient.on('connect', () => {
    console.log("Connected!");
    mqttClient.subscribe('#');
});

mqttClient.on('message', (topic, message) => {

    const base_topic = 'zigbee2mqtt/';

    if (topic === base_topic + 'temperature_001') {
       let json = JSON.parse(message.toString());
       insertSensorData('temperature_001',json);
    }
    if (topic === base_topic + 'temperature_002') {
       let json = JSON.parse(message.toString());
       insertSensorData('temperature_002',json);
    }
    if (topic === base_topic + 'temperature_003') {
       let json = JSON.parse(message.toString());
       insertSensorData('temperature_003',json);
    }
    if (topic === base_topic + 'temperature_004') {
       let json = JSON.parse(message.toString());
       insertSensorData('temperature_004',json);
    }
    if (topic === base_topic + 'temperature_005') {
       let json = JSON.parse(message.toString());
       insertSensorData('temperature_005',json);
    }

    if (topic === 'openweather/current_weather') {
       let json = JSON.parse(message.toString());
       insertOpenWeatherData('openweather',json);
    }
//    else {
//       console.log("Unexpected message: " + topic + ": " + message);
//    }
});

async function insertSensorData(device, json) {
    let client;
    try {
        client = await pool.connect()
    } catch (e) {
        console.error("Failed to connect to database pool due to: " + e.message)
        return;
    }
    try {
        const result = await client.query('INSERT INTO conditions (time, device, temperature, humidity, pressure, battery, voltage, linkquality) VALUES (current_timestamp, $1, $2, $3, $4, $5, $6, $7);', [device, json.temperature, json.humidity, json.pressure, json.battery, json.voltage, json.linkquality]);
        if (result.rowCount != 1) {
            console.warn("Row count was not equal to 1 in: ", result);
        }
    } finally {
        client.release()
    }
}

async function insertOpenWeatherData(provider, json) {
    let client;
    let optional_defaults = {
        rain : { '1h': undefined, '3h': undefined },
        snow : { '1h': undefined, '3h': undefined }
    }
    var json = { ...optional_defaults, ...json }
    //console.log(json);
    try {
        client = await pool.connect()
    } catch (e) {
        console.error("Failed to connect to database pool due to: " + e.message)
        return;
    }
    try {
        //const result = await client.query("INSERT INTO weather (time, provider, humidity, pressure, temperature_cur, temperature_min, temperature_max, temperature_feels_like, weather_id, weather_main, weather_description, weather_icon, wind_speed, wind_deg, clouds_all, visibility, sunrise, sunset, time_of_calculation, country, coordinates_longitude, coordinates_latitude, city_name, base) VALUES (current_timestamp, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TIMESTAMP 'epoch' + $16 * INTERVAL '1 second', TIMESTAMP 'epoch' + $17 * INTERVAL '1 second', TIMESTAMP 'epoch' + $18 * INTERVAL '1 second', $19, $20, $21, $22, $23);", [provider, json.main.humidity, json.main.pressure, json.main.temp, json.main.temp_min, json.main.temp_max, json.main.feels_like, json.weather[0].id, json.weather[0].main, json.weather[0].description, json.weather[0].icon, json.wind.speed, json.wind.deg, json.clouds.all, json.visibility, json.sys.sunrise+json.timezone, json.sys.sunset+json.timezone, json.dt+json.timezone, json.sys.country, json.coord.lon, json.coord.lat, json.name, json.base]);
        const result = await client.query("INSERT INTO weather (time, provider, humidity, pressure, temperature_cur, temperature_min, temperature_max, temperature_feels_like, weather_id, weather_main, weather_description, weather_icon, wind_speed, wind_deg, clouds_all, visibility, sunrise, sunset, time_of_calculation, country, coordinates_longitude, coordinates_latitude, city_name, base, rain_1h, rain_3h, snow_1h, snow_3h) VALUES (current_timestamp, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TIMESTAMP 'epoch' + $16 * INTERVAL '1 second', TIMESTAMP 'epoch' + $17 * INTERVAL '1 second', TIMESTAMP 'epoch' + $18 * INTERVAL '1 second', $19, $20, $21, $22, $23, $24, $25, $26, $27);", [provider, json.main.humidity, json.main.pressure, json.main.temp, json.main.temp_min, json.main.temp_max, json.main.feels_like, json.weather[0].id, json.weather[0].main, json.weather[0].description, json.weather[0].icon, json.wind.speed, json.wind.deg, json.clouds.all, json.visibility, json.sys.sunrise+json.timezone, json.sys.sunset+json.timezone, json.dt+json.timezone, json.sys.country, json.coord.lon, json.coord.lat, json.name, json.base, json.rain['1h'], json.rain['3h'], json.snow['1h'], json.snow['3h']]);
        if (result.rowCount != 1) {
            console.warn("Row count was not equal to 1 in: ", result);
        }
    } finally {
        client.release()
    }
}
