/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Newpermissions4Inputs */

const en_developerportal_guides_embedapp_yourapp_newpermissions4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Newpermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New permissions required`)
};

const es_developerportal_guides_embedapp_yourapp_newpermissions4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Newpermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New permissions obligatorio`)
};

const fr_developerportal_guides_embedapp_yourapp_newpermissions4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Newpermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New permissions obligatoire`)
};

const ar_developerportal_guides_embedapp_yourapp_newpermissions4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Newpermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New permissions مطلوب`)
};

/**
* | output |
* | --- |
* | "New permissions required" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Newpermissions4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_newpermissions4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Newpermissions4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Newpermissions4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_newpermissions4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_newpermissions4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_newpermissions4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_newpermissions4(inputs)
});
export { developerportal_guides_embedapp_yourapp_newpermissions4 as "developerPortal.guides.embedApp.yourApp.newPermissions" }