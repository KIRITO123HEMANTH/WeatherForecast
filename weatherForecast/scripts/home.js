$(document).ready(function(){
    var jPage = $('.home'), result, cityName, cityExist, forecastDays = 7, // warning: forecastDays must not be set to values more than 16 days
    weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // find maximum temperatue of each day
    function max(teperatures, days) {
        var highestTemperatures = [];
        for (var i = 0; i < days; i++) {
            var dayInfo = teperatures.slice(24 * i, 24 * (i + 1));
            var max = dayInfo[0];
            for (var j in dayInfo) {
                if (dayInfo[j] > max)
                    max = dayInfo[j];
            }
            highestTemperatures.push(Math.round(max));
        }
        return highestTemperatures;
    }

    // find minimum temperatue of each day
    function min(teperatures, days) {
        var lowestTemperatures = [], dayInfo, min;
        for (var i = 0; i < days; i++) {
            dayInfo = teperatures.slice(24 * i, 24 * (i + 1));
            min = dayInfo[0];
            for (var j in dayInfo) {
                if (dayInfo[j] < min)
                    min = dayInfo[j];
            }
            lowestTemperatures.push(Math.round(min));
        }
        return lowestTemperatures;
    }

    // get city weather information using its coordinates through a third-party api and show it to user
    function getWeatherInformation(city){
        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat + '&longitude=' +
        city.lon + '&hourly=temperature_2m&timezone=auto&forecast_days=' + forecastDays,
        xhr = new XMLHttpRequest();
        xhr.onload = function () {
            result = JSON.parse(xhr.response);
            var daysHighestTemeratures = max(result.hourly.temperature_2m, forecastDays),
            daysLowestTemeratures = min(result.hourly.temperature_2m, forecastDays);
            jPage.find(' > .content > .tempToday > .temperature > .amount > .highest').html(daysHighestTemeratures[0]);
            jPage.find(' > .content > .tempToday > .temperature > .amount > .lowest').html(daysLowestTemeratures[0]);
            jPage.find(' > .content > .tempToday > .cityName').html(city.name + ', ' + countryCodes[city.country]);
            jPage.find(' > .content > .date').html('Today,<br/>' + weekDays[new Date().getDay()]);
            jPage.find(' > .content > .daysOverview > .title').html(forecastDays + ' Day Forecast');
            var html = '';
            for (var i = 0; i < forecastDays; i++) {
                html += '<div class="day">\
                    <div class="weekDay">' + new Date(Date.now() + 1000 * 60 * 60 * 24 * i).toString().slice(0, 3) + '</div>\
                    <div class="temperature">\
                        <div class="amount">\
                            <div class="highest">' + daysHighestTemeratures[i] + '</div>\
                            <div class="lowest">' + daysLowestTemeratures[i] + '</div>\
                        </div>\
                        <div class="degree">o</div>\
                        <div class="unit">C</div>\
                    </div>\
                </div>';
            }
            jPage.find(' > .content > .daysOverview > .details').html(html);
            jPage.find(' > .content > .search > .button').removeClass('locked');
            jPage.find(' > .content > .daysOverview').css('display', 'block');
            searchBoxResult = [];
        }
        xhr.open('Get', url);
        xhr.send();
    }

    // real-time search box
    var searchBoxResult = [];
    jPage.find(' > .content > .search > input').keyup(function() {
        searchBoxResult = [];
        selectedCityId = '';
        cityName = jPage.find(' > .content > .search > input').val().toLowerCase().trim();
        if (cityName.length > 2) { // do real-time search only if the user has enterd more than 2 characters
            for (var i = 0; i < cities50000.length; i++) {
                if ((cities50000[i].name.toLowerCase().indexOf(cityName) !== -1) && (cities50000[i].name.slice(0, cityName.length).toLowerCase() === cityName))
                    searchBoxResult.push(cities50000[i]);
            }
            jPage.find(' > .content > .search > .box > ul').html('');
            if (searchBoxResult.length) {
                searchBoxResult.sort(function(a, b){return a.name.localeCompare(b.name)});
                for (var j = 0; j < searchBoxResult.length; j++) {
                    jPage.find(' > .content > .search > .box > ul').append('<li key="' + searchBoxResult[j].id + '"><div class="city">' +
                    searchBoxResult[j].name + '</div><div class="country">' + countryCodes[searchBoxResult[j].country] + '</div></li>');
                    if (j === 5) // show only the first six result on search box
                        break;
                }
                jPage.find(' > .content > .search > .box > ul > li').each(function() {
                    $(this).click(function(){
                        jPage.find(' > .content > .search > input').val($(this).children('.city').html());
                        jPage.find(' > .content > .search > .box').css('display', 'none');
                        selectedCityId = $(this).attr('key');
                        for (var i in searchBoxResult)
                            if (searchBoxResult[i].id === selectedCityId) {
                                getWeatherInformation(searchBoxResult[i]);
                                jPage.find(' > .content > .search > .button').addClass('locked');
                            };
                    })
                });
                jPage.find(' > .content > .search > .box').css('display', 'block');
            }
        }
        else
        jPage.find(' > .content > .search > .box').css('display', 'none');
    });

    // search button
    jPage.find(' > .content > .search > .button').click(function() {
        if (!($(this).hasClass('locked'))) {
            $(this).addClass('locked');
            jPage.find(' > .content > .search > .box').css('display', 'none');
            cityName = jPage.find(' > .content > .search > input').val().toLowerCase().trim();
            if (cityName) {
                cityExist = false;

                // check if the city is already in search box results
                if (searchBoxResult.length) {
                        if (selectedCityId)
                            for (var i in searchBoxResult)
                                if (searchBoxResult[i].id === selectedCityId) {
                                    getWeatherInformation(searchBoxResult[i]);
                                    cityExist = true;
                                }
                        else
                            for (var i in searchBoxResult) {
                                if (searchBoxResult[i].name.toLowerCase() === cityName) {
                                    getWeatherInformation(searchBoxResult[i]);
                                    cityExist = true;
                                };
                            };
                }

                // if city doesn't exist in search box results, look for it in database
                if (!cityExist) {
                    for (var i in cities50000) {
                        if (cities50000[i].name.toLowerCase() === cityName) {
                            getWeatherInformation(cities50000[i]);
                            cityExist = true;
                        }
                    }
                }

                // do this if the city doesn't exist in database
                if (!cityExist) {
                    jPage.find(' > .content > .tempToday > .temperature > .amount > div').html('');
                    jPage.find(' > .content > .tempToday > .cityName').html('City Doesn\'t Exist In Database');
                    jPage.find(' > .content > .daysOverview').css('display', 'none');
                    jPage.find(' > .content > .date').html('');
                    $(this).removeClass('locked');
                }
            }
            else
                $(this).removeClass('locked');
        }
    });
});