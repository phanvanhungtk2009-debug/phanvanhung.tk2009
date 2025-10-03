import React, { useState } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import * as L from 'leaflet';

interface MapSearchProps {
  onSearch: (latLng: L.LatLng) => void;
}

const MapSearch: React.FC<MapSearchProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Đà Nẵng, Việt Nam&limit=1`;

    try {
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Yêu cầu tìm kiếm thất bại.');
      }
      
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latLng = L.latLng(parseFloat(lat), parseFloat(lon));
        onSearch(latLng);
        setQuery(''); // Clear input on success
      } else {
        setError('Không tìm thấy địa điểm.');
        setTimeout(() => setError(null), 3000); // Clear error after 3s
      }
    } catch (err) {
      console.error("Lỗi khi tìm kiếm địa điểm:", err);
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra.';
      setError(message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="absolute top-4 right-4 z-10 flex items-center group"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm địa điểm ở Đà Nẵng..."
        className={`bg-white/80 backdrop-blur-sm shadow-lg rounded-l-full py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300 w-40 sm:w-48 md:w-64 ${error ? 'ring-2 ring-red-500 placeholder-red-400' : ''}`}
        aria-label="Tìm kiếm địa điểm"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-white/80 backdrop-blur-sm shadow-lg rounded-r-full p-3 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
        aria-label="Tìm kiếm"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-t-teal-500 border-gray-200 rounded-full animate-spin"></div>
        ) : (
          <SearchIcon className="w-5 h-5" />
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-600 text-white text-xs font-semibold py-1 px-3 rounded-md shadow-lg transition-opacity duration-300 opacity-100 group-hover:opacity-100">
            {error}
        </div>
      )}
    </form>
  );
};

export default MapSearch;