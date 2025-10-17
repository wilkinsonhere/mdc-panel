
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const NarrativeInputSchema = z.object({
  officerName: z.string().describe("The full name of the reporting officer."),
  officerBadge: z.string().describe("The badge number of the reporting officer."),
  officerDepartment: z.string().describe("The department of the reporting officer."),
  officerCallsign: z.string().describe("The callsign of the reporting officer."),
  suspectName: z.string().describe("The full name of the suspect."),
  charges: z.array(z.string()).describe("A list of charges filed against the suspect."),
  location: z.string().describe("The location of the arrest."),
  date: z.string().describe("The date of the arrest."),
  time: z.string().describe("The time of the arrest."),
  logs: z.string().describe("The user's raw logs detailing the events of the incident."),
});
export type NarrativeInput = z.infer<typeof NarrativeInputSchema>;

const NarrativeOutputSchema = z.object({
  narrative: z.string().describe("The full, detailed arrest narrative based on the provided logs and context."),
});
export type NarrativeOutput = z.infer<typeof NarrativeOutputSchema>;

const narrativePrompt = ai.definePrompt({
  name: 'basicArrestNarrativePrompt',
  input: { schema: NarrativeInputSchema },
  output: { schema: NarrativeOutputSchema },
  prompt: `You are an expert at writing police arrest reports. Your task is to generate a detailed, professional narrative based on the provided information. Follow the structure and tone of the example provided.

**Instructions:**
1.  **Generate a comprehensive arrest narrative.** Use the provided logs and context to construct a story in the first person from the officer's perspective. The narrative should be in chronological order and clearly explain the probable cause for the arrest and each charge.
2.  **Follow the example narrative structure precisely.**

**Example Narrative Structure:**
"On {{date}}, I, {{officerRank}} {{officerName}} (#{{officerBadge}}) of the {{officerDepartment}}, while conducting patrol operations under the callsign "{{officerCallsign}}", responded to an incident at {{location}}. At approximately {{time}}, [Continue with a detailed, first-person account of the events from the logs, explaining the sequence of events, actions taken, and justification for the arrest and charges...]. The suspect, {{suspectName}}, was arrested for the following offenses: {{charges}}."

---

**Provided Information:**

*   **Officer Name:** {{officerName}}
*   **Officer Badge:** {{officerBadge}}
*   **Officer Department:** {{officerDepartment}}
*   **Officer Callsign:** {{officerCallsign}}
*   **Suspect Name:** {{suspectName}}
*   **Location of Arrest:** {{location}}
*   **Date:** {{date}}
*   **Time:** {{time}}
*   **Charges:** 
    {{#each charges}}
    - {{this}}
    {{/each}}
*   **Event Logs:**
    \`\`\`
    {{logs}}
    \`\`\`
`,
});

export const generateBasicArrestNarrativeFlow = ai.defineFlow(
  {
    name: 'generateBasicArrestNarrativeFlow',
    inputSchema: NarrativeInputSchema,
    outputSchema: NarrativeOutputSchema,
  },
  async (input) => {
    const { output } = await narrativePrompt(input);
    if (!output) {
      throw new Error("The AI failed to produce a valid output.");
    }
    return output;
  }
);
