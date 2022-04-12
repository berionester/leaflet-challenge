//create the tile layers

var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});



//MtbMap layer
var mtbMap= L.tileLayer('http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; USGS'
});

//topography layer
let topoMap=  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

//street map layer
var streetMap= L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

//grayscale layer
var grayscaleMap = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

//make a basemap
let basemaps={
    Default:defaultMap,
    Grayscale:grayscaleMap,
    "MtbMap ":mtbMap,
    "Topography":topoMap,
    "Street Map":streetMap,
};

//make an object
var myMap=L.map("map", {
    center:[33.753746, -84.386330],
    zoom:5,
    layers:[defaultMap,topoMap,grayscaleMap ,mtbMap,streetMap]
});

//add default map to the map
defaultMap.addTo(myMap);


//get the data for the tectonic plates
let tectonicplates=new L.layerGroup();

//call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    //console log to check the data
    //console.log(plateData);

    //load the data using GeoJson
    L.geoJson(plateData,{

        //add styling
        color:"yellow",
        weight:1

    }).addTo(tectonicplates);
});

//add the tectonic plates to the map
tectonicplates.addTo(myMap);

//variable for the earthquake data layer
let earthquakes=new L.layerGroup();

//get the data for the earthquakes by using the USGS GeoJson API
 d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        //console log to check the data
        //console.log(earthquakeData);

        //make a function for the colors of the data changing points
        function dataColor(depth){
            if (depth >90)
                return "red";
            else if(depth>70)
                return "#fc4903";
            else if(depth>50)
                return "#fc8403";
            else if(depth>30)
                return "#fcad03";    
            else if(depth>10)
                return "#cafc03";        
            else
                return "green";

        }

        //size of the radius
        function radiusSize(mag){
            if (mag==0)
                return 1; 
            else
                return mag * 5;

        }

        //styling the data points
        function dataStyle(feature)
        {
            return{
                opacity:0.5,
                fillOpacity:0.5,
                fillColor:dataColor(feature.geometry.coordinates[2]), //use index 2 for the depth
                color:"0000", //black outline
                radius:radiusSize(feature.properties.mag), //grabs the magnitude
                weight: 0.5,
                stroke:true
            }
        }

        //add the GeoJson Data to the earthquake layer
        L.geoJson(earthquakeData,{
            //create markers
            pointToLayer: function(feature,latLng) {
                return L.circleMarker(latLng);
            },
            //set the style for each marker
            style: dataStyle, 

            //adding popups
            onEachFeature:function(feature,layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates}</b><br>
                                Location:<b>${feature.properties.place}</b>`);


            }

        }).addTo(earthquakes)

    }
);

//add the earthquake layers
earthquakes.addTo(myMap);

//overlays for the tectonic plates and earthquakes
let overlays={
    "Tectonic Plates":tectonicplates,
    "Earthquake Data":earthquakes
};

//layer control
L.control
    .layers(basemaps,overlays)
    .addTo(myMap);


//legend overlay in the map
let legend= L.control({
    position: "bottomright"

});

//the properties for the legend

legend.onAdd = function(){
    let div= L.DomUtil.create("div","info legend")

    //intervals
    let intervals= [-10,10,30,50,70,90];
    //styling the intervals
    let colors= [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc4903",
        "red"
    ];

    //loop through the intervals to create a label 
    for(var i= 0; i<intervals.length;i++)
    {
        //inner html
        div.innerHTML +="<i style='background:"
            + colors[i]
            + "></i"
            + intervals[i]
            +(intervals[i+1] ? "km &ndash km;"+intervals[i+1]+"km<br>":"+");

    }

    return div;

};

//add the legend to the map
legend.addTo(myMap);
