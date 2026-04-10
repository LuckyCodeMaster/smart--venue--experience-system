import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Sensor, SensorReading } from '../../types';
import { sensorsApi } from '../../services/api';
import { format, parseISO, subHours } from 'date-fns';

interface SensorChartProps {
  sensor: Sensor;
}

type Period = '1h' | '6h' | '24h' | '7d';

const periodHours: Record<Period, number> = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };

const SensorChart: React.FC<SensorChartProps> = ({ sensor }) => {
  const [period, setPeriod] = useState<Period>('6h');
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReadings = async () => {
      setLoading(true);
      try {
        const to = new Date().toISOString();
        const from = subHours(new Date(), periodHours[period]).toISOString();
        const response = await sensorsApi.getHistory(sensor.id, from, to);
        setReadings(response.data.readings ?? response.data ?? []);
      } catch {
        setReadings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReadings();
  }, [sensor.id, period]);

  const formatX = (value: string) => {
    try {
      return format(parseISO(value), period === '7d' ? 'EEE HH:mm' : 'HH:mm');
    } catch {
      return value;
    }
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', p: 1.5, borderRadius: 2 }}>
        <Typography variant="caption" display="block" color="text.secondary">
          {label ? formatX(label) : ''}
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {payload[0].value} {sensor.lastReading?.unit ?? ''}
        </Typography>
      </Box>
    );
  };

  const values = readings.map((r) => r.value);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardHeader
        title={`${sensor.name} Readings`}
        subheader={sensor.type.replace('_', ' ')}
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, val) => val && setPeriod(val)}
            size="small"
          >
            {(['1h', '6h', '24h', '7d'] as Period[]).map((p) => (
              <ToggleButton key={p} value={p} sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}>
                {p}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {loading ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">Loading readings...</Typography>
          </Box>
        ) : readings.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">No readings available for this period</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatX}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {avg !== undefined && (
                <ReferenceLine
                  y={avg}
                  stroke="#9e9e9e"
                  strokeDasharray="4 4"
                  label={{ value: `Avg: ${avg.toFixed(1)}`, fontSize: 11, fill: '#9e9e9e' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1565C0"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SensorChart;
