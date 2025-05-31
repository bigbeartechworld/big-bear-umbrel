const fs = require("fs");
const path = require("path");

// Simple YAML parser for the basic structure we need
const parseYaml = (content) => {
  const lines = content.split("\n");
  const result = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes(":")) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Handle multiline values (basic support)
      if (value === ">" || value === "|") {
        continue; // Skip multiline indicators for now
      }

      result[key] = value;
    }
  }

  return result;
};

const getAppsList = async () => {
  const apps = {};
  const rootDir = path.join(__dirname, "../..");

  // Get all directories that start with "big-bear-umbrel-"
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const appDirs = entries
    .filter(
      (entry) =>
        entry.isDirectory() && entry.name.startsWith("big-bear-umbrel-")
    )
    .map((entry) => entry.name);

  for (const appDir of appDirs) {
    const umbrelAppPath = path.join(rootDir, appDir, "umbrel-app.yml");

    if (!fs.existsSync(umbrelAppPath)) {
      console.warn(`umbrel-app.yml not found for ${appDir}`);
      continue;
    }

    try {
      const umbrelAppContent = fs.readFileSync(umbrelAppPath, "utf8");
      const appConfig = parseYaml(umbrelAppContent);

      apps[appDir] = {
        id: appConfig.id || appDir,
        name: appConfig.name || "N/A",
        version: appConfig.version || "N/A",
        tagline: appConfig.tagline || "",
        developer: appConfig.developer || "N/A",
        website: appConfig.website || "",
        repo: appConfig.repo || "",
      };
    } catch (e) {
      console.error(`Error parsing umbrel-app.yml for ${appDir}: ${e.message}`);
    }
  }

  return { apps };
};

const appToMarkdownTable = (apps) => {
  let table = `| Application | Version | Developer | Repository |\n`;
  table += `| --- | --- | --- | --- |\n`;

  // Sort apps alphabetically by name
  const sortedApps = Object.values(apps).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  sortedApps.forEach((app) => {
    const repoLink = app.repo ? `[Repository](${app.repo})` : "";
    const appName = app.website ? `[${app.name}](${app.website})` : app.name;

    table += `| ${appName} | ${app.version} | ${app.developer} | ${repoLink} |\n`;
  });

  return table;
};

const writeToReadme = (appsTable) => {
  const baseReadme = fs.readFileSync(
    path.join(__dirname, "../../templates/README.md"),
    "utf8"
  );
  const finalReadme = baseReadme.replace("<!appsList>", appsTable);
  fs.writeFileSync(path.join(__dirname, "../../README.md"), finalReadme);
};

const main = async () => {
  const { apps } = await getAppsList();
  const markdownTable = appToMarkdownTable(apps);
  writeToReadme(markdownTable);
  console.log(`Generated README with ${Object.keys(apps).length} apps`);
};

main().catch(console.error);
