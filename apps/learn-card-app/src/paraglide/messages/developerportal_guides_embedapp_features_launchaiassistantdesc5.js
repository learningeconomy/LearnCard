/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Launchaiassistantdesc5Inputs */

const en_developerportal_guides_embedapp_features_launchaiassistantdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchaiassistantdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embed a custom AI chat or tutor experience. Configure preset prompts and context for customized interactions.`)
};

const es_developerportal_guides_embedapp_features_launchaiassistantdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchaiassistantdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embed a custom AI chat or tutor experience. Configure preset prompts and context for customized interactions.`)
};

const fr_developerportal_guides_embedapp_features_launchaiassistantdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchaiassistantdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embed a custom AI chat or tutor experience. Configure preset prompts and context for customized interactions.`)
};

const ar_developerportal_guides_embedapp_features_launchaiassistantdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchaiassistantdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embed a custom AI chat or tutor experience. Configure preset prompts and context for customized interactions.`)
};

/**
* | output |
* | --- |
* | "Embed a custom AI chat or tutor experience. Configure preset prompts and context for customized interactions." |
*
* @param {Developerportal_Guides_Embedapp_Features_Launchaiassistantdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_launchaiassistantdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Launchaiassistantdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Launchaiassistantdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_launchaiassistantdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_launchaiassistantdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_launchaiassistantdesc5(inputs)
	return ar_developerportal_guides_embedapp_features_launchaiassistantdesc5(inputs)
});
export { developerportal_guides_embedapp_features_launchaiassistantdesc5 as "developerPortal.guides.embedApp.features.launchAiAssistantDesc" }