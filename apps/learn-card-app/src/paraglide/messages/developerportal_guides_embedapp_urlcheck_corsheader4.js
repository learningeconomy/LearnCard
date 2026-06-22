/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ header: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Urlcheck_Corsheader4Inputs */

const en_developerportal_guides_embedapp_urlcheck_corsheader4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsheader4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`CORS: ${i?.header}`)
};

const es_developerportal_guides_embedapp_urlcheck_corsheader4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsheader4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`CORS: ${i?.header}`)
};

const fr_developerportal_guides_embedapp_urlcheck_corsheader4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsheader4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`CORS: ${i?.header}`)
};

const ar_developerportal_guides_embedapp_urlcheck_corsheader4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsheader4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`CORS: ${i?.header}`)
};

/**
* | output |
* | --- |
* | "CORS: {header}" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Corsheader4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_corsheader4 = /** @type {((inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsheader4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Corsheader4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_corsheader4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_corsheader4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_corsheader4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_corsheader4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_corsheader4 as "developerPortal.guides.embedApp.urlCheck.corsHeader" }