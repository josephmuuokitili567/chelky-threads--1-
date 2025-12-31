import { PickupLocation } from '../types';

// Mock Database of Pick-Up Mtaani Agents
const MOCK_AGENTS: PickupLocation[] = [
  { id: 'pm_001', name: 'Nairobi CBD - Sasa Mall', region: 'CBD', price: 120 },
  { id: 'pm_002', name: 'Nairobi CBD - Imenti House', region: 'CBD', price: 120 },
  { id: 'pm_003', name: 'Westlands - The Mall', region: 'Westlands', price: 150 },
  { id: 'pm_004', name: 'Roysambu - TRM', region: 'Thika Road', price: 180 },
  { id: 'pm_005', name: 'Kahawa Wendani - Magunas', region: 'Thika Road', price: 180 },
  { id: 'pm_006', name: 'Eastleigh - Yare Towers', region: 'Eastleigh', price: 150 },
  { id: 'pm_007', name: 'Karen - Shopping Center', region: 'Karen', price: 250 },
  { id: 'pm_008', name: 'Ongata Rongai - Tuskys', region: 'Rongai', price: 250 },
  { id: 'pm_009', name: 'Juja - Juja City Mall', region: 'Juja', price: 200 },
  { id: 'pm_010', name: 'Thika - Ananas Mall', region: 'Thika', price: 220 },
  { id: 'pm_011', name: 'Utawala - Naivas', region: 'Embakasi', price: 180 },
  { id: 'pm_012', name: 'South B - Hazina', region: 'South B', price: 150 },
  { id: 'pm_013', name: 'Langata - Cleanshelf', region: 'Langata', price: 200 },
  { id: 'pm_014', name: 'Buruburu - The Point', region: 'Eastlands', price: 150 },
  { id: 'pm_015', name: 'Donholm - Greenspan', region: 'Eastlands', price: 150 },
];

export const pickupService = {
  /**
   * Simulates fetching all available agents from the API
   */
  getAgents: async (): Promise<PickupLocation[]> => {
    return new Promise((resolve) => {
      // Simulate network latency of 800ms
      setTimeout(() => {
        resolve(MOCK_AGENTS);
      }, 800); 
    });
  },

  /**
   * Simulates a server-side search for agents
   */
  searchAgents: async (query: string): Promise<PickupLocation[]> => {
    return new Promise((resolve) => {
      // Simulate network latency for search (shorter)
      setTimeout(() => {
        if (!query.trim()) {
          resolve(MOCK_AGENTS);
          return;
        }
        
        const lowerQuery = query.toLowerCase();
        const results = MOCK_AGENTS.filter(agent => 
          agent.name.toLowerCase().includes(lowerQuery) || 
          agent.region.toLowerCase().includes(lowerQuery)
        );
        resolve(results);
      }, 500);
    });
  }
};