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

const getUmbrelAppConfigs = (): UmbrelAppConfig[] => {
  const apps: UmbrelAppConfig[] = [];
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
            apps.push(config);
          }
        } catch (e) {
          console.error(`Error parsing config file for ${entry.name}:`, e);
        }
      }
    }
  });

  return apps;
};

describe("Umbrel App configs", () => {
  it("Should find at least one Umbrel app", () => {
    const apps = getUmbrelAppConfigs();
    expect(apps.length).toBeGreaterThan(0);
  });

  describe("Each app should have required fields", () => {
    const apps = getUmbrelAppConfigs();

    apps.forEach((app) => {
      describe(`App: ${app.id}`, () => {
        test("should have a valid manifestVersion", () => {
          expect(app.manifestVersion).toBeDefined();
          expect(app.manifestVersion).toBe(1);
        });

        test("should have an id", () => {
          expect(app.id).toBeDefined();
          expect(typeof app.id).toBe("string");
          expect(app.id.length).toBeGreaterThan(0);
        });

        test("should have a name", () => {
          expect(app.name).toBeDefined();
          expect(typeof app.name).toBe("string");
          expect(app.name.length).toBeGreaterThan(0);
        });

        test("should have a category", () => {
          expect(app.category).toBeDefined();
          expect(typeof app.category).toBe("string");
          expect(app.category.length).toBeGreaterThan(0);
        });

        test("should have a version", () => {
          expect(app.version).toBeDefined();
          expect(typeof app.version).toBe("string");
          expect(app.version.length).toBeGreaterThan(0);
        });

        test("should have a tagline", () => {
          expect(app.tagline).toBeDefined();
          expect(typeof app.tagline).toBe("string");
          expect(app.tagline.length).toBeGreaterThan(0);
        });

        test("should have an icon URL", () => {
          expect(app.icon).toBeDefined();
          expect(typeof app.icon).toBe("string");
          expect(app.icon).toMatch(/^https?:\/\//);
        });

        test("should have a description", () => {
          expect(app.description).toBeDefined();
          expect(typeof app.description).toBe("string");
          expect(app.description.length).toBeGreaterThan(0);
        });

        test("should have a developer", () => {
          expect(app.developer).toBeDefined();
          expect(typeof app.developer).toBe("string");
          expect(app.developer.length).toBeGreaterThan(0);
        });

        test("should have a website URL", () => {
          expect(app.website).toBeDefined();
          expect(typeof app.website).toBe("string");
          expect(app.website).toMatch(/^https?:\/\//);
        });

        test("should have dependencies array", () => {
          expect(app.dependencies).toBeDefined();
          expect(Array.isArray(app.dependencies)).toBe(true);
        });

        test("should have a repo URL", () => {
          expect(app.repo).toBeDefined();
          expect(typeof app.repo).toBe("string");
          expect(app.repo).toMatch(/^https?:\/\//);
        });

        test("should have a support URL", () => {
          expect(app.support).toBeDefined();
          expect(typeof app.support).toBe("string");
          expect(app.support).toMatch(/^https?:\/\//);
        });

        test("should have a valid port", () => {
          expect(app.port).toBeDefined();
          expect(typeof app.port).toBe("number");
          expect(app.port).toBeGreaterThan(999);
          expect(app.port).toBeLessThan(65536);
        });

        test("should have a submitter", () => {
          expect(app.submitter).toBeDefined();
          expect(typeof app.submitter).toBe("string");
          expect(app.submitter.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("Each app should have a docker-compose file", () => {
    const apps = getUmbrelAppConfigs();

    apps.forEach((app) => {
      test(`${app.id} should have docker-compose.yml`, () => {
        const dockerComposePath = `./${app.id}/docker-compose.yml`;
        expect(fs.existsSync(dockerComposePath)).toBe(true);
      });
    });
  });

  describe("Docker compose files should be valid", () => {
    const apps = getUmbrelAppConfigs();

    apps.forEach((app) => {
      test(`${app.id} docker-compose.yml should be valid YAML`, () => {
        const dockerComposePath = `./${app.id}/docker-compose.yml`;

        if (fs.existsSync(dockerComposePath)) {
          const dockerComposeContent = fs.readFileSync(
            dockerComposePath,
            "utf8"
          );

          expect(() => {
            jsyaml.load(dockerComposeContent);
          }).not.toThrow();
        }
      });

      test(`${app.id} docker-compose.yml should have services`, () => {
        const dockerComposePath = `./${app.id}/docker-compose.yml`;

        if (fs.existsSync(dockerComposePath)) {
          const dockerComposeContent = fs.readFileSync(
            dockerComposePath,
            "utf8"
          );
          const dockerCompose: any = jsyaml.load(dockerComposeContent);

          expect(dockerCompose.services).toBeDefined();
          expect(typeof dockerCompose.services).toBe("object");
          expect(Object.keys(dockerCompose.services).length).toBeGreaterThan(0);
        }
      });
    });
  });

  test("Each app should have a unique id", () => {
    const apps = getUmbrelAppConfigs();
    const ids = apps.map((app) => app.id);
    expect(new Set(ids).size).toBe(apps.length);
  });

  test("Each app should have a unique port", () => {
    const apps = getUmbrelAppConfigs();
    const ports = apps.map((app) => app.port);
    const uniquePorts = new Set(ports);

    if (uniquePorts.size !== apps.length) {
      const duplicatePorts = ports.filter(
        (port, index) => ports.indexOf(port) !== index
      );
      const appsWithDuplicatePorts = apps.filter((app) =>
        duplicatePorts.includes(app.port)
      );

      const conflictDetails = duplicatePorts
        .map((port) => {
          const conflictingApps = apps.filter((app) => app.port === port);
          return `Port ${port}: ${conflictingApps
            .map((app) => app.id)
            .join(", ")}`;
        })
        .join("\n  ");

      throw new Error(
        `Port conflicts detected! Each app must have a unique port.\n\nConflicting apps:\n  ${conflictDetails}\n\nRun 'npm run fix-port-conflicts' to automatically generate new ports for conflicting apps.`
      );
    }

    expect(uniquePorts.size).toBe(apps.length);
  });

  describe("App directory structure", () => {
    const apps = getUmbrelAppConfigs();

    apps.forEach((app) => {
      test(`${app.id} directory structure`, () => {
        const dataPath = `./${app.id}/data`;
        const hasDataDir = fs.existsSync(dataPath);

        // Log which apps don't have data directories for informational purposes
        if (!hasDataDir) {
          console.log(`Info: ${app.id} does not have a data directory`);
        }

        // For now, just ensure the app directory exists
        expect(fs.existsSync(`./${app.id}`)).toBe(true);
      });
    });
  });
});
