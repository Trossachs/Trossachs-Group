// Local / single-server entry point. On Vercel, api/index.js is used instead.
import { createRuntime } from './runtime.js';

const port = Number(process.env.PORT || 3000);
const app = await createRuntime();
const initial = await app.ready;

if (initial) {
  console.log('\n──────────────────────────────────────────────');
  console.log(' First run: admin account created');
  console.log(`   Email:    ${initial.email}`);
  console.log(initial.password ? `   Password: ${initial.password}   (shown once, change it in Admin → Account)` : '   Password: from ADMIN_PASSWORD');
  console.log('──────────────────────────────────────────────\n');
}

app.server.listen(port, () => {
  console.log(`Trossachs Group running on http://localhost:${port}`);
  console.log(`Admin: http://localhost:${port}/admin`);
});

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => app.close().then(() => process.exit(0)));
