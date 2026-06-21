import { Providers } from "./providers.js";
import { AppRouter } from "./router.js";

export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
