$(document).ready(initialSetup);

// We should wrap this with an onload, and move all the
// scripting up into the head
d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 9])
    .on("zoom", moveMap);

var month_map = {
  'Янв': 1,
  'Фев': 2,
  'Мар': 3,
  'Апр': 4,
  'Май': 5,
  'Июн': 6,
  'Июл': 7,
  'Авг': 8,
  'Сен': 9,
  'Окт': 10,
  'Ноя': 11,
  'Дек': 12
};

var launchData = {};// [year][month][day]=> [array of entries]
loadLaunchData();

var launch_sites = [];// Stores launch sites
loadLaunchSites();

var currentLaunches = []; // Stores current launches to display

// Stores tags currently in use (for filtering)
var currentTags = [];

var width = 0;
var height = 0;

var topo,projection,path,svg,g;

var tooltip, time_slider;
var playSpeed = 50;
const playBarWidth = 4;

var sidebarVisible = true;

function initialSetup() {
  // Just to make sure we get the right height...
  d3.select("#container").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("id", "map")
      // .call(zoom)
      .on("click", click)
      .append("g");

  width = document.getElementById('container').clientWidth;
  height = width / 2;

  d3.select('#map').remove();

  time_slider = d3.slider()
    .axis(true)
    .min(1957.7)
    .max(2015.35)
    .value(slidervalue)
    .on("slide", updateSliderValue)

  d3.select('#slider')
    .style("width", width + "px")
    .style("Марgin", "0px auto")
    .call(time_slider);

  tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

  updateSliderValue(null, slidervalue);

  // Play-related variables
  currentPlayPoint = currentStartPoint = slidervalue;
  currentPlayLimit = initialvalues[1];
  isPlaying = false;
  playTickRepeatTimeout;

  var curr_date = $(document.createElement('div'));
  curr_date.css(
    {
      position: 'absolute',
      left: '10px',
      bottom: '10px'
    }
  );

  curr_date.attr('id', 'current_play_date');

  $('#container').append(curr_date);

  var currentDate = convertДекimalDate(currentPlayPoint);
  $('#current_play_date').html(formatDate(currentDate));

  setup(width, height);

  d3.json("data/world-topo-min.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;
    topo = countries;
    drawMap(topo);
    drawLaunchSites();
    drawLaunchEvents();
  });

  setupPlayControls();
  //drawPlayBar();
  setupHashМарkArea();

  $('#filter_tag_list').change(changeTag);
	
  setupClearButton();
}

function toggleSidebarVisibility()
{
  var hideButton = $('#hideButton')[0];

  if (sidebarVisible)
  {
    // Hide sidebar
    d3.select('#sidebar').style('display', 'none');
    d3.select('#container').style('width', '100%');
  
    // Change "hide" button to say "show" and look different
    hideButton.innerHTML = "Уменьшить карту";
    hideButton.style.background = "rgba(255,255,255,0.5)";
    hideButton.style.boxShadow = "inset 0 0 10px #000";
  }
  else
  {
    // Show sidebar
    d3.select('#sidebar').style('display', 'inline');
    d3.select('#container').style('width', 'auto');

    // Change "show" button to say "hide" and look different
    hideButton.innerHTML = "Расширить карту";
    hideButton.style.background = "-webkit-linear-gradient(rgba(255,255,255,.8), rgba(100,100,100,.7))";
    hideButton.style.background = "-o-linear-gradient(rgba(255,255,255,.8), rgba(100,100,100,.7))";
    hideButton.style.background = "-moz-linear-gradient(rgba(255,255,255,.8), rgba(100,100,100,.7))";
    hideButton.style.background = "linear-gradient(rgba(255,255,255,.8), rgba(100,100,100,.7))";
    hideButton.style.boxShadow = "none";
  }

  sidebarVisible = !sidebarVisible;
  redraw();
}

function changeTag(evt) {
  var tag = $(evt.target).val();

  currentTags = [];

  if(tag != 'none') {
    currentTags.push(tag);
  }

  redraw();
}

