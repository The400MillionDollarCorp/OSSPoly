// Simple test to verify mock stream functionality
const { mockAgentStream } = require('./lib/actions/agent/mock-stream.ts');

async function testMockStream() {
  console.log('Testing mock agent stream...');
  
  const mockTokens = [
    { token_id: '1', outcome: 'YES', price: 0.65 },
    { token_id: '2', outcome: 'NO', price: 0.35 }
  ];
  
  try {
    const stream = mockAgentStream(12345, mockTokens);
    
    console.log('Stream created successfully');
    console.log('Iterating through events...');
    
    let eventCount = 0;
    for await (const event of stream) {
      eventCount++;
      console.log(`Event ${eventCount}:`, event.event);
      if (event.data) {
        console.log('  Data keys:', Object.keys(event.data));
      }
    }
    
    console.log(`\nTest completed! Received ${eventCount} events`);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMockStream();
