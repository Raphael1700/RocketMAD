/* global showAllZoomLevel getS2CellBounds processWeather processWeatherAlerts getIvsPercentageCssColor getPokemonGen getPokemonRawIconUrl timestampToTime timestampToDateTime */

//
// Global map.js variables
//

var $selectNotifyRaidPokemon
var $selectNotifyEggs
var $selectNotifyInvasions
var $selectStyle
var $selectSearchIconMarker
var $selectLocationIconMarker
var $gymNameFilter = ''
var $pokestopNameFilter = ''

var searchMarkerStyles

var settings = {
    showPokemon: null,
    excludedPokemon: null,
    showPokemonValues: null,
    filterValues: null,
    noFilterValuesPokemon: null,
    minIvs: null,
    maxIvs: null,
    showZeroIvsPokemon: null,
    minLevel: null,
    maxLevel: null,
    scaleByRarity: null,
    pokemonNotifications: null,
    notifyPokemon: null,
    filterNotifyValues: null,
    noFilterValuesNotifyPokemon: null,
    notifyZeroIvsPokemon: null,
    notifyHundoIvsPokemon: null,
    minNotifyIvs: null,
    maxNotifyIvs: null,
    minNotifyLevel: null,
    maxNotifyLevel: null,
    notifyTinyRattata: null,
    notifyBigMagikarp: null,
    useGymSidebar: null,
    showGyms: null,
    includedGymTeams: null,
    minGymLevel: null,
    maxGymLevel: null,
    showOpenSpotGymsOnly: null,
    showExGymsOnly: null,
    showInBattleGymsOnly: null,
    gymLastScannedHours: null,
    showRaids: null,
    excludedRaidPokemon: null,
    showActiveRaidsOnly: null,
    showExEligibleRaidsOnly: null,
    includedRaidLevels: null,
    showPokestops: null,
    showPokestopsNoEvent: null,
    showQuests: null,
    excludedQuestPokemon: null,
    excludedQuestItems: null,
    showInvasions: null,
    showLures: null,
    includedLureTypes: null,
    excludedInvasions: null,
    showWeather: null,
    showWeatherCells: null,
    showMainWeather: null,
    showSpawnpoints: null,
    showScannedLocations: null,
    showExParks: null,
    showNestParks: null,
    showS2Cells: null,
    showS2CellsLevel10: null,
    showS2CellsLevel13: null,
    showS2CellsLevel14: null,
    showS2CellsLevel17: null,
    warnHiddenS2Cells: null,
    showRanges: null,
    includedRangeTypes: null,
    startAtUserLocation: null,
    startAtLastLocation: null,
    isStartLocationMarkerMovable: null,
    followUserLocation: null
}

var timestamp
var reincludedPokemon = []
var excludedPokemonByRarity = []

var notifyPokemon = []
var notifyRaidPokemon = []
var notifyEggs = []
var notifyInvasions = []

var notifiedPokemonData = {}
var notifiedGymData = {}
var notifiedPokestopData = {}

var luredPokestopIds = new Set()
var invadedPokestopIds = new Set()
var raidIds = new Set()
var upcomingRaidIds = new Set() // Contains only raids with known raid boss.

// var map
var mapData = {
    pokemons: {},
    gyms: {},
    pokestops: {},
    lurePokemons: {},
    weather: {},
    scannedLocs: {},
    spawnpoints: {},
    exParks: [],
    nestParks: []
}
var rawDataIsLoading = false
var startLocationMarker
var userLocationMarker
var followUserHandle
const gymRangeColors = ['#999999', '#0051CF', '#FF260E', '#FECC23'] // 'Uncontested', 'Mystic', 'Valor', 'Instinct'

var oSwLat
var oSwLng
var oNeLat
var oNeLng

var lastpokemon
var lastgyms
var lastpokestops
var lastspawns
var lastscannedlocs
var lastweather

var map
var markers
var markersNoCluster
var _oldlayer = 'stylemapnik'

var nestParksLayerGroup
var exParksLayerGroup
var s2CellsLayerGroup
var rangesLayerGroup

// Z-index values for various markers.
const userLocationMarkerZIndex = 0
const pokestopZIndex = 0
const gymZIndex = 1000
const pokemonZIndex = 2000
const pokemonUncommonZIndex = 3000
const pokemonRareZIndex = 4000
const pokestopQuestZIndex = 5000
const gymEggZIndex = 6000
const pokestopLureZIndex = 7000
const pokestopInvasionZIndex = 8000
const gymRaidBossZIndex = 9000
const pokemonVeryRareZIndex = 10000
const pokemonUltraRareZIndex = 11000
const pokemonNewSpawnZIndex = 120000
const pokestopNotifiedZIndex = 13000
const gymNotifiedZIndex = 14000
const pokemonNotifiedZIndex = 15000
const startLocationMarkerZIndex = 20000 // Highest value so it doesn't get stuck behind other markers.

var selectedStyle = 'stylemapnik'

var updateWorker
var lastUpdateTime
var redrawTimeout = null

const gymTypes = ['Uncontested', 'Mystic', 'Valor', 'Instinct']

const audio = new Audio('static/sounds/ding.mp3')
const cryFileTypes = ['wav', 'mp3']

// FontAwesome gender classes.
const genderClasses = ['fa-mars', 'fa-venus', 'fa-neuter']

const ActiveFortModifierEnum = Object.freeze({'normal':501, 'glacial':502, 'mossy':503, 'magnetic':504})

const lureTypes = {
    501: 'Normal',
    502: 'Glacial',
    503: 'Mossy',
    504: 'Magnetic'
}

const raidEggImages = {
    1: 'egg_normal.png',
    2: 'egg_normal.png',
    3: 'egg_rare.png',
    4: 'egg_rare.png',
    5: 'egg_legendary.png'
}

//
// Functions
//

function isShowAllZoom() {
    return serverSettings.showAllZoomLevel > 0 && map.getZoom() >= serverSettings.showAllZoomLevel
}

function loadSettingsFile(file) { // eslint-disable-line no-unused-vars
    var reader = new FileReader()
    reader.onload = function () {
        //Object.assign(localStorage, JSON.parse(reader.result))
    }
    reader.readAsText(file.target.files[0])
    window.location.reload()
}

function loadData(file, onLoad, onError) {
    var reader = new FileReader()
    reader.readAsText(file)
    reader.onload = onLoad
    reader.onerror = onError
}

function downloadData(fileName, data) {
    var a = document.createElement('a')
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data))
    a.setAttribute('download', fileName + '_' + moment().format('DD-MM-YYYY HH:mm'))
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

function initMap() { // eslint-disable-line no-unused-vars
    initSettings()

    // URL query parameters.
    const paramLat = Number(getParameterByName('lat'))
    const paramLng = Number(getParameterByName('lon'))
    const paramZoom = Number(getParameterByName('zoom'))

    if (settings.startAtLastLocation) {
        var position = Store.get('startAtLastLocationPosition')
        var lat = position.lat
        var lng = position.lng
    } else {
        position = Store.get('startLocationPosition')
        const useStartLocation = 'lat' in position && 'lng' in position
        lat = useStartLocation ? position.lat : serverSettings.centerLat
        lng = useStartLocation ? position.lng : serverSettings.centerLng
    }

    map = L.map('map', {
        center: [paramLat || lat, paramLng || lng],
        zoom: paramZoom || Store.get('zoomLevel'),
        minZoom: serverSettings.maxZoomLevel,
        maxZoom: 18,
        zoomControl: false,
        preferCanvas: true
    })

    setTitleLayer(Store.get('map_style'))

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map)

    if (hasLocationSupport()) {
        createUserLocationButton()
    }

    map.addControl(new L.Control.Fullscreen({
        position: 'topright'
    }))

    var GeoSearchControl = window.GeoSearch.GeoSearchControl
    var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider
    var provider = new OpenStreetMapProvider()
    const search = new GeoSearchControl({
        provider: provider,
        position: 'topright',
        autoClose: true,
        keepResult: false,
        showMarker: false
    })
    map.addControl(search)

    map.on('geosearch/showlocation', function (e) {
        changeLocation(e.location.y, e.location.x)
    })

    map.on('moveend', function () {
        updateMainS2CellId()
        updateWeatherButton()
        updateAllParks()
        updateS2Overlay()

        const position = map.getCenter()
        Store.set('startAtLastLocationPosition', {
            lat: position.lat,
            lng: position.lng
        })
    })

    map.on('zoom', function () {
        Store.set('zoomLevel', map.getZoom())
    })

    map.on('zoomend', function () {
        if (settings.showRanges) {
            if (map.getZoom() > serverSettings.clusterZoomLevel) {
                if (!map.hasLayer(rangesLayerGroup)) {
                    map.addLayer(rangesLayerGroup)
                }
            } else {
                if (map.hasLayer(rangesLayerGroup)) {
                    map.removeLayer(rangesLayerGroup)
                }
            }
        }

        if ($('#stats').hasClass('visible')) {
            countMarkers(map)
        }
    })

    markers = L.markerClusterGroup({
        disableClusteringAtZoom: serverSettings.clusterZoomLevel + 1,
        maxClusterRadius: serverSettings.maxClusterRadius,
        spiderfyOnMaxZoom: serverSettings.spiderfyClusters
    }).addTo(map)
    markersNoCluster = L.layerGroup().addTo(map)

    if (serverSettings.nestParks) {
        nestParksLayerGroup = L.layerGroup().addTo(map)
    }
    if (serverSettings.exParks) {
        exParksLayerGroup = L.layerGroup().addTo(map)
    }
    if (serverSettings.s2Cells) {
        s2CellsLayerGroup = L.layerGroup().addTo(map)
    }
    if (serverSettings.ranges) {
        rangesLayerGroup = L.layerGroup()
        if (map.getZoom() > serverSettings.clusterZoomLevel) {
            map.addLayer(rangesLayerGroup)
        }
    }

    startLocationMarker = createStartLocationMarker()
    if (hasLocationSupport()) {
        userLocationMarker = createUserLocationMarker()
    }

    if (settings.startAtUserLocation && !paramLat && !paramLng) {
        centerMapOnUserLocation()
    }

    if (settings.followUserLocation) {
        startFollowingUser()
    }

    updateMainS2CellId()
    getAllParks()
    updateS2Overlay()

    initPushJS()
    if (Push._agents.chrome.isSupported()) {
        createServiceWorkerReceiver()
    }

    if (serverSettings.rarity) {
        updatePokemonRarities(serverSettings.rarityFileName, function () {
            updateMap()
        })
    } else {
        updateMap()
    }

    initI8lnDictionary(function () {
        initPokemonData(function () {
            initPokemonFilters()
        })
    })

    initMoveData(function () {})

    if (serverSettings.quests) {
        initItemData(function () {
            initItemFilters()
        })
    }

    if (serverSettings.invasions) {
        initInvasionData(function () {
            initInvasionFilters()
        })
    }

    // Initialize materialize components.
    $('.dropdown-trigger').dropdown({
      constrainWidth: false,
      coverTrigger: false
    })
    $('.sidenav').sidenav({
        draggable: false
    })
    $('.collapsible').collapsible()
    $('.tabs').tabs()
    $('.modal').modal()
    $('#weather-modal').modal({
        onOpenStart: function () {
            setupWeatherModal()
        }
    })
    $('#quest-filter-modal').modal({
        onOpenEnd: function () {
            $('#quest-filter-tabs').tabs('updateTabIndicator')
        }
    })
    $('.tooltipped').tooltip()

    initSidebar()
    initBackupModals()
}

/* eslint-disable no-unused-vars */
var stylemapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'})
var styletopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'})
var stylesatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'})
var stylewikimedia = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>'})
var stylecartodbdarkmatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'})
var stylecartodbdarkmatternolabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'})
var stylecartodbpositron = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'})
var stylecartodbpositronnolabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'})
var stylecartodbvoyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'})
/* eslint-enable no-unused-vars */

function setTitleLayer(layername) {
    // fallback in case layername does not exist (anymore)
    if (!window.hasOwnProperty(layername)) {
        layername = 'stylemapnik'
    }

    if (map.hasLayer(window[_oldlayer])) { map.removeLayer(window[_oldlayer]) }
    map.addLayer(window[layername])
    _oldlayer = layername
}

function createStartLocationMarker() {
    const pos = Store.get('startLocationPosition')
    const useStoredPosition = 'lat' in pos && 'lng' in pos
    const lat = useStoredPosition ? pos.lat : serverSettings.centerLat
    const lng = useStoredPosition ? pos.lng : serverSettings.centerLng

    var marker = L.marker([lat, lng], {draggable: settings.isStartLocationMarkerMovable}).addTo(markersNoCluster)
    marker.bindPopup(`<div><b>${i8ln('Start location')}</b></div>`)
    marker.setZIndexOffset(startLocationMarkerZIndex)
    addListeners(marker)

    marker.on('dragend', function () {
        var newLocation = marker.getLatLng()
        Store.set('startLocationPosition', {
            lat: newLocation.lat,
            lng: newLocation.lng
        })
    })

    return marker
}

function updateStartLocationMarker(style) {
    if (style in searchMarkerStyles) {
        Store.set('searchMarkerStyle', style)

        // If it's disabled, stop.
        if (!startLocationMarker) {
            return
        }

        var url = searchMarkerStyles[style].icon
        if (url) {
            var startIcon = L.icon({
                iconUrl: url,
                iconSize: [24, 24]
            })
            startLocationMarker.setIcon(startIcon)
        }
    }

    return startLocationMarker
}

function createUserLocationMarker() {
    const pos = Store.get('lastUserLocation')
    const useStoredPosition = 'lat' in pos && 'lng' in pos
    const lat = useStoredPosition ? pos.lat : serverSettings.centerLat
    const lng = useStoredPosition ? pos.lng : serverSettings.centerLng

    var marker = L.marker([lat, lng]).addTo(markersNoCluster)
    marker.bindPopup(`<div><b>${i8ln('My location')}</b></div>`)
    marker.setZIndexOffset(userLocationMarkerZIndex)
    addListeners(marker)

    return marker
}

function updateUserLocationMarker(style) {
    // Don't do anything if it's disabled.
    if (!userLocationMarker) {
        return
    }
    var locationIcon
    if (style in searchMarkerStyles) {
        var url = searchMarkerStyles[style].icon
        if (url) {
            locationIcon = L.icon({
                iconUrl: url,
                iconSize: [24, 24]
            })
            userLocationMarker.setIcon(locationIcon)
        }
        Store.set('locationMarkerStyle', style)
    }
    // Return value is currently unused.
    return userLocationMarker
}

