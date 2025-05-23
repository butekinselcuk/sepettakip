/**
 * Policy Application Test Script
 * 
 * This script demonstrates how different policies are applied
 * to cancellation and refund requests.
 */

// Sample Policy: 30-minute free cancellation, time-based fees after
const timePolicyExample = {
  name: "Standard Time-Based Policy",
  description: "Allows free cancellation within 30 minutes, then applies gradual fees",
  autoApproveTimeline: 10, // auto-approve cancellations within 10 minutes
  timeLimit: 7, // can only request cancellations/refunds within 7 days
  cancellationFees: [
    {
      minMinutes: 0,
      maxMinutes: 30,
      feePercentage: 0,
      description: "Free cancellation within 30 minutes"
    },
    {
      minMinutes: 30,
      maxMinutes: 60,
      feePercentage: 10,
      description: "10% fee between 30-60 minutes"
    },
    {
      minMinutes: 60,
      maxMinutes: null,
      feePercentage: 20,
      description: "20% fee after 60 minutes"
    }
  ],
  orderStatusRules: {
    "PENDING": { allowCancellation: true, cancellationFeePercentage: 0 },
    "PROCESSING": { allowCancellation: true, cancellationFeePercentage: 10 },
    "PREPARING": { allowCancellation: true, cancellationFeePercentage: 20 },
    "READY": { allowCancellation: false, cancellationFeePercentage: null },
    "IN_TRANSIT": { allowCancellation: false, cancellationFeePercentage: null },
    "DELIVERED": { allowCancellation: false, cancellationFeePercentage: null }
  },
  productRules: {
    "food": { refundable: true, refundTimeLimit: 1 }, // Food can only be refunded within 1 day
    "drinks": { refundable: true, refundTimeLimit: 2 },
    "electronics": { refundable: true, refundTimeLimit: 14 },
    "clothing": { refundable: true, refundTimeLimit: 30 },
    "perishable": { refundable: false } // Not refundable
  },
  isActive: true
};

// Sample order
const sampleOrder = {
  id: "12345",
  orderNumber: "ORD-12345",
  status: "PROCESSING",
  createdAt: new Date(new Date().getTime() - 45 * 60 * 1000), // 45 minutes ago
  totalPrice: 100,
  items: [
    { id: "item1", name: "Hamburger", price: 50, quantity: 1, categoryId: "food" },
    { id: "item2", name: "Cola", price: 10, quantity: 2, categoryId: "drinks" },
    { id: "item3", name: "T-shirt", price: 30, quantity: 1, categoryId: "clothing" }
  ],
  business: {
    id: "business1",
    name: "Restaurant ABC"
  },
  customer: {
    id: "customer1",
    userId: "user1"
  }
};

// Test cancellation policy application
function testCancellationPolicy(order, policy) {
  console.log("\n--- TESTING CANCELLATION POLICY ---");
  
  // Check if cancellation is allowed for the order status
  const statusRule = policy.orderStatusRules[order.status];
  if (!statusRule || !statusRule.allowCancellation) {
    console.log(`❌ Cannot cancel order in ${order.status} status according to policy`);
    return;
  }
  
  console.log(`✅ Order in ${order.status} status can be cancelled`);
  
  // Calculate time since order creation
  const creationTime = new Date(order.createdAt);
  const currentTime = new Date();
  const minutesSinceCreation = Math.floor((currentTime - creationTime) / (1000 * 60));
  
  console.log(`ℹ️ Order was created ${minutesSinceCreation} minutes ago`);
  
  // Check for auto-approval
  let autoApprove = false;
  if (policy.autoApproveTimeline !== null && minutesSinceCreation <= policy.autoApproveTimeline) {
    autoApprove = true;
    console.log(`✅ Auto-approved: within ${policy.autoApproveTimeline} minutes of order creation`);
  } else {
    console.log(`ℹ️ Not eligible for auto-approval (over ${policy.autoApproveTimeline} minutes)`);
  }
  
  // Calculate cancellation fee based on time
  let cancellationFee = statusRule.cancellationFeePercentage || 0;
  let feeDescription = `Base fee for ${order.status} status: ${cancellationFee}%`;
  
  // Check time-based fee rules
  if (policy.cancellationFees && policy.cancellationFees.length > 0) {
    for (const feeRule of policy.cancellationFees) {
      if (minutesSinceCreation >= feeRule.minMinutes && 
          (feeRule.maxMinutes === null || minutesSinceCreation <= feeRule.maxMinutes)) {
        if (feeRule.feePercentage > cancellationFee) {
          cancellationFee = feeRule.feePercentage;
          feeDescription = feeRule.description;
        }
        break;
      }
    }
  }
  
  const feeAmount = (order.totalPrice * cancellationFee) / 100;
  
  console.log(`💰 Cancellation Fee: ${cancellationFee}% (${feeAmount} currency units)`);
  console.log(`📝 Fee reason: ${feeDescription}`);
  
  console.log(`Result: ${autoApprove ? 'AUTO_APPROVED' : 'PENDING'} with ${feeAmount} fee`);
}

