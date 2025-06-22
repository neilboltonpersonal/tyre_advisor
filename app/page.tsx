'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Group,
  Stack,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Checkbox,
  Table,
  Badge,
  Modal,
  Textarea as MantineTextarea,
  ActionIcon,
  Tooltip,
  Tabs,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBike, IconWheel, IconSearch, IconMessageCircle, IconRefresh, IconMapPin } from '@tabler/icons-react';
import { TyreRecommendation, ScrapedTyreData } from '../types/tyre';
import { getTyreRecommendations, refreshDatabaseWithRealData } from '../lib/actions';
import Heatmap from '../components/Heatmap';

export default function HomePage() {
  const [recommendations, setRecommendations] = useState<TyreRecommendation[]>([]);
  const [scrapedData, setScrapedData] = useState<ScrapedTyreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementQuestion, setRefinementQuestion] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [refreshingData, setRefreshingData] = useState(false);
  const [testingScraping, setTestingScraping] = useState(false);

  const form = useForm({
    initialValues: {
      ridingStyle: '',
      terrain: '',
      weatherConditions: '',
      skillLevel: '',
      budget: '',
      bikeType: '',
      wheelSize: '',
      weight: '',
      ridingFrequency: '',
      performancePriority: '',
      suspensionType: '',
      suspensionTravel: '',
      additionalNotes: '',
    },
    validate: {
      ridingStyle: (value) => (value ? null : 'Please select your riding style'),
      terrain: (value) => (value ? null : 'Please select your primary terrain'),
      skillLevel: (value) => (value ? null : 'Please select your skill level'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setLoading(true);
    setRecommendations([]); // Clear previous recommendations
    setScrapedData([]);
    try {
      const { recommendations: results, scrapedData: rawData } = await getTyreRecommendations(values);
      setRecommendations(results);
      setScrapedData(rawData);
      setActiveTab('recommendations');
      notifications.show({
        title: 'Recommendations Ready!',
        message: `We found ${results.length} great tyre options for you.`,
        color: 'green',
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error',
        message: 'Failed to get recommendations. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  });

  const handleRefinement = async () => {
    if (!refinementQuestion.trim()) return;
    
    setLoading(true);
    try {
      const { recommendations: refinedResults, scrapedData: rawData } = await getTyreRecommendations(
        form.values,
        refinementQuestion,
        recommendations
      );
      setRecommendations(refinedResults);
      setScrapedData(rawData);
      setRefinementQuestion('');
      notifications.show({
        title: 'Refined Recommendations',
        message: 'Your recommendations have been updated based on your question.',
        color: 'blue',
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error',
        message: 'Failed to refine recommendations. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshingData(true);
    try {
      const result = await refreshDatabaseWithRealData();
      if (result.success) {
        notifications.show({
          title: 'Database Refreshed',
          message: result.message,
          color: 'green',
        });
        // Reload the current recommendations to show fresh data
        if (form.values.ridingStyle) {
          // Trigger a new search with current form values
          const { recommendations: results, scrapedData: rawData } = await getTyreRecommendations(form.values);
          setRecommendations(results);
          setScrapedData(rawData);
        }
      } else {
        notifications.show({
          title: 'Refresh Failed',
          message: result.message,
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to refresh database',
        color: 'red',
      });
    } finally {
      setRefreshingData(false);
    }
  };

  const handleTestScraping = async () => {
    console.log('Test scraping button clicked');
    setTestingScraping(true);
    try {
      console.log('Fetching from /api/test-scraping...');
      const response = await fetch('/api/test-scraping');
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Test scraping result:', result);
      
      if (result.success) {
        console.log('Showing success notification');
        notifications.show({
          title: 'Scraping Test Successful',
          message: `Found ${result.tyreCount} tyres. Sample: ${result.tyres.map((t: any) => `${t.brand} ${t.model}`).join(', ')}`,
          color: 'green',
        });
      } else {
        console.log('Showing error notification');
        notifications.show({
          title: 'Scraping Test Failed',
          message: result.error || 'Unknown error occurred',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Test scraping error:', error);
      notifications.show({
        title: 'Test Error',
        message: 'Failed to test scraping functionality',
        color: 'red',
      });
    } finally {
      setTestingScraping(false);
    }
  };

  const getRankColor = (index: number): string => {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    if (index < 5) return 'blue';
    return 'gray';
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Stack gap="xs">
            <Title order={1} size="h2" c="white">
              <IconWheel size={32} style={{ marginRight: 8 }} />
              Tyre Advisor
            </Title>
            <Text c="dimmed" size="sm">
              Get personalized tyre recommendations based on your riding style and preferences
            </Text>
          </Stack>
          <Group>
            <Button
              variant="outline"
              color="blue"
              leftSection={<IconSearch size={16} />}
              onClick={handleTestScraping}
              loading={testingScraping}
              disabled={testingScraping}
            >
              Test Scraping
            </Button>
            <Button
              variant="outline"
              color="gray"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefreshData}
              loading={refreshingData}
              disabled={refreshingData}
            >
              Refresh Data
            </Button>
          </Group>
        </Group>

        {/* Main Form */}
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Title order={2} size="h3">
                Tell us about your riding
              </Title>
              
              <Group grow>
                <Select
                  label="Riding Style"
                  placeholder="Select your primary riding style"
                  data={[
                    'Cross Country (XC)',
                    'Trail',
                    'Enduro',
                    'Downhill',
                    'All Mountain',
                    'Gravel',
                    'Road',
                    'Urban/Commuting'
                  ]}
                  required
                  {...form.getInputProps('ridingStyle')}
                />
                
                <Select
                  label="Primary Terrain"
                  placeholder="What terrain do you ride most?"
                  data={[
                    'Smooth trails',
                    'Rocky trails',
                    'Muddy trails',
                    'Loose gravel',
                    'Hardpack',
                    'Mixed terrain',
                    'Pavement',
                    'Technical trails'
                  ]}
                  required
                  {...form.getInputProps('terrain')}
                />
              </Group>

              <Group grow>
                <Select
                  label="Weather Conditions"
                  placeholder="Typical weather you ride in"
                  data={[
                    'Dry conditions',
                    'Wet conditions',
                    'Mixed conditions',
                    'All weather',
                    'Mostly dry',
                    'Mostly wet'
                  ]}
                  {...form.getInputProps('weatherConditions')}
                />
                
                <Select
                  label="Skill Level"
                  placeholder="Your riding experience"
                  data={[
                    'Beginner',
                    'Intermediate',
                    'Advanced',
                    'Expert',
                    'Professional'
                  ]}
                  required
                  {...form.getInputProps('skillLevel')}
                />
              </Group>

              <Group grow>
                <Select
                  label="Bike Type"
                  placeholder="What type of bike do you ride?"
                  data={[
                    'Mountain Bike',
                    'Gravel Bike',
                    'Road Bike',
                    'Hybrid Bike',
                    'E-Bike',
                    'Fat Bike'
                  ]}
                  {...form.getInputProps('bikeType')}
                />
                
                <Select
                  label="Wheel Size"
                  placeholder="Your wheel size"
                  data={[
                    '26"',
                    '27.5"',
                    '29"',
                    '700c',
                    '650b',
                    'Mixed'
                  ]}
                  {...form.getInputProps('wheelSize')}
                />
              </Group>

              <Group grow>
                <Select
                  label="Suspension Type"
                  placeholder="What type of suspension?"
                  data={[
                    'Hardtail',
                    'Full Suspension',
                    'Rigid',
                    'Front Suspension Only'
                  ]}
                  {...form.getInputProps('suspensionType')}
                />
                
                {form.values.suspensionType === 'Full Suspension' && (
                  <Select
                    label="Suspension Travel"
                    placeholder="How much travel does your bike have?"
                    data={[
                      '100-120mm (XC/Short Travel)',
                      '120-140mm (Trail)',
                      '140-160mm (Enduro)',
                      '160-180mm (Downhill)',
                      '180mm+ (Long Travel)'
                    ]}
                    {...form.getInputProps('suspensionTravel')}
                  />
                )}
              </Group>

              <Group grow>
                <NumberInput
                  label="Your Weight (kg)"
                  placeholder="Enter your weight"
                  min={30}
                  max={200}
                  {...form.getInputProps('weight')}
                />
                
                <Select
                  label="Riding Frequency"
                  placeholder="How often do you ride?"
                  data={[
                    'Daily',
                    '2-3 times per week',
                    'Weekly',
                    '2-3 times per month',
                    'Monthly',
                    'Occasionally'
                  ]}
                  {...form.getInputProps('ridingFrequency')}
                />
              </Group>

              <Select
                label="Performance Priority"
                placeholder="What's most important to you?"
                data={[
                  'Grip and traction',
                  'Rolling speed',
                      'Durability',
                      'Weight',
                      'Puncture resistance',
                      'All-around performance'
                ]}
                {...form.getInputProps('performancePriority')}
              />

              <MantineTextarea
                label="Additional Notes"
                placeholder="Any specific requirements or preferences?"
                rows={3}
                {...form.getInputProps('additionalNotes')}
              />

              <Button
                type="submit"
                size="lg"
                leftSection={<IconSearch size={20} />}
                loading={loading}
                fullWidth
              >
                Get Tyre Recommendations
              </Button>
            </Stack>
          </form>
        </Card>

        {/* Results Section */}
        {recommendations.length > 0 && (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab 
                  value="recommendations" 
                  leftSection={<IconWheel size={16} />}
                >
                  Recommendations
                </Tabs.Tab>
                <Tabs.Tab 
                  value="heatmap" 
                  leftSection={<IconMapPin size={16} />}
                >
                  Local Heatmap
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="recommendations" pt="md">
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Title order={2} size="h3">
                      Your Tyre Recommendations
                    </Title>
                    <Button
                      variant="light"
                      leftSection={<IconMessageCircle size={16} />}
                      onClick={() => setShowRefinement(true)}
                    >
                      Ask Questions
                    </Button>
                  </Group>

                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Rank</Table.Th>
                        <Table.Th>Tyre Model</Table.Th>
                        <Table.Th>Brand</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Best For</Table.Th>
                        <Table.Th>Price Range</Table.Th>
                        <Table.Th>Rating</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {recommendations.map((tyre, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <Badge color={getRankColor(index)}>
                              #{index + 1}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500}>{tyre.model}</Text>
                          </Table.Td>
                          <Table.Td>{tyre.brand}</Table.Td>
                          <Table.Td>
                            <Badge variant="light">{tyre.type}</Badge>
                          </Table.Td>
                          <Table.Td>{tyre.bestFor}</Table.Td>
                          <Table.Td>{tyre.priceRange}</Table.Td>
                          <Table.Td>
                            <Badge color="green">{tyre.rating}/5</Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="heatmap" pt="md">
                <Heatmap
                  recommendations={recommendations}
                  scrapedData={scrapedData}
                />
              </Tabs.Panel>
            </Tabs>
          </Card>
        )}

        {/* Refinement Modal */}
        <Modal
          opened={showRefinement}
          onClose={() => setShowRefinement(false)}
          title="Ask Questions to Refine Recommendations"
          size="lg"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Ask specific questions about the recommendations to get more personalized results.
            </Text>
            
            <MantineTextarea
              label="Your Question"
              placeholder="e.g., Which option is best for wet conditions? How do these compare for durability?"
              value={refinementQuestion}
              onChange={(event) => setRefinementQuestion(event.currentTarget.value)}
              rows={4}
            />
            
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setShowRefinement(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRefinement}
                loading={loading}
                leftSection={<IconRefresh size={16} />}
              >
                Refine Recommendations
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
} 