function initSettings() {
    settings.showPokemon = serverSettings.pokemons && Store.get('showPokemon')
    settings.excludedPokemon = serverSettings.pokemons ? Store.get('excludedPokemon') : []
    settings.pokemonNotifications = serverSettings.pokemons && Store.get('pokemonNotifications')
    if (serverSettings.pokemons) {
        settings.showPokemonValues = serverSettings.pokemonValues && Store.get('showPokemonValues')
        settings.notifyPokemon = Store.get('notifyPokemon')
    }
    if (serverSettings.pokemonValues) {
        settings.filterValues = Store.get('filterValues')
        settings.noFilterValuesPokemon = Store.get('noFilterValuesPokemon')
        settings.minIvs = Store.get('minIvs')
        settings.maxIvs = Store.get('maxIvs')
        settings.showZeroIvsPokemon = Store.get('showZeroIvsPokemon')
        settings.minLevel = Store.get('minLevel')
        settings.maxLevel = Store.get('maxLevel')
        settings.filterNotifyValues = Store.get('filterNotifyValues')
        settings.noFilterValuesNotifyPokemon = Store.get('noFilterValuesNotifyPokemon')
        settings.notifyZeroIvsPokemon = Store.get('notifyZeroIvsPokemon')
        settings.notifyHundoIvsPokemon = Store.get('notifyHundoIvsPokemon')
        settings.minNotifyIvs = Store.get('minNotifyIvs')
        settings.maxNotifyIvs = Store.get('maxNotifyIvs')
        settings.minNotifyLevel = Store.get('minNotifyLevel')
        settings.maxNotifyLevel = Store.get('maxNotifyLevel')
        settings.notifyTinyRattata = Store.get('notifyTinyRattata')
        settings.notifyBigMagikarp = Store.get('notifyBigMagikarp')
    }
    if (serverSettings.rarity) {
        settings.includedRarities = Store.get('includedRarities')
        settings.scaleByRarity = serverSettings.rarity && Store.get('scaleByRarity')
    }

    settings.showGyms = serverSettings.gyms && Store.get('showGyms')
    settings.useGymSidebar = serverSettings.gymSidebar && Store.get('useGymSidebar')
    if (serverSettings.gymFilters) {
        settings.includedGymTeams = Store.get('includedGymTeams')
        settings.minGymLevel = Store.get('minGymLevel')
        settings.maxGymLevel = Store.get('maxGymLevel')
        settings.showOpenSpotGymsOnly = Store.get('showOpenSpotGymsOnly')
        settings.showExGymsOnly = Store.get('showExGymsOnly')
        settings.showInBattleGymsOnly = Store.get('showInBattleGymsOnly')
        settings.gymLastScannedHours = Store.get('gymLastScannedHours')
    }
    settings.showRaids = serverSettings.raids && Store.get('showRaids')
    if (serverSettings.raidFilters) {
        settings.excludedRaidPokemon = Store.get('excludedRaidPokemon')
        settings.showActiveRaidsOnly = Store.get('showActiveRaidsOnly')
        settings.showExEligibleRaidsOnly = Store.get('showExEligibleRaidsOnly')
        settings.includedRaidLevels = Store.get('includedRaidLevels')
    }

    settings.showPokestops = serverSettings.pokestops && Store.get('showPokestops')
    if (serverSettings.pokestops) {
        settings.showPokestopsNoEvent = Store.get('showPokestopsNoEvent')
        settings.showQuests = serverSettings.quests && Store.get('showQuests')
        settings.showInvasions = serverSettings.invasions && Store.get('showInvasions')
        settings.showLures = serverSettings.lures && Store.get('showLures')
    }
    if (serverSettings.quests) {
        settings.excludedQuestPokemon = Store.get('excludedQuestPokemon')
        settings.excludedQuestItems = Store.get('excludedQuestItems')
    }
    if (serverSettings.invasions) {
        settings.excludedInvasions = Store.get('excludedInvasions')
    }
    if (serverSettings.lures) {
        settings.includedLureTypes = Store.get('includedLureTypes')
    }

    settings.showWeather = serverSettings.weather && Store.get('showWeather')
    if (serverSettings.weather) {
        settings.showMainWeather = Store.get('showMainWeather')
        settings.showWeatherCells = Store.get('showWeatherCells')
    }

    settings.showSpawnpoints = serverSettings.spawnpoints && Store.get('showSpawnpoints')
    settings.showScannedLocations = serverSettings.scannedLocs && Store.get('showScannedLocations')

    settings.showNestParks = serverSettings.nestParks && Store.get('showNestParks')
    settings.showExParks = serverSettings.exParks && Store.get('showExParks')

    settings.showS2Cells = serverSettings.s2Cells && Store.get('showS2Cells')
    if (serverSettings.s2Cells) {
        settings.showS2CellsLevel10 = Store.get('showS2CellsLevel10')
        settings.showS2CellsLevel13 = Store.get('showS2CellsLevel13')
        settings.showS2CellsLevel14 = Store.get('showS2CellsLevel14')
        settings.showS2CellsLevel17 = Store.get('showS2CellsLevel17')
        settings.warnHiddenS2Cells = Store.get('warnHiddenS2Cells')
    }

    settings.showRanges = serverSettings.ranges && Store.get('showRanges')
    if (serverSettings.ranges) {
        settings.includedRangeTypes = Store.get('includedRangeTypes')
    }

    settings.startAtUserLocation = hasLocationSupport() && Store.get('startAtUserLocation')
    settings.startAtLastLocation = Store.get('startAtLastLocation')
    settings.lockStartLocationMarker = serverSettings.lockStartMarker && Store.get('lockStartLocationMarker')
    settings.isStartLocationMarkerMovable = serverSettings.isStartMarkerMovable && Store.get('isStartLocationMarkerMovable')
    settings.followUserLocation = hasLocationSupport() && Store.get('followUserLocation')
}

