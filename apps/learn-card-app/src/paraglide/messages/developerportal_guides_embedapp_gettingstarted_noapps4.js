/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Noapps4Inputs */

const en_developerportal_guides_embedapp_gettingstarted_noapps4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Noapps4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No apps yet`)
};

const es_developerportal_guides_embedapp_gettingstarted_noapps4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Noapps4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin aplicaciones aún`)
};

const fr_developerportal_guides_embedapp_gettingstarted_noapps4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Noapps4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune app pour l'instant`)
};

const ar_developerportal_guides_embedapp_gettingstarted_noapps4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Noapps4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تطبيقات بعد`)
};

/**
* | output |
* | --- |
* | "No apps yet" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Noapps4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_noapps4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Noapps4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Noapps4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_noapps4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_noapps4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_noapps4(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_noapps4(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_noapps4 as "developerPortal.guides.embedApp.gettingStarted.noApps" }