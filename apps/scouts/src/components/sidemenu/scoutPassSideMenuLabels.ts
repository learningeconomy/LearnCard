export const SCOUT_PASS_SIDE_MENU_MESSAGE_KEYS: Readonly<Record<string, string>> = {
    '/campfire': 'campfire',
    '/contacts': 'contacts',
    '/notifications': 'alerts',
    '/admin-tools': 'adminTools',
    '/wallet': 'wallet',
    '/boosts': 'socialBoosts',
    '/badges': 'meritBadges',
    '/troops': 'troops',
    '/competencies': 'competencies',
};

export const getScoutPassSideMenuLinkLabel = (
    messages: Record<string, unknown>,
    link: { path: string; name: string }
): string => {
    const key = SCOUT_PASS_SIDE_MENU_MESSAGE_KEYS[link.path];
    const message = key ? messages[`sidemenu.links.${key}`] : undefined;

    return typeof message === 'function' ? (message as () => string)() : link.name;
};
