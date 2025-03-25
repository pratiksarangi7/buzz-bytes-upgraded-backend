import { initServer } from "./app";
import * as dotenv from "dotenv";

dotenv.config();

async function init() {
  const app = await initServer();
  const PORT = process.env.PORT || 8000;

  app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
  });
}

init();
