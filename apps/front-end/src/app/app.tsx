import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../routes";
import { AuthProvider } from "./context/auth.context";

declare module '@tanstack/react-router' {
  interface HistoryState {
    fromPage?: number;
    fromMediaId? : string;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;