function initSidebar() {
    // Setup UI element interactions.

    if (serverSettings.pokemons) {
        $('#pokemon-switch').on('change', function () {
            settings.showPokemon = this.checked
            const filtersWrapper = $('#pokemon-filters-wrapper')
            const filterButton = $('a[data-target="pokemon-filter-modal"]')
            if (this.checked) {
                filterButton.show()
                filtersWrapper.show()
                lastpokemon = false
                updateMap()
            } else {
                filterButton.hide()
                filtersWrapper.hide()
                updatePokemons()
            }
            Store.set('showPokemon', this.checked)
        })
    }

    if (serverSettings.pokemonValues) {
        $('#pokemon-values-switch').on('change', function () {
            settings.showPokemonValues = this.checked
            const filterValuesWrapper = $('#filter-pokemon-values-wrapper')
            if (this.checked) {
                filterValuesWrapper.show()
            } else {
                filterValuesWrapper.hide()
                if (settings.filterValues) {
                    lastpokemon = false
                    updateMap()
                }
            }
            updatePokemons()
            Store.set('showPokemonValues', this.checked)
        })

        $('#filter-values-switch').on('change', function () {
            settings.filterValues = this.checked
            const filtersWrapper = $('#pokemon-values-filters-wrapper')
            const filterButton = $('a[data-target="pokemon-values-filter-modal"]')
            if (this.checked) {
                filterButton.show()
                filtersWrapper.show()
                updatePokemons()
            } else {
                filterButton.hide()
                filtersWrapper.hide()
                lastpokemon = false
                updateMap()
            }
            Store.set('filterValues', this.checked)
        })

        var pokemonIvsSlider = document.getElementById('pokemon-ivs-slider')
        noUiSlider.create(pokemonIvsSlider, {
            start: [settings.minIvs, settings.maxIvs],
            connect: true,
            step: 1,
            range: {
                'min': 0,
                'max': 100
            },
            format: {
                to: function (value) {
                    return Math.round(value)
                },
                from: function (value) {
                    return Number(value)
                }
            }
        })
        pokemonIvsSlider.noUiSlider.on('change', function () {
            const oldMinIvs = settings.minIvs
            const oldMaxIvs = settings.maxIvs
            settings.minIvs = this.get()[0]
            settings.maxIvs = this.get()[1]

            $('#pokemon-ivs-slider-title').text(`IVs (${settings.minIvs}% - ${settings.maxIvs}%)`)
            const zeroIvsWrapper = $('#zero-ivs-pokemon-switch-wrapper')
            if (settings.minIvs > 0) {
                zeroIvsWrapper.show()
            } else {
                zeroIvsWrapper.hide()
            }

            if (settings.minIvs > oldMinIvs || settings.maxIvs < oldMaxIvs) {
                updatePokemons([], true)
            } else {
                lastpokemon = false
                updateMap()
            }

            Store.set('minIvs', settings.minIvs)
            Store.set('maxIvs', settings.maxIvs)
        })

        $('#zero-ivs-pokemon-switch').on('change', function () {
            settings.showZeroIvsPokemon = this.checked
            if (this.checked) {
                lastpokemon = false
                updateMap()
            } else {
                updatePokemons([], true)
            }
            Store.set('showZeroIvsPokemon', this.checked)
        })

        var pokemonLevelSlider = document.getElementById('pokemon-level-slider')
        noUiSlider.create(pokemonLevelSlider, {
            start: [settings.minLevel, settings.maxLevel],
            connect: true,
            step: 1,
            range: {
                'min': 1,
                'max': 35
            },
            format: {
                to: function (value) {
                    return Math.round(value)
                },
                from: function (value) {
                    return Number(value)
                }
            }
        })
        pokemonLevelSlider.noUiSlider.on('change', function () {
            const oldMinLevel = settings.minLevel
            const oldMaxLevel = settings.maxLevel
            settings.minLevel = this.get()[0]
            settings.maxLevel = this.get()[1]
            $('#pokemon-level-slider-title').text(`Levels (${settings.minLevel} - ${settings.maxLevel})`)

            if (settings.minLevel > oldMinLevel || settings.maxLevel < oldMaxLevel) {
                updatePokemons()
            } else {
                lastpokemon = false
                updateMap([], true)
            }

            Store.set('minLevel', settings.minLevel)
            Store.set('maxLevel', settings.maxLevel)
        })
    }

    if (serverSettings.rarity) {
        $('#rarity-select').on('change', function () {
            const oldIncludedRarities = settings.includedRarities
            settings.includedRarities = $(this).val().map(Number)
            reincludedPokemon = reincludedPokemon.concat(excludedPokemonByRarity)
            excludedPokemonByRarity = []
            if (settings.includedRarities.length < oldIncludedRarities.length) {
                updatePokemons()
            } else {
                // Don't set lastgyms to false since we add the reids to the request.
                updateMap()
            }
            Store.set('includedRarities', settings.includedRarities)
        })

        $('#scale-rarity-switch').on('change', function () {
            settings.scaleByRarity = this.checked
            updatePokemons()
            Store.set('scaleByRarity', this.checked)
        })
    }

    if (serverSettings.gyms) {
        $('#gym-switch').on('change', function () {
            settings.showGyms = this.checked
            const filtersWrapper = $('#gym-filters-wrapper')
            const nameFilterSidebarWrapper = $('#gym-name-filter-sidebar-wrapper')
            if (this.checked) {
                if (serverSettings.gymFilters) {
                    filtersWrapper.show()
                }
                if (!settings.showRaids) {
                    nameFilterSidebarWrapper.show()
                }
                lastgyms = false
                updateMap()
            } else {
                if (serverSettings.gymFilters) {
                    filtersWrapper.hide()
                }
                if (!settings.showRaids) {
                    nameFilterSidebarWrapper.hide()
                }
                updateGyms()
            }
            Store.set('showGyms', this.checked)
        })
    }

    if (serverSettings.gymSidebar) {
        $('#gym-sidebar-switch').on('change', function () {
            settings.useGymSidebar = this.checked
            updateGyms()
            /*lastgyms = false
            $.each(['gyms'], function (d, dType) {
                $.each(mapData[dType], function (key, value) {
                    // for any marker you're turning off, you'll want to wipe off the range
                    if (mapData[dType][key].marker.rangeCircle) {
                        markers.removeLayer(mapData[dType][key].marker.rangeCircle)
                        delete mapData[dType][key].marker.rangeCircle
                    }
                    markers.removeLayer(mapData[dType][key].marker)
                })
                mapData[dType] = {}
            })
            updateMap()*/
            Store.set('useGymSidebar', this.checked)
        })
    }

    if (serverSettings.gymFilters) {
        $('#gym-name-filter').on('keyup', function () {
            $gymNameFilter = this.value.match(/[.*+?^${}()|[\]\\]/g) ? this.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : this.value
            updateGyms()
            lastgyms = false
            updateMap()
        })

        $('#gym-team-select').on('change', function () {
            const oldIncludedGymTeams = settings.includedGymTeams
            settings.includedGymTeams = $(this).val().map(Number)
            if (settings.includedGymTeams.length < oldIncludedGymTeams.length) {
                updateGyms()
            } else {
                lastgyms = false
                updateMap()
            }
            Store.set('includedGymTeams', settings.includedGymTeams)
        })

        var gymLevelSlider = document.getElementById('gym-level-slider')
        noUiSlider.create(gymLevelSlider, {
            start: [settings.minGymLevel, settings.maxGymLevel],
            connect: true,
            step: 1,
            range: {
                'min': 0,
                'max': 6
            },
            format: {
                to: function (value) {
                    return Math.round(value)
                },
                from: function (value) {
                    return Number(value)
                }
            }
        })
        gymLevelSlider.noUiSlider.on('change', function () {
            const oldMinLevel = settings.minGymLevel
            const oldMaxLevel = settings.maxGymLevel
            settings.minGymLevel = this.get()[0]
            settings.maxGymLevel = this.get()[1]
            $('#gym-level-slider-title').text(`Gym levels (${settings.minGymLevel} - ${settings.maxGymLevel})`)

            if (settings.minGymLevel > oldMinLevel || settings.maxGymLevel < oldMaxLevel) {
                updateGyms()
            } else {
                lastgyms = false
                updateMap()
            }

            Store.set('minGymLevel', settings.minGymLevel)
            Store.set('maxGymLevel', settings.maxGymLevel)
        })

        $('#gym-open-spot-switch').on('change', function () {
            settings.showOpenSpotGymsOnly = this.checked
            if (this.checked) {
                updateGyms()
            } else {
                lastgyms = false
                updateMap()
            }
            Store.set('showOpenSpotGymsOnly', this.checked)
        })

        $('#gym-ex-eligible-switch').on('change', function () {
            settings.showExGymsOnly = this.checked
            if (this.checked) {
                updateGyms()
            } else {
                lastgyms = false
                updateMap()
            }
            Store.set('showExGymsOnly', this.checked)
        })

        $('#gym-in-battle-switch').on('change', function () {
            settings.showInBattleGymsOnly = this.checked
            if (this.checked) {
                updateGyms()
            } else {
                lastgyms = false
                updateMap()
            }
            Store.set('showInBattleGymsOnly', this.checked)
        })

        $('#gym-last-scanned-select').on('change', function () {
            const oldGymLastScannedHours = settings.gymLastScannedHours
            settings.gymLastScannedHours = this.value
            if ((settings.gymLastScannedHours < oldGymLastScannedHours && !settings.gymLastScannedHours === 0)
                    || oldGymLastScannedHours === 0) {
                updateGyms()
            } else {
                lastgyms = false
                updateMap()
            }
            Store.set('gymLastScannedHours', this.value)
        })
    }

    if (serverSettings.raids) {
        $('#raid-switch').on('change', function () {
            settings.showRaids = this.checked
            const filtersWrapper = $('#raid-filters-wrapper')
            const nameFilterSidebarWrapper = $('#gym-name-filter-sidebar-wrapper')
            const filterButton = $('a[data-target="raid-pokemon-filter-modal"]')
            if (this.checked) {
                if (serverSettings.raidFilters) {
                    filtersWrapper.show()
                    filterButton.show()
                }
                if (!settings.showGyms) {
                    nameFilterSidebarWrapper.show()
                }
                if (settings.showGyms) {
                    updateGyms()
                }
                lastgyms = false
                updateMap()
            } else {
                if (serverSettings.raidFilters) {
                    filtersWrapper.hide()
                    filterButton.hide()
                }
                if (!settings.showGyms) {
                    nameFilterSidebarWrapper.hide()
                }
                updateGyms()
            }
            Store.set('showRaids', this.checked)
        })
    }

    if (serverSettings.raidFilters) {
        $('#raid-active-switch').on('change', function () {
            settings.showActiveRaidsOnly = this.checked
            if (this.checked) {
                updateGyms()
            } else {
                if (settings.showGyms) {
                    updateGyms()
                }
                lastgyms = false
                updateMap()
            }
            Store.set('showActiveRaidsOnly', this.checked)
        })

        $('#raid-ex-eligible-switch').on('change', function () {
            settings.showExEligibleRaidsOnly = this.checked
            if (this.checked) {
                updateGyms()
            } else {
                if (settings.showGyms) {
                    updateGyms()
                }
                lastgyms = false
                updateMap()
            }
            Store.set('showExEligibleRaidsOnly', this.checked)
        })

        $('#raid-level-select').on('change', function () {
            const oldIncludedRaidLevels = settings.includedRaidLevels
            settings.includedRaidLevels = $(this).val().map(Number)
            if (settings.includedRaidLevels.length < oldIncludedRaidLevels.length) {
                updateGyms()
            } else {
                if (settings.showGyms) {
                    updateGyms()
                }
                lastgyms = false
                updateMap()
            }
            Store.set('includedRaidLevels', settings.includedRaidLevels)
        })
    }

    if (serverSettings.pokestops) {
        $('#pokestop-switch').on('change', function () {
            settings.showPokestops = this.checked
            const filtersWrapper = $('#pokestop-filters-wrapper')
            if (this.checked) {
                filtersWrapper.show()
                lastpokestops = false
                updateMap()
            } else {
                filtersWrapper.hide()
                updatePokestops()
            }
            Store.set('showPokestops', this.checked)
        })

        $('#pokestop-no-event-switch').on('change', function () {
            settings.showPokestopsNoEvent = this.checked
            if (this.checked) {
                lastpokestops = false
                updateMap()
            } else {
                updatePokestops()
            }
            Store.set('showPokestopsNoEvent', this.checked)
        })

        $('#pokestop-name-filter').on('keyup', function () {
            $pokestopNameFilter = this.value.match(/[.*+?^${}()|[\]\\]/g) ? this.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : this.value
            updatePokestops()
            lastpokestops = false
            updateMap()
        })
    }

    if (serverSettings.quests) {
        $('#quest-switch').on('change', function () {
            settings.showQuests = this.checked
            var filterButton = $('a[data-target="quest-filter-modal"]')
            if (this.checked) {
                filterButton.show()
            } else {
                filterButton.hide()
            }
            updatePokestops()
            lastpokestops = false
            updateMap()
            Store.set('showQuests', this.checked)
        })
    }

    if (serverSettings.invasions) {
        $('#invasion-switch').on('change', function () {
            settings.showInvasions = this.checked
            var filterButton = $('a[data-target="invasion-filter-modal"]')
            if (this.checked) {
                filterButton.show()
            } else {
                filterButton.hide()
            }
            updatePokestops()
            lastpokestops = false
            updateMap()
            Store.set('showInvasions', this.checked)
        })
    }

    if (serverSettings.lures) {
        $('#lure-switch').on('change', function () {
            settings.showLures = this.checked
            const lureTypeWrapper = $('#lure-type-select-wrapper')
            if (this.checked) {
                lureTypeWrapper.show()
            } else {
                lureTypeWrapper.hide()
            }
            updatePokestops()
            lastpokestops = false
            updateMap()
            Store.set('showLures', this.checked)
        })

        $('#lure-type-select').on('change', function () {
            settings.includedLureTypes = $(this).val().map(Number)
            updateGyms()
            lastpokestops = false
            updateMap()
            Store.set('includedLureTypes', settings.includedLureTypes)
        })
    }

    if (serverSettings.weather) {
        $('#weather-switch').on('change', function () {
            settings.showWeather = this.checked
            const formsWrapper = $('#weather-forms-wrapper')
            if (this.checked) {
                formsWrapper.show()
                lastweather = false
                updateMap()
            } else {
                formsWrapper.hide()
                updateWeathers()
                if (settings.showMainWeather) {
                    $('#weather-button').hide()
                }
            }
            Store.set('showWeather', this.checked)
        })

        $('#main-weather-switch').on('change', function () {
            settings.showMainWeather = this.checked
            if (this.checked) {
                updateWeatherButton()
            } else {
                $('#weather-button').hide()
            }
            Store.set('showMainWeather', this.checked)
        })

        $('#weather-cells-switch').on('change', function () {
            settings.showWeatherCells = this.checked
            updateWeathers()
            Store.set('showWeatherCells', this.checked)
        })
    }

    if (serverSettings.spawnpoints) {
        $('#spawnpoint-switch').on('change', function () {
            settings.showSpawnpoints = this.checked
            if (this.checked) {
                lastspawns = false
                updateMap()
            } else {
                updateSpawnpoints()
            }
            Store.set('showSpawnpoints', this.checked)
        })
    }

    if (serverSettings.scannedLocs) {
        $('#scanned-locs-switch').on('change', function () {
            settings.showScannedLocations = this.checked
            if (this.checked) {
                lastscannedlocs = false
                updateMap()
            } else {
                updateScannedLocations()
            }
            Store.set('showScannedLocations', this.checked)
        })
    }

    if (serverSettings.nestParks) {
        $('#nest-park-switch').on('change', function () {
            settings.showNestParks = this.checked
            if (this.checked) {
                updateNestParks()
            } else {
                nestParksLayerGroup.clearLayers()
            }
            Store.set('showNestParks', this.checked)
        })
    }

    if (serverSettings.exParks) {
        $('#ex-park-switch').on('change', function () {
            settings.showExParks = this.checked
            if (this.checked) {
                updateExParks()
            } else {
                exParksLayerGroup.clearLayers()
            }
            Store.set('showExParks', this.checked)
        })
    }

    if (serverSettings.s2Cells) {
        $('#s2-cell-switch').on('change', function () {
            settings.showS2Cells = this.checked
            const filtersWrapper = $('#s2-filters-wrapper')
            if (this.checked) {
                filtersWrapper.show()
                updateS2Overlay()
            } else {
                filtersWrapper.hide()
                s2CellsLayerGroup.clearLayers()
            }
            Store.set('showS2Cells', this.checked)
        })

        $('#s2-level10-switch').on('change', function () {
            settings.showS2CellsLevel10 = this.checked
            updateS2Overlay()
            Store.set('showS2CellsLevel10', this.checked)
        })

        $('#s2-level13-switch').on('change', function () {
            settings.showS2CellsLevel13 = this.checked
            updateS2Overlay()
            Store.set('showS2CellsLevel13', this.checked)
        })

        $('#s2-level14-switch').on('change', function () {
            settings.showS2CellsLevel14 = this.checked
            updateS2Overlay()
            Store.set('showS2CellsLevel14', this.checked)
        })

        $('#s2-level17-switch').on('change', function () {
            settings.showS2CellsLevel17 = this.checked
            updateS2Overlay()
            Store.set('showS2CellsLevel17', this.checked)
        })

        $('#s2-cells-warning-switch').on('change', function () {
            settings.warnHiddenS2Cells = this.checked
            Store.set('warnHiddenS2Cells', this.checked)
        })
    }

    if (serverSettings.ranges) {
        $('#ranges-switch').on('change', function () {
            settings.showRanges = this.checked
            const rangeTypeWrapper = $('#range-type-select-wrapper')
            if (this.checked) {
                rangeTypeWrapper.show()
            } else {
                rangeTypeWrapper.hide()
            }
            if (settings.includedRangeTypes.includes(1)) {
                updatePokemons()
            }
            if (settings.includedRangeTypes.includes(2)) {
                updateGyms()
            }
            if (settings.includedRangeTypes.includes(3)) {
                updatePokestops()
            }
            if (settings.includedRangeTypes.includes(4)) {
                updateSpawnpoints()
            }
            Store.set('showRanges', this.checked)
        })

        $('#range-type-select').on('change', function () {
            const oldIncludedRangeTypes = settings.includedRangeTypes
            settings.includedRangeTypes = $(this).val().map(Number)
            if (settings.includedRangeTypes.includes(1) !== oldIncludedRangeTypes.includes(1)) {
                updatePokemons()
            } else if (settings.includedRangeTypes.includes(2) !== oldIncludedRangeTypes.includes(2)) {
                updateGyms()
            } else if (settings.includedRangeTypes.includes(3) !== oldIncludedRangeTypes.includes(3)) {
                updatePokestops()
            } else if (settings.includedRangeTypes.includes(4) !== oldIncludedRangeTypes.includes(4)) {
                updateSpawnpoints()
            }
            Store.set('includedRangeTypes', settings.includedRangeTypes)
        })
    }

    if (hasLocationSupport()) {
        $('#start-at-user-location-switch').on('change', function () {
            settings.startAtUserLocation = this.checked
            if (settings.startAtLastLocation && this.checked) {
                $('#start-at-last-location-switch').prop('checked', false)
                settings.startAtLastLocation = false
                Store.set('startAtLastLocation', false)
            }
            Store.set('startAtUserLocation', this.checked)
        })
    } else {
        $('#start-at-user-location-wrapper').hide()
    }

    $('#start-at-last-location-switch').on('change', function () {
        settings.startAtLastLocation = this.checked
        if (this.checked) {
            if (settings.startAtUserLocation) {
                $('#start-at-user-location-switch').prop('checked', false)
                settings.startAtUserLocation = false
                Store.set('startAtUserLocation', false)
            }

            const position = map.getCenter()
            Store.set('startAtLastLocationPosition', {
                lat: position.lat,
                lng: position.lng
            })
        }
        Store.set('startAtLastLocation', this.checked)
    })

    if (serverSettings.isStartMarkerMovable) {
        $('#lock-start-marker-switch').on('change', function () {
            settings.isStartLocationMarkerMovable = !this.checked
            if (startLocationMarker) {
                if (this.checked) {
                    startLocationMarker.dragging.disable()
                } else {
                    startLocationMarker.dragging.enable()
                }
            }
            Store.set('isStartLocationMarkerMovable', !this.checked)
        })
    }

    if (hasLocationSupport()) {
        $('#follow-user-location-switch').on('change', function () {
            settings.followUserLocation = this.checked
            if (this.checked) {
                startFollowingUser()
            } else {
                stopFollowingUser()
            }
            Store.set('followUserLocation', this.checked)
        })
    } else {
        $('#follow-user-location-wrapper').hide()
    }

    if (serverSettings.pokemons) {
        $('#pokemon-notifications-switch').on('change', function () {
            settings.pokemonNotifications = this.checked
            var wrapper = $('#pokemon-notification-filters-wrapper')
            const filterButton = $('a[data-target="notify-pokemon-filter-modal"]')
            if (this.checked) {
                wrapper.show()
                filterButton.show()
            } else {
                wrapper.hide()
                filterButton.hide()
                if (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways) {
                    lastpokemon = false
                    updateMap()
                }
            }
            updatePokemons()
            Store.set('pokemonNotifications', this.checked)
        })
    }

    if (serverSettings.pokemonValues) {
        $('#pokemon-values-notifications-switch').on('change', function () {
            settings.filterNotifyValues = this.checked
            var wrapper = $('#pokemon-values-notification-filters-wrapper')
            const filterButton = $('a[data-target="notify-pokemon-values-filter-modal"]')
            if (this.checked) {
                wrapper.show()
                filterButton.show()
            } else {
                wrapper.hide()
                filterButton.hide()
                if (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways) {
                    lastpokemon = false
                    updateMap()
                }
            }
            updatePokemons()
            Store.set('filterNotifyValues', this.checked)
        })

        $('#zero-ivs-notify-pokemon-switch').on('change', function () {
            settings.notifyZeroIvsPokemon = this.checked
            if (this.checked && (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways)) {
                lastpokemon = false
                updateMap()
            }
            updatePokemons([], true)
            Store.set('notifyZeroIvsPokemon', this.checked)
        })

        $('#hundo-ivs-notify-pokemon-switch').on('change', function () {
            settings.notifyHundoIvsPokemon = this.checked
            if (this.checked && (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways)) {
                lastpokemon = false
                updateMap()
            }
            updatePokemons([], true)
            Store.set('notifyHundoIvsPokemon', this.checked)
        })

        var notifyPokemonIvsSlider = document.getElementById('notify-pokemon-ivs-slider')
        noUiSlider.create(notifyPokemonIvsSlider, {
            start: [settings.minNotifyIvs, settings.maxNotifyIvs],
            connect: true,
            step: 1,
            range: {
                'min': 0,
                'max': 100
            },
            format: {
                to: function (value) {
                    return Math.round(value)
                },
                from: function (value) {
                    return Number(value)
                }
            }
        })
        notifyPokemonIvsSlider.noUiSlider.on('change', function () {
            const oldMinIvs = settings.minNotifyIvs
            const oldMaxIvs = settings.maxNotifyIvs
            settings.minNotifyIvs = this.get()[0]
            settings.maxNotifyIvs = this.get()[1]

            $('#notify-pokemon-ivs-slider-title').text(`Notify IVs (${settings.minNotifyIvs}% - ${settings.maxNotifyIvs}%)`)
            const zeroIvsWrapper = $('#zero-ivs-notify-pokemon-switch-wrapper')
            const hundoIvsWrapper = $('#hundo-ivs-notify-pokemon-switch-wrapper')
            if (settings.minNotifyIvs > 0) {
                zeroIvsWrapper.show()
            } else {
                zeroIvsWrapper.hide()
            }
            if (settings.maxNotifyIvs < 100) {
                hundoIvsWrapper.show()
            } else {
                hundoIvsWrapper.hide()
            }

            if ((settings.minNotifyIvs < oldMinIvs || settings.maxNotifyIvs > oldMaxIvs) &&
                    (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways)) {
                lastpokemon = false
                updateMap()
            }
            updatePokemons([], true)

            Store.set('minNotifyIvs', settings.minNotifyIvs)
            Store.set('maxNotifyIvs', settings.maxNotifyIvs)
        })

        var notifyPokemonLevelSlider = document.getElementById('notify-pokemon-level-slider')
        noUiSlider.create(notifyPokemonLevelSlider, {
            start: [settings.minNotifyLevel, settings.maxNotifyLevel],
            connect: true,
            step: 1,
            range: {
                'min': 1,
                'max': 35
            },
            format: {
                to: function (value) {
                    return Math.round(value)
                },
                from: function (value) {
                    return Number(value)
                }
            }
        })
        notifyPokemonLevelSlider.noUiSlider.on('change', function () {
            const oldMinLevel = settings.minNotifyLevel
            const oldMaxLevel = settings.maxNotifyLevel
            settings.minNotifyLevel = this.get()[0]
            settings.maxNotifyLevel = this.get()[1]
            $('#notify-pokemon-level-slider-title').text(`Notify Levels (${settings.minNotifyLevel} - ${settings.maxNotifyLevel})`)

            if ((settings.minNotifyLevel < oldMinLevel || settings.maxNotifyLevel > oldMaxLevel) &&
                    (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways)) {
                lastpokemon = false
                updateMap()
            }
            updatePokemons([], true)

            Store.set('minNotifyLevel', settings.minNotifyLevel)
            Store.set('maxNotifyLevel', settings.maxNotifyLevel)
        })

        $('#notify-tiny-rattata-switch').on('change', function () {
            settings.notifyTinyRattata = this.checked
            if (this.checked && (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways)) {
                reincludedPokemon.push(19)
                updateMap()
            }
            updatePokemons([19], true)
            Store.set('notifyTinyRattata', this.checked)
        })

        $('#notify-big-magikarp-switch').on('change', function () {
            settings.notifyBigMagikarp = this.checked
            if (this.checked && (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways)) {
                reincludedPokemon.push(129)
                updateMap()
            }
            updatePokemons([129], true)
            Store.set('notifyBigMagikarp', this.checked)
        })
    }



    $('#sound-switch').change(function () {
        Store.set('playSound', this.checked)
        var criesWrapper = $('#cries-wrapper')
        if (this.checked) {
            criesWrapper.show()
        } else {
            criesWrapper.hide()
        }
    })

    $('#pokemon-bounce-switch').change(function () {
        Store.set('bouncePokemon', this.checked)
        updatePokemons()
    })

    $('#gym-bounce-switch').change(function () {
        Store.set('bounceGyms', this.checked)
        updateGyms()
    })

    $('#pokestop-bounce-switch').change(function () {
        Store.set('bouncePokestops', this.checked)
        updatePokestops()
    })

    $('#pokemon-upscale-switch').change(function () {
        Store.set('upscaleNotifyPokemon', this.checked)
        updatePokemons()
    })

    $('#gym-upscale-switch').change(function () {
        Store.set('upscaleGyms', this.checked)
        updateGyms()
    })

    $('#pokestop-upscale-switch').change(function () {
        Store.set('upscalePokestops', this.checked)
        updatePokestops()
    })

    $('#notify-gyms-switch').change(function () {
        var wrapper = $('#notify-gyms-filter-wrapper')
        this.checked ? wrapper.show() : wrapper.hide()
        Store.set('notifyGyms', this.checked)
        updateGyms()
    })

    $('#notify-pokestops-switch').change(function () {
        var wrapper = $('#notify-pokestops-filter-wrapper')
        this.checked ? wrapper.show() : wrapper.hide()
        Store.set('notifyPokestops', this.checked)
        updatePokestops()
    })

    $('#notify-normal-lures-switch').change(function () {
        Store.set('notifyNormalLures', this.checked)
        updatePokestops()
    })

    $('#notify-glacial-lures-switch').change(function () {
        Store.set('notifyGlacialLures', this.checked)
        updatePokestops()
    })

    $('#notify-magnetic-lures-switch').change(function () {
        Store.set('notifyMagneticLures', this.checked)
        updatePokestops()
    })

    $('#notify-mossy-lures-switch').change(function () {
        Store.set('notifyMossyLures', this.checked)
        updatePokestops()
    })

    $('#popups-switch').change(function () {
        Store.set('showPopups', this.checked)
        location.reload()
    })

    $('#cries-switch').change(function () {
        Store.set('playCries', this.checked)
    })

    /*$('#notify-rarities-select').select2({
        placeholder: i8ln('Select rarity'),
        data: [i8ln('Common'), i8ln('Uncommon'), i8ln('Rare'), i8ln('Very Rare'), i8ln('Ultra Rare'), i8ln('New Spawn')],
        templateResult: formatRarityState
    })*/
    $('#notify-rarities-select').on('change', function (e) {
        if (Store.get('showNotifiedPokemonAlways') || Store.get('showNotifiedPokemonOnly')) {
            lastpokemon = false
        }
        Store.set('notifyRarities', $('#notify-rarities-select').val())
        updatePokemons()
    })

    $('#notified-pokemon-priority-switch').change(function () {
        Store.set('showNotifiedPokemonAlways', this.checked)
        if (!this.checked) {
            lastpokemon = false
        }
        updatePokemons()
    })

    $('#notified-pokemon-only-switch').change(function () {
        Store.set('showNotifiedPokemonOnly', this.checked)
        if (!this.checked) {
            lastpokemon = false
        }
        updatePokemons()
    })

    $('#pokemon-icon-size').on('change', function () {
        Store.set('pokemonIconSizeModifier', this.value)
        updatePokemons()
    })

    /*$('#map-service-provider').select2({
        placeholder: 'Select map provider',
        data: ['googlemaps', 'applemaps'],
        minimumResultsForSearch: Infinity
    })*/
    $('#map-service-provider').change(function () {
        Store.set('mapServiceProvider', this.value)
    })

    // Pokemon.
    if (serverSettings.pokemons) {
        $('#pokemon-switch').prop('checked', settings.showPokemon)
        $('a[data-target="pokemon-filter-modal"]').toggle(settings.showPokemon)
        $('#pokemon-filters-wrapper').toggle(settings.showPokemon)
    }
    if (serverSettings.pokemonValues) {
        $('#pokemon-values-switch').prop('checked', settings.showPokemonValues)
        $('#filter-pokemon-values-wrapper').toggle(settings.showPokemonValues)
        $('#filter-values-switch').prop('checked', settings.filterValues)
        $('a[data-target="pokemon-values-filter-modal"]').toggle(settings.filterValues)
        $('#pokemon-values-filters-wrapper').toggle(settings.filterValues)
        $('#pokemon-ivs-slider-title').text(`IVs (${settings.minIvs}% - ${settings.maxIvs}%)`)
        $('#pokemon-ivs-slider-wrapper').toggle(settings.filterValues)
        $('#zero-ivs-pokemon-switch').prop('checked', settings.showZeroIvsPokemon)
        $('#zero-ivs-pokemon-switch-wrapper').toggle(settings.minIvs > 0)
        $('#pokemon-level-slider-title').text(`Levels (${settings.minLevel} - ${settings.maxLevel})`)
        $('#pokemon-level-slider-wrapper').toggle(settings.filterValues)
    }
    if (serverSettings.rarity) {
        $('#rarity-select').val(settings.includedRarities)
        $('#rarity-select').formSelect()
        $('#scale-rarity-switch').prop('checked', settings.scaleByRarity)
    }

    // Gyms and Raids.
    if (serverSettings.gyms || serverSettings.raids) {
        $('#gym-name-filter-sidebar-wrapper').toggle(settings.showGyms || settings.showRaids)
        if (serverSettings.gym_sidebar) {
            $('#gym-sidebar-switch').prop('checked', settings.useGymSidebar)
        }
    }
    if (serverSettings.gyms) {
        $('#gym-switch').prop('checked', settings.showGyms)
    }
    if (serverSettings.gymFilters) {
        $('#gym-filters-wrapper').toggle(settings.showGyms)
        $('#gym-team-select').val(settings.includedGymTeams)
        $('#gym-team-select').formSelect()
        $('#gym-level-slider-title').text(`Gym levels (${settings.minGymLevel} - ${settings.maxGymLevel})`)
        $('#gym-open-spot-switch').prop('checked', settings.showOpenSpotGymsOnly)
        $('#gym-ex-eligible-switch').prop('checked', settings.showExGymsOnly)
        $('#gym-in-battle-switch').prop('checked', settings.showInBattleGymsOnly)
        $('#gym-last-scanned-select').val(settings.gymLastScannedHours)
        $('#gym-last-scanned-select').formSelect()
    }
    if (serverSettings.raids) {
        $('#raid-switch').prop('checked', settings.showRaids)
    }
    if (serverSettings.raidFilters) {
        $('a[data-target="raid-pokemon-filter-modal"]').toggle(settings.showRaids)
        $('#raid-filters-wrapper').toggle(settings.showRaids)
        $('#raid-active-switch').prop('checked', settings.showActiveRaidsOnly)
        $('#raid-ex-eligible-switch').prop('checked', settings.showExEligibleRaidsOnly)
        $('#raid-level-select').val(settings.includedRaidLevels)
        $('#raid-level-select').formSelect()
    }

    // Pokestops.
    if (serverSettings.pokestops) {
        $('#pokestop-switch').prop('checked', settings.showPokestops)
        $('#pokestop-filters-wrapper').toggle(settings.showPokestops)
        $('#pokestop-no-event-switch').prop('checked', settings.showPokestopsNoEvent)
    }
    if (serverSettings.quests) {
        $('#quest-switch').prop('checked', settings.showQuests)
        $('a[data-target="quest-filter-modal"]').toggle(settings.showQuests)
    }
    if (serverSettings.invasions) {
        $('#invasion-switch').prop('checked', settings.showInvasions)
        $('a[data-target="invasion-filter-modal"]').toggle(settings.showInvasions)
    }
    if (serverSettings.lures) {
        $('#lure-switch').prop('checked', settings.showLures)
        $('#lure-type-select-wrapper').toggle(settings.showLures)
        $('#lure-type-select').val(settings.includedLureTypes)
        $('#lure-type-select').formSelect()
    }

    // Weather.
    if (serverSettings.weather) {
        $('#weather-switch').prop('checked', settings.showWeather)
        $('#weather-forms-wrapper').toggle(settings.showWeather)
        $('#weather-cells-switch').prop('checked', settings.showWeatherCells)
        $('#main-weather-switch').prop('checked', settings.showMainWeather)
    }

    // Map.
    if (serverSettings.spawnpoints) {
        $('#spawnpoint-switch').prop('checked', settings.showSpawnpoints)
    }
    if (serverSettings.scannedLocs) {
        $('#scanned-locs-switch').prop('checked', settings.showScannedLocations)
    }
    if (serverSettings.nestParks) {
        $('#nest-park-switch').prop('checked', settings.showNestParks)
    }
    if (serverSettings.exParks) {
        $('#ex-park-switch').prop('checked', settings.showExParks)
    }
    if (serverSettings.s2Cells) {
        $('#s2-cell-switch').prop('checked', settings.showS2Cells)
        $('#s2-filters-wrapper').toggle(settings.showS2Cells)
        $('#s2-level10-switch').prop('checked', settings.showS2CellsLevel10)
        $('#s2-level13-switch').prop('checked', settings.showS2CellsLevel13)
        $('#s2-level14-switch').prop('checked', settings.showS2CellsLevel14)
        $('#s2-level17-switch').prop('checked', settings.showS2CellsLevel17)
        $('#s2-cells-warning-switch').prop('checked', settings.warnHiddenS2Cells)
    }
    if (serverSettings.ranges) {
        $('#ranges-switch').prop('checked', settings.showRanges)
        $('#range-type-select-wrapper').toggle(settings.showRanges)
        $('#range-type-select').val(settings.includedRangeTypes)
        $('#range-type-select').formSelect()
    }

    // Location.
    if (hasLocationSupport()) {
        $('#start-at-user-location-switch').prop('checked', settings.startAtUserLocation)
    }
    $('#start-at-last-location-switch').prop('checked', settings.startAtLastLocation)
    if (serverSettings.isStartLocationMarkerMovable) {
        $('#lock-start-marker-switch').prop('checked', !settings.isStartLocationMarkerMovable)
    }
    if (hasLocationSupport()) {
        $('#follow-user-location-switch').prop('checked', settings.followUserLocation)
    }

    // Notifications.
    if (serverSettings.pokemons) {
        $('#pokemon-notifications-switch').prop('checked', settings.pokemonNotifications)
        $('a[data-target="notify-pokemon-filter-modal"]').toggle(settings.pokemonNotifications)
        $('#pokemon-notification-filters-wrapper').toggle(settings.pokemonNotifications)
    }
    if (serverSettings.pokemonValues) {
        $('#pokemon-values-notifications-switch').prop('checked', settings.filterNotifyValues)
        $('a[data-target="notify-pokemon-values-filter-modal"]').toggle(settings.filterNotifyValues)
        $('#pokemon-values-notification-filters-wrapper').toggle(settings.filterNotifyValues)
        $('#zero-ivs-notify-pokemon-switch-wrapper').toggle(settings.minNotifyIvs > 0)
        $('#zero-ivs-notify-pokemon-switch').prop('checked', settings.notifyZeroIvsPokemon)
        $('#hundo-ivs-notify-pokemon-switch-wrapper').toggle(settings.maxNotifyIvs < 100)
        $('#hundo-ivs-notify-pokemon-switch').prop('checked', settings.notifyHundoIvsPokemon)
        $('#notify-pokemon-ivs-slider-title').text(`Notify IVs (${settings.minNotifyIvs}% - ${settings.maxNotifyIvs}%)`)
        $('#notify-pokemon-level-slider-title').text(`Notify Levels (${settings.minNotifyLevel} - ${settings.maxNotifyLevel})`)
        $('#notify-tiny-rattata-switch').prop('checked', settings.notifyTinyRattata)
        $('#notify-big-magikarp-switch').prop('checked', settings.notifyBigMagikarp)
    }


    $('#notify-pokemon-switch-wrapper').toggle(settings.showPokemon)
    $('#notify-pokemon-filter-wrapper').toggle(Store.get('notifyPokemon'))
    $('#notify-ivs-text').val(Store.get('notifyIvsPercentage')).trigger('change')
    $('#notify-level-text').val(Store.get('notifyLevel')).trigger('change')
    $('#notify-rarities-select').val(Store.get('notifyRarities'))
    $('#notify-tiny-rattata-switch').prop('checked', Store.get('notifyTinyRattata'))
    $('#notify-big-magikarp-switch').prop('checked', Store.get('notifyBigMagikarp'))
    $('#notified-pokemon-priority-switch').prop('checked', Store.get('showNotifiedPokemonAlways'))
    $('#notified-pokemon-only-switch').prop('checked', Store.get('showNotifiedPokemonOnly'))
    $('#cries-switch').prop('checked', Store.get('playCries'))
    $('#cries-wrapper').toggle(Store.get('playSound'))
    $('#pokemon-bounce-switch').prop('checked', Store.get('bouncePokemon'))
    $('#pokemon-upscale-switch').prop('checked', Store.get('upscaleNotifyPokemon'))
    $('#notify-gyms-switch-wrapper').toggle(settings.showRaids)
    $('#notify-gyms-switch').prop('checked', Store.get('notifyGyms'))
    $('#notify-gyms-filter-wrapper').toggle(Store.get('notifyGyms'))
    $('#gym-bounce-switch').prop('checked', Store.get('bounceGyms'))
    $('#gym-upscale-switch').prop('checked', Store.get('upscaleGyms'))
    $('#notify-pokestops-switch-wrapper').toggle(settings.showPokestops)
    $('#notify-pokestops-switch').prop('checked', Store.get('notifyPokestops'))
    $('#notify-pokestops-filter-wrapper').toggle(Store.get('notifyPokestops'))
    $('#notify-normal-lures-switch').prop('checked', Store.get('notifyNormalLures'))
    $('#notify-glacial-lures-switch').prop('checked', Store.get('notifyGlacialLures'))
    $('#notify-magnetic-lures-switch').prop('checked', Store.get('notifyMagneticLures'))
    $('#notify-mossy-lures-switch').prop('checked', Store.get('notifyMossyLures'))
    $('#pokestop-bounce-switch').prop('checked', Store.get('bouncePokestops'))
    $('#pokestop-upscale-switch').prop('checked', Store.get('upscalePokestops'))
    $('#popups-switch').prop('checked', Store.get('showPopups'))
    $('#sound-switch').prop('checked', Store.get('playSound'))

    // Style.
    $('#map-service-provider').val(Store.get('mapServiceProvider'))
    $('#pokemon-icon-size').val(Store.get('pokemonIconSizeModifier'))

    // Stats sidebar.
    $('#pokemon-stats-container').toggle(settings.showPokemon)
    $('#gym-stats-container').toggle(settings.showGyms)
    $('#pokestop-stats-container').toggle(settings.showPokestops)

    /*$('select:not([multiple])').select2({
        minimumResultsForSearch: Infinity
    })

    $('select[multiple]').select2()
    $('select[multiple]').parent().find('.select2-search__field').remove()
    $('select[multiple]').on('select2:opening select2:closing', function(event) {
        $(this).parent().find('.select2-search__field').remove()
    })*/
}

