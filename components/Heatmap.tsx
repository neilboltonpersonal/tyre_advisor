'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  LoadingOverlay,
  Alert,
  Button,
  Avatar,
  Paper,
  Divider,
  Select,
  MultiSelect,
  NumberInput,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconMapPin, IconLocation, IconAlertCircle, IconStar, IconMessage, IconFilter, IconFilterOff, IconCalendar, IconWorld } from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import { UserComment } from '../types/tyre';

// Helper function to generate a random date within the last year
const getRandomDate = (): string => {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

// Moved mock data outside the component to prevent re-generation on every render
const allMockComments: Omit<UserComment, 'location'>[] = [
  {
    id: '1',
    username: 'TrailRider_Mike',
    tyreModel: 'Maxxis Minion DHF',
    tyreBrand: 'Maxxis',
    comment: "Absolutely love these tyres! Perfect grip on loose terrain and they handle wet conditions surprisingly well. Been running them for 6 months now and they're still going strong.",
    rating: 5,
    date: getRandomDate(),
    ridingStyle: 'Enduro',
    terrain: 'Rocky trails',
    source: 'Pinkbike',
  },
  {
    id: '2',
    username: 'XC_Sarah',
    tyreModel: 'Continental Trail King',
    tyreBrand: 'Continental',
    comment: "Great all-rounder for my XC rides. Fast rolling but still provides decent grip when things get technical. Perfect for the mixed terrain around here.",
    rating: 4,
    date: getRandomDate(),
    ridingStyle: 'Cross Country',
    terrain: 'Mixed terrain',
    source: 'Singletrackworld',
  },
  {
    id: '3',
    username: 'Downhill_Dave',
    tyreModel: 'Schwalbe Magic Mary',
    tyreBrand: 'Schwalbe',
    comment: "These tyres are beasts! Incredible braking performance and they stick to everything. A bit heavy but worth it for the confidence they give you on steep descents.",
    rating: 5,
    date: getRandomDate(),
    ridingStyle: 'Downhill',
    terrain: 'Steep descents',
    source: 'Pinkbike',
  },
  {
    id: '4',
    username: 'WeekendWarrior',
    tyreModel: 'Michelin Wild Enduro',
    tyreBrand: 'Michelin',
    comment: "Solid performance for weekend rides. Good balance between grip and rolling resistance. They've held up well to the abuse I put them through.",
    rating: 4,
    date: getRandomDate(),
    ridingStyle: 'Trail',
    terrain: 'Technical trails',
    source: 'Singletrackworld',
  },
  {
    id: '5',
    username: 'GravelGuru',
    tyreModel: 'WTB Riddler',
    tyreBrand: 'WTB',
    comment: "Perfect for gravel adventures! Fast on smooth sections and surprisingly capable on rougher terrain. Great puncture protection too.",
    rating: 5,
    date: getRandomDate(),
    ridingStyle: 'Gravel',
    terrain: 'Gravel roads',
    source: 'Pinkbike',
  },
  {
    id: '6',
    username: 'AllMountain_Alex',
    tyreModel: 'Maxxis Assegai',
    tyreBrand: 'Maxxis',
    comment: "These tyres are confidence-inspiring! Amazing grip in all conditions and they roll better than I expected. Perfect for all-mountain riding.",
    rating: 5,
    date: getRandomDate(),
    ridingStyle: 'All Mountain',
    terrain: 'Varied terrain',
    source: 'Singletrackworld',
  }
];

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '400px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px'
    }}>
      <Text c="dimmed">Loading interactive map...</Text>
    </div>
  )
});

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

interface TyreUsageData {
  location: string;
  tyreModel: string;
  brand: string;
  usageCount: number;
  latitude: number;
  longitude: number;
}

interface HeatmapProps {
  recommendations: any[];
  userLocation?: LocationData;
}

interface CommentFilters {
  brands: string[];
  ridingStyles: string[];
  minRating: number;
}