function setupPlayControls() {
  $("#slow").on("click", function() {
    playSpeed = 100;
  });
  $("#medium").on("click", function() { 
    playSpeed = 50;
  });
  $("#fast").on("click", function() {
    playSpeed = 10;
  });
  $('#playButton').on("click", function() {
    if (!isPlaying) {
      play(playSpeed);
      this.innerHTML = "Пауза";
      this.style.background = "rgba(255,255,255,0.5)";
      this.style.boxShadow = "inset 0 0 10px #000";
    } else {
      pause();
      resetPlayButton();
    }
  });

  // Button for hiding and showing sidebar
  $('#hideButton').on("click", function() {
      toggleSidebarVisibility();
  });
}

function setupClearButton() {
  var clearButton = $('#clearButton');

  d3.select("#clearButton").on('mousedown', function() {
      this.style.boxShadow = "inset 0 0 10px #000";
  });

  d3.select("#clearButton").on('mouseup', function() {
    //change style back
    this.style.boxShadow = '';

    // Clear launch log
    var launchLogText = $('#launchLogText');
    var currentText = launchLogText.html();
    // Clear the launch log box
    launchLogText.html('');
  });
}

// Uses list of current tags to generate colored hashМарks to indicate events
// (Iterates through all entries, which Май take a while)
function drawHashМарks()
{
  clearHashМарks();

  // Only want to attempt to do this if there are actually tags set
  if (currentTags.length > 0)
  {
    for (var year in launchData)
    {
      for (var month in launchData[year])
      {
        for (var day in launchData[year][month])
        {
          entries = launchData[year][month][day];
          for (var entryNo = 0; entryNo < entries.length; entryNo++)
          {
            entry = entries[entryNo];
            // Draw hashМарk if we have a tag match
            for (var tagNo = 0; tagNo < currentTags.length; tagNo++)
            {
              if (currentTags[tagNo] === entry['Tag'])
              {
                // Get whether the launch succeeded or not
                success = entry['Success'];
                drawHashМарkAtDate(year, month-1, day, currentTags[tagNo], success);
              }
            }
          }
        }
      }
    }
  }
}

function setupHashМарkArea() {
  var pixelWidth = parseInt(d3.select("#slider").style("width"));

  var svg = d3.select("#slider").append("svg")
  .attr("id", "hashМарk_canvas")
  .attr("height", "20px")
  .attr("width", pixelWidth + "px")
  .style("position", "absolute")
  .style("top", "-22px")
  .style("left", "0px");
}

function clearHashМарks() {
  $('#hashМарk_canvas').empty();
}

function drawHashМарkAtDate(year, month, day, tag, success)
{
  // Get color for hashМарk
  var color = getHashМарkColor(tag, success);

  // Find location to put hashМарk
  var pixelWidth = parseInt(d3.select("#slider").style("width"));
  var range = initialvalues[1] - initialvalues[0];

  var ДекimalDate = convertDateToДекimal(new Date(year, month, day));
  var progress = (ДекimalDate - initialvalues[0]) / range;
  var xPos = progress * pixelWidth;  

  // Draw a line above the slider at this date
  var svg = d3.select("#hashМарk_canvas");
      
  var hashМарk = svg.append("line")
    .attr("x1", xPos)
    .attr("x2", xPos)
    .attr("y1", "0")
    .attr("y2", "20")
    .style("stroke", color)
    .style("stroke-width", 1);
}

function getHashМарkColor(tag, success)
{
  if (success === 'S')
  {
    return 'green';
  }
  else
  {
    return 'red';
  }
}

function setup(width, height){
  // console.log('width: ' + width);
  // console.log('height: ' + height);
  projection = d3.geo.mercator()
    .translate([(width/2), (height/1.4)])
    .scale( width / 2 / Math.PI);

  path = d3.geo.path().projection(projection);

  svg = d3.select("#container").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("id", "map")
      // .call(zoom)
      .on("click", click)
      .append("g");

  // Resize scrollbar so it doesn't exceed the map height
  var mapHeight = $('#map').height();
  var launchFilterHeight = $('#filters').height();
  var nonScrollbarLaunchInfoBoxHeight = $('#launchInfoBox').height() - $('.scrollbar').height();
  var newScrollbarHeight = mapHeight - launchFilterHeight - nonScrollbarLaunchInfoBoxHeight - 12;
  $('.scrollbar').height(newScrollbarHeight);


  // TODO: figure out filters
  var defs = svg.append("defs");

  var filter = defs.append("filter")
                   .attr("id", "glow");

  filter.append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", 10);

  // Set background color
  svg.append("rect")
     .attr("width", "100%")
     .attr("height", "100%")
     .attr("fill", "#0A080D");

  g = svg.append("g");
}