function initPokemonFilters() {
    const pokemonIds = getPokemonIds()

    $.each(pokemonIds, function(idx, id) {
        var pokemonIcon
        if (serverSettings.generateImages) {
            pokemonIcon = `<img src='${getPokemonRawIconUrl({'pokemon_id': id})}' width='32'>`
        } else {
            pokemonIcon = `<i class='pokemon-sprite n${id}' width='32'></i>`
        }
        $('.pokemon-filter-list').append(`
            <div class='filter-button' data-id='${id}'>
              <div class='filter-button-content'>
                <div>#${id}</div>
                <div>${pokemonIcon}</div>
                <div>${getPokemonName(id)}</div>
              </div>
            </div>`)
    })

    $('.pokemon-filter-list').on('click', '.filter-button', function () {
        var img = $(this)
        var inputElement = $(this).parent().parent().find('input[id$=pokemon]')
        var value = inputElement.val().length > 0 ? inputElement.val().split(',') : []
        var id = img.data('id').toString()
        if (img.hasClass('active')) {
            inputElement.val((value.concat(id).join(','))).trigger('change')
            img.removeClass('active')
        } else {
            inputElement.val(value.filter(function (elem) {
                return elem !== id
            }).join(',')).trigger('change')
            img.addClass('active')
        }
    })

    $('.pokemon-select-all').on('click', function (e) {
        e.preventDefault()
        var parent = $(this).parent().parent().parent()
        parent.find('.pokemon-filter-list .filter-button:visible').addClass('active')
        parent.find('input[id$=pokemon]').val('').trigger('change')
    })

    $('.pokemon-deselect-all').on('click', function (e) {
        e.preventDefault()
        var parent = $(this).parent().parent().parent()
        parent.find('.pokemon-filter-list .filter-button:visible').removeClass('active')
        parent.find('input[id$=pokemon]').val(pokemonIds.join(',')).trigger('change')
    })

    $('.pokemon-select-filtered').on('click', function (e) {
        e.preventDefault()
        var parent = $(this).parent().parent().parent()
        var inputElement = parent.find('input[id$=pokemon]')
        var deselectedPokemons = inputElement.val().length > 0 ? inputElement.val().split(',') : []
        var visibleNotActiveIconElements = parent.find('.filter-button:visible:not(.active)')
        visibleNotActiveIconElements.addClass('active')
        $.each(visibleNotActiveIconElements, function (i, item) {
            var id = $(this).data('id').toString()
            deselectedPokemons = deselectedPokemons.filter(function (item) {
                return item !== id
            })
        })
        inputElement.val(deselectedPokemons.join(',')).trigger('change')
    })

    $('.pokemon-deselect-filtered').on('click', function (e) {
        e.preventDefault()
        var parent = $(this).parent().parent().parent()
        var inputElement = parent.find('input[id$=pokemon]')
        var deselectedPokemons = inputElement.val().length > 0 ? inputElement.val().split(',') : []
        var visibleActiveIconElements = parent.find('.filter-button:visible.active')
        visibleActiveIconElements.removeClass('active')
        $.each(visibleActiveIconElements, function (i, item) {
            deselectedPokemons.push($(this).data('id'))
        })
        inputElement.val(deselectedPokemons.join(',')).trigger('change')
    })

    $('.search').on('input', function () {
        var searchtext = $(this).val().toString()
        var parent = $(this)
        var foundPokemon = []
        var pokeselectlist = $(this).parent().parent().prev('.pokemon-filter-list').find('.filter-button')
        if (searchtext === '') {
            parent.parent().parent().find('.pokemon-select-filtered, .pokemon-deselect-filtered').hide()
            parent.parent().parent().find('.pokemon-select-all, .pokemon-deselect-all').show()
            pokeselectlist.show()
        } else {
            pokeselectlist.hide()
            parent.parent().parent().find('.pokemon-select-filtered, .pokemon-deselect-filtered').show()
            parent.parent().parent().find('.pokemon-select-all, .pokemon-deselect-all').hide()
            foundPokemon = searchPokemon(searchtext.replace(/\s/g, ''))
        }

        $.each(foundPokemon, function (i, item) {
            parent.parent().parent().prev('.pokemon-filter-list').find('.filter-button[data-id="' + foundPokemon[i] + '"]').show()
        })
    })

    if (serverSettings.pokemons) {
        $('#exclude-pokemon').val(settings.excludedPokemon)
        if (settings.excludedPokemon.length === 0) {
            $('#filter-pokemon-title').text('Pokémon (All)')
        } else {
            $('#filter-pokemon-title').text(`Pokémon (${pokemonIds.length - settings.excludedPokemon.length})`)
        }

        $('label[for="exclude-pokemon"] .pokemon-filter-list .filter-button').each(function () {
            if (!settings.excludedPokemon.includes($(this).data('id'))) {
                $(this).addClass('active')
            }
        })

        $('#exclude-pokemon').on('change', function (e) {
            const oldExcludedPokemon = settings.excludedPokemon
            settings.excludedPokemon = $(this).val().length > 0 ? $(this).val().split(',').map(Number) : []

            const newExcludedPokemon = settings.excludedPokemon.filter(id => !oldExcludedPokemon.includes(id))
            if (newExcludedPokemon.length > 0) {
                updatePokemons(newExcludedPokemon)
            }

            const newReincludedPokemon = oldExcludedPokemon.filter(id => !settings.excludedPokemon.includes(id))
            reincludedPokemon = reincludedPokemon.concat(newReincludedPokemon)
            if (reincludedPokemon.length > 0) {
                updateMap()
            }

            if (settings.excludedPokemon.length === 0) {
                $('#filter-pokemon-title').text('Pokémon (All)')
            } else {
                $('#filter-pokemon-title').text(`Pokémon (${pokemonIds.length - settings.excludedPokemon.length})`)
            }

            Store.set('excludedPokemon', settings.excludedPokemon)
        })
    }

    if (serverSettings.pokemonValues) {
        $('#unfiltered-pokemon').val(settings.noFilterValuesPokemon)
        if (settings.noFilterValuesPokemon.length === 0) {
            $('#filter-values-pokemon-title').text('Pokémon filtered by Values (All)')
        } else {
            $('#filter-values-pokemon-title').text(`Pokémon filtered by Values (${pokemonIds.length - settings.noFilterValuesPokemon.length})`)
        }

        $('label[for="unfiltered-pokemon"] .pokemon-filter-list .filter-button').each(function () {
            if (!settings.noFilterValuesPokemon.includes($(this).data('id'))) {
                $(this).addClass('active')
            }
        })

        $('#unfiltered-pokemon').on('change', function (e) {
            const oldnoFilterValuesPokemon = settings.noFilterValuesPokemon
            settings.noFilterValuesPokemon = $(this).val().length > 0 ? $(this).val().split(',').map(Number) : []

            const newFilterdPokemon = oldnoFilterValuesPokemon.filter(id => !settings.noFilterValuesPokemon.includes(id))
            if (newFilterdPokemon.length > 0) {
                updatePokemons(newFilterdPokemon)
            }

            const newUnfilterdPokemon = settings.noFilterValuesPokemon.filter(id => !oldnoFilterValuesPokemon.includes(id))
            reincludedPokemon = reincludedPokemon.concat(newUnfilterdPokemon)
            if (reincludedPokemon.length > 0) {
                updateMap()
            }

            if (settings.noFilterValuesPokemon.length === 0) {
                $('#filter-values-pokemon-title').text('Pokémon filtered by Values (All)')
            } else {
                $('#filter-values-pokemon-title').text(`Pokémon filtered by Values (${pokemonIds.length - settings.noFilterValuesPokemon.length})`)
            }

            Store.set('noFilterValuesPokemon', settings.noFilterValuesPokemon)
        })
    }

    if (serverSettings.raidFilters) {
        $('#exclude-raid-pokemon').val(settings.excludedRaidPokemon)
        if (settings.excludedRaidPokemon.length === 0) {
            $('#filter-raid-pokemon-title').text('Raid Bosses (All)')
        } else {
            $('#filter-raid-pokemon-title').text(`Raid Bosses (${pokemonIds.length - settings.excludedRaidPokemon.length})`)
        }

        $('label[for="exclude-raid-pokemon"] .pokemon-filter-list .filter-button').each(function () {
            if (!settings.excludedRaidPokemon.includes($(this).data('id'))) {
                $(this).addClass('active')
            }
        })

        $('#exclude-raid-pokemon').on('change', function (e) {
            const oldExcludedPokemon = settings.excludedRaidPokemon
            settings.excludedRaidPokemon = $(this).val().length > 0 ? $(this).val().split(',').map(Number) : []

            if (settings.excludedRaidPokemon.length > oldExcludedPokemon.length) {
                updateGyms()
            } else {
                lastgyms = false
                updateMap()
            }

            if (settings.excludedRaidPokemon.length === 0) {
                $('#filter-raid-pokemon-title').text('Raid Bosses (All)')
            } else {
                $('#filter-raid-pokemon-title').text(`Raid Bosses (${pokemonIds.length - settings.excludedRaidPokemon.length})`)
            }

            Store.set('excludedRaidPokemon', settings.excludedRaidPokemon)
        })
    }

    if (serverSettings.quests) {
        $('#exclude-quest-pokemon').val(settings.excludedQuestPokemon)
        if (settings.excludedQuestPokemon.length === 0) {
            $('a[href="#quest-pokemon-tab"]').text('Quest Pokémon (All)')
        } else {
            $('a[href="#quest-pokemon-tab"]').text(`Quest Pokémon (${pokemonIds.length - settings.excludedQuestPokemon.length})`)
        }

        $('label[for="exclude-quest-pokemon"] .pokemon-filter-list .filter-button').each(function () {
            if (!settings.excludedQuestPokemon.includes($(this).data('id'))) {
                $(this).addClass('active')
            }
        })

        $('#exclude-quest-pokemon').on('change', function (e) {
            const oldExcludedPokemon = settings.excludedQuestPokemon
            settings.excludedQuestPokemon = $(this).val().length > 0 ? $(this).val().split(',').map(Number) : []

            if (settings.excludedQuestPokemon.length > oldExcludedPokemon.length) {
                updatePokestops()
            } else {
                lastpokestops = false
                updateMap()
            }

            if (settings.excludedQuestPokemon.length === 0) {
                $('a[href="#quest-pokemon-tab"]').text('Quest Pokémon (All)')
            } else {
                $('a[href="#quest-pokemon-tab"]').text(`Quest Pokémon (${pokemonIds.length - settings.excludedQuestPokemon.length})`)
            }
            $('#quest-filter-tabs').tabs('updateTabIndicator')

            Store.set('excludedQuestPokemon', settings.excludedQuestPokemon)
        })
    }

    if (serverSettings.pokemons) {
        const noNotifyPokemonSaved = pokemonIds.filter(id => !settings.notifyPokemon.includes(id))
        $('#notify-pokemon').val(noNotifyPokemonSaved)
        if (settings.notifyPokemon.length === pokemonIds.length) {
            $('#filter-notify-pokemon-title').text('Notify Pokémon (All)')
        } else {
            $('#filter-notify-pokemon-title').text(`Notify Pokémon (${settings.notifyPokemon.length})`)
        }

        $('label[for="notify-pokemon"] .pokemon-filter-list .filter-button').each(function () {
            if (settings.notifyPokemon.includes($(this).data('id'))) {
                $(this).addClass('active')
            }
        })

        $('#notify-pokemon').on('change', function (e) {
            const oldNotifyPokemon = settings.notifyPokemon
            const noNotifyPokemon = $(this).val().length > 0 ? $(this).val().split(',').map(Number) : []
            settings.notifyPokemon = pokemonIds.filter(id => !noNotifyPokemon.includes(id))

            const newNotifyPokemon = settings.notifyPokemon.filter(id => !oldNotifyPokemon.includes(id))
            const newNoNotifyPokemon = noNotifyPokemon.filter(id => oldNotifyPokemon.includes(id))

            updatePokemons(newNotifyPokemon.concat(newNoNotifyPokemon))

            if (newNotifyPokemon.length > 0 && (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways)) {
                lastpokemon = false
                updateMap()
            }

            if (settings.notifyPokemon.length === pokemonIds.length) {
                $('#filter-notify-pokemon-title').text('Notify Pokémon (All)')
            } else {
                $('#filter-notify-pokemon-title').text(`Notify Pokémon (${settings.notifyPokemon.length})`)
            }

            Store.set('notifyPokemon', settings.notifyPokemon)
        })
    }

    if (serverSettings.pokemonValues) {
        $('#unfiltered-notify-pokemon').val(settings.noFilterValuesNotifyPokemon)
        if (settings.noFilterValuesNotifyPokemon.length === 0) {
            $('#filter-notify-pokemon-values-title').text('Notify Pokémon filtered by Values (All)')
        } else {
            $('#filter-notify-pokemon-values-title').text(`Notify Pokémon filtered by Values (${pokemonIds.length - settings.noFilterValuesNotifyPokemon.length})`)
        }

        $('label[for="unfiltered-notify-pokemon"] .pokemon-filter-list .filter-button').each(function () {
            if (!settings.noFilterValuesNotifyPokemon.includes($(this).data('id'))) {
                $(this).addClass('active')
            }
        })

        $('#unfiltered-notify-pokemon').on('change', function (e) {
            const oldValues = settings.noFilterValuesNotifyPokemon
            settings.noFilterValuesNotifyPokemon = $(this).val().length > 0 ? $(this).val().split(',').map(Number) : []

            const newValues = settings.noFilterValuesNotifyPokemon.filter(id => !oldValues.includes(id))
            const removedValues = oldValues.filter(id => !settings.noFilterValuesNotifyPokemon.includes(id))

            updatePokemons(newValues.concat(removedValues))

            if (newValues.length > 0 && (settings.showNotifyPokemonOnly || settings.showNotifyPokemonAlways)) {
                lastpokemon = false
                updateMap()
            }

            if (settings.noFilterValuesNotifyPokemon.length === 0) {
                $('#filter-notify-pokemon-values-title').text('Notify Pokémon filtered by Values (All)')
            } else {
                $('#filter-notify-pokemon-values-title').text(`Notify Pokémon filtered by Values (${pokemonIds.length - settings.noFilterValuesNotifyPokemon.length})`)
            }

            Store.set('noFilterValuesNotifyPokemon', settings.noFilterValuesNotifyPokemon)
        })
    }
}

