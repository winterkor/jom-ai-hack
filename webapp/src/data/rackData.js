// TODO: Replace with live API call to ESP32 backend or LTA DataMall / data.gov.sg
// Mock data for 10 bicycle rack locations across Tampines, Singapore.
// Coordinates are approximate, chosen to reflect real high-traffic civic nodes.

export const rackData = [
  {
    id: 'TPN-01',
    name: 'Tampines MRT Station',
    address: '20 Tampines Central 1, Singapore 529538',
    lat: 1.35451,
    lng: 103.94531,
    totalSlots: 60,
    occupiedSlots: 58,
  },
  {
    id: 'TPN-02',
    name: 'Our Tampines Hub',
    address: '1 Tampines Walk, Singapore 528523',
    lat: 1.35275,
    lng: 103.93989,
    totalSlots: 80,
    occupiedSlots: 52,
  },
  {
    id: 'TPN-03',
    name: 'Tampines Mall',
    address: '4 Tampines Central 5, Singapore 529510',
    lat: 1.35365,
    lng: 103.94378,
    totalSlots: 40,
    occupiedSlots: 39,
  },
  {
    id: 'TPN-04',
    name: 'Tampines East MRT',
    address: '10 Tampines Central 7, Singapore 529957',
    lat: 1.35633,
    lng: 103.95430,
    totalSlots: 50,
    occupiedSlots: 18,
  },
  {
    id: 'TPN-05',
    name: 'Tampines West MRT',
    address: '40 Tampines Avenue 3, Singapore 529706',
    lat: 1.34556,
    lng: 103.93829,
    totalSlots: 45,
    occupiedSlots: 31,
  },
  {
    id: 'TPN-06',
    name: 'Tampines Regional Library',
    address: '1 Tampines Walk #02-01, Singapore 528523',
    lat: 1.35333,
    lng: 103.94038,
    totalSlots: 35,
    occupiedSlots: 8,
  },
  {
    id: 'TPN-07',
    name: 'Tampines Round Market & Food Centre',
    address: '137 Tampines Street 11, Singapore 521137',
    lat: 1.34556,
    lng: 103.94632,
    totalSlots: 30,
    occupiedSlots: 27,
  },
  {
    id: 'TPN-08',
    name: 'Tampines Stadium',
    address: '11 Tampines Street 71, Singapore 529067',
    lat: 1.35831,
    lng: 103.93472,
    totalSlots: 55,
    occupiedSlots: 12,
  },
  {
    id: 'TPN-09',
    name: 'Tampines Polyclinic',
    address: '1 Tampines Street 41, Singapore 529203',
    lat: 1.35114,
    lng: 103.94890,
    totalSlots: 25,
    occupiedSlots: 22,
  },
  {
    id: 'TPN-10',
    name: 'Tampines Eco Green',
    address: 'Tampines Avenue 12, Singapore 529757',
    lat: 1.36207,
    lng: 103.93824,
    totalSlots: 40,
    occupiedSlots: 5,
  },
];

export function getRackStatus(rack) {
  const ratio = rack.occupiedSlots / rack.totalSlots;
  if (ratio >= 0.9) return 'full';
  if (ratio >= 0.6) return 'filling';
  return 'available';
}

export function getAvailableSlots(rack) {
  return Math.max(0, rack.totalSlots - rack.occupiedSlots);
}
