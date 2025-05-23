import { PrismaClient } from '@prisma/client';
import { log } from '../lib/logger';

/**
 * This script helps analyze query performance and suggests optimal indexes
 * Run with: ts-node prisma/query-index-analysis.ts
 */

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
});

// Collection of queries for analysis
const TOP_QUERIES = {
  // Common order queries
  getActiveOrders: () => prisma.order.findMany({ 
    where: { status: { in: ['PENDING', 'PREPARING', 'READY', 'IN_TRANSIT'] } },
    orderBy: { createdAt: 'desc' }
  }),
  getBusinessOrders: (businessId: string) => prisma.order.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' }
  }),
  getCourierOrders: (courierId: string) => prisma.order.findMany({
    where: { courierId },
    orderBy: { createdAt: 'desc' }
  }),
  getOrdersByCustomer: (customerId: string) => prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' }
  }),
  getOrdersByDateRange: (startDate: Date, endDate: Date) => prisma.order.findMany({
    where: { 
      createdAt: { 
        gte: startDate,
        lte: endDate
      } 
    },
    orderBy: { createdAt: 'desc' }
  }),
  
  // User-related queries
  getUsersByRole: (role: string) => prisma.user.findMany({
    where: { role },
  }),
  getUserWithProfile: (userId: string) => prisma.user.findUnique({
    where: { id: userId },
    include: {
      admin: true,
      business: true,
      customer: true,
      courier: true
    }
  }),
  
  // Business-related queries
  getBusinessProducts: (businessId: string) => prisma.product.findMany({
    where: { businessId }
  }),
  
  // Courier-related queries
  getActiveCouriers: () => prisma.courier.findMany({
    where: { status: 'ACTIVE' }
  }),
  getCourierEarnings: (courierId: string) => prisma.earning.findMany({
    where: { courierId }
  }),
  
  // Notification queries
  getUserNotifications: (userId: string) => prisma.notification.findMany({
    where: { userId, read: false }
  })
};

// Track query durations
const queryDurations: Record<string, number[]> = {};

// Listen for query events
prisma.$on('query', async (e: any) => {
  const startTime = performance.now();
  const queryName = e.query;
  
  // Execute the query (already happens from the query event)
  
  const duration = performance.now() - startTime;
  if (!queryDurations[queryName]) {
    queryDurations[queryName] = [];
  }
  queryDurations[queryName].push(duration);
});

async function runQueryAnalysis() {
  log.info('Starting query performance analysis...');

  try {
    // Run each query multiple times to get average performance
    for (const [name, queryFn] of Object.entries(TOP_QUERIES)) {
      log.info(`Testing query: ${name}`);
      
      // Run query with sample parameters
      if (name === 'getBusinessOrders') {
        await queryFn('sample-business-id');
      } else if (name === 'getCourierOrders') {
        await queryFn('sample-courier-id');
      } else if (name === 'getOrdersByCustomer') {
        await queryFn('sample-customer-id');
      } else if (name === 'getUsersByRole') {
        await queryFn('BUSINESS');
      } else if (name === 'getUserWithProfile') {
        await queryFn('sample-user-id');
      } else if (name === 'getBusinessProducts') {
        await queryFn('sample-business-id');
      } else if (name === 'getCourierEarnings') {
        await queryFn('sample-courier-id');
      } else if (name === 'getUserNotifications') {
        await queryFn('sample-user-id');
      } else if (name === 'getOrdersByDateRange') {
        await queryFn(new Date('2023-01-01'), new Date('2023-01-31'));
      } else {
        await queryFn();
      }
    }

    // Display results
    log.info('Query analysis results:');
    for (const [query, durations] of Object.entries(queryDurations)) {
      const avgDuration = durations.reduce((sum, time) => sum + time, 0) / durations.length;
      log.info(`Query: ${query}`);
      log.info(`Average duration: ${avgDuration.toFixed(2)}ms over ${durations.length} executions`);
      
      // Suggest indexes based on query patterns
      suggestIndexes(query);
    }
  } catch (error) {
    log.error('Error in query analysis', error);
  } finally {
    await prisma.$disconnect();
  }
}

function suggestIndexes(query: string) {
  // Simple pattern matching for basic index suggestions
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('where') && queryLower.includes('orderby')) {
    // Extract the fields in WHERE clause
    const whereMatch = queryLower.match(/where\s+(.*?)\s+orderby/);
    const whereClause = whereMatch ? whereMatch[1] : '';
    
    // Extract the field in ORDER BY
    const orderByMatch = queryLower.match(/orderby\s+(.*?)(?:\s+|$)/);
    const orderByField = orderByMatch ? orderByMatch[1].replace(/['"{}]/g, '') : '';
    
    // Find the fields in the WHERE clause
    const potentialIndexFields = [];
    
    // Common fields we might want to index
    const fieldPatterns = [
      { pattern: /status/, field: 'status' },
      { pattern: /businessid/, field: 'businessId' },
      { pattern: /courierid/, field: 'courierId' },
      { pattern: /customerid/, field: 'customerId' },
      { pattern: /userid/, field: 'userId' },
      { pattern: /createdat/, field: 'createdAt' },
      { pattern: /role/, field: 'role' },
      { pattern: /read\s*:\s*false/, field: 'read' }
    ];
    
    // Check for each field pattern
    for (const { pattern, field } of fieldPatterns) {
      if (pattern.test(whereClause)) {
        potentialIndexFields.push(field);
      }
    }
    
    // Add order by field if not already included
    if (orderByField && !potentialIndexFields.includes(orderByField)) {
      potentialIndexFields.push(orderByField);
    }
    
    // Suggest indexes
    if (potentialIndexFields.length > 0) {
      log.info(`Suggested indexes for query:`);
      
      // Single field indexes
      potentialIndexFields.forEach(field => {
        log.info(`- Single field index on ${field}`);
      });
      
      // Compound indexes (for multiple fields)
      if (potentialIndexFields.length > 1) {
        const compoundFields = [...potentialIndexFields].sort((a, b) => {
          // Prioritize equality predicates over range predicates
          const aIsRange = a === 'createdAt';
          const bIsRange = b === 'createdAt';
          if (aIsRange && !bIsRange) return 1;
          if (!aIsRange && bIsRange) return -1;
          return 0;
        });
        
        log.info(`- Compound index on (${compoundFields.join(', ')})`);
      }
    }
  }
}

// Run the analysis when this script is executed directly
if (require.main === module) {
  runQueryAnalysis()
    .then(() => log.info('Analysis complete'))
    .catch(err => log.error('Error running analysis', err));
}

export default runQueryAnalysis; 