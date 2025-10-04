// Test script to verify API URL functionality
import axios from 'axios';

async function testAPI() {
  try {
    console.log('Testing API URL: https://road-safety-rx9y.onrender.com/api/risk?lat=26.8798111&lon=75.7807435&speed=60');
    
    const response = await axios.get('https://road-safety-rx9y.onrender.com/api/risk', {
      params: {
        lat: 26.8798111,
        lon: 75.7807435,
        speed: 60
      },
      timeout: 10000
    });
    
    console.log('✅ API Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Check if response structure matches what frontend expects
    const data = response.data;
    const expectedFields = ['factors', 'overall_risk_score'];
    const missingFields = expectedFields.filter(field => !(field in data));
    
    if (missingFields.length === 0) {
      console.log('✅ Response structure matches frontend expectations');
    } else {
      console.log('❌ Missing expected fields:', missingFields);
    }
    
    // Check factors structure
    if (data.factors) {
      const expectedFactorFields = ['accident_hotspot', 'current_speed', 'road_condition', 'weather'];
      const missingFactorFields = expectedFactorFields.filter(field => !(field in data.factors));
      
      if (missingFactorFields.length === 0) {
        console.log('✅ Factors structure is complete');
      } else {
        console.log('❌ Missing factor fields:', missingFactorFields);
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAPI();