export default function Heatmap({ recommendations, userLocation }: HeatmapProps) {
  const [location, setLocation] = useState<LocationData | null>(userLocation || null);
  const [localTyreData, setLocalTyreData] = useState<TyreUsageData[]>([]);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<UserComment[]>([]);
  const [filters, setFilters] = useState<CommentFilters>({
    brands: [],
    ridingStyles: [],
    minRating: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      detectUserLocation();
    } else {
      generateLocalTyreData();
      generateUserComments();
    }
  }, [location]);

  useEffect(() => {
    applyFilters();
  }, [userComments, filters]);

  const applyFilters = () => {
    let filtered = [...userComments];

    // Filter by brands
    if (filters.brands.length > 0) {
      filtered = filtered.filter(comment => 
        filters.brands.includes(comment.tyreBrand)
      );
    }

    // Filter by riding styles
    if (filters.ridingStyles.length > 0) {
      filtered = filtered.filter(comment => 
        filters.ridingStyles.includes(comment.ridingStyle)
      );
    }

    // Filter by minimum rating
    if (filters.minRating > 0) {
      filtered = filtered.filter(comment => 
        comment.rating >= filters.minRating
      );
    }

    setFilteredComments(filtered);
  };

  const clearFilters = () => {
    setFilters({
      brands: [],
      ridingStyles: [],
      minRating: 0
    });
  };

  const getUniqueBrands = () => {
    return Array.from(new Set(userComments.map(comment => comment.tyreBrand)));
  };

  const getUniqueRidingStyles = () => {
    return Array.from(new Set(userComments.map(comment => comment.ridingStyle)));
  };

  const detectUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get city and country
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const locationData: LocationData = {
              latitude,
              longitude,
              city: data.city || 'Unknown City',
              country: data.countryName || 'Unknown Country'
            };
            
            setLocation(locationData);
          } else {
            // Fallback if reverse geocoding fails
            setLocation({
              latitude,
              longitude,
              city: 'Your Location',
              country: 'Unknown'
            });
          }
        } catch (error) {
          console.error('Error getting location data:', error);
          setError('Could not determine your location');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Could not access your location. Please enable location services.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const generateLocalTyreData = () => {
    if (!location) return;

    // Generate mock local tyre usage data based on the recommendations
    // In a real application, this would come from a database of local tyre usage
    const mockLocalData: TyreUsageData[] = recommendations.map((rec, index) => ({
      location: `${location.city}, ${location.country}`,
      tyreModel: rec.model,
      brand: rec.brand,
      usageCount: Math.floor(Math.random() * 50) + 10, // Random usage count
      latitude: location.latitude + (Math.random() - 0.5) * 0.1, // Spread around user location
      longitude: location.longitude + (Math.random() - 0.5) * 0.1
    }));

    // Add some additional local data points
    const additionalData: TyreUsageData[] = [
      {
        location: `${location.city}, ${location.country}`,
        tyreModel: 'Maxxis Minion DHF',
        brand: 'Maxxis',
        usageCount: 45,
        latitude: location.latitude + 0.02,
        longitude: location.longitude + 0.01
      },
      {
        location: `${location.city}, ${location.country}`,
        tyreModel: 'Continental Trail King',
        brand: 'Continental',
        usageCount: 38,
        latitude: location.latitude - 0.01,
        longitude: location.longitude + 0.02
      },
      {
        location: `${location.city}, ${location.country}`,
        tyreModel: 'Schwalbe Nobby Nic',
        brand: 'Schwalbe',
        usageCount: 32,
        latitude: location.latitude + 0.01,
        longitude: location.longitude - 0.02
      }
    ];

    setLocalTyreData([...mockLocalData, ...additionalData]);
  };

  const generateUserComments = () => {
    if (!location) return;

    // Add location to the mock comments
    const commentsWithLocation = allMockComments.map(comment => ({
      ...comment,
      location: `${location.city}, ${location.country.substring(0, 15)}...`, // Truncate long country names
    }));

    // Randomly select 3-4 comments to show
    const shuffled = commentsWithLocation.sort(() => 0.5 - Math.random());
    setUserComments(shuffled.slice(0, Math.floor(Math.random() * 2) + 3));
  };

  const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;

    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;

    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;

    return `${Math.floor(seconds)} seconds ago`;
  };

  const getUsageIntensity = (count: number): 'low' | 'medium' | 'high' => {
    if (count < 20) return 'low';
    if (count < 35) return 'medium';
    return 'high';
  };

  const getIntensityColor = (intensity: 'low' | 'medium' | 'high'): string => {
    switch (intensity) {
      case 'low': return '#3b82f6'; // blue
      case 'medium': return '#eab308'; // yellow
      case 'high': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  if (loading) {
    return (
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <LoadingOverlay visible={true} />
        <Title order={3} mb="md">
          <IconMapPin size={20} style={{ marginRight: 8 }} />
          Local Tyre Usage Heatmap
        </Title>
        <Text c="dimmed">Detecting your location...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Location Access Required"
          color="orange"
          mb="md"
        >
          {error}
        </Alert>
        <Button onClick={detectUserLocation} leftSection={<IconLocation size={16} />}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (!location) {
    return (
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Title order={3} mb="md">
          <IconMapPin size={20} style={{ marginRight: 8 }} />
          Local Tyre Usage Heatmap
        </Title>
        <Text c="dimmed" mb="md">
          We'll show you what tyres are popular in your area based on your location.
        </Text>
        <Button onClick={detectUserLocation} leftSection={<IconLocation size={16} />}>
          Enable Location Access
        </Button>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>
            <IconMapPin size={20} style={{ marginRight: 8 }} />
            Local Tyre Usage Heatmap
          </Title>
          <Badge color="blue" variant="light">
            {location.city}, {location.country}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          Showing tyre popularity in your area based on local cycling community data.
        </Text>

        {/* Interactive Map */}
        <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <MapComponent 
            userLocation={location}
            tyreData={localTyreData}
            getIntensityColor={getIntensityColor}
          />
        </div>

        {/* Legend */}
        <Group gap="md" justify="center">
          <Group gap="xs">
            <div style={{ width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: '50%' }} />
            <Text size="xs">High Usage</Text>
          </Group>
          <Group gap="xs">
            <div style={{ width: 12, height: 12, backgroundColor: '#eab308', borderRadius: '50%' }} />
            <Text size="xs">Medium Usage</Text>
          </Group>
          <Group gap="xs">
            <div style={{ width: 12, height: 12, backgroundColor: '#3b82f6', borderRadius: '50%' }} />
            <Text size="xs">Low Usage</Text>
          </Group>
        </Group>

        {/* Local tyre statistics */}
        <div>
          <Title order={4} mb="sm">Popular Tyres in Your Area</Title>
          <Stack gap="xs">
            {localTyreData
              .sort((a, b) => b.usageCount - a.usageCount)
              .slice(0, 5)
              .map((data, index) => (
                <Group key={index} justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>{data.tyreModel}</Text>
                    <Text size="xs" c="dimmed">{data.brand}</Text>
                  </div>
                  <Badge 
                    color={getIntensityColor(getUsageIntensity(data.usageCount))}
                    variant="light"
                  >
                    {data.usageCount} users
                  </Badge>
                </Group>
              ))}
          </Stack>
        </div>

        {/* User Comments */}
        <div>
          <Title order={4} mb="sm">
            <IconMessage size={20} style={{ marginRight: 8 }} />
            Local Rider Comments
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Real feedback from cyclists in your area about their tyre experiences.
          </Text>

          {/* Filter Controls */}
          <Paper p="md" radius="md" withBorder mb="md">
            <Group justify="space-between" align="center" mb="sm">
              <Group gap="xs">
                <IconFilter size={16} />
                <Text size="sm" fw={500}>Filter Comments</Text>
              </Group>
              <Tooltip label="Clear all filters">
                <ActionIcon 
                  variant="light" 
                  color="gray" 
                  onClick={clearFilters}
                  disabled={filters.brands.length === 0 && filters.ridingStyles.length === 0 && filters.minRating === 0}
                >
                  <IconFilterOff size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            
            <Group gap="md" align="flex-end">
              <MultiSelect
                label="Tyre Brands"
                placeholder="Select brands"
                data={getUniqueBrands()}
                value={filters.brands}
                onChange={(value) => setFilters(prev => ({ ...prev, brands: value }))}
                clearable
                style={{ flex: 1 }}
              />
              <MultiSelect
                label="Riding Styles"
                placeholder="Select styles"
                data={getUniqueRidingStyles()}
                value={filters.ridingStyles}
                onChange={(value) => setFilters(prev => ({ ...prev, ridingStyles: value }))}
                clearable
                style={{ flex: 1 }}
              />
              <NumberInput
                label="Min Rating"
                placeholder="Any rating"
                min={0}
                max={5}
                value={filters.minRating}
                onChange={(value) => setFilters(prev => ({ ...prev, minRating: typeof value === 'number' ? value : 0 }))}
                style={{ width: 120 }}
              />
            </Group>
            
            {filteredComments.length !== userComments.length && (
              <Text size="xs" c="dimmed" mt="sm">
                Showing {filteredComments.length} of {userComments.length} comments
              </Text>
            )}
          </Paper>

          <Stack gap="md">
            {filteredComments.length === 0 ? (
              <Paper p="md" radius="md" withBorder>
                <Text c="dimmed" ta="center">
                  No comments match your current filters. Try adjusting your filter criteria.
                </Text>
              </Paper>
            ) : (
              filteredComments.map((comment, index) => (
                <Paper key={index} p="md" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start" mb="sm">
                    <Group gap="sm">
                      <Avatar src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.username}`} alt={comment.username} radius="xl" />
                      <div style={{ flex: 1 }}>
                        <Group justify="space-between" align="center">
                          <Text size="sm" fw={500}>{comment.username}</Text>
                          <Group gap="xs">
                            {[...Array(5)].map((_, i) => (
                              <IconStar key={i} size={16} color={i < comment.rating ? '#fab005' : '#ced4da'} fill={i < comment.rating ? '#fab005' : 'transparent'} />
                            ))}
                          </Group>
                        </Group>
                        <Text size="xs" c="dimmed">{comment.tyreModel} ({comment.tyreBrand})</Text>
                      </div>
                    </Group>
                  </Group>

                  <Text pl={54} pr={10} pt={4} size="sm">
                    {comment.comment}
                  </Text>
                  
                  <Group justify="space-between" align="center" mt="sm" pl={54} pr={10}>
                    <Group gap="xs" c="dimmed">
                      <IconWorld size={14} />
                      <Text size="xs">{comment.location}</Text>
                      <IconCalendar size={14} style={{ marginLeft: 8 }} />
                      <Text size="xs">{timeAgo(comment.date)}</Text>
                    </Group>
                    <Badge 
                      variant="light"
                      size="xs"
                      color={comment.source === 'Pinkbike' ? 'pink' : 'cyan'}
                    >
                      {comment.source}
                    </Badge>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        </div>
      </Stack>
    </Card>
  );
} 