function initItemFilters() {
    var questItemIds = []
    const includeInFilter = [6, 1, 2, 3, 701, 703, 705, 706, 708, 101, 102, 103, 104, 201, 202, 1301, 1201, 1202, 501, 502, 503, 504, 1101, 1102, 1103, 1104, 1105, 1106, 1107]
    for (var i = 0; i < includeInFilter.length; i++) {
        const id = includeInFilter[i]
        const iconUrl = getItemImageUrl(id)
        const name = getItemName(id)
        const questBundles = getQuestBundles(id)
        if (questBundles.length === 0) {
            questBundles.push(1)
        }
        $.each(questBundles, function (idx, bundleAmount) {
            questItemIds.push(id + '_' + bundleAmount)
            $('.quest-item-filter-list').append(`
                <div class='filter-button' data-id='${id}' data-bundle='${bundleAmount}'>
                <div class='filter-button-content'>
                <div>${name}</div>
                <div><img src='${iconUrl}' width='32'></div>
                <div>x${bundleAmount}</div>
                </div>
                </div>`)
        })
    }

    $('#exclude-quest-items').val(settings.excludedQuestItems)
    if (settings.excludedQuestItems.length === 0) {
        $('a[href="#quest-item-tab"]').text('Quest Items (All)')
    } else {
        $('a[href="#quest-item-tab"]').text(`Quest Items (${questItemIds.length - settings.excludedQuestItems.length})`)
    }

    $('label[for="exclude-quest-items"] .quest-item-filter-list .filter-button').each(function () {
        var id = $(this).data('id').toString()
        if ($(this).data('bundle')) {
            id += '_' + $(this).data('bundle')
        }
        if (!settings.excludedQuestItems.includes(id)) {
            $(this).addClass('active')
        }
    })

    $('.quest-item-filter-list').on('click', '.filter-button', function () {
        var inputElement = $(this).parent().parent().find('input[id$=items]')
        var value = inputElement.val().length > 0 ? inputElement.val().split(',') : []
        var id = $(this).data('id').toString()
        if ($(this).data('bundle')) {
            id += '_' + $(this).data('bundle')
        }
        if ($(this).hasClass('active')) {
            inputElement.val((value.concat(id).join(','))).trigger('change')
            $(this).removeClass('active')
        } else {
            inputElement.val(value.filter(function (elem) {
                return elem !== id
            }).join(',')).trigger('change')
            $(this).addClass('active')
        }
    })

    $('.quest-item-select-all').on('click', function (e) {
        var parent = $(this).parent().parent().parent()
        parent.find('.quest-item-filter-list .filter-button:visible').addClass('active')
        parent.find('input[id$=items]').val('').trigger('change')
    })

    $('.quest-item-deselect-all').on('click', function (e) {
        var parent = $(this).parent().parent().parent()
        parent.find('.quest-item-filter-list .filter-button:visible').removeClass('active')
        parent.find('input[id$=items]').val(questItemIds.join(',')).trigger('change')
    })

    $('#exclude-quest-items').on('change', function () {
        const oldExcludedQuestItems = settings.excludedQuestItems
        settings.excludedQuestItems = $(this).val().length > 0 ? $(this).val().split(',') : []

        updatePokestops()
        lastpokestops = false
        updateMap()

        if (settings.excludedQuestItems.length === 0) {
            $('a[href="#quest-item-tab"]').text('Quest Items (All)')
        } else {
            $('a[href="#quest-item-tab"]').text(`Quest Items (${questItemIds.length - settings.excludedQuestItems.length})`)
        }
        $('#quest-filter-tabs').tabs('updateTabIndicator')

        Store.set('excludedQuestItems', settings.excludedQuestItems)
    })
}