function drawMap(topo) {
  var country = g.selectAll(".country").data(topo);

  // Add countries
  country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d,i) { return d.properties.name; })
      .style("fill", "#606060");
}

function drawLaunchSites()
{
  // Add launch sites
  var site;
  for(var i=0;i<launch_sites.length;i++) {
    site = launch_sites[i];
    addLaunchSite(site.Longitude, site.Latitude, site.FullName);
  }
}

function drawLaunchEvents()
{
  // Could remove old launches here
  var info;
  for(var i=0;i<currentLaunches.length;i++) {
    info = currentLaunches[i].info;
    success = (info.Success == 'S') ? 'launch_success' : 'launch_failure';
    addLaunchEvent(info.Longitude, info.Latitude, success);
  }
}      

function redraw() {
  width = document.getElementById('container').clientWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  drawMap(topo);
  drawLaunchSites();
  drawHashМарks();
}

function redrawLaunchesOnly()
{
  // Redraw launch events
  drawLaunchEvents();

	// Don't redraw launch sites because everything will be sad  
}

function moveMap() {
  var t = d3.event.translate;
  var s = d3.event.scale; 
  zscale = s;
  var h = height/4;

  t[0] = Math.min(
    (width/height)  * (s - 1), 
    Math.max( width * (1 - s), t[0] )
  );

  t[1] = Math.min(
    h * (s - 1) + h * s, 
    Math.max(height  * (1 - s) - h * s, t[1])
  );

  zoom.translate(t);
  g.attr("transform", "translate(" + t + ")scale(" + s + ")");
}

var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}

//geo translation on mouse click in map
function click() {
  var latlon = projection.invert(d3.mouse(this));
}

