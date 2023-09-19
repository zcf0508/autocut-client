import path from "path";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.join(__dirname, "../../public/resources")

const { whisper } = require(path.join(
  resourcesPath,
  "whisper-addon.node",
));
import { promisify } from "node:util";

export const whisperAsync = promisify(whisper);

