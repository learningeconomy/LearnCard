declare module 'astro:actions' {
    type Actions =
        typeof import('/Users/gerardoparedes/Documents/work/LearnCard/examples/app-store-apps/6-basic-sync-app/src/actions/index.ts')['server'];

    export const actions: Actions;
}
