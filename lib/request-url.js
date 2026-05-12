import { NextResponse } from "next/server";

export function buildRelativeUrl(pathname) {
  const url = new URL(pathname, "http://local");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function createRedirectResponse(pathname, status = 303) {
  return new NextResponse(null, {
    status,
    headers: {
      location: buildRelativeUrl(pathname)
    }
  });
}
