//import { Config } from "sst/node/config";

interface TokenConfig {
    admin: string;
  }
  
  const tokenConfig: Record<string, TokenConfig> = {
    dev: {
      admin: 'thisisasecretkeyforadminactions',
    },
    staging: {
      admin: process.env.STAGING_ADMIN_TOKEN || '',
    },
    production: {
      admin: process.env.PRODUCTION_ADMIN_TOKEN || '',
    },
  };
  
  export default tokenConfig;