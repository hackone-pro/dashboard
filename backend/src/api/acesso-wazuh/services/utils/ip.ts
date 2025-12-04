export function isPrivateIp(ip: string) {
    return (
        /^10\./.test(ip) ||
        /^192\.168\./.test(ip) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
    );
}
