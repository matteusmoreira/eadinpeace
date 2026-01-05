export default {
    providers: [
        {
            domain: (() => {
                const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
                if (!domain) {
                    throw new Error("CLERK_JWT_ISSUER_DOMAIN não configurado");
                }
                return domain;
            })(),
            applicationID: "convex",
        },
    ],
};
