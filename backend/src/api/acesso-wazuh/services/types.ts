export interface TopVulnItem {
    key: string;
    total: number;
    severity: Record<string, number>;
}

export interface TopOSItem {
    os: string;
    total: number;
    severity: Record<string, number>;
}

export interface TopAgentItem {
    agent: string;
    total: number;
    severity: Record<string, number>;
}

export interface TopPackageItem {
    package: string;
    total: number;
    severity: Record<string, number>;
}

export interface TopScoreItem {
    score: string;
    total: number;
}

export interface VulnAnoItem {
    ano: string;
    total: number;
    severity: Record<string, number>;
}

export interface OvertimeResponse {
    labels: string[];
    datasets: { name: string; data: number[] }[];
}

export interface EventosSummaryResponse {
    labels: string[];
    values: number[];
}

export interface RuleDistributionItem {
    rule: string;
    count: number;
}

export interface TopUserItem {
    user: string;
    agent_id: string;
    agent_name: string;
    count: number;
}
