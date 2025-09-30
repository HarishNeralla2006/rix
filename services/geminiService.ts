
// Note: This service has been updated to use Pollinations.ai for image generation
// and mock data for text generation. The filename is kept as geminiService.ts
// to avoid breaking existing imports throughout the application.

import type { HardwareProjectDetails, SoftwareProjectDetails } from '../types';

// --- MOCK DATA GENERATORS ---

const mockSoftwarePRD = (description: string): string => `
# Product Requirements Document (PRD)

## 1. Introduction & Vision
**Project Description:** ${description}

**Vision:** To develop a robust, user-friendly application that effectively addresses the core problem statement. This product aims to be a market leader by providing a seamless user experience, powerful features, and reliable performance.

## 2. User Personas & Audience
*   **Primary User (The Doer):** The main target audience who will use the product daily to accomplish their core tasks. They value efficiency, simplicity, and a clean interface.
*   **Administrator (The Manager):** A power user responsible for account management, configuration, and overseeing usage. They require access to analytics and user management tools.
*   **New User (The Explorer):** A first-time user who needs intuitive onboarding and clear guidance to understand the product's value proposition.

## 3. Features & Requirements
### Core Features (MVP):
-   **User Authentication:** Secure sign-up, login, password reset, and logout functionality.
-   **Dashboard:** A central hub displaying key information, recent activity, and navigation to core features.
-   **Core Feature A:** Detailed implementation of the primary value proposition based on the project description.
-   **User Profile & Settings:** Allows users to manage their account information, preferences, and notifications.

### Technical Requirements:
-   **Frontend:** A responsive, single-page application (SPA) built with a modern JavaScript framework for a fluid user experience.
-   **Backend:** A scalable, secure, and stateless RESTful or GraphQL API.
-   **Database:** A reliable and scalable relational (e.g., PostgreSQL) or NoSQL (e.g., MongoDB) database.
-   **Deployment:** The application must be containerized using Docker for consistency across environments and deployed on a major cloud provider (AWS, GCP, Azure).
-   **Security:** Must include protection against common web vulnerabilities (XSS, CSRF, SQL Injection) and use HTTPS for all communication.

## 4. Success Metrics
*   **User Adoption:** Achieve 1,000 active users within 3 months of launch.
*   **Engagement:** Daily Active Users (DAU) / Monthly Active Users (MAU) ratio should be above 20%.
*   **Performance:** API response times should be under 200ms for 95% of requests.
*   **Reliability:** Maintain 99.9% uptime.

## 5. Future Scope (Post-MVP)
-   Mobile application (iOS and Android).
-   Third-party integrations (e.g., Slack, Google Workspace).
-   Advanced analytics and reporting features.
-   Team collaboration features.
`;

const mockTechStack = (): string[] => ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express.js', 'PostgreSQL', 'Docker', 'AWS'];


const mockHardwareBlueprint = (description: string): string => `
# Technical Blueprint

## 1. Project Overview & Goals
**Project Description:** ${description}

**Primary Goal:** To design, build, and test a functional hardware prototype that successfully performs the core tasks outlined in the description. The final product should be reliable, user-friendly, and housed in a suitable enclosure.

## 2. Core Functionality
- **Input:** The device will accept input via [e.g., sensors, buttons, wireless signals].
- **Processing:** A central microcontroller will process the input data according to the embedded firmware logic.
- **Output:** The device will produce an output in the form of [e.g., visual display, motor actuation, audio signal, data transmission].

## 3. Component Specification
*   **Microcontroller:** An ESP32 is recommended for projects requiring Wi-Fi or Bluetooth connectivity. For simpler, non-connected projects, an Arduino Uno or Nano is sufficient.
*   **Primary Sensor/Module:** The key component that enables the core functionality, such as a BME280 for environmental sensing or an MPU-6050 for motion tracking.
*   **Power Supply Circuit:** A regulated 5V or 3.3V power supply, typically using a USB input with an LDO (Low-Dropout) regulator or a LiPo battery with a dedicated charging and protection module (e.g., TP4056).
*   **User Interface:** Components like tactile buttons for input and a 0.96" OLED display or WS2812B LEDs for status feedback.

## 4. Power & Enclosure Design
*   **Power Budget:** The design must operate within a calculated power budget, especially if battery-powered. All components' current draw should be summed to determine the required power supply capacity.
*   **Enclosure:** A custom 3D-printed enclosure using PETG or PLA filament is recommended for prototyping. The design must include mounting points for the PCB, openings for ports (USB, power), and any necessary ventilation.
`;

