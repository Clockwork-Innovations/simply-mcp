/**
 * Weather Card Component
 *
 * Displays weather information including temperature, conditions, and humidity.
 * Used for UI type validation testing.
 */

import React from 'react';

export type WeatherCardProps = {
  location: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  lastUpdated: string;
};

export default function WeatherCard({
  location,
  temperature,
  feelsLike,
  condition,
  humidity,
  windSpeed,
  pressure,
  visibility,
  lastUpdated,
}: WeatherCardProps) {
  return (
    <div
      style={{
        border: '1px solid transparent',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '320px',
        fontFamily: 'system-ui, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2 style={{ margin: '0', fontSize: '20px', fontWeight: '500' }}>{location}</h2>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{temperature}°F</div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>Feels like {feelsLike}°F</div>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: '18px',
          marginTop: '12px',
          textTransform: 'capitalize',
        }}
      >
        {condition}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Humidity</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{humidity}%</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Wind</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{windSpeed} mph</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Pressure</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{pressure} hPa</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Visibility</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{visibility} mi</div>
        </div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', opacity: 0.7 }}>
        Last updated: {lastUpdated}
      </div>
    </div>
  );
}
