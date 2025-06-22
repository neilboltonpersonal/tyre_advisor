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
import { TyreRecommendation } from '../types/tyre';
import { getTyreRecommendations } from '../lib/tyre-advisor';
import Heatmap from '../components/Heatmap';

export default function HomePage() {
  const [recommendations, setRecommendations] = useState<TyreRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementQuestion, setRefinementQuestion] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('recommendations');

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
    try {
      const results = await getTyreRecommendations(values);
      setRecommendations(results);
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
      const refinedResults = await getTyreRecommendations(
        form.values,
        refinementQuestion,
        recommendations
      );
      setRecommendations(refinedResults);
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
        <Group justify="center" mb="xl">
          <IconBike size={48} color="#228be6" />
          <div>
            <Title order={1} ta="center" c="blue">
              Tyre Advisor
            </Title>
            <Text c="dimmed" ta="center" size="lg">
              Find your perfect tyre match
            </Text>
          </div>
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
                <Heatmap recommendations={recommendations} />
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