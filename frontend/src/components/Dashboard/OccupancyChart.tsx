import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { OccupancyDataPoint } from '../../types';
import { format, parseISO } from 'date-fns';

interface OccupancyChartProps {
  data: OccupancyDataPoint[];
  capacity?: number;
  title?: string;
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({
  data,
  capacity,
  title = 'Occupancy Over Time',
}) => {
  const [period, setPeriod] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const formatXAxis = (value: string) => {
    try {
      const date = parseISO(value);
      if (period === '7d') return format(date, 'EEE');
      if (period === '24h') return format(date, 'HH:mm');
      return format(date, 'HH:mm');
    } catch {
      return value;
    }
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 1.5,
          boxShadow: 3,
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">
          {label ? formatXAxis(label) : ''}
        </Typography>
        {payload.map((entry, i) => (
          <Typography key={i} variant="body2" fontWeight={600}>
            {entry.name}: {entry.value}
            {entry.name === 'Percentage' ? '%' : ''}
          </Typography>
        ))}
      </Box>
    );
  };

  return (
    <Card
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
    >
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, val) => val && setPeriod(val)}
            size="small"
          >
            {(['1h', '6h', '24h', '7d'] as const).map((p) => (
              <ToggleButton key={p} value={p} sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}>
                {p}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1565C0" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {capacity && (
              <ReferenceLine y={capacity} stroke="#f44336" strokeDasharray="4 4" label="" />
            )}
            <Area
              type="monotone"
              dataKey="occupancy"
              name="Occupancy"
              stroke="#1565C0"
              strokeWidth={2}
              fill="url(#occupancyGradient)"
              dot={false}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default OccupancyChart;
