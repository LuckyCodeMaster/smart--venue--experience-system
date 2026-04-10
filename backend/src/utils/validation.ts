import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(100).required(),
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  role: Joi.string().valid('admin', 'staff', 'attendee').default('attendee'),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

export const createVenueSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(2000).required(),
  address: Joi.string().trim().max(500).required(),
  capacity: Joi.number().integer().min(1).required(),
  floor_plan_url: Joi.string().uri().optional().allow(null, ''),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  amenities: Joi.object().default({}),
});

export const updateVenueSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255),
  description: Joi.string().trim().max(2000),
  address: Joi.string().trim().max(500),
  capacity: Joi.number().integer().min(1),
  floor_plan_url: Joi.string().uri().optional().allow(null, ''),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  amenities: Joi.object(),
  is_active: Joi.boolean(),
}).min(1);

export const createQueueSchema = Joi.object({
  venue_id: Joi.string().uuid().required(),
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(1000).allow(null, ''),
  max_capacity: Joi.number().integer().min(1).allow(null),
});

export const updateQueueSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255),
  description: Joi.string().trim().max(1000).allow(null, ''),
  status: Joi.string().valid('active', 'paused', 'closed'),
  max_capacity: Joi.number().integer().min(1).allow(null),
}).min(1);

export const joinQueueSchema = Joi.object({
  party_size: Joi.number().integer().min(1).max(20).default(1),
  notes: Joi.string().trim().max(500).allow(null, ''),
});

export const sensorIngestSchema = Joi.object({
  value: Joi.number().required(),
  unit: Joi.string().trim().max(50).required(),
  recorded_at: Joi.date().iso().max('now').default(() => new Date()),
  metadata: Joi.object().default({}),
});

export const createSensorSchema = Joi.object({
  venue_id: Joi.string().uuid().required(),
  name: Joi.string().trim().min(1).max(255).required(),
  sensor_type: Joi.string()
    .valid('occupancy', 'temperature', 'humidity', 'air_quality', 'noise', 'crowd_density')
    .required(),
  location_description: Joi.string().trim().max(500).required(),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  floor_level: Joi.number().integer().allow(null),
});

export const reportCongestionSchema = Joi.object({
  zone_id: Joi.string().uuid().required(),
  level: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  notes: Joi.string().trim().max(500).allow(null, ''),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
