/**
 * Stock Card Component
 *
 * Displays stock information including price, change, and market data.
 * Used for UI type validation testing.
 */

import React from 'react';

export type StockCardProps = {
  ticker: string;
  company: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  lastUpdated: string;
};

export default function StockCard({
  ticker,
  company,
  price,
  change,
  changePercent,
  volume,
  marketCap,
  lastUpdated,
}: StockCardProps) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? '#10B981' : '#EF4444';

  return (
    <div
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '320px',
        fontFamily: 'system-ui, sans-serif',
        background: '#FFFFFF',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            {ticker}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6B7280' }}>{company}</p>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
          ${price.toFixed(2)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <span style={{ color: changeColor, fontWeight: '500' }}>
            {isPositive ? '+' : ''}
            {change.toFixed(2)}
          </span>
          <span style={{ color: changeColor, fontWeight: '500' }}>
            ({isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Volume</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
            {volume.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Market Cap</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{marketCap}</div>
        </div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
        Last updated: {lastUpdated}
      </div>
    </div>
  );
}
