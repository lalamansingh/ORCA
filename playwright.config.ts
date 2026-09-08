import {defineConfig} from "@playwright/test";
export default defineConfig({testDir:"./tests/e2e",fullyParallel:false,workers:1,timeout:90_000,use:{baseURL:process.env.ORCA_WEB_URL??"http://localhost:3000",viewport:{width:1440,height:900},screenshot:"only-on-failure",trace:"off"},reporter:"list"});
