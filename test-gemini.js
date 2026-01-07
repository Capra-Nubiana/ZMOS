require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  
  // Try different model names
  const modelNames = [
    'gemini-1.5-pro',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp'
  ];

  for (const modelName of modelNames) {
    console.log(`\nTesting ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello in one word');
      const response = await result.response;
      console.log(`✅ ${modelName} works! Response:`, response.text());
      break; // Stop after first success
    } catch (error) {
      console.log(`❌ ${modelName} failed:`, error.message.split('\n')[0]);
    }
  }
}

testGemini();
