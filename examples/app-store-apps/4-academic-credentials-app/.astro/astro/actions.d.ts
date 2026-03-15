declare module "astro:actions" {
	type Actions = typeof import("/home/computer/LearnCard-project/LearnCard/examples/app-store-apps/4-academic-credentials-app/src/actions")["server"];

	export const actions: Actions;
}