// Test refund policy application
function testRefundPolicy(order, policy, itemsToRefund = []) {
  console.log("\n--- TESTING REFUND POLICY ---");
  
  // Check if delivered (only delivered orders can be refunded)
  if (order.status !== "DELIVERED") {
    console.log(`❌ Cannot refund order in ${order.status} status (must be DELIVERED)`);
    return;
  }
  
  // Check time limit if any
  if (policy.timeLimit !== null) {
    // Simulate a delivered order
    const deliveryTime = new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const currentTime = new Date();
    const daysSinceDelivery = Math.floor((currentTime - deliveryTime) / (1000 * 60 * 60 * 24));
    
    console.log(`ℹ️ Order was delivered ${daysSinceDelivery} days ago`);
    
    if (daysSinceDelivery > policy.timeLimit) {
      console.log(`❌ Cannot refund order after ${policy.timeLimit} days of delivery`);
      return;
    }
    
    console.log(`✅ Order is within the ${policy.timeLimit}-day refund window`);
    
    // Check for auto-approval based on time
    if (policy.autoApproveTimeline !== null && daysSinceDelivery <= policy.autoApproveTimeline) {
      console.log(`✅ Auto-approved: within ${policy.autoApproveTimeline} days of delivery`);
    } else {
      console.log(`ℹ️ Not eligible for time-based auto-approval (over ${policy.autoApproveTimeline} days)`);
    }
  }
  
  // Check product-based rules if items are specified
  if (itemsToRefund.length > 0 && policy.productRules) {
    console.log("Checking refund eligibility for specific items:");
    
    let totalRefundable = 0;
    let rejectedItems = [];
    
    for (const item of itemsToRefund) {
      const foundItem = order.items.find(i => i.id === item);
      
      if (!foundItem) {
        console.log(`❌ Item ${item} not found in order`);
        continue;
      }
      
      const category = foundItem.categoryId;
      const categoryRule = policy.productRules[category];
      
      if (!categoryRule || !categoryRule.refundable) {
        console.log(`❌ Item ${foundItem.name} (${category}) is not refundable`);
        rejectedItems.push(foundItem.name);
        continue;
      }
      
      if (categoryRule.refundTimeLimit) {
        const deliveryTime = new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        const currentTime = new Date();
        const daysSinceDelivery = Math.floor((currentTime - deliveryTime) / (1000 * 60 * 60 * 24));
        
        if (daysSinceDelivery > categoryRule.refundTimeLimit) {
          console.log(`❌ Item ${foundItem.name} (${category}) cannot be refunded after ${categoryRule.refundTimeLimit} days`);
          rejectedItems.push(foundItem.name);
          continue;
        }
      }
      
      console.log(`✅ Item ${foundItem.name} (${category}) is eligible for refund`);
      totalRefundable += foundItem.price * foundItem.quantity;
    }
    
    console.log(`\n💰 Total refundable amount: ${totalRefundable} currency units`);
    if (rejectedItems.length > 0) {
      console.log(`❌ Rejected items: ${rejectedItems.join(", ")}`);
    }
  }
}

// Test our sample policy with a cancellation request
testCancellationPolicy(sampleOrder, timePolicyExample);

// For refund testing, let's modify the order to be delivered
const deliveredOrder = {
  ...sampleOrder,
  status: "DELIVERED",
  actualDelivery: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
};

// Test with a refund request for specific items
testRefundPolicy(deliveredOrder, timePolicyExample, ["item1", "item2", "item3"]);

// You can run this script with Node.js to see the output
console.log("\nThis script demonstrates how policies would be evaluated for cancellation and refund requests.");
console.log("Use similar logic in your API endpoints to enforce business policies consistently."); 