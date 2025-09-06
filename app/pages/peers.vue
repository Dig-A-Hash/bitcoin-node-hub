<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { type ApiResponse } from '~~/shared/types/apiResponse';
import type { PeerInfo } from '~~/shared/types/bitcoinCore';
import type { GeoIpResponse } from '~~/shared/types/geoip';
import { Map, View, Overlay } from 'ol';
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
import { UBadge, UButton } from '#components';

const router = useRouter();

// Configurable Items
const INBOUND_COLOR = '#f7931a'; // Orange
const OUTBOUND_COLOR = '#3399ff'; // Blue
const STROKE_COLOR = '#000000'; // Black stroke for visibility
const HEADER_HEIGHT = 135; // Replace with your actual header height (in pixels)

const route = useRoute();
const nodeIndex = parseInt(route.query.i ? route.query.i.toString() : '0');
const bitcoinStore = useBitcoin();
const dashboardNode = ref(bitcoinStore.dashboardNodes[nodeIndex]);

const apiResponse = ref<ApiResponse<PeerInfo[]>>();
const geoLocations = ref<GeoIpResponse[]>([]);
const mapContainer = ref<HTMLDivElement | null>(null);
const tooltipContainer = ref<HTMLDivElement | null>(null);
let map: Map | null = null;
let tooltip: Overlay | null = null;
const isLoading = ref(true);
const combinedPeerData = ref<(PeerInfo & { geo?: GeoIpResponse })[]>([]);
const isDrawerOpen = ref(false);
const selectedPeer = ref<(PeerInfo & { geo?: GeoIpResponse }) | null>(null);
const mapHeight = ref(100);

const columns: TableColumn<PeerInfo & { geo?: GeoIpResponse }>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: 'Location',
    cell: ({ row }) => {
      const address = row.original.addr;
      const type = row.original.connection_type;
      const city = row.original.geo?.city ?? 'N/A';
      const state = row.original.geo?.state ?? 'N/A';
      const country = row.original.geo?.country ?? 'N/A';
      return h('div', { class: 'flex flex-col cursor-pointer' }, [
        h('div', { class: 'font-bold  truncate max-w-[150px]' }, address),
        h('div', { class: 'truncate max-w-[150px]' }, `${city}`),
        h('div', { class: 'truncate max-w-[150px]' }, `${state}, ${country}`),
        h('div', { class: 'text-xs truncate max-w-[150px]' }, `${type}`),
      ]);
    },
  },
  {
    accessorKey: 'inbound',
    header: '',
    cell: ({ row }) => {
      const inBound = row.original.inbound;
      return h('div', { class: '' }, [
        h('div', { class: 'text-center' }, [
          h(
            UBadge,
            {
              variant: 'solid',
              class: `uppercase text-white ${
                inBound ? 'bg-amber-600' : 'bg-blue-500'
              }`,
              size: 'sm',
            },
            () => (inBound ? 'In' : 'Out')
          ),
        ]),
        h('div', { class: 'text-center mt-4' }, [
          h(
            UButton,
            {
              title: 'Peer Details',
              variant: 'subtle',
              color: `${inBound ? 'warning' : 'secondary'}`,
              icon: 'material-symbols:side-navigation',
              size: 'sm',
              onClick: () => {
                selectedPeer.value = row.original;
                isDrawerOpen.value = true;
              },
            },
            () => ''
          ),
        ]),
      ]);
    },
  },
];

const calculateMapHeight = () => {
  if (window.innerWidth < 640) {
    mapHeight.value = 500;
    return;
  }

  const titleElement = document.querySelector('h1'); // Select the h1 title
  const containerElement = document.querySelector('.mt-4'); // Select UContainer
  let titleHeight = 0;

  if (titleElement && containerElement) {
    const titleRect = titleElement.getBoundingClientRect();
    const containerPadding =
      parseFloat(getComputedStyle(containerElement).paddingTop) || 0;
    titleHeight =
      titleRect.height +
        parseFloat(getComputedStyle(titleElement).marginBottom) || 0;
    titleHeight += containerPadding; // Account for UContainer's top padding/margin
  }

  const availableHeight = window.innerHeight - HEADER_HEIGHT - titleHeight;
  mapHeight.value = Math.max(availableHeight, 300); // Ensure a minimum height
};

