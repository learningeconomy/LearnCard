declare module "astro:actions" {
	type Actions = typeof import("/home/computer/LearnCard-project/LearnCard/examples/app-store-apps/6-event-conference-badge-app/src/actions")["server"];

	export const actions: Actions;
}