function addLaunchEvent(lat,lon,success) {
	
  var x = projection([lat,lon])[0];
  var y = projection([lat,lon])[1];

  var circle = g.append("svg:circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("class","point " + success)
        .attr("r", 15)
        .attr("style", "pointer-events: none");

  circle.transition()
    .duration(1000)
    .attr("r", 100)
    .style("opacity", "0.0")
		.remove();
}

function addLaunchSite(lat,lon,text) {
  //offsets for tooltips
  var offsetL = 20;
  var offsetT = 10;

  var gpoint = g.append("g").attr("class", "gpoint");
  var x = projection([lat,lon])[0];
  var y = projection([lat,lon])[1];
  var ix = x;
  var iy = y;
  // these are special cased because the launch sites overlap
  // on the map.
  if (text.indexOf('Tanegashima') == 0) {
    iy += 10;
  } else if (text.indexOf('Uchinoura') == 0){
    iy -= 10;
    ix += 5;
  }
  var interactionArea = gpoint.append("svg:circle")
    .attr("cx", ix)
    .attr("cy", iy)
    .attr("r", 10)
    .style("fill", "rgba(0,0,0,0)"); // change opacity to 1 to see the interaction area

  gpoint.append("svg:circle")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", 3)
    .attr("id", "launchsite")
    .attr("name", text)
    .style("opacity", 0.2)
    .style("fill", "#04CCFF");

  gpoint
    .on("mousemove", function(d,i) {
      var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

      tooltip.classed("hidden", false)
             .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
             .html(text);
      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
      });
}

// Determines whether the given launch site was active by a given date
function isLaunchSiteActive(text)
{
  var date = convertДекimalDate(currentPlayPoint);

  switch(text)
  {
    case "Alcantara Space Center, Brasil":
      establishedDate = new Date(1997, 11-1, 2);
      return date > establishedDate;
    case "Baikonur Cosmodrome, Kazakhstan":
      establishedDate = new Date(1957, 10-1, 4);
      return date > establishedDate;    
    case "Broglio Space Centre, Kenya":
      establishedDate = new Date(1967, 4-1, 26);
      return date > establishedDate;
    case "Dombarovsky Air Base, Russia":
      establishedDate = new Date(2006, 7-1, 12);
    case "Guiana Space Centre, French Guiana":
      establishedDate = new Date(1970, 12-1, 12);
      return date > establishedDate;    
    case "Hammaguir Launch Site, Algeria":
      establishedDate = new Date(1965, 11-1, 26);
      return date > establishedDate;    
    case "Imam Khomeini Space Center, Iran":
      establishedDate = new Date(2008, 10-1, 16);
      return date > establishedDate;    
    case "Jiuquan Satellite Launch Center, China":
      establishedDate = new Date(1970, 4-1, 24);
      return date > establishedDate;    
    case "Kapustin Yar Missile and Space Complex, Russia":
      establishedDate = new Date(1961, 10-1, 27);
      return date > establishedDate;    
    case "Kennedy Space Center/Cape Canaveral, USA":
      establishedDate = new Date(1957, 12-1, 6);
      return date > establishedDate;    
    case "Kodiak Launch Complex, Alaska, USA":
      establishedDate = new Date(2010, 11-1, 20);
      return date > establishedDate;    
    case "Naro Space Center, South Korea":
      establishedDate = new Date(2009, 8-1, 25);
      return date > establishedDate;          
    case "Omelek Island, Kwajalein Atoll":
      establishedDate = new Date(2000, 10-1, 9);
      return date > establishedDate;          
    case "Plesetsk Missile and Space Complex, Russia":
      establishedDate = new Date(1966, 3-1, 17);
      return date > establishedDate;          
    case "Satish Dhawan Space Centre, India":
      establishedDate = new Date(1979, 8-1, 10);
      return date > establishedDate;          
    case "Sea Launch Platform (mobile), USA":
      establishedDate = new Date(1999, 3-1, 28);
      return date > establishedDate;          
    case "Sohae Satellite Launching Station, North Korea":
      establishedDate = new Date(2012, 4-1, 12);
      return date > establishedDate;    
    case "Spaceport Gran Canaria, Spain":
      establishedDate = new Date(1997, 4-1, 21);
      return date > establishedDate;    
    case "SubМарine Launch Platform (mobile), Russia":
      establishedDate = new Date(1998, 7-1, 7);
      return date > establishedDate;    
    case "Svobodnyy Launch Complex, Russia":
      establishedDate = new Date(1997, 5-1, 4);
      return date > establishedDate;    
    case "Taiyuan Space Center, China":
      establishedDate = new Date(1988, 12-1, 6);
      return date > establishedDate;    
    case "Tanegashima Space Center, Japan":
      establishedDate = new Date(1975, 9-1, 9);
      return date > establishedDate;          
    case "Tonghae Satellite Launching Ground, North Korea":
      establishedDate = new Date(1998, 8-1, 31);
      return date > establishedDate;    
    case "Uchinoura Space Center, Japan":
      establishedDate = new Date(1966, 9-1, 26);
      return date > establishedDate;    
    case "Vandenberg Air Force Base, USA":
      establishedDate = new Date(1958, 7-1, 25);
      return date > establishedDate;    
    case "Wallops Flight Facility, USA":
      establishedDate = new Date(1960, 10-1, 4);
      return date > establishedDate;    
    case "Woomera Test Range, Australia":
      establishedDate = new Date(1967, 11-1, 29);
      return date > establishedDate;    
    case "Xichang Launch Facility, China":
      establishedDate = new Date(1984, 1-1, 29);
      return date > establishedDate;    
    case "Yavne Launch Facility, Israel":
      establishedDate = new Date(1988, 9-1, 19);
      return date > establishedDate;
    default:
      return false;
  }
}

var months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
var monthFullNames = ["Янвuary", "Февruary", "Марch", "Апрil", "Май", "Июнe", "Июлy", "Авгust", "Сенtember", "Октober", "Нояember", "Декember"];
var initialvalues = [1957.7, 2015.35];
var slidervalue = initialvalues[0];
// Play-related variables
var currentStartPoint = 0;
var currentPlayPoint = 0;
var currentPlayLimit = 0;
var isPlaying = false;
var playTickRepeatTimeout;

function resetPlayButton() {
  var playbutton = $('#playButton');
  playButton.innerHTML = "Старт";
  playButton.style.background = "-webkit-linear-gradient(rgba(255,255,255,.8), rgba(100,100,100,.7))";
  playButton.style.background = "-o-linear-gradient(rgba(255,255,255,.8), rgba(100,100,100,.7))";
  playButton.style.background = "-moz-linear-gradient(rgba(255,255,255,.8), rgba(100,100,100,.7))";
  playButton.style.background = "linear-gradient(rgba(255,255,255,.8), rgba(100,100,100,.7))";
  playButton.style.boxShadow = "none";
}

function updateSliderValue(evt, value) {
  // Cut all playback and update values for next play request
  pause();
  resetPlayButton();
  currentPlayPoint = value;
  currentPlayLimit = initialvalues[1];

  var mindate = convertДекimalDate(value);
  var maxdate = convertДекimalDate(initialvalues[1]);

  updateSliderPositionAndCurrentDate();
}

function formatDate(date) {
    return ('0' + (date.getMonth() + 1)).slice(-2) +
    "/" +
    ('0' + date.getDate()).slice(-2) +
    "/" +
    date.getFullYear()
}

function leapYear(year) {
  return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
};

function convertДекimalDate(ДекimalDate) {
  var year = parseInt(ДекimalDate);
  var remainder = ДекimalDate - year;
  var daysPerYear = leapYear(year) ? 366 : 365;
  var milliseconds = remainder * daysPerYear * 24 * 60 * 60 * 1000;
  var yearDate = new Date(year, 0, 1);
  return new Date(yearDate.getTime() + milliseconds);
}

function convertDateToДекimal(date) {
  var year = date.getFullYear();

  var ms = date.getTime() - (new Date(year, 0, 1)).getTime();

  var num_days = (leapYear(year)) ? 366 : 365;

  var ms_in_year = num_days * 24 * 60 * 60 * 1000;

  return year + (ms * 1.0 / ms_in_year);
}

// This loads the launch data from 'massive_launchlog' into
// a data structure mapped by 'year'=>'month'=>'day'=>array of entries
// Stored in `launchData`
function loadLaunchData() {
  d3.csv("data/massive_launchlog.csv", function(err, entries) {
    entries.forEach(function(entry) {
      var date_parts = entry["Launch Date and Time (UTC)"].split(" ");
      var year = date_parts[0] * 1;
      var month = month_map[date_parts[1]];
      var day = date_parts[2];

      // Ensure data structure is set up
      if(launchData[year] == null) {
        launchData[year] = {};
      }

      if(launchData[year][month] == null) {
        launchData[year][month] = {};
      }

      if(launchData[year][month][day] == null) {
        launchData[year][month][day] = [];
      }

      launchData[year][month][day].push(entry);
    });
  });

}

// Loads launch site data from csv, storing entries in `launch_sites`
function loadLaunchSites() {
  d3.csv("data/launch_sites.csv", function(err, sites) {
    sites.forEach(function(i){
      launch_sites.push(i);
    });
  });
}

// Adds points for the launches of a given day to the display
// list, after clearing the previous display
function displayDate(year, month, day) {
  var entries = [];

  // Loads launches from current day's launch data
  if(launchData[year] && launchData[year][month] && launchData[year][month][day]) {
    entries = launchData[year][month][day];
  }

  // Right now this clears the points completely
  // Later we Май change it to not clear, and just allow
  // the animation to continue
  currentLaunches = [];

  for(var i=0; i <entries.length; i++) {
    
    // If there are filter tags, applies the filter
    if (currentTags.length > 0)
    {
      for (var tagNo = 0; tagNo < currentTags.length; tagNo++)
      {
        var tag = currentTags[tagNo];
        // Add if we have a tag match
        if (entries[i]['Tag'] === tag)
        {
          currentLaunches.push(
            { birthtime: (new Date()).getTime(),
              info: entries[i] } );
		  addEntryToLaunchLog(entries[i]);
        }
      }
    }
    else
    {
      // Just add, since we're not checking tags
      currentLaunches.push(
        { birthtime: (new Date()).getTime(),
          info: entries[i] } );
	  addEntryToLaunchLog(entries[i]);
    }
  }

  updateSliderPositionAndCurrentDate();
  redrawLaunchesOnly();
  // updateLaunchSiteOpacities();
}

function addEntryToLaunchLog(entry){
	 // Add this entry to the text-based launch log
	 var textToAdd = getLaunchInfo(entry);
	 var launchLogText = $('#launchLogText');
	 var currentText = launchLogText.html();
	 launchLogText.html(currentText + textToAdd);
	 // Adjust scroll height to stay at the bottom
	 var launchLogBox = $('#launchInfoBoxAndScrollbar');

   // This value is hard-coded based on current styling and I'm not proud of it
   var scrollPoint = launchLogText.height() - 370;

	 launchLogBox.scrollTop(scrollPoint);
}

// For updating the window on the screen that displays information about launches
function getLaunchInfo(entry)
{
  var displayString = '<p>';

  // Add entry's data to the string
  var successColor = entry['Success'].trim() === 'S' ? 'green' : 'red';

  // Get a name string (include alternative name, if it's different)
  var nameString = entry["Official Payload Name"].trim();
  // if (entry["Official Payload Name"].trim() !== entry["Manufacturer's Payload Name"].trim())
  // {
  //   nameString += ' (a.k.a. ' + entry["Manufacturer's Payload Name"].trim() + ')';
  // }

  // For field properties
  var fpOpen = '<font color="#A0A0A0">';
  var fpClose = '</font>';
  displayString += '<font color="' + successColor + '">' + nameString + '</font><br>';
  displayString += 'Космодром: ' + fpOpen + entry['Launch Site (Full)'] + fpClose + '<br>';
  displayString += 'Дата: ' + fpOpen +entry['Launch Date and Time (UTC)'] + fpClose +'<br>';
  displayString += 'Ракета-носитель: ' + fpOpen + entry['Launch Vehicle'] + fpClose +'<br>';
  // displayString += 'Success/Failure: ' + entry['Success'] + fpClose +'<br>';
 
  // Only show COSPAR ID if we have one (some of the newer launch entries don't have that data yet)
  if (entry['COSPAR'])
  {
	displayString += 'COSPAR Номер: ' + fpOpen + entry['COSPAR'] + fpClose +'<br>';
  }
  else
  {
	  displayString += 'COSPAR Номер: ' + fpOpen + 'Not available' + fpClose +'<br>';
  }
  displayString += '</p>';

  return displayString;
}

function updateLaunchSiteOpacities()
{
  launchSites = d3.selectAll("#launchsite")[0];

  for (var i = 0; i < launchSites.length; i++)
  {
    var name = launchSites[i].getAttribute('name').trim();

    var siteActiveOpacity;
    if (isLaunchSiteActive(name))
    {
      siteActiveOpacity = 1.0;
    }
    else
    {
      siteActiveOpacity = 0.2;
    }
    // Change opacity
    launchSites[i].setAttribute('style', 'opacity: ' + siteActiveOpacity);
  }
}

// Starts playing a sequence of launches at a specified interval
function play()
{
  isPlaying = true;
  playTick();
}

// Pauses playing of launch sequences
function pause() {
  isPlaying = false;
  clearTimeout(playTickRepeatTimeout);
}

// Plays the sequence of all launches starting at the left slider position
// and ending at the right slider position. This function will loop
// indefinitely, until the right slider position is reached
function playTick()
{
  // Stop playing if we're at the right slider position
  if (currentPlayPoint >= currentPlayLimit)
  {
    pause();
    resetPlayButton();
    currentPlayPoint = initialvalues[0];
  }

  if (isPlaying)
  {
    // Increment date
    currentPlayPoint += 1.0 / 365.25;
    var currentDate = convertДекimalDate(currentPlayPoint);

    // Update displayed launches (getMonth() returns a value from 0 to 11, so we increment it)
    displayDate(currentDate.getFullYear(), currentDate.getMonth()+1, currentDate.getDate());
    $('#current_play_date').html(formatDate(currentDate));
		updateSliderPositionAndCurrentDate();
    // This function will be called again in {playSpeed} ms
    playTickRepeatTimeout = setTimeout(playTick, playSpeed);
  }
}

function drawPlayBar() {
  var svg = d3.select("#slider").append("svg")
    .attr("id", "playBar")
    .attr("height", "50px")
    .attr("width", playBarWidth + "px")
    .style("position", "absolute")
    .style("top", "-18px")
    .style("left", "-" + playBarWidth/2 + "px");
        
  var rect = svg.append("rect")
    .attr("id", "playBarRect")
    .attr("height", "50px")
    .attr("width", playBarWidth + "px")
    .attr("fill", "black");
}

function updateSliderPositionAndCurrentDate() {
  var currentDate = convertДекimalDate(currentPlayPoint);
  $('#current_play_date').html(formatDate(currentDate));
  time_slider.value(currentPlayPoint);
  updateLaunchSiteOpacities();
}