async function fetchPeers() {
  isLoading.value = true;
  try {
    const response = await $fetch<ApiResponse<PeerInfo[]>>(
      '/api/getPeerInfo?host=' + dashboardNode.value?.host
    );

    if (response.success && response.data && response.data.length > 0) {
      apiResponse.value = response;
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
        let addr = peer.addr;
        if (peer.network === 'ipv6') {
          addr = addr.replace(/\[|\]/g, '').replace(/:\d+$/, '');
        } else if (peer.network === 'ipv4') {
          addr = addr.split(':')[0] || '';
        }
        return addr?.includes('.onion') ? peer.addr : addr;
      })
      .filter((addr) => addr !== '127.0.0.1')
  );
  const newGeoLocations: GeoIpResponse[] = [];
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/; // Updated regex
  const validIps: string[] = [];

  for (const addr of ipSet) {
    let resolvedAddr = addr;
    if (addr?.includes('.onion')) {
      continue;
    } else if (!ipv4Regex.test(addr || '') && !ipv6Regex.test(addr || '')) {
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

  combinedPeerData.value = peers.map((peer) => {
    const ip =
      peer.network === 'ipv6'
        ? peer.addr.replace(/\[|\]/g, '').replace(/:\d+$/, '')
        : peer.addr.split(':')[0]?.replace('[', '').replace(']', '');
    const geo = newGeoLocations.find((g) => g.ip === ip);
    return { ...peer, geo };
  });
}

function renderMap() {
  if (!mapContainer.value || !tooltipContainer.value) return;
  const vectorSource = new VectorSource();
  combinedPeerData.value.forEach((peer, index) => {
    const geo = peer.geo;
    if (geo && geo.latitude && geo.longitude) {
      const lat = Number(geo.latitude);
      const lon = Number(geo.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([lon, lat])),
          index: index,
          inbound: peer.inbound,
          ip: peer.addr,
          city: geo.city || 'N/A',
          country: geo.country || 'N/A',
          connection_type: peer.connection_type || 'N/A',
        });
        vectorSource.addFeature(feature);
      }
    }
  });

  if (map) {
    map.setLayers([]);
    map.dispose();
  }

  // Create custom canvas with willReadFrequently
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    console.warn('Failed to create canvas context with willReadFrequently');
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
        style: (feature) => {
          const isInbound = feature.get('inbound');
          return new Style({
            image: new Circle({
              radius: 6,
              fill: new Fill({
                color: isInbound ? INBOUND_COLOR : OUTBOUND_COLOR,
              }),
              stroke: new Stroke({ color: STROKE_COLOR, width: 1 }),
            }),
          });
        },
      }),
    ],
    view: new View({
      center: fromLonLat([103.9681, 1.3665]),
      zoom: 1,
      minZoom: 1,
    }),
  });

  // Initialize tooltip overlay
  tooltip = new Overlay({
    element: tooltipContainer.value,
    offset: [10, -10],
    positioning: 'bottom-left',
    stopEvent: false,
  });
  map.addOverlay(tooltip);

  // Handle pointermove for tooltip
  map.on('pointermove', (event) => {
    if (!tooltip) return;
    const pixel = map?.getEventPixel(event.originalEvent);
    const feature = map?.forEachFeatureAtPixel(pixel || [0], (feat) => feat, {
      hitTolerance: 10,
    });
    if (feature) {
      const coordinates = (feature.getGeometry() as Point).getCoordinates();
      tooltip.setPosition(coordinates);
      tooltipContainer.value!.innerHTML = `
        <div class="tooltip-content">
          <strong>IP:</strong> ${feature.get('ip')}<br>
          <strong>Location:</strong> ${feature.get('city')}, ${feature.get(
        'country'
      )}<br>
          <strong>Inbound:</strong> ${feature.get('inbound') ? 'Yes' : 'No'}
        </div>
      `;
      tooltipContainer.value!.style.display = 'block';
      mapContainer.value!.style.cursor = 'pointer';
    } else {
      tooltipContainer.value!.style.display = 'none';
      mapContainer.value!.style.cursor = 'default';
    }
  });

  // Handle click to select row and scroll
  map.on('singleclick', (event) => {
    const pixel = map?.getEventPixel(event.originalEvent);
    const feature = map?.forEachFeatureAtPixel(pixel || [0], (feat) => feat, {
      hitTolerance: 10,
    });
    if (feature) {
      const index = feature.get('index') as number;
      const peer = combinedPeerData.value[index];
      if (peer) {
        selectedPeer.value = peer;
        isDrawerOpen.value = true;
        rowSelection.value = { [index]: true };

        nextTick(() => {
          setTimeout(() => {
            const row = document.querySelector('tr[data-selected="true"]');
            if (row)
              row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            else console.error('Row not found for index:', index);
          }, 100);
        });
      } else {
        console.error('No peer at index:', index);
      }
    } else {
      console.error('No feature at click');
      isDrawerOpen.value = false;
      selectedPeer.value = null;
      rowSelection.value = {};
    }
  });

  if (vectorSource.getFeatures().length > 0) {
    map.getView().fit(vectorSource.getExtent(), {
      padding: [100, 100, 100, 100],
      maxZoom: 4,
    });
  }
}

