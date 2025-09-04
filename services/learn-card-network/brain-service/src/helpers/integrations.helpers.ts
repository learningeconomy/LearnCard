

export const isDomainWhitelisted = (domain: string, whitelistedDomains: string[]) => {
    let domainCopy = domain;
    // Escape localhost ports
    if (domain.includes('%3A')) domainCopy = domain.replace('%3A', ':');
    return whitelistedDomains.includes(domainCopy);
}   