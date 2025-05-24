import { createRootRoute, createRoute, NotFoundRoute, Outlet, Router } from "@tanstack/react-router";
 import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import  LandingPage from '../app/LandingPage'
import SingleMedia from '../app/features/SingleMedia'
import MediaGrid from "../app/features/mediaGrid";

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

const mediaGridRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/media",
  component: MediaGrid,
  validateSearch: (search) => {
    const page = Number(search.page ?? 1)
    return { page }
  },
});

const singleMediaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/media/$mediaId",
  component: SingleMedia,
});



const notFoundRoute = new NotFoundRoute({
  component: () => <h1>Ruh Roh! Page not found.</h1>,
  getParentRoute: () => rootRoute,
});

const routeTree = rootRoute.addChildren([
  landingPageRoute,
  mediaGridRoute,
  singleMediaRoute,
]);

export const router = new Router({ routeTree, notFoundRoute });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}


