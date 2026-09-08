import {test,expect} from "@playwright/test";
import {randomUUID} from "node:crypto";

test("landing identity, navigation and mobile layout",async({page})=>{
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 const response=await page.goto("/");expect(response?.status()).toBe(200);
 await expect(page.getByRole("heading",{name:/Ask the Ocean/})).toBeVisible();
 expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
 await page.screenshot({path:"test-results/landing-desktop.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:"test-results/landing-mobile.png",fullPage:true});
 await page.getByRole("link",{name:/Explore ORCA/}).click();
 await expect(page).toHaveURL(/register/);expect(errors).toEqual([]);
});

test("dedicated demo registration, persistent session, assistant and route",async({page})=>{
 test.skip(process.env.ORCA_E2E_DEMO!=="true","Explicit ORCA_E2E_DEMO=true required; creates a dedicated disposable account");
 const email=`orca-e2e-${randomUUID()}@example.com`;const password=randomUUID()+"Aa!";
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 await page.goto("/register");
 await page.getByLabel("Full name").fill("ORCA Demo Reviewer");
 await page.getByLabel("Email").fill(email);
 await page.getByLabel(/^Password/).fill(password);
 await page.getByLabel("Confirm password").fill(password);
 await page.getByRole("button",{name:/Create account/i}).click();
 await expect(page).toHaveURL(/dashboard/);
 await page.reload();await expect(page.getByRole("heading",{name:"Marine Intelligence Overview"})).toBeVisible();
 await page.goto("/assistant");
 await page.getByRole("button",{name:"Use Chennai sample location"}).click();
 await page.getByLabel("Marine query").fill("Show nearest PFZ");
 await page.getByRole("button",{name:"Send query"}).click();
 await expect(page.getByText("Source evidence",{exact:false})).toBeVisible({timeout:65000});
 await expect(page.getByText("DEMO / MIXED DATA",{exact:false})).toBeVisible();
 await page.screenshot({path:"test-results/assistant-desktop.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:"test-results/assistant-mobile.png",fullPage:true});
 await page.goto("/routes");
 await page.getByRole("button",{name:"Calculate route"}).click();
 await expect(page.getByRole("heading",{name:"DEMO DATA — geometry demonstration"})).toBeVisible();
 expect(errors).toEqual([]);
});