const mockHardwareMaterialsList = (description: string): string => `
# Materials & Tools Required

## I. Electronic Components
- **Microcontroller:** 1x ESP32 Development Board (for Wi-Fi/Bluetooth) or Arduino Uno R3.
- **Primary Sensor/Module:** 1x [Relevant sensor, e.g., DHT22 for temp/humidity, HC-SR04 for distance]. This is key for: *${description}*.
- **Resistors:** 1x Assorted resistor kit (1kΩ, 10kΩ, 220Ω are most common).
- **LEDs:** 5x Standard 5mm LEDs (Assorted colors for status indicators).
- **Buttons:** 2x Tactile push buttons.
- **Connecting Wires:** 1x Pack of male-to-male and male-to-female jumper wires.
- **Power Supply:** 1x 5V/1A USB power adapter and USB cable.

## II. Prototyping & Assembly
- **Breadboard:** 1x 830-point solderless breadboard.
- **Soldering Iron & Solder:** (Required for permanent circuits).
- **Perfboard/PCB:** 1x Prototyping perfboard for final assembly.
- **Enclosure:** Access to a 3D printer for the case is highly recommended.

## III. Tools
- **Digital Multimeter:** Essential for testing connections and voltage levels.
- **Wire Strippers & Cutters:** For preparing wires.
- **Screwdriver Set:** For final assembly.
- **Computer:** With Arduino IDE or PlatformIO VSCode extension installed.
`;

const mockHardwareBuildGuide = (description: string): string => `
# Step-by-Step Build Guide

## 0. Prerequisites & Safety
- **Safety First:** Always disconnect power before making changes to your circuit. When soldering, use proper ventilation and safety glasses.
- **Firmware:** Download the required libraries for your components via the Arduino IDE's Library Manager before you begin.

## 1. Breadboard Prototyping
1.  **Mount Microcontroller:** Place the ESP32 or Arduino onto the breadboard, straddling the central divider.
2.  **Power Rails:** Connect the microcontroller's 5V/VIN and GND pins to the red (+) and blue (-) power rails on the breadboard, respectively.
3.  **Connect Core Sensor:** Following the schematic, carefully connect the primary sensor module to the microcontroller. Pay close attention to VCC, GND, and data pins.
4.  **Add UI Components:** Wire the LEDs (with current-limiting resistors) and buttons to available digital I/O pins.

## 2. Firmware Upload & Initial Test
1.  **Connect to PC:** Connect the microcontroller to your computer via USB.
2.  **Select Board & Port:** In the Arduino IDE, select the correct board (e.g., "ESP32 Dev Module") and the corresponding COM port.
3.  **Compile & Upload:** Write a basic test sketch to verify each component is working (e.g., blink an LED, print sensor data to Serial Monitor). Compile and upload the code.
4.  **Debug:** Use the Serial Monitor to check for sensor readings or error messages.

## 3. Final Assembly
1.  **Solder Circuit:** Once the breadboard prototype is fully functional, transfer the circuit to a perfboard for a permanent connection. Plan your component layout first.
2.  **Mount in Enclosure:** Secure the perfboard and any external components (like sensors or displays) into the 3D-printed enclosure.
3.  **Final Test:** Power on the fully assembled device and run a comprehensive test of all its features.
`;

// --- IMAGE GENERATION (POLLINATIONS.AI) ---

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const isSchematic = prompt.toLowerCase().includes('schematic');
    
    // Use a specific, high-quality prompt for schematics, and a different one for other images
    const enhancedPrompt = isSchematic
      ? `${prompt}, detailed electronic circuit schematic, black and white, technical drawing, clean lines, component labels, professional diagram, high resolution`
      : `${prompt}, photorealistic, 8k, detailed, professional photography, cinematic lighting`;
      
    const negativePrompt = `blurry, ugly, cartoon, drawing, sketch, deformed, watermark, text, logo, 3d render, illustration`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1280&height=720&seed=${Date.now()}&nologo=true&negative_prompt=${encodeURIComponent(negativePrompt)}`;
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Pollinations.ai image generation failed: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch (error) {
    console.error("Error generating image from Pollinations.ai:", error);
    throw error;
  }
};

// --- ASSET GENERATION ---

export const generateSoftwareProjectAssets = async (description: string): Promise<SoftwareProjectDetails | null> => {
  const uiMockupPrompt = `UI mockup for a web application based on this description: ${description}. The style should be clean, modern, and professional. Focus on the main dashboard or landing page view.`;
  const architecturePrompt = `High-level system architecture diagram for a project with this description: ${description}. The diagram should illustrate the main components (e.g., frontend, backend, database, external APIs) and their interactions. Style should be a clean, professional technical diagram.`;

  try {
    const [uiMockup, architectureDiagram] = await Promise.all([
      generateImage(uiMockupPrompt),
      generateImage(architecturePrompt)
    ]);
    
    const prd = mockSoftwarePRD(description);
    const techStack = mockTechStack();

    if (!uiMockup || !architectureDiagram) {
      return null;
    }

    return {
      prd,
      techStack,
      uiMockups: [uiMockup],
      architectureDiagram
    };
  } catch (error) {
    console.error("Failed to generate software project assets:", error);
    throw error;
  }
};

export const generateHardwareProjectAssets = async (description: string): Promise<HardwareProjectDetails | null> => {
  const schematicsPrompt = `Circuit schematic diagram for a hardware project with this description: ${description}.`;

  try {
    const schematics = await generateImage(schematicsPrompt);
    
    const blueprint = mockHardwareBlueprint(description);
    const buildGuide = mockHardwareBuildGuide(description);
    const materialsList = mockHardwareMaterialsList(description);

    if (!schematics) {
      return null;
    }

    return {
      blueprint,
      schematics: [schematics],
      buildGuide,
      materialsList,
    };
  } catch (error) {
    console.error("Failed to generate hardware project assets:", error);
    throw error;
  }
};