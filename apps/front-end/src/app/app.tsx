import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, NotFoundRoute,
  Outlet,
  RootRoute,
  Route,
  Router,
 } from "@tanstack/react-router";
 import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import  LandingPage from './LandingPage'
import ImageGrid from './components/ImageGrid'
import SingleImage from './components/SingleImage'

const rootRoute = new RootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

const landingPageRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const imageGridRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/images",
  component: ImageGrid,
});

const singleImageRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/images/$imageId",
  component: SingleImage,
});



const notFoundRoute = new NotFoundRoute({
  component: () => <h1>Ruh Roh! Page not found.</h1>,
  getParentRoute: () => rootRoute,
});

const routeTree = rootRoute.addChildren([
  landingPageRoute,
  imageGridRoute,
  singleImageRoute,
]);

export const router = new Router({ routeTree, notFoundRoute });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
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
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;


