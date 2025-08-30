<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { type ApiResponse } from '~~/shared/types/apiResponse';
import type { PeerInfo } from '~~/shared/types/bitcoinCore';
import type { GeoIpResponse } from '~~/shared/types/geoip';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style } from 'ol/style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

const route = useRoute();
const nodeIndex = parseInt(route.query.i ? route.query.i.toString() : '0');
const bitcoinStore = useBitcoin();
const dashboardNode = ref(bitcoinStore.dashboardNodes[nodeIndex]);

const apiResponse = ref<ApiResponse<PeerInfo[]>>();
const geoLocations = ref<GeoIpResponse[]>([]);
const mapContainer = ref<HTMLDivElement | null>(null);
let map: Map | null = null;
const isLoading = ref(true);

async function fetchPeers() {
  isLoading.value = true;
  try {
    const response = await $fetch<ApiResponse<PeerInfo[]>>(
      '/api/getPeerInfo?host=' + dashboardNode.value?.host
    );

    if (response.success && response.data && response.data.length > 0) {
      apiResponse.value = response;
      console.log('Fetched peer data:', response.data);
      await fetchGeoLocations(response.data);
      await nextTick();
      renderMap();
    } else {
      console.error('API response missing success or data:', response);
    }
  } catch (error) {
    console.error('Error fetching peers:', error);
  } finally {
    isLoading.value = false;
  }
}

async function fetchGeoLocations(peers: PeerInfo[]) {
  const ipSet = new Set(
    peers
      .filter(
        (peer) =>
          peer.network === 'ipv4' ||
          peer.network === 'ipv6' ||
          peer.network === 'onion'
      )
      .map((peer) => {
        const addr = peer.addr.split(':')[0]?.replace('[', '').replace(']', '');
        return addr?.includes('.onion') ? peer.addr : addr;
      })
      .filter((addr) => addr !== '127.0.0.1')
  );
  const newGeoLocations: GeoIpResponse[] = [];
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex =
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:?:[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}$/;
  const validIps: string[] = [];

  for (const addr of ipSet) {
    let resolvedAddr = addr;
    if (addr?.includes('.onion')) {
      console.log(
        `.onion address detected: ${addr} - skipped due to lack of geo support`
      );
      continue;
    } else if (
      !ipv4Regex.test(addr ? addr : '') &&
      !ipv6Regex.test(addr ? addr : '')
    ) {
      try {
        const response: any = await $fetch(
          `https://dns.google/resolve?name=${addr}`
        );
        resolvedAddr = response?.Answer?.[0]?.data || addr;
      } catch (error) {
        console.warn(`DNS resolution failed for ${addr}:`, error);
      }
    }
    if (
      !ipv4Regex.test(resolvedAddr || '') &&
      !ipv6Regex.test(resolvedAddr || '')
    ) {
      console.warn(`Skipping unresolved address: ${addr}`);
      continue;
    }
    validIps.push(resolvedAddr || '');
  }

  try {
    const response = await $fetch<GeoIpResponse[]>('/api/geoip/batch', {
      method: 'POST',
      body: { ips: validIps },
      parseResponse: JSON.parse,
    });
    newGeoLocations.push(...response);
  } catch (error) {
    console.error(`Error fetching batch geolocation:`, error);
  }

  geoLocations.value = newGeoLocations;
}

function renderMap() {
  if (!mapContainer.value) return;
  const vectorSource = new VectorSource();
  geoLocations.value.forEach((geo, index) => {
    const lat = parseFloat(geo.latitude as any);
    const lon = parseFloat(geo.longitude as any);
    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([lon, lat])),
        id: `${geo.ip}-${index}`,
      });
      vectorSource.addFeature(feature);
      console.log(
        `Added feature for ${
          geo.ip
        } at [${lat}, ${lon}] with ID: ${feature.getId()}`
      );
    }
  });

  if (map) {
    map.setLayers([]);
    map.dispose();
  }
  map = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({
        source: new OSM({
          url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          attributions:
            '<span style="color: #ffffff;">© CARTO © OpenStreetMap contributors</span>',
        }),
        className: 'ol-layer-dark',
      }),
      new VectorLayer({
        source: vectorSource,
        style: new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({ color: '#f7931a' }),
            stroke: new Stroke({ color: '#ffffff', width: 2 }),
          }),
        }),
      }),
    ],
    view: new View({
      center: fromLonLat([103.9681, 1.3665]),
      zoom: 1,
      minZoom: 1,
    }),
  });
  if (vectorSource.getFeatures().length > 0) {
    map.getView().fit(vectorSource.getExtent(), {
      padding: [100, 100, 100, 100],
      maxZoom: 4,
    });
  }
}

onMounted(async () => {
  await fetchPeers();
});
</script>

<template>
  <UContainer class="mt-4">
    <h1 class="text-xl mb-2 text-white">
      {{ dashboardNode?.name }} Connection Details
    </h1>
    <div class="grid grid-cols-1 gap-4">
      <div
        ref="mapContainer"
        class="w-full h-[500px] rounded-lg shadow-lg"
      ></div>
      <div v-if="isLoading" class="text-center text-gray-400">
        Loading peer data...
      </div>
      <div v-else-if="apiResponse?.data" class="overflow-x-auto">
        <table class="min-w-full border border-gray-700 bg-gray-800 text-white">
          <thead>
            <tr class="bg-gray-900">
              <th class="border border-gray-700 p-2">ID</th>
              <th class="border border-gray-700 p-2">Address</th>
              <th class="border border-gray-700 p-2">Network</th>
              <th class="border border-gray-700 p-2">Connection Type</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="peer in apiResponse.data"
              :key="peer.id"
              class="hover:bg-gray-700"
            >
              <td class="border border-gray-700 p-2 text-center">
                {{ peer.id }}
              </td>
              <td class="border border-gray-700 p-2">{{ peer.addr }}</td>
              <td class="border border-gray-700 p-2 text-center">
                {{ peer.network }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ peer.connection_type }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-center text-gray-400">
        No peer data available or error occurred
      </div>
    </div>
  </UContainer>
</template>
