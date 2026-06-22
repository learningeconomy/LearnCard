/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ status: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Urlcheck_Statusn4Inputs */

const en_developerportal_guides_embedapp_urlcheck_statusn4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Statusn4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Status ${i?.status}`)
};

const es_developerportal_guides_embedapp_urlcheck_statusn4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Statusn4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Status ${i?.status}`)
};

const fr_developerportal_guides_embedapp_urlcheck_statusn4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Statusn4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Status ${i?.status}`)
};

const ar_developerportal_guides_embedapp_urlcheck_statusn4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Statusn4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Status ${i?.status}`)
};

/**
* | output |
* | --- |
* | "Status {status}" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Statusn4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_statusn4 = /** @type {((inputs: Developerportal_Guides_Embedapp_Urlcheck_Statusn4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Statusn4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_statusn4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_statusn4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_statusn4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_statusn4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_statusn4 as "developerPortal.guides.embedApp.urlCheck.statusN" }