declare module "astro:actions" {
	type Actions = typeof import("/home/computer/LearnCard-project/LearnCard/examples/app-store-apps/8-high-score-game-app/src/actions")["server"];

	export const actions: Actions;
}