function initInvasionFilters() {
    const invasionIds = [41, 42, 43, 44, 5, 4, 6, 7, 10, 11, 12, 13, 49, 50, 14, 15, 16, 17, 18, 19, 20, 21, 47, 48, 22, 23, 24, 25, 26, 27, 30, 31, 32, 33, 34, 35, 36, 37, 28, 29, 38, 39]
    for (var i = 0; i < invasionIds.length; i++) {
        const id = invasionIds[i]
        const iconUrl = getInvasionImageUrl(id)
        const type = getInvasionType(id)
        const grunt = getInvasionGrunt(id)
        $('.invasion-filter-list').append(`
            <div class='filter-button' data-id='${id}'>
              <div class='filter-button-content'>
                <div>${type}</div>
                <div><img src='${iconUrl}' width='32'></div>
                <div>${grunt}</div>
              </div>
            </div>`)
    }

    $('#exclude-invasions').val(settings.excludedInvasions)
    if (settings.excludedInvasions.length === 0) {
        $('#filter-invasion-title').text('Team Rocket Invasions (All)')
    } else {
        $('#filter-invasion-title').text(`Team Rocket Invasions (${invasionIds.length - settings.excludedInvasions.length})`)
    }

    $('label[for="exclude-invasions"] .invasion-filter-list .filter-button').each(function () {
        if (!settings.excludedInvasions.includes($(this).data('id'))) {
            $(this).addClass('active')
        }
    })

    $('.invasion-filter-list').on('click', '.filter-button', function () {
        var inputElement = $(this).parent().parent().find('input[id$=invasions]')
        var value = inputElement.val().length > 0 ? inputElement.val().split(',') : []
        var id = $(this).data('id').toString()
        if ($(this).hasClass('active')) {
            inputElement.val((value.concat(id).join(','))).trigger('change')
            $(this).removeClass('active')
        } else {
            inputElement.val(value.filter(function (elem) {
                return elem !== id
            }).join(',')).trigger('change')
            $(this).addClass('active')
        }
    })

    $('.invasion-select-all').on('click', function (e) {
        var parent = $(this).parent().parent().parent()
        parent.find('.invasion-filter-list .filter-button:visible').addClass('active')
        parent.find('input[id$=invasions]').val('').trigger('change')
    })

    $('.invasion-deselect-all').on('click', function (e) {
        var parent = $(this).parent().parent().parent()
        parent.find('.invasion-filter-list .filter-button:visible').removeClass('active')
        parent.find('input[id$=invasions]').val(invasionIds.join(',')).trigger('change')
    })

    $('#exclude-invasions').on('change', function () {
        const oldExcludedinvasions = settings.excludedInvasions
        settings.excludedInvasions = $(this).val().length > 0 ? $(this).val().split(',').map(Number) : []

        updatePokestops()
        lastpokestops = false
        updateMap()

        if (settings.excludedInvasions.length === 0) {
            $('#filter-invasion-title').text('Team Rocket Invasions (All)')
        } else {
            $('#filter-invasion-title').text(`Team Rocket Invasions (${invasionIds.length - settings.excludedInvasions.length})`)
        }

        Store.set('excludedInvasions', settings.excludedInvasions)
    })
}

function initBackupModals() {
    const pokemonIds = getPokemonIds()

    if (serverSettings.pokemons) {
        $('#export-pokemon-button').on('click',  function () {
            const pokemon = pokemonIds.filter(id => !settings.excludedPokemon.includes(id))
            downloadData('pokemon', JSON.stringify(pokemon))
        })
    }

    if (serverSettings.pokemonValues) {
        $('#export-values-pokemon-button').on('click',  function () {
            const pokemon = pokemonIds.filter(id => !settings.noFilterValuesPokemon.includes(id))
            downloadData('values_pokemon', JSON.stringify(pokemon))
        })
    }

    if (serverSettings.raids) {
        $('#export-raid-pokemon-button').on('click',  function () {
            const pokemon = pokemonIds.filter(id => !settings.excludedRaidPokemon.includes(id))
            downloadData('raid_pokemon', JSON.stringify(pokemon))
        })
    }

    if (serverSettings.quests) {
        $('#export-quest-pokemon-button').on('click',  function () {
            const pokemon = pokemonIds.filter(id => !settings.excludedQuestPokemon.includes(id))
            downloadData('quest_pokemon', JSON.stringify(pokemon))
        })
    }

    if (serverSettings.pokemons) {
        $('#export-notify-pokemon-button').on('click',  function () {
            downloadData('notify_pokemon', JSON.stringify(settings.notifyPokemon))
        })
    }

    if (serverSettings.pokemonValues) {
        $('#export-notify-values-pokemon-button').on('click',  function () {
            // TODO:
            const pokemon = []
            downloadData('notify_values_pokemon', JSON.stringify(pokemon))
        })
    }

    function loaded(e) {
        var fileString = e.target.result
        var checkBoxSelected = false

        var pokemons = null
        try {
            pokemons = JSON.parse(fileString)
        } catch (e) {
            console.error('Error while parsing pokemon list: ' + e)
        }
        if (pokemons === null || !Array.isArray(pokemons)) {
            toastError(i8ln('Error while reading Pokémon list file!'), i8ln('Check your Pokémon list file.'))
            return
        }
        for (var i = 0; i < pokemons.length; i++) {
            if (!Number.isInteger(pokemons[i])) {
                toastError(i8ln('Unexpected character found in Pokémon list file!'), i8ln('Check your Pokémon list file.'))
                return
            }
        }

        const excludedPokemon = pokemonIds.filter(id => !pokemons.includes(id))

        if (serverSettings.pokemons && $('#import-pokemon-checkbox').is(':checked')) {
            checkBoxSelected = true
            $('#exclude-pokemon').val(excludedPokemon).trigger('change')

            $('label[for="exclude-pokemon"] .pokemon-filter-list .filter-button').each(function () {
                if (!settings.excludedPokemon.includes($(this).data('id'))) {
                    $(this).addClass('active')
                } else {
                    $(this).removeClass('active')
                }
            })
        }

        if (serverSettings.pokemonValues && $('#import-values-pokemon-checkbox').is(':checked')) {
            checkBoxSelected = true
            $('#unfiltered-pokemon').val(excludedPokemon).trigger('change')

            $('label[for="unfiltered-pokemon"] .pokemon-filter-list .filter-button').each(function () {
                if (!settings.noFilterValuesPokemon.includes($(this).data('id'))) {
                    $(this).addClass('active')
                } else {
                    $(this).removeClass('active')
                }
            })
        }

        if (serverSettings.raids && $('#import-raid-pokemon-checkbox').is(':checked')) {
            checkBoxSelected = true
            $('#exclude-raid-pokemon').val(excludedPokemon).trigger('change')

            $('label[for="exclude-raid-pokemon"] .pokemon-filter-list .filter-button').each(function () {
                if (!settings.excludedRaidPokemon.includes($(this).data('id'))) {
                    $(this).addClass('active')
                } else {
                    $(this).removeClass('active')
                }
            })
        }

        if (serverSettings.quests && $('#import-quest-pokemon-checkbox').is(':checked')) {
            checkBoxSelected = true
            $('#exclude-quest-pokemon').val(excludedPokemon).trigger('change')

            $('label[for="exclude-quest-pokemon"] .pokemon-filter-list .filter-button').each(function () {
                if (!settings.excludedQuestPokemon.includes($(this).data('id'))) {
                    $(this).addClass('active')
                } else {
                    $(this).removeClass('active')
                }
            })
        }

        if (serverSettings.pokemons && $('#import-notify-pokemon-checkbox').is(':checked')) {
            checkBoxSelected = true
            $('#notify-pokemon').val(excludedPokemon).trigger('change')

            $('label[for="notify-pokemon"] .pokemon-filter-list .filter-button').each(function () {
                if (settings.notifyPokemon.includes($(this).data('id'))) {
                    $(this).addClass('active')
                } else {
                    $(this).removeClass('active')
                }
            })
        }

        if (checkBoxSelected) {
            toastSuccess(i8ln('Pokémon list imported.'), '')
        } else {
            toastWarning(i8ln('Please select a filter to import to first.'), '')
        }
    }

    function error(e) {
        console.error('Error while loading Pokémon list file: ' + e)
        toastError(i8ln('Error while loading Pokémon list file!'), i8ln('Please try again.'))
    }

    $('#import-pokemon-list').on('click', function () {
        var elem = document.getElementById('pokemon-list-file')
        if (elem.value != '') {
            var file = elem.files[0]
            loadData(file, loaded, error)
        } else {
            toastWarning(i8ln('Please select a Pokémon list first!'), '')
        }
    })
}

function setupRangeCircle(item, type, cluster) {
    var range
    var circleColor

    switch (type) {
        case 'pokemon':
            circleColor = '#C233F2'
            range = 50 // Pokemon appear at 50m, but disappear at 70m.
            break
        case 'gym':
            circleColor = gymRangeColors[item.team_id]
            range = 40
            break
        case 'pokestop':
            circleColor = '#3EB0FF'
            range = 40
            break
        case 'spawnpoint':
            circleColor = '#C233F2'
            range = 50
            break
        default:
            return
    }

    const rangeCircle = L.circle([item.latitude, item.longitude], {
        radius: range, // Meters.
        interactive: false,
        weight: 1,
        color: circleColor,
        opacity: 0.9,
        fillOpacity: 0.3
    })
    rangesLayerGroup.addLayer(rangeCircle)

    return rangeCircle
}

function updateRangeCircle(item, type, cluster) {
    if (!item.rangeCircle) {
        return
    }

    var isRangeActive
    switch (type) {
        case 'pokemon':
            isRangeActive = isPokemonRangesActive()
            break
        case 'gym':
            isRangeActive = isGymRangesActive()
            break
        case 'pokestop':
            isRangeActive = isPokestopRangesActive()
            break
        case 'spawnpoint':
            isRangeActive = isSpawnpointRangesActive()
            break
        default:
            isRangeActive = false
    }

    if (!isRangeActive) {
        removeRangeCircle(item.rangeCircle)
        delete item.rangeCircle
        return
    }

    if (type === 'gym') {
        item.rangeCircle.setStyle({color: gymRangeColors[item.team_id]})
    }

    return item.rangeCircle
}

function removeRangeCircle(rangeCircle) {
    rangesLayerGroup.removeLayer(rangeCircle)
}

function lpad(str, len, padstr) {
    return Array(Math.max(len - String(str).length + 1, 0)).join(padstr) + str
}

function getTimeUntil(time) {
    var now = Date.now()
    var tdiff = time - now

    var sec = Math.floor((tdiff / 1000) % 60)
    var min = Math.floor((tdiff / 1000 / 60) % 60)
    var hour = Math.floor((tdiff / (1000 * 60 * 60)) % 24)

    return {
        'total': tdiff,
        'hour': hour,
        'min': min,
        'sec': sec,
        'now': now,
        'ttime': time
    }
}

function playPokemonSound(pokemonID, cryFileTypes) {
    if (!Store.get('playSound')) {
        return
    }

    if (!Store.get('playCries')) {
        audio.play()
    } else {
        // Stop if we don't have any supported filetypes left.
        if (cryFileTypes.length === 0) {
            return
        }

        // Try to load the first filetype in the list.
        const filetype = cryFileTypes.shift()
        const audioCry = new Audio('static/sounds/cries/' + pokemonID + '.' + filetype)

        audioCry.play().catch(function (err) {
            // Try a different filetype.
            if (err) {
                console.log('Sound filetype %s for Pokémon %s is missing.', filetype, pokemonID)

                // If there's more left, try something else.
                playPokemonSound(pokemonID, cryFileTypes)
            }
        })
    }
}

function sizeRatio(height, weight, baseHeight, baseWeight) {
    var heightRatio = height / baseHeight
    var weightRatio = weight / baseWeight

    return heightRatio + weightRatio
}

