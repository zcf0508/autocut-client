import path from "path";

const prod = import.meta.env.PROD
const resourcesPath = prod ? process.resourcesPath : path.join(__dirname, "../../public/resources")

const { vad } = require(path.join(
  resourcesPath,
  "vad_addon.node",
));

const model = path.resolve(resourcesPath, "silero_vad.onnx")
