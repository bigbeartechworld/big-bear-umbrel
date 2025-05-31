#!/usr/bin/env node

import * as fs from "fs";
import * as jsyaml from "js-yaml";

interface UmbrelAppConfig {
  manifestVersion: number;
  id: string;
  name: string;
  category: string;
  version: string;
  tagline: string;
  icon: string;
  description: string;
  developer: string;
  website: string;
  dependencies: string[];
  repo: string;
  support: string;
  port: number;
  gallery?: string[];
  path: string;
  defaultPassword: string;
  releaseNotes?: string;
  submitter: string;
  submission: string;
}

interface AppWithPaths extends UmbrelAppConfig {
  configPath: string;
  appPath: string;
}

const getUmbrelAppConfigs = (): AppWithPaths[] => {
  const apps: AppWithPaths[] = [];
  const rootDir = "./";

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  entries.forEach((entry) => {
    if (entry.isDirectory() && entry.name.startsWith("big-bear-umbrel-")) {
      const appPath = `${rootDir}${entry.name}`;
      const configPath = `${appPath}/umbrel-app.yml`;

      if (fs.existsSync(configPath)) {
        try {
          const configFile = fs.readFileSync(configPath, "utf8");
          const config = jsyaml.load(configFile) as UmbrelAppConfig;

          if (config && config.version) {
            apps.push({
              ...config,
              configPath,
              appPath,
            });
          }
        } catch (e) {
          console.error(`Error parsing config file for ${entry.name}:`, e);
        }
      }
    }
  });

  return apps;
};

const generateUniquePort = (usedPorts: Set<number>): number => {
  // Start from port 8000 and find the next available port
  let port = 8000;
  while (usedPorts.has(port)) {
    port++;
  }
  return port;
};

const updateAppConfig = (app: AppWithPaths, newPort: number): boolean => {
  try {
    // Read the original file to preserve formatting and comments
    const originalContent = fs.readFileSync(app.configPath, "utf8");

    // Replace the port value while preserving the original formatting
    const updatedContent = originalContent.replace(
      /^port:\s*\d+$/m,
      `port: ${newPort}`
    );

    // Write the updated content back to the file
    fs.writeFileSync(app.configPath, updatedContent, "utf8");
    console.log(`✅ Updated ${app.id}: port ${app.port} → ${newPort}`);

    return true;
  } catch (error: any) {
    console.error(`❌ Failed to update ${app.id}:`, error.message);
    return false;
  }
};

const fixPortConflicts = (): void => {
  console.log("🔍 Scanning for port conflicts...\n");

  const apps = getUmbrelAppConfigs();
  const ports = apps.map((app) => app.port);
  const uniquePorts = new Set(ports);

  if (uniquePorts.size === apps.length) {
    console.log("✅ No port conflicts found! All apps have unique ports.");
    return;
  }

  // Find duplicate ports
  const duplicatePorts = ports.filter(
    (port, index) => ports.indexOf(port) !== index
  );
  const uniqueDuplicatePorts = [...new Set(duplicatePorts)];

  console.log(
    `⚠️  Found ${uniqueDuplicatePorts.length} conflicting port(s):\n`
  );

  // Group apps by conflicting ports
  const conflictGroups: { [key: number]: AppWithPaths[] } = {};
  uniqueDuplicatePorts.forEach((port) => {
    conflictGroups[port] = apps.filter((app) => app.port === port);
  });

  // Display conflicts
  Object.entries(conflictGroups).forEach(([port, conflictingApps]) => {
    console.log(`Port ${port}:`);
    conflictingApps.forEach((app) => {
      console.log(`  - ${app.id}`);
    });
    console.log();
  });

  // Generate new ports for conflicting apps (keep the first app with each port)
  const usedPorts = new Set(ports);
  const appsToUpdate: { app: AppWithPaths; newPort: number }[] = [];

  Object.entries(conflictGroups).forEach(([port, conflictingApps]) => {
    // Skip the first app (keep its port), update the rest
    const appsNeedingNewPorts = conflictingApps.slice(1);

    appsNeedingNewPorts.forEach((app) => {
      const newPort = generateUniquePort(usedPorts);
      usedPorts.add(newPort);
      appsToUpdate.push({ app, newPort });
    });
  });

  if (appsToUpdate.length === 0) {
    console.log("✅ No apps need port updates.");
    return;
  }

  console.log(`🔧 Updating ${appsToUpdate.length} app(s) with new ports:\n`);

  let successCount = 0;
  appsToUpdate.forEach(({ app, newPort }) => {
    if (updateAppConfig(app, newPort)) {
      successCount++;
    }
  });

  console.log(
    `\n🎉 Successfully updated ${successCount}/${appsToUpdate.length} apps!`
  );

  if (successCount < appsToUpdate.length) {
    console.log(
      "⚠️  Some updates failed. Please check the error messages above."
    );
    process.exit(1);
  } else {
    console.log("\n✅ All port conflicts have been resolved!");
    console.log("💡 Run 'npm test' to verify the fixes.");
  }
};

// Run the script
fixPortConflicts();
