'use client'

import React from 'react';
import { RefreshCw, MapPin, RotateCcw, Maximize, List, Map } from 'lucide-react';

interface RouteControlsProps {
  onRefresh?: () => void;
  onCenterMap?: () => void;
  onFullScreen?: () => void;
  onToggleView?: () => void;
  onReroute?: () => void;
  isRefreshing?: boolean;
  viewMode?: 'map' | 'split' | 'list';
  className?: string;
  lastUpdated?: string;
}

const RouteControls: React.FC<RouteControlsProps> = ({
  onRefresh,
  onCenterMap,
  onFullScreen,
  onToggleView,
  onReroute,
  isRefreshing = false,
  viewMode = 'split',
  className = '',
  lastUpdated,
}) => {
  const getViewIcon = () => {
    switch (viewMode) {
      case 'map':
        return <List size={18} />;
      case 'list':
        return <Map size={18} />;
      default:
        return <Maximize size={18} />;
    }
  };

  const getViewTooltip = () => {
    switch (viewMode) {
      case 'map':
        return 'Liste Görünümüne Geç';
      case 'list':
        return 'Harita Görünümüne Geç';
      default:
        return 'Tam Ekran Görünümüne Geç';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
            title="Rotayı Yenile"
          >
            <RefreshCw size={16} className={`text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onCenterMap}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
            title="Haritayı Ortala"
          >
            <MapPin size={16} className="text-gray-700" />
          </button>
          
          <button
            onClick={onReroute}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-green-50 hover:bg-green-100 transition-colors"
            title="Rotayı Yeniden Hesapla"
          >
            <RotateCcw size={16} className="text-green-700" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500 mr-2">
              Son güncelleme: {lastUpdated}
            </span>
          )}
          
          <button
            onClick={onToggleView}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
            title={getViewTooltip()}
          >
            {getViewIcon()}
          </button>
          
          <button
            onClick={onFullScreen}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
            title="Tam Ekran"
          >
            <Maximize size={16} className="text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteControls; 