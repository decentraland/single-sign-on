import { handler as v1 } from "./handler/v1";
import { handler as v2 } from "./handler/v2";
import { init } from "./init";

init(v1, v2);