function addListeners(marker, type) {
    marker.on('click', function () {
        switch (type) {
            case 'pokemon':
                if (mapData.pokemons[marker.encounter_id].updated) {
                    updatePokemonLabel(mapData.pokemons[marker.encounter_id], marker)
                }
                if (marker.isBouncing()) {
                    marker.stopBouncing()
                    notifiedPokemonData[marker.encounter_id].animationDisabled = true
                }
                break
            case 'gym':
                if (mapData.gyms[marker.gym_id].updated) {
                    updateGymLabel(mapData.gyms[marker.gym_id], marker)
                }
                if (marker.isBouncing()) {
                    marker.stopBouncing()
                    notifiedGymData[marker.gym_id].animationDisabled = true
                }
                break
            case 'pokestop':
                if (mapData.pokestops[marker.pokestop_id].updated) {
                    updatePokestopLabel(mapData.pokestops[marker.pokestop_id], marker)
                }
                if (marker.isBouncing()) {
                    marker.stopBouncing()
                    notifiedPokestopData[marker.pokestop_id].animationDisabled = true
                }
                break
            case 'spawnpoint':
                if (mapData.spawnpoints[marker.spawnpoint_id].updated) {
                    updateSpawnpointLabel(mapData.spawnpoints[marker.spawnpoint_id], marker)
                }
                break
            case 'weather':
                // Always update label before opening since weather might have become outdated.
                updateWeatherLabel(mapData.weather[marker.s2_cell_id], marker)
                break
        }

        marker.openPopup()
        updateLabelDiffTime()
        marker.options.persist = true
    })

    if (!isMobileDevice() && !isTouchDevice()) {
        marker.on('mouseover', function (e) {
            if (marker.isPopupOpen()) {
                return true
            }

            switch (type) {
                case 'pokemon':
                    if (mapData.pokemons[marker.encounter_id].updated) {
                        updatePokemonLabel(mapData.pokemons[marker.encounter_id], marker)
                    }
                    if (marker.isBouncing()) {
                        marker.stopBouncing()
                        notifiedPokemonData[marker.encounter_id].animationDisabled = true
                    }
                    break
                case 'gym':
                    if (mapData.gyms[marker.gym_id].updated) {
                        updateGymLabel(mapData.gyms[marker.gym_id], marker)
                    }
                    if (marker.isBouncing()) {
                        marker.stopBouncing()
                        notifiedGymData[marker.gym_id].animationDisabled = true
                    }
                    break
                case 'pokestop':
                    if (mapData.pokestops[marker.pokestop_id].updated) {
                        updatePokestopLabel(mapData.pokestops[marker.pokestop_id], marker)
                    }
                    if (marker.isBouncing()) {
                        marker.stopBouncing()
                        notifiedPokestopData[marker.pokestop_id].animationDisabled = true
                    }
                    break
                case 'spawnpoint':
                    if (mapData.spawnpoints[marker.spawnpoint_id].updated) {
                        updateSpawnpointLabel(mapData.spawnpoints[marker.spawnpoint_id], marker)
                    }
                    break
                case 'weather':
                    // Always update label before opening since weather might have become outdated.
                    updateWeatherLabel(mapData.weather[marker.s2_cell_id], marker)
                    break
            }

            marker.openPopup()
            updateLabelDiffTime()
        })
    }

    marker.on('mouseout', function (e) {
        if (!marker.options.persist) {
            marker.closePopup()
        }
    })

    marker.on('popupclose', function (e) {
        switch (type) {
            case 'pokemon':
                mapData.pokemons[marker.encounter_id].updated = false
                break
            case 'gym':
                mapData.gyms[marker.gym_id].updated = false
                break
            case 'pokestop':
                mapData.pokestops[marker.pokestop_id].updated = false
                break
            case 'spawnpoint':
                mapData.spawnpoints[marker.spawnpoint_id].updated = false
                break
        }
        marker.options.persist = false
    })

    return marker
}

function updateStaleMarkers() {
    var markerChange = false

    $.each(mapData.pokemons, function (encounterId, pokemon) {
        if (pokemon.disappear_time <= Date.now()) {
            removePokemon(pokemon)
            markerChange = true
        }
    })

    for (let id of raidIds) {
        if (!isValidRaid(mapData.gyms[id].raid)) {
            mapData.gyms[id].raid = null
            updateGym(id)
            raidIds.delete(id)
        }
    }

    for (let id of upcomingRaidIds) {
        if (isOngoingRaid(mapData.gyms[id].raid)) {
            updateGym(id)
            upcomingRaidIds.delete(id)
        }
    }

    for (let id of invadedPokestopIds) {
        if (!isInvadedPokestop(mapData.pokestops[id])) {
            updatePokestop(id)
            invadedPokestopIds.delete(id)
        }
    }

    for (let id of luredPokestopIds) {
        if (!isLuredPokestop(mapData.pokestops[id])) {
            updatePokestop(id)
            luredPokestopIds.delete(id)
            markerChange = true
        }
    }

    $.each(mapData.spawnpoints, function (id, spawnpoint) {
        if (spawnpoint.spawn_time) {
            const now = Date.now()
            if (spawnpoint.despawn_time < now) {
                const diffhours = Math.ceil((now - spawnpoint.despawn_time) / 3600000)
                mapData.spawnpoints[id].spawn_time += diffhours * 3600000
                mapData.spawnpoints[id].despawn_time += diffhours * 3600000
            }
            const isActive = isNowBetween(mapData.spawnpoints[id].spawn_time, mapData.spawnpoints[id].despawn_time)
            if ((spawnpoint.marker.options.color === 'green' && !isActive) ||
                    (spawnpoint.marker.options.color === 'blue' && isActive)) {
                // Spawn point became active/inactive, update it.
                updateSpawnpoint(id)
            }
        }
    })

    $.each(mapData.scannedLocs, function (id, scannedLoc) {
        if (scannedLoc.last_modified < (Date.now() - 15 * 60 * 1000)) {
            // Remove if older than 15 minutes.
            removeScannedLocation(scannedLoc)
        } else if (map.getBounds().contains(scannedLoc.marker.getLatLng())) {
            updateScannedLocation(id)
        }

    })

    if ($('#stats').hasClass('visible') && markerChange) {
        // Update stats sidebar.
        countMarkers(map)
    }
}

function removeMarker(marker) {
    if (markers.hasLayer(marker)) {
        markers.removeLayer(marker)
    } else {
        markersNoCluster.removeLayer(marker)
    }
}

function loadRawData() {
    var userAuthCode = localStorage.getItem('userAuthCode')
    var loadPokemon = settings.showPokemon
    var loadGyms = settings.showGyms
    var loadRaids = settings.showRaids
    var loadPokestops = settings.showPokestops
    var loadPokestopsNoEvent = settings.showPokestopsNoEvent
    var loadQuests = settings.showQuests
    var loadInvasions = settings.showInvasions
    var loadLures = settings.showLures
    var loadWeather = settings.showWeather
    var loadSpawnpoints = settings.showSpawnpoints
    var loadScannedLocs = settings.showScannedLocations
    var prionotifyactiv = Store.get('showNotifiedPokemonAlways')

    var bounds = map.getBounds()
    var swPoint = bounds.getSouthWest()
    var nePoint = bounds.getNorthEast()
    var swLat = swPoint.lat
    var swLng = swPoint.lng
    var neLat = nePoint.lat
    var neLng = nePoint.lng

    return $.ajax({
        url: 'raw_data',
        type: 'GET',
        data: {
            'userAuthCode': userAuthCode,
            'timestamp': timestamp,
            'swLat': swLat,
            'swLng': swLng,
            'neLat': neLat,
            'neLng': neLng,
            'oSwLat': oSwLat,
            'oSwLng': oSwLng,
            'oNeLat': oNeLat,
            'oNeLng': oNeLng,
            'pokemon': loadPokemon,
            'eids': String(getExcludedPokemon()),
            'reids': String(isShowAllZoom() ? settings.excludedPokemon : reincludedPokemon),
            'prionotify': prionotifyactiv,
            'pokestops': loadPokestops,
            'pokestopsNoEvent': loadPokestopsNoEvent,
            'quests': loadQuests,
            'invasions': loadInvasions,
            'lures': loadLures,
            'gyms': loadGyms,
            'raids': loadRaids,
            'weather': loadWeather,
            'spawnpoints': loadSpawnpoints,
            'scannedLocs': loadScannedLocs,
            'lastpokemon': lastpokemon,
            'lastgyms': lastgyms,
            'lastpokestops': lastpokestops,
            'lastweather': lastweather,
            'lastspawns': lastspawns,
            'lastscannedlocs': lastscannedlocs
        },
        dataType: 'json',
        cache: false,
        beforeSend: function () {
            if (rawDataIsLoading) {
                return false
            } else {
                rawDataIsLoading = true
            }
        },
        error: function () {
            toastError(i8ln('Error getting data!'), i8ln('Please check your connection.'))
        },
        success: function (data) {
            if (data.auth_redirect) {
                window.location = data.auth_redirect
            }
        },
        complete: function () {
            rawDataIsLoading = false
        }
    })
}

function updateMap() {
    loadRawData().done(function (result) {
        $.each(result.pokemons, function (idx, pokemon) {
            processPokemon(pokemon)
        })
        $.each(result.gyms, function (id, gym) {
            processGym(gym)
        })
        $.each(result.pokestops, function (id, pokestop) {
            processPokestop(pokestop)
        })
        $.each(result.weather, function (idx, weather) {
            processWeather(weather)
        })
        $.each(result.spawnpoints, function (idx, spawnpoint) {
            processSpawnpoint(spawnpoint)
        })
        $.each(result.scannedlocs, function (idx, scannedLoc) {
            processScannedLocation(scannedLoc)
        })

        if ($('#stats').hasClass('visible')) {
            countMarkers(map)
        }

        oSwLat = result.oSwLat
        oSwLng = result.oSwLng
        oNeLat = result.oNeLat
        oNeLng = result.oNeLng

        lastpokemon = result.lastpokemon
        lastgyms = result.lastgyms
        lastpokestops = result.lastpokestops
        lastspawns = result.lastspawns
        lastscannedlocs = result.lastscannedlocs
        lastweather = result.lastweather

        if (result.reids instanceof Array) {
            reincludedPokemon = result.reids.filter(function (e) {
                return this.indexOf(e) < 0
            }, reincludedPokemon)
        }
        timestamp = result.timestamp
        lastUpdateTime = Date.now()
    })
}

function updateLabelDiffTime() {
    $('.label-countdown').each(function (index, element) {
        var disappearsAt = getTimeUntil(parseInt(element.getAttribute('disappears-at')))

        var hours = disappearsAt.hour
        var minutes = disappearsAt.min
        var seconds = disappearsAt.sec
        var timestring = ''

        if (disappearsAt.ttime < disappearsAt.now) {
            timestring = 'expired'
        } else if (hours > 0) {
            timestring = lpad(hours, 2, 0) + 'h' + lpad(minutes, 2, 0) + 'm' + lpad(seconds, 2, 0) + 's'
        } else {
            timestring = lpad(minutes, 2, 0) + 'm' + lpad(seconds, 2, 0) + 's'
        }

        $(element).text(timestring)
    })
}

function initPushJS() {
    /* If push.js is unsupported or disabled, fall back on materialize toast
     * notifications. */
    Push.config({
        serviceWorker: 'static/dist/js/serviceWorker.min.js',
        fallback: function (payload) {
            sendToastNotification(
                payload.title,
                payload.body,
                payload.icon,
                payload.data.lat,
                payload.data.lng
            )
        }
    })
}

function createServiceWorkerReceiver() {
    navigator.serviceWorker.addEventListener('message', function (event) {
        const data = JSON.parse(event.data)
        if (data.action === 'centerMap' && data.lat && data.lng) {
            centerMap(data.lat, data.lng, 18)
        }
    })
}

function sendNotification(title, text, icon, lat, lng) {
   var notificationDetails = {
        icon: icon,
        body: text,
        data: {
            lat: lat,
            lng: lng
        }
    }

    if (Push._agents.desktop.isSupported()) {
        /* This will only run in browsers which support the old
         * Notifications API. Browsers supporting the newer Push API
         * are handled by serviceWorker.js. */
        notificationDetails.onClick = function (event) {
            if (Push._agents.desktop.isSupported()) {
                window.focus()
                event.currentTarget.close()
                map.setView(L.latLng(lat, lng), 18)
            }
        }
    }

    /* Push.js requests the Notification permission automatically if
     * necessary. */
    Push.create(title, notificationDetails).catch(function () {
        // Fall back on materialize toast if something goes wrong.
        sendToastNotification(title, text, icon, lat, lng)
    })
}

function sendToastNotification(title, text, iconUrl, lat, lng) {
    var toastId = 'toast' + lat + '_' + lng
    toastId = toastId.replace(/\./gi, '') // Remove all dots.
    const toastHTML = `<div id='${toastId}'style='margin-right:15px;'><img src='${iconUrl}' width='48'></div><div><strong>${title}</strong><br>${text}</div>`
    M.toast({html: toastHTML, displayLength: 10000})

    var $toast = $('#' + toastId).parent()
    $toast.css('cursor', 'pointer')
    $toast.on('click', function () {
        map.setView(L.latLng(lat, lng), 18)
        var toastChildElement = document.getElementById(toastId)
        var toastElement = toastChildElement.closest('.toast') // Get parent.
        var toastInstance = M.Toast.getInstance(toastElement)
        toastInstance.dismiss()
    })
}

function createUserLocationButton() {
    var locationMarker = L.control({position: 'bottomright'})
    locationMarker.onAdd = function (map) {
        var locationContainer = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar')

        var locationButton = document.createElement('a')
        locationButton.innerHTML = '<i class="material-icons">my_location</i>'
        locationButton.title = 'My location'
        locationButton.href = '#'
        locationContainer.appendChild(locationButton)

        var locationIcon = locationButton.firstChild
        locationIcon.style.fontSize = '20px'
        locationIcon.style.marginTop = '3px'

        locationButton.addEventListener('click', function () {
            centerMapOnUserLocation()
        })

        return locationContainer
    }

    locationMarker.addTo(map)
}

function centerMapOnUserLocation() {
    if (!hasLocationSupport()) {
        return
    }

    var locationIcon = document.getElementsByClassName('leaflet-control-locate')[0].firstChild.firstChild
    var animationInterval = setInterval(function () {
        if (locationIcon.innerHTML === 'my_location') {
            locationIcon.innerHTML = 'location_searching'
        } else {
            locationIcon.innerHTML = 'my_location'
        }
    }, 500)

    function succes(pos) {
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude)
        if (userLocationMarker) {
            userLocationMarker.setLatLng(latlng)
        }
        map.panTo(latlng)
        clearInterval(animationInterval)
        locationIcon.innerHTML = 'my_location'
        Store.set('lastUserLocation', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        })
    }

    function error(e) {
        toastError(i8ln('Error getting your location!'), e.message)
        clearInterval(animationInterval)
        locationIcon.innerHTML = 'my_location'
    }

    navigator.geolocation.getCurrentPosition(succes, error, {enableHighAccuracy: true})
}

function startFollowingUser() {
    centerMapOnUserLocation()
    followUserHandle = setInterval(centerMapOnUserLocation, 3000)
}

function stopFollowingUser() {
    clearInterval(followUserHandle)
    followUserHandle = null
}

function changeLocation(lat, lng) {
    const loc = L.latLng(lat, lng)
    map.panTo(loc)
}

