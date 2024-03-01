import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Mapbox, {
  RasterDemSource,
  Terrain,
  BackgroundLayer,
} from '@rnmapbox/maps';
import placesData from '../world.geo.json';
import * as turf from '@turf/turf';
import Config from 'react-native-config';

const { width, height } = Dimensions.get('window');

Mapbox.setAccessToken(Config.MAPBOX_ACCESS_TOKEN);

const wonders = [
  { name: 'Mount Everest Peak, Nepal', coordinates: [86.925, 27.9881] },
  {
    name: 'Great Pyramid of Giza, Egypt',
    coordinates: [31.1342, 29.9792],
  },
  {
    name: 'Hanging Gardens of Babylon, Iraq',
    coordinates: [44.4208, 32.5364],
  },
  {
    name: 'Statue of Zeus at Olympia, Greece',
    coordinates: [21.6254, 37.6411],
  },
  {
    name: 'Temple of Artemis at Ephesus, Turkey',
    coordinates: [27.3635, 37.9497],
  },
  {
    name: 'Mausoleum at Halicarnassus, Turkey',
    coordinates: [27.4305, 37.0379],
  },
  {
    name: 'Colossus of Rhodes, Greece',
    coordinates: [28.2278, 36.4511],
  },
  {
    name: 'Lighthouse of Alexandria, Egypt',
    coordinates: [29.9187, 31.2001],
  },
  {
    name: 'Great Wall of China, China',
    coordinates: [116.5704, 40.4319],
  },
  {
    name: 'Machu Picchu, Peru',
    coordinates: [-72.545, -13.1631],
  },
];

const searchPlaces = (query) => {
  return placesData.features.filter(feature => {
    const placeName = feature.properties.name.toLowerCase();
    return placeName.includes(query.toLowerCase());
  });
};

const route = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [86.925, 27.9881],
      [86.926, 27.9891],
      [86.926, 27.9871],
      [86.924, 27.9871],
    ],
  },
};

const App = () => {
  const [styleURL, setStyleURL] = useState(Mapbox.StyleURL.Outdoors);
  const [modalVisible, setModalVisible] = useState(false);
  const [locations, setLocations] = useState(wonders[0]);
  const [centerCoordinate, setCenterCoordinate] = useState([86.925, 27.9881]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(true);

  const handleSearch = query => {
    setSearchQuery(query);
    const results = searchPlaces(query);
    setSearchResults(results);
    setMapInteractionEnabled(results.length === 0);
  };

  const getCoordinatesFromFeature = (feature) => {
    switch (feature.geometry.type) {
      case 'Point':
        return feature.geometry.coordinates;
      case 'Polygon':
      case 'MultiPolygon':
        const center = turf.centroid(feature);
        return center.geometry.coordinates;
      case 'LineString':
        return feature.geometry.coordinates[0];
      default:
        console.error('Unsupported geometry type:', feature.geometry.type);
        return null;
    }
  };

  const stylesList = [
    { label: 'Street', value: Mapbox.StyleURL.Street },
    { label: 'Dark', value: Mapbox.StyleURL.Dark },
    { label: 'Light', value: Mapbox.StyleURL.Light },
    { label: 'Outdoors', value: Mapbox.StyleURL.Outdoors },
    { label: 'Satellite', value: Mapbox.StyleURL.Satellite },
  ];

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <BackgroundLayer
          id="backgroundLayer"
          style={{
            backgroundColor: '#e0e0e0',
          }}
        />
        <Mapbox.MapView style={styles.map} styleURL={styleURL}>
          <RasterDemSource
            id="terrainData"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
          />

          <Terrain sourceID="terrainData" style={{ exaggeration: 2 }} />
          <Mapbox.ShapeSource id="routeSource" shape={route}>
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: 'blue',
                lineWidth: 5,
              }}
            />
          </Mapbox.ShapeSource>

          <Mapbox.Camera
            zoomLevel={13}
            centerCoordinate={centerCoordinate}
            pitch={60}
          />
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={() => setModalVisible(true)}>
            <Text style={{ fontSize: 21 }}>≡</Text>
          </TouchableOpacity>
          <Mapbox.Light anchor="viewport" position={[1.15, 210, 30]} />
        </Mapbox.MapView>
        <View style={styles.settings} pointerEvents="box-none">
          <TextInput
            style={styles.textInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search for places..."
            placeholderTextColor="#aaa"
          />
          {searchResults.map((result, index) => (
            <TouchableOpacity
              style={styles.searchResult}
              key={index}
              onPress={() => {
                const coords = getCoordinatesFromFeature(result);
                if (coords) {
                  setCenterCoordinate(coords);
                  setSearchResults([]);
                  setMapInteractionEnabled(true);
                }
              }}>
              <Text>{result.properties.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Modal animationType="fade" transparent={true} visible={modalVisible}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}>
              <Text style={{ fontSize: 20, color: '#fff' }}>X</Text>
            </TouchableOpacity>
            <ScrollView style={{ width: '90%' }} contentContainerStyle={{ alignItems: 'center', width: '100%', marginTop: 40 }}>
              <Text style={{ color: '#fff', marginBottom: 10 }}>
                Select Map Style
              </Text>
              {stylesList.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalButton}
                  onPress={() => {
                    setStyleURL(item.value);
                    setModalVisible(false);
                  }}>
                  <Text>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <Text style={{ color: '#fff', marginTop: 20, marginBottom: 10 }}>
                Select Location
              </Text>
              {wonders.map((wonder, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalButton}
                  onPress={() => {
                    setLocations(wonder);
                    setCenterCoordinate(wonder.coordinates);
                    setModalVisible(false);
                  }}>
                  <Text>{wonder.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  container: {
    height: height,
    width: width,
  },
  map: {
    flex: 1,
    zIndex: 1,
  },
  dropdownButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalButton: {
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  closeButton: {
    width: '100%',
    padding: 10,
    backgroundColor: '#ddd',
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  hamburgerButton: {
    position: 'absolute',
    top: 54,
    right: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  textInput: {
    height: 40,
    width: '90%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  settings: {
    position: 'absolute',
    width: '75%',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    zIndex: 1000,
  },
  searchResult: {
    width: '80%',
    padding: 10,
    backgroundColor: '#fff',
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 2,
  },
});
