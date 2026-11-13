import { z } from "zod";

// Zod compiles validators with `new Function` when the page allows it, and
// probes for that on first use. Our Content Security Policy blocks eval on
// purpose, so the probe showed up as a CSP violation in the browser console.
// Jitless mode skips the probe; validation works exactly the same.
z.config({ jitless: true });

export { z };