function centerMap(lat, lng, zoom) {
    changeLocation(lat, lng)
    if (zoom) {
        map.setZoom(zoom)
    }
}

function createUpdateWorker() {
    try {
        if (isMobileDevice() && window.Worker) {
            var updateBlob = new Blob([`onmessage = function(e) {
                var data = e.data
                if (data.name === 'backgroundUpdate') {
                    self.setInterval(function () {self.postMessage({name: 'backgroundUpdate'})}, 5000)
                }
            }`])

            var updateBlobURL = window.URL.createObjectURL(updateBlob)

            updateWorker = new Worker(updateBlobURL)

            updateWorker.onmessage = function (e) {
                var data = e.data
                if (document.hidden && data.name === 'backgroundUpdate' && Date.now() - lastUpdateTime > 2500) {
                    updateMap()
                }
            }

            updateWorker.postMessage({
                name: 'backgroundUpdate'
            })
        }
    } catch (ex) {
        console.log('Webworker error: ' + ex.message)
    }
}

function showGymDetails(id) { // eslint-disable-line no-unused-vars
    var sidebar = document.querySelector('#gym-details')
    var sidebarClose

    sidebar.classList.add('visible')

    var data = $.ajax({
        url: 'gym_data',
        type: 'GET',
        data: {
            'id': id
        },
        dataType: 'json',
        cache: false
    })

    data.done(function (result) {
        var pokemonHtml = ''
        var pokemonIcon
        if (serverSettings.generateImages) {
            result.pokemon_id = result.guard_pokemon_id
            pokemonIcon = `<img class='guard-pokemon-icon' src='${getPokemonRawIconUrl(result)}'>`
        } else {
            pokemonIcon = `<i class="pokemon-large-sprite n${result.guard_pokemon_id}"></i>`
        }
        pokemonHtml = `
            <div class='section-divider'></div>
              <center>
                Gym Leader:<br>
                ${pokemonIcon}<br>
                <b>${result.guard_pokemon_name}</b>
              </center>`

        var topPart = gymLabel(result)
        sidebar.innerHTML = `${topPart}${pokemonHtml}`

        sidebarClose = document.createElement('a')
        sidebarClose.href = '#'
        sidebarClose.className = 'close'
        sidebarClose.tabIndex = 0
        sidebar.appendChild(sidebarClose)

        sidebarClose.addEventListener('click', function (event) {
            event.preventDefault()
            event.stopPropagation()
            sidebar.classList.remove('visible')
        })
    })
}

// TODO: maybe delete.
function getSidebarGymMember(pokemon) { // eslint-disable-line no-unused-vars
    var perfectPercent = getIvsPercentage(pokemon)
    var moveEnergy = Math.round(100 / pokemon.move_2_energy)
    const motivationZone = ['Good', 'Average', 'Bad']
    const motivationPercentage = (pokemon.cp_decayed / pokemon.pokemon_cp) * 100
    var colorIdx = 0
    if (motivationPercentage <= 46.66) {
        colorIdx = 2
    } else if ((motivationPercentage > 46.66) && (motivationPercentage < 73.33)) {
        colorIdx = 1
    }
    // Skip getDateStr() so we can re-use the moment.js object.
    var relativeTime = 'Unknown'
    var absoluteTime = ''

    if (pokemon.deployment_time) {
        let deploymentTime = moment(pokemon.deployment_time)
        relativeTime = deploymentTime.fromNow()
        // Append as string so we show nothing when the time is Unknown.
        absoluteTime = '<div class="gym pokemon">(' + deploymentTime.format('Do MMM HH:mm') + ')</div>'
    }

    var pokemonImage = getPokemonRawIconUrl(pokemon)
    return `
                    <tr onclick=toggleGymPokemonDetails(this)>
                        <td width="30px">
                            <img class="gym pokemon sprite" src="${pokemonImage}">
                        </td>
                        <td>
                            <div class="gym pokemon"><span class="gym pokemon name">${pokemon.pokemon_name}</span></div>
                            <div>
                                <span class="gym pokemon motivation decayed zone ${motivationZone[colorIdx].toLowerCase()}">${pokemon.cp_decayed}</span>
                            </div>
                        </td>
                        <td width="190" align="center">
                            <div class="gym pokemon">${pokemon.trainer_name} (${pokemon.trainer_level})</div>
                            <div class="gym pokemon">Deployed ${relativeTime}</div>
                            ${absoluteTime}
                        </td>
                        <td width="10">
                            <!--<a href="#" onclick="toggleGymPokemonDetails(this)">-->
                                <i class="fa fa-angle-double-down"></i>
                            <!--</a>-->
                        </td>
                    </tr>
                    <tr class="details">
                        <td colspan="2">
                            <div class="ivs">
                                <div class="iv">
                                    <div class="type">ATK</div>
                                    <div class="value">
                                        ${pokemon.iv_attack}
                                    </div>
                                </div>
                                <div class="iv">
                                    <div class="type">DEF</div>
                                    <div class="value">
                                        ${pokemon.iv_defense}
                                    </div>
                                </div>
                                <div class="iv">
                                    <div class="type">STA</div>
                                    <div class="value">
                                        ${pokemon.iv_stamina}
                                    </div>
                                </div>
                                <div class="iv" style="width: 36px;"">
                                    <div class="type">PERFECT</div>
                                    <div class="value">
                                        ${perfectPercent.toFixed(0)}<span style="font-size: .6em;">%</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td colspan="2">
                            <div class="moves">
                                <div class="move">
                                    <div class="name">
                                        ${pokemon.move_1_name}
                                        <div class="type ${pokemon.move_1_type['type_en'].toLowerCase()}">${pokemon.move_1_type['type']}</div>
                                    </div>
                                    <div class="damage">
                                        ${pokemon.move_1_damage}
                                    </div>
                                </div>
                                <br>
                                <div class="move">
                                    <div class="name">
                                        ${pokemon.move_2_name}
                                        <div class="type ${pokemon.move_2_type['type_en'].toLowerCase()}">${pokemon.move_2_type['type']}</div>
                                        <div>
                                            <i class="move-bar-sprite move-bar-sprite-${moveEnergy}"></i>
                                        </div>
                                    </div>
                                    <div class="damage">
                                        ${pokemon.move_2_damage}
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    `
}

// TODO: maybe delete.
function toggleGymPokemonDetails(e) { // eslint-disable-line no-unused-vars
    e.lastElementChild.firstElementChild.classList.toggle('fa-angle-double-up')
    e.lastElementChild.firstElementChild.classList.toggle('fa-angle-double-down')
    e.nextElementSibling.classList.toggle('visible')
}

//
// Page Ready Execution
//

$(function () {
   /* TODO: Some items are being loaded asynchronously, but synchronous code
    * depends on it. Restructure to make sure these "loading" tasks are
    * completed before continuing. Right now it "works" because the first
    * map update is scheduled after 5s. */

    // populate Navbar Style menu
    $selectStyle = $('#map-style')

    // Load Stylenames, translate entries, and populate lists
    $.getJSON('static/dist/data/mapstyle.min.json').done(function (data) {
        var styleList = []

        $.each(data, function (key, value) {
            styleList.push({
                id: key,
                text: i8ln(value)
            })
        })

        // setup the stylelist
        /*$selectStyle.select2({
            placeholder: 'Select Style',
            data: styleList,
            minimumResultsForSearch: Infinity
        })*/

        // setup the list change behavior
        $selectStyle.on('change', function (e) {
            selectedStyle = $selectStyle.val()
            setTitleLayer(selectedStyle)
            Store.set('map_style', selectedStyle)
        })

        // recall saved mapstyle
        $selectStyle.val(Store.get('map_style')).trigger('change')
    })

    $selectSearchIconMarker = $('#iconmarker-style')
    $selectLocationIconMarker = $('#locationmarker-style')

    $.getJSON('static/dist/data/searchmarkerstyle.min.json').done(function (data) {
        searchMarkerStyles = data
        var searchMarkerStyleList = []

        $.each(data, function (key, value) {
            searchMarkerStyleList.push({
                id: key,
                text: value.name
            })
        })

        /*$selectSearchIconMarker.select2({
            placeholder: 'Select Icon Marker',
            data: searchMarkerStyleList,
            minimumResultsForSearch: Infinity
        })*/

        $selectSearchIconMarker.on('change', function (e) {
            var selectSearchIconMarker = $selectSearchIconMarker.val()
            Store.set('searchMarkerStyle', selectSearchIconMarker)
            setTimeout(function () { updateStartLocationMarker(selectSearchIconMarker) }, 300)
        })

        $selectSearchIconMarker.val(Store.get('searchMarkerStyle')).trigger('change')

        /*$selectLocationIconMarker.select2({
            placeholder: 'Select Location Marker',
            data: searchMarkerStyleList,
            minimumResultsForSearch: Infinity
        })*/

        $selectLocationIconMarker.on('change', function (e) {
            var locStyle = this.value
            Store.set('locationMarkerStyle', locStyle)
            setTimeout(function () { updateUserLocationMarker(locStyle) }, 300)
        })

        $selectLocationIconMarker.val(Store.get('locationMarkerStyle')).trigger('change')
    })
})

$(function () {
    moment.locale(language)

    $selectNotifyRaidPokemon = $('#notify-raid-pokemon')
    $selectNotifyEggs = $('#notify-eggs')
    $selectNotifyInvasions = $('#notify-invasions')

    /*$.each(questItemIds, function (key, id) {
        $('.quest-item-list').append(`<div class='quest-item-sprite' data-value='${id}'><img class='quest-item-select-icon' src='static/images/quest/reward_${id}_1.png'></div>`)
    })
    $('.quest-item-list').append(`<div class='quest-item-sprite' data-value='6'><img class='quest-item-select-icon' src='static/images/quest/reward_stardust.png'></div>`)*/

    // Load pokemon names and populate lists
    $.getJSON('static/dist/data/pokemon.min.json').done(function (data) {
        var pokemonIds = []

        var id
        for (id = 1; id <= availablePokemonCount; id++) {
            pokemonIds.push(id)
        }
        // Meltan and Melmetal
        pokemonIds.push(808)
        pokemonIds.push(809)

        $selectNotifyRaidPokemon.on('change', function (e) {
            if ($selectNotifyRaidPokemon.val().length > 0) {
                notifyRaidPokemon = $selectNotifyRaidPokemon.val().split(',').map(Number).sort(function (a, b) {
                    return a - b
                })
            } else {
                notifyRaidPokemon = []
            }
            if (notifyRaidPokemon.length === pokemonIds.length) {
                $('a[href$="#tabs_notify_raid_pokemon-1"]').text('Raid Bosses (All)')
            } else {
                $('a[href$="#tabs_notify_raid_pokemon-1"]').text(`Raid Bosses (${notifyRaidPokemon.length})`)
            }
            updateGyms()
            Store.set('remember_select_notify_raid_pokemon', notifyRaidPokemon)
        })

        $selectNotifyEggs.on('change', function (e) {
            notifyEggs = $selectNotifyEggs.val().map(Number)
            updateGyms()
            Store.set('remember_select_notify_eggs', notifyEggs)
        })

        // Recall saved lists.
        $selectNotifyRaidPokemon.val(Store.get('remember_select_notify_raid_pokemon')).trigger('change')
        $selectNotifyEggs.val(Store.get('remember_select_notify_eggs')).trigger('change')

        /*if (isTouchDevice() && isMobileDevice()) {
            $('.select2-search input').prop('readonly', true)
        }*/
    })

    /*// Load invasion data and populate list.
    $.getJSON('static/dist/data/invasions.min.json').done(function (data) {
        let invasionIds = []
        for (var id in data) {
            idToInvasion[id] = data[id]
            $('.invasion-list').append(`<div class='invasion-sprite' data-value='${id}'><div id='invasion-type-list'>${idToInvasion[id].type}</div><img class='invasion-select-icon' src='static/images/invasion/${id}.png' width='32px'><div id='invasion-gender-list'>${idToInvasion[id].grunt}</div></div>`)
            invasionIds.push(id)
        }

        $('.invasion-list').on('click', '.invasion-sprite', function () {
            var img = $(this)
            var inputElement = $(this).parent().parent().find('input[id$=invasions]')
            var value = inputElement.val().length > 0 ? inputElement.val().split(',') : []
            var id = img.data('value').toString()
            if (img.hasClass('active')) {
                inputElement.val(value.filter(function (elem) {
                    return elem !== id
                }).join(',')).trigger('change')
                img.removeClass('active')
            } else {
                inputElement.val((value.concat(id).join(','))).trigger('change')
                img.addClass('active')
            }
        })

        $('.invasion-select-all').on('click', function (e) {
            e.preventDefault()
            var parent = $(this).parent().parent()
            parent.find('.invasion-list .invasion-sprite').addClass('active')
            parent.find('input[id$=invasions]').val(invasionIds.join(',')).trigger('change')
        })

        $('.invasion-deselect-all').on('click', function (e) {
            e.preventDefault()
            var parent = $(this).parent().parent()
            parent.find('.invasion-list .invasion-sprite').removeClass('active')
            parent.find('input[id$=invasions]').val('').trigger('change')
        })

        $selectNotifyInvasions.on('change', function (e) {
            if ($selectNotifyInvasions.val().length > 0) {
                notifyInvasions = $selectNotifyInvasions.val().split(',').map(Number).sort(function (a, b) {
                    return a - b
                })
            } else {
                notifyInvasions = []
            }
            if (notifyInvasions.length === invasionIds.length) {
                $('a[href$="#tabs_notify_invasion-1"]').text('Invasions (All)')
            } else {
                $('a[href$="#tabs_notify_invasion-1"]').text(`Invasions (${notifyInvasions.length})`)
            }
            updatePokestops()
            Store.set('remember_select_notify_invasions', notifyInvasions)
        })

        $selectNotifyInvasions.val(Store.get('remember_select_notify_invasions')).trigger('change')
    })*/

    // run interval timers to regularly update map, rarity and timediffs
    window.setInterval(updateLabelDiffTime, 1000)
    window.setInterval(updateMap, 2000)
    window.setInterval(updateStaleMarkers, 2500)
    if (serverSettings.rarity) {
        window.setInterval(updatePokemonRarities(serverSettings.rarityFileName, function () {}), 300000)
    }

    createUpdateWorker()


    // Initialize dataTable in statistics sidebar
    //   - turn off sorting for the 'icon' column
    //   - initially sort 'name' column alphabetically

    /*$('#pokemon-table').DataTable({
        paging: false,
        searching: false,
        info: false,
        'scrollX': true,
        errMode: 'throw',
        'language': {
            'emptyTable': ''
        },
        'columns': [
            { 'orderable': false },
            null,
            null,
            null,
            null
        ]
    }).order([1, 'asc'])

    $('#gym-table').DataTable({
        paging: false,
        searching: false,
        info: false,
        'scrollX': true,
        errMode: 'throw',
        'language': {
            'emptyTable': ''
        },
        'columns': [
            { 'orderable': false },
            null,
            null,
            null
        ]
    }).order([1, 'asc'])

    $('#pokestop-table').DataTable({
        paging: false,
        searching: false,
        info: false,
        'scrollX': true,
        errMode: 'throw',
        'language': {
            'emptyTable': ''
        },
        'columns': [
            { 'orderable': false },
            null,
            null,
            null
        ]
    }).order([1, 'asc'])*/
})