// Format bytes to human-readable format (e.g., KB, MB)
const formatBytes = (bytes: number) => {
  if (!bytes) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

// Format Unix timestamp to readable date
const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString();
};

const rowSelection = ref<Record<number, boolean>>({});
function onSelect(row: TableRow<PeerInfo & { geo?: GeoIpResponse }>) {
  // Clear previous selections
  Object.keys(rowSelection.value).forEach((key) => {
    rowSelection.value[Number(key)] = false;
  });
  row.toggleSelected(true);
  selectedPeer.value = row.original;
  //isDrawerOpen.value = true;

  // Zoom to the selected peer's location with zoom-out first
  if (map && row.original.geo) {
    const lat = parseFloat(row.original.geo.latitude as any);
    const lon = parseFloat(row.original.geo.longitude as any);
    if (!isNaN(lat) && !isNaN(lon)) {
      map?.render();
      // Zoom out to world view
      map.getView().animate(
        {
          center: fromLonLat([0, 0]), // Center of the world
          zoom: 1, // World view zoom level
          duration: 1500, // Zoom-out duration
        },
        () => {
          map?.render(); // Force redraw after zoom-out
          // Add delay before zooming in
          setTimeout(() => {
            // Zoom in to the selected location
            map?.getView().animate(
              {
                center: fromLonLat([lon, lat]),
                zoom: 10, // Adjust zoom level as needed
                duration: 2500, // Zoom-in duration
              },
              () => {
                map?.render(); // Force redraw after zoom-in
              }
            );
          }, 300); // 300ms delay between animations
        }
      );
    }
  }
}

