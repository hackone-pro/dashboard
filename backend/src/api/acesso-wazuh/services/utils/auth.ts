// src/api/acesso-wazuh/services/utils/auth.ts

export function authHeader(tenant) {
    const basicAuth = Buffer.from(
        `${tenant.wazuh_username}:${tenant.wazuh_password}`
    ).toString("base64");

    return {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
    };
}

export function customerFilter(clientName: string) {
    return { match: { customer: clientName } };
}

export function isPrivateIp(ip: string) {
    return (
        /^10\./.test(ip) ||
        /^192\.168\./.test(ip) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
    );
}
