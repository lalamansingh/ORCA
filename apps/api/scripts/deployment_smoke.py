"""Read-only by default. Auth/chat require explicit dedicated-account opt-in."""
import argparse
import asyncio
import os
import sys
import httpx

async def run(args):
    failures = []
    async with httpx.AsyncClient(base_url=args.api_url.rstrip("/"), timeout=65, follow_redirects=False) as client:
        async def check(name, method, path, expected=(200,), **kwargs):
            try:
                response = await client.request(method, path, **kwargs)
                ok = response.status_code in expected
                print(f"{'PASS' if ok else 'FAIL'} {name}: HTTP {response.status_code}")
                if not ok: failures.append(name)
                return response
            except httpx.HTTPError:
                print(f"FAIL {name}: connection/timeout error (details redacted)")
                failures.append(name)
                return None
        for name, path in [("liveness", "/health/live"), ("readiness/PostGIS", "/health/ready"), ("capabilities", "/system/capabilities"), ("provider status", "/system/data-sources")]:
            await check(name, "GET", "/api/v1" + path)
        await check("unauthenticated session", "GET", "/api/v1/auth/me", expected=(401,))
        if args.origin:
            response = await check("CORS preflight", "OPTIONS", "/api/v1/auth/me", headers={"Origin": args.origin, "Access-Control-Request-Method": "GET"})
            if response is not None and (response.headers.get("access-control-allow-origin") != args.origin or response.headers.get("access-control-allow-credentials") != "true"):
                failures.append("CORS credentials")
        if args.providers:
            for name, path in [("conditions", "/conditions"), ("risk", "/risk"), ("PFZ", "/pfz/nearest")]:
                response = await check(name, "GET", "/api/v1" + path, params={"latitude": 13.08, "longitude": 80.27})
                if response is not None and response.status_code == 200:
                    body = response.json()
                    print(f"DATA {name}: {body.get('status', body.get('level', 'inspect evidence'))}")
            await check("geofence", "POST", "/api/v1/geofence/check", json={"latitude": 13.08, "longitude": 80.27})
        if args.demo_account:
            email, password = os.environ.get("ORCA_SMOKE_EMAIL"), os.environ.get("ORCA_SMOKE_PASSWORD")
            if not email or not password: raise SystemExit("Set ORCA_SMOKE_EMAIL and ORCA_SMOKE_PASSWORD for a dedicated account")
            await check("login", "POST", "/api/v1/auth/login", json={"email": email, "password": password})
            await check("session restore", "GET", "/api/v1/auth/me")
            async def csrf():
                response = await client.get("/api/v1/auth/csrf")
                response.raise_for_status()
                return {"X-CSRF-Token": response.json()["csrf_token"]}
            await check("refresh", "POST", "/api/v1/auth/refresh", headers=await csrf())
            point = {"latitude": 13.08, "longitude": 80.27}
            await check("route", "POST", "/api/v1/routes/calculate", headers=await csrf(), json={"start": point, "destination": {"latitude": 13.2, "longitude": 80.5}})
            await check("recommendations", "POST", "/api/v1/pfz/recommendations", headers=await csrf(), json=point)
            await check("chat (creates demo conversation)", "POST", "/api/v1/ai/conversations/messages", headers=await csrf(), json={"query": "Show nearest PFZ", "selected_location": point})
            await check("logout", "POST", "/api/v1/auth/logout", expected=(204,), headers=await csrf())
            await check("session revoked", "GET", "/api/v1/auth/me", expected=(401,))
    return bool(failures)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-url", required=True)
    parser.add_argument("--origin")
    parser.add_argument("--providers", action="store_true", help="Call configured external providers")
    parser.add_argument("--demo-account", action="store_true", help="Explicitly mutate sessions and create a conversation for a dedicated account")
    args = parser.parse_args()
    url = httpx.URL(args.api_url)
    if url.scheme != "https" and url.host not in {"localhost", "127.0.0.1"}: parser.error("Hosted API must use HTTPS")
    sys.exit(asyncio.run(run(args)))

if __name__ == "__main__": main()
