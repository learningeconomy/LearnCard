/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchcategories_Credentialsachievements4Inputs */

const en_developerportal_guides_embedapp_launchcategories_credentialsachievements4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Credentialsachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials & Achievements`)
};

const es_developerportal_guides_embedapp_launchcategories_credentialsachievements4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Credentialsachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credenciales y Logros`)
};

const fr_developerportal_guides_embedapp_launchcategories_credentialsachievements4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Credentialsachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titres & Réalisations`)
};

const ar_developerportal_guides_embedapp_launchcategories_credentialsachievements4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Credentialsachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشهادات والإنجازات`)
};

/**
* | output |
* | --- |
* | "Credentials & Achievements" |
*
* @param {Developerportal_Guides_Embedapp_Launchcategories_Credentialsachievements4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchcategories_credentialsachievements4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchcategories_Credentialsachievements4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchcategories_Credentialsachievements4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchcategories_credentialsachievements4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchcategories_credentialsachievements4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchcategories_credentialsachievements4(inputs)
	return ar_developerportal_guides_embedapp_launchcategories_credentialsachievements4(inputs)
});
export { developerportal_guides_embedapp_launchcategories_credentialsachievements4 as "developerPortal.guides.embedApp.launchCategories.credentialsAchievements" }