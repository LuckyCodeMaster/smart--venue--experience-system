import React from 'react';
import { Card, CardContent, CardHeader, Box, Typography, Tooltip } from '@mui/material';
import { VenueZone } from '../../types';

interface HeatmapVisualizationProps {
  zones: VenueZone[];
  width?: number;
  height?: number;
}

const getHeatColor = (percentage: number): string => {
  if (percentage >= 90) return '#d32f2f';
  if (percentage >= 75) return '#f57c00';
  if (percentage >= 50) return '#fbc02d';
  if (percentage >= 25) return '#388e3c';
  return '#1976d2';
};

const HeatmapVisualization: React.FC<HeatmapVisualizationProps> = ({
  zones,
  width = 600,
  height = 400,
}) => {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardHeader
        title="Crowd Density Heatmap"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheader="Real-time zone occupancy visualization"
      />
      <CardContent>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: `${(height / width) * 100}%`,
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0 }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
              {/* Floor plan background */}
              <rect x="0" y="0" width={width} height={height} fill="#fafafa" />
              <rect
                x="10"
                y="10"
                width={width - 20}
                height={height - 20}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="2"
                strokeDasharray="8 4"
                rx="4"
              />

              {zones.map((zone) => {
                const { x, y, width: zw, height: zh } = zone.coordinates;
                const color = getHeatColor(zone.occupancyPercentage);
                const opacity = 0.3 + (zone.occupancyPercentage / 100) * 0.55;

                return (
                  <Tooltip
                    key={zone.id}
                    title={`${zone.name}: ${zone.currentOccupancy}/${zone.capacity} (${zone.occupancyPercentage}%)`}
                    placement="top"
                  >
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={zw}
                        height={zh}
                        fill={color}
                        fillOpacity={opacity}
                        stroke={color}
                        strokeWidth="1.5"
                        rx="4"
                        style={{ cursor: 'pointer', transition: 'fill-opacity 0.3s' }}
                      />
                      <text
                        x={x + zw / 2}
                        y={y + zh / 2 - 6}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#333"
                      >
                        {zone.name}
                      </text>
                      <text
                        x={x + zw / 2}
                        y={y + zh / 2 + 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fill="#555"
                      >
                        {zone.occupancyPercentage}%
                      </text>
                    </g>
                  </Tooltip>
                );
              })}
            </svg>
          </Box>
        </Box>

        {/* Legend */}
        <Box display="flex" gap={1.5} mt={2} flexWrap="wrap" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Density:
          </Typography>
          {[
            { label: 'Low (0–25%)', color: '#1976d2' },
            { label: 'Moderate (25–50%)', color: '#388e3c' },
            { label: 'High (50–75%)', color: '#fbc02d' },
            { label: 'Very High (75–90%)', color: '#f57c00' },
            { label: 'Critical (90%+)', color: '#d32f2f' },
          ].map(({ label, color }) => (
            <Box key={label} display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: color, opacity: 0.7 }}
              />
              <Typography variant="caption">{label}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HeatmapVisualization;
