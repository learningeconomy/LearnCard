/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Initializestep_Description3Inputs */

const en_developerportal_guides_embedapp_initializestep_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Initializestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up the SDK when your app loads. You can immediately request the user's identity — no login required since they're already in the wallet.`)
};

const es_developerportal_guides_embedapp_initializestep_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Initializestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up the SDK when your app loads. You can immediately request the user's identity — no login obligatorio since they're already in the wallet.`)
};

const fr_developerportal_guides_embedapp_initializestep_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Initializestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up the SDK when your app loads. You can immediately request the user's identity — no login obligatoire since they're already in the wallet.`)
};

const ar_developerportal_guides_embedapp_initializestep_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Initializestep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up the SDK when your app loads. You can immediately request the user's identity — no login مطلوب since they're already in the wallet.`)
};

/**
* | output |
* | --- |
* | "Set up the SDK when your app loads. You can immediately request the user's identity — no login required since they're already in the wallet." |
*
* @param {Developerportal_Guides_Embedapp_Initializestep_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_initializestep_description3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Initializestep_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Initializestep_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_initializestep_description3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_initializestep_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_initializestep_description3(inputs)
	return ar_developerportal_guides_embedapp_initializestep_description3(inputs)
});
export { developerportal_guides_embedapp_initializestep_description3 as "developerPortal.guides.embedApp.initializeStep.description" }