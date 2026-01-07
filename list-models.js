require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  
  console.log('Fetching available models...\n');
  try {
    const models = await genAI.listModels();
    models.forEach(model => {
      console.log('Model:', model.name);
      console.log('  Display Name:', model.displayName);
      if (model.supportedGenerationMethods) {
        console.log('  Supported:', model.supportedGenerationMethods.join(', '));
      }
      console.log('');
    });
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

listModels();
