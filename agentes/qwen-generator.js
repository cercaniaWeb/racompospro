// qwen-generator.js - Integration with Ollama for local model execution
import { execSync } from 'child_process';
import fs from 'fs';

export async function generateWithOllama(prompt, options = {}) {
  const {
    model = 'qwen2.5-coder:7b',
    temperature = 0.3,
    systemPrompt = 'You are Qwen-Coder, an expert AI assistant for software development.'
  } = options;

  try {
    // Prepare the full prompt with system context
    const fullPrompt = `${systemPrompt}\n\nUser request: ${prompt}`;
    
    // Use ollama to generate the response
    const command = `echo '${fullPrompt}' | ollama run ${model} -t ${temperature}`;
    const result = execSync(command, { encoding: 'utf8', timeout: 30000 });
    
    return result.trim();
  } catch (error) {
    throw new Error(`Ollama generation failed: ${error.message}`);
  }
}

export async function generateComponentWithAgent(componentSpec, agentFile) {
  // Read the agent configuration
  const agentContent = fs.readFileSync(agentFile, 'utf8');
  
  const prompt = `
  ${agentContent}
  
  Based on the above agent configuration, generate a React/Next.js component with the following specification:
  ${componentSpec}
  
  Include proper TypeScript types, Tailwind CSS classes, and follow Next.js best practices.
  `;

  return await generateWithOllama(prompt, {
    model: 'qwen2.5-coder:7b',
    temperature: 0.2,
    systemPrompt: `You are following the specific guidelines in the agent configuration file provided.`
  });
}

// Function to run Qwen with specific agent context
export async function runQwenWithAgent(agentName, task) {
  const agentFile = `../agents/${agentName}.md`;
  
  if (fs.existsSync(agentFile)) {
    const agentContent = fs.readFileSync(agentFile, 'utf8');
    
    const prompt = `
    ${agentContent}
    
    Task to execute: ${task}
    
    Please provide the implementation following the guidelines above.
    `;
    
    return await generateWithOllama(prompt, {
      model: 'qwen2.5-coder:7b',
      temperature: 0.3
    });
  } else {
    throw new Error(`Agent file not found: ${agentFile}`);
  }
}

// Health check for Ollama
export async function checkOllamaHealth() {
  try {
    execSync('ollama list', { timeout: 5000 });
    return { status: 'healthy', models: ['qwen2.5-coder:7b', 'qwen3-coder:480b-cloud'] };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

// Start Ollama server if not running
export async function ensureOllamaRunning() {
  try {
    // Check if ollama server is running
    execSync('ollama list', { timeout: 5000 });
    return true;
  } catch (error) {
    console.log('Starting Ollama server...');
    execSync('ollama serve > /tmp/ollama.log 2>&1 &', { shell: '/bin/bash' });
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      execSync('ollama list', { timeout: 5000 });
      return true;
    } catch {
      throw new Error('Failed to start Ollama server');
    }
  }
}