onMounted(async () => {
  if (bitcoinStore.dashboardNodes.length === 0) {
    router.push('/');
    return;
  }

  await fetchPeers();
  calculateMapHeight();
  window.addEventListener('resize', calculateMapHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', calculateMapHeight);
});
</script>

<template>
  <div class="mt-4 mx-4">
    <h1 class="text-xl mb-2 text-white">
      {{ dashboardNode?.name }} Connection Explorer
    </h1>

    <div class="flex space-x-4 mt-4">
      <card-subtle class="w-100">
        <template #header>
          <div class="p-2">{{ combinedPeerData.length }} Connected Nodes</div>
        </template>
        <div>
          <div v-if="isLoading" class="text-center text-gray-400">
            <div class="mx-8 my-24">
              <div class="mb-3">
                <UProgress color="warning"></UProgress>
              </div>
              <div>Fetching Node Info...</div>
            </div>
          </div>
          <div v-else-if="combinedPeerData.length" class="overflow-x-auto">
            <UTable
              ref="table"
              sticky
              :data="combinedPeerData"
              class="flex-1"
              :columns="columns"
              :style="{ height: `${mapHeight}px` }"
              @select="onSelect"
              v-model:row-selection="rowSelection"
              :ui="{
                tr: 'data-[selected=true]:bg-elevated/100 data-[selected=true]:border-l-2 border-b-1 data-[selected=true]:border-l-green-500',
                td: 'light:text-gray-700',
              }"
            />
          </div>
          <div v-else class="text-center text-gray-400">
            No peer data available or error occurred
          </div>
        </div>
      </card-subtle>
      <card-subtle class="w-full">
        <template #header>
          <div class="p-2">Geographic Connection Map</div>
        </template>
        <div>
          <div
            ref="mapContainer"
            class="w-full"
            :style="{ height: `${mapHeight}px` }"
          ></div>
          <div ref="tooltipContainer" class="tooltip"></div>
        </div>
      </card-subtle>
    </div>
  </div>

  <!-- Drawer for Peer Details -->
  <USlideover
    v-model:open="isDrawerOpen"
    aria-describedby="undefined"
    direction="right"
    :overlay="false"
    title="Peer Details"
    :modal="false"
    class="w-full max-w-md"
    close-icon="solar:close-square-bold"
  >
    <template #body>
      <div class="">
        <div v-if="selectedPeer">
          <div class="grid grid-cols-1 gap-3 p-4 pt-0 text-sm">
            <div class="flex justify-between items-center">
              <span class="font-medium text-gray-700 dark:text-gray-300"
                >Peer ID</span
              >
              <UBadge
                :color="selectedPeer.inbound ? 'warning' : 'secondary'"
                variant="subtle"
                size="lg"
                >{{ selectedPeer.id }}</UBadge
              >
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-700 dark:text-gray-300"
                >Address</span
              >
              <UBadge
                :color="selectedPeer.inbound ? 'warning' : 'secondary'"
                variant="subtle"
                size="lg"
                class="max-w-52 overflow-hidden"
              >
                {{ selectedPeer.addr }}</UBadge
              >
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-700 dark:text-gray-300"
                >Connection Type</span
              >
              <UBadge
                :color="selectedPeer.inbound ? 'warning' : 'secondary'"
                variant="subtle"
                size="lg"
                >{{ selectedPeer.connection_type || 'N/A' }}</UBadge
              >
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-700 dark:text-gray-300"
                >Inbound</span
              >
              <UBadge
                :color="selectedPeer.inbound ? 'warning' : 'secondary'"
                variant="subtle"
                size="lg"
                >{{ selectedPeer.inbound ? 'True' : 'False' }}</UBadge
              >
            </div>
          </div>

          <UTabs
            :items="[
              { label: 'Network', slot: 'network' },
              { label: 'Blockchain', slot: 'blockchain' },
              { label: 'Traffic', slot: 'traffic' },
              { label: 'Geo', slot: 'geo' },
            ]"
            :color="selectedPeer.inbound ? 'warning' : 'secondary'"
            class="mt-4"
          >
            <template #network>
              <card-subtle>
                <div class="grid grid-cols-1 gap-3 p-4 text-sm">
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Network Type</span
                    >
                    <span>{{ selectedPeer.network }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Services</span
                    >
                    <span class="max-w-52 text-right text-xs">
                      {{ selectedPeer.servicesnames?.join(', ') || 'N/A' }}
                    </span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Software Version</span
                    >
                    <span class="max-w-52 text-right">{{
                      selectedPeer.subver || 'N/A'
                    }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Protocol Version</span
                    >
                    <span>{{ selectedPeer.version || 'N/A' }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Transport Protocol</span
                    >
                    <span>{{
                      selectedPeer.transport_protocol_type || 'N/A'
                    }}</span>
                  </div>
                </div>
              </card-subtle>
            </template>

            <template #blockchain>
              <card-subtle>
                <div class="grid grid-cols-1 gap-3 p-4 text-sm">
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Starting Height</span
                    >
                    <span>{{ selectedPeer.startingheight || 'N/A' }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Synced Blocks</span
                    >
                    <span>{{ selectedPeer.synced_blocks || 'N/A' }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Synced Headers</span
                    >
                    <span>{{ selectedPeer.synced_headers || 'N/A' }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Min Fee Filter</span
                    >
                    <span>{{
                      selectedPeer.minfeefilter
                        ? `${selectedPeer.minfeefilter} sat/byte`
                        : 'N/A'
                    }}</span>
                  </div>
                </div>
              </card-subtle>
            </template>

            <template #traffic>
              <card-subtle>
                <div class="grid grid-cols-1 gap-3 p-4 text-sm">
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Bytes Sent</span
                    >
                    <span>{{ formatBytes(selectedPeer.bytessent) }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Bytes Received</span
                    >
                    <span>{{ formatBytes(selectedPeer.bytesrecv) }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Ping Time</span
                    >
                    <span>{{
                      selectedPeer.pingtime
                        ? `${(selectedPeer.pingtime * 1000).toFixed(2)} ms`
                        : 'N/A'
                    }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Min Ping</span
                    >
                    <span>{{
                      selectedPeer.minping
                        ? `${(selectedPeer.minping * 1000).toFixed(2)} ms`
                        : 'N/A'
                    }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Connection Time</span
                    >
                    <span>{{ formatTimestamp(selectedPeer.conntime) }}</span>
                  </div>
                </div>
              </card-subtle>
            </template>

            <template #geo>
              <card-subtle>
                <div class="grid grid-cols-1 gap-3 p-4 text-sm">
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >City</span
                    >
                    <span>{{ selectedPeer.geo?.city || 'N/A' }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Postal</span
                    >
                    <span>{{ selectedPeer.geo?.postal || 'N/A' }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Country</span
                    >
                    <span>{{ selectedPeer.geo?.country || 'N/A' }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Latitude</span
                    >
                    <span>{{ selectedPeer.geo?.latitude || 'N/A' }}</span>
                  </div>
                  <USeparator></USeparator>
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-700 dark:text-gray-300"
                      >Longitude</span
                    >
                    <span>{{ selectedPeer.geo?.longitude || 'N/A' }}</span>
                  </div>
                </div>
              </card-subtle>
            </template>
          </UTabs>
        </div>
        <div v-else class="text-center py-6">
          <p class="text-gray-500 dark:text-gray-400">No peer selected</p>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  display: none;
  z-index: 1000;
  width: 200px;
}
.tooltip-content {
  white-space: normal;
  overflow-wrap: break-word;
}
</style>
