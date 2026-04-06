/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
    equals(latlng: LatLng): boolean;
    toCoords(): any;
  }
  class LatLngBounds {
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
  }
  class Map {
    getCenter(): LatLng;
    getLevel(): number;
    getBounds(): LatLngBounds;
  }
  function load(callback: () => void): void;
  namespace services {
    class Geocoder {
      addressSearch(address: string, callback: (result: any[], status: string) => void): void;
    }
    class Places {
      keywordSearch(keyword: string, callback: (data: any[], status: string, pagination: any) => void, options?: any): void;
      categorySearch(code: string, callback: (data: any[], status: string, pagination: any) => void, options?: any): void;
    }
    const Status: { OK: string; ZERO_RESULT: string; ERROR: string };
  }
}

declare global {
  interface Window {
    kakao: {
      maps: typeof kakao.maps & {
        load: typeof kakao.maps.load;
        LatLng: typeof kakao.maps.LatLng;
        Map: typeof kakao.maps.Map;
        services: typeof kakao.maps.services & Record<string, any>;
        [key: string]: any;
      };
    };
  }
}

export {};
