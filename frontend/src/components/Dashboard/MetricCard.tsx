import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = 'primary',
}) => {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  const TrendIcon = trendPositive
    ? ArrowUpwardIcon
    : trendNegative
    ? ArrowDownwardIcon
    : RemoveIcon;

  const trendColor = trendPositive ? 'success' : trendNegative ? 'error' : 'default';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        height: '100%',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} mb={0.5}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={`${color}.main`} lineHeight={1.2}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.lighter` || `${color}.main`,
              color: `${color}.main`,
              opacity: 0.9,
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend !== undefined && (
          <Box display="flex" alignItems="center" gap={0.5} mt={2}>
            <Chip
              icon={<TrendIcon sx={{ fontSize: '0.875rem !important' }} />}
              label={`${Math.abs(trend)}% ${trendLabel ?? ''}`}
              size="small"
              color={trendColor as 'success' | 'error' | 'default'}
              variant="outlined"
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
