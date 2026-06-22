/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Appnameplaceholder5Inputs */

const en_developerportal_guides_embedapp_gettingstarted_appnameplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Appnameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Awesome App`)
};

const es_developerportal_guides_embedapp_gettingstarted_appnameplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Appnameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi App Increíble`)
};

const fr_developerportal_guides_embedapp_gettingstarted_appnameplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Appnameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Awesome App`)
};

const ar_developerportal_guides_embedapp_gettingstarted_appnameplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Appnameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Awesome App`)
};

/**
* | output |
* | --- |
* | "My Awesome App" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Appnameplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_appnameplaceholder5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Appnameplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Appnameplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_appnameplaceholder5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_appnameplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_appnameplaceholder5(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_appnameplaceholder5(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_appnameplaceholder5 as "developerPortal.guides.embedApp.gettingStarted.appNamePlaceholder" }