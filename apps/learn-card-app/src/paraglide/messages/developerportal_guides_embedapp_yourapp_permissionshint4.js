/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Permissionshint4Inputs */

const en_developerportal_guides_embedapp_yourapp_permissionshint4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Permissionshint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Based on your selected features, these permissions are required. You can add more if needed.`)
};

const es_developerportal_guides_embedapp_yourapp_permissionshint4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Permissionshint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Based on your selected features, these permissions are obligatorio. You can add more if needed.`)
};

const fr_developerportal_guides_embedapp_yourapp_permissionshint4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Permissionshint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Based on your selected features, these permissions are obligatoire. You can add more if needed.`)
};

const ar_developerportal_guides_embedapp_yourapp_permissionshint4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Permissionshint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Based on your selected features, these permissions are مطلوب. You can add more if needed.`)
};

/**
* | output |
* | --- |
* | "Based on your selected features, these permissions are required. You can add more if needed." |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Permissionshint4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_permissionshint4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Permissionshint4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Permissionshint4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_permissionshint4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_permissionshint4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_permissionshint4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_permissionshint4(inputs)
});
export { developerportal_guides_embedapp_yourapp_permissionshint4 as "developerPortal.guides.embedApp.yourApp.permissionsHint" }