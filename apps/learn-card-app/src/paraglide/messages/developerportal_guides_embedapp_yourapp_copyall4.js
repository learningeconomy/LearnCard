/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Copyall4Inputs */

const en_developerportal_guides_embedapp_yourapp_copyall4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Copyall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy All`)
};

const es_developerportal_guides_embedapp_yourapp_copyall4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Copyall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar Todo`)
};

const fr_developerportal_guides_embedapp_yourapp_copyall4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Copyall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier All`)
};

const ar_developerportal_guides_embedapp_yourapp_copyall4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Copyall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ All`)
};

/**
* | output |
* | --- |
* | "Copy All" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Copyall4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_copyall4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Copyall4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Copyall4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_copyall4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_copyall4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_copyall4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_copyall4(inputs)
});
export { developerportal_guides_embedapp_yourapp_copyall4 as "developerPortal.guides.embedApp.yourApp.copyAll" }