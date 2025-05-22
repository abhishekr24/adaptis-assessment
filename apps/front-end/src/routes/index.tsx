import { createRootRoute, createRoute, NotFoundRoute, Outlet, Router } from "@tanstack/react-router";
 import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import  LandingPage from '../app/LandingPage'
import ImageGrid from '../app/components/ImageGrid'
import SingleImage from '../app/components/SingleImage'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

const landingPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const imageGridRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/images",
  component: ImageGrid,
});

const singleImageRoute = createRoute({
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


