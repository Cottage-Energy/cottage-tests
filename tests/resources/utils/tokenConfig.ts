interface TokenConfig {
    admin: string;
    bot: string;
  }
  
  const tokenConfig: Record<string, TokenConfig> = {
    dev: {
      admin: 'thisisasecretkeyforadminactions',
      bot: 'SECRET',
    },
    staging: {
      admin: process.env.STAGING_ADMIN_TOKEN || '',
      bot: process.env.STAGING_BOT_TOKEN || '',
    },
    production: {
      admin: process.env.PRODUCTION_ADMIN_TOKEN || '',
      bot: process.env.PRODUCTION_BOT_TOKEN || '',
    },
  };
  
  export default tokenConfig;