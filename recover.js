const fs = require('fs');

const transcript = fs.readFileSync('C:\\Users\\narne\\.gemini\\antigravity-ide\\brain\\5bc171f9-45c1-4c89-a23c-4bc32a626733\\.system_generated\\logs\\transcript.jsonl', 'utf8');
const lines = transcript.split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('multi_replace_file_content')) {
    try {
      const obj = JSON.parse(lines[i]);
      if (obj.tool_calls) {
          for(const tool of obj.tool_calls) {
              if (tool.function.name === 'default_api:multi_replace_file_content') {
                  const args = JSON.parse(tool.function.arguments);
                  if (args.TargetFile && args.TargetFile.includes('onboarding\\index.html')) {
                      console.log('Found it!');
                      // Let's get the response which comes in the NEXT lines
                      break;
                  }
              }
          }
      }
      
      if (obj.type === 'ACTION_RESULT' && obj.content && obj.content.includes('onboarding') && obj.content.includes('diff_block_start')) {
          fs.writeFileSync('c:\\Users\\narne\\Desktop\\project\\recovered_diff.txt', obj.content, 'utf8');
          console.log('Wrote recovered diff to recovered_diff.txt');
          process.exit(0);
      }
    } catch(e) {}
  }
}
