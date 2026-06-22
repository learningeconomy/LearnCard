/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Failed3Inputs */

const en_developerportal_credentialbuilder_jsonpreview_failed3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Failed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed`)
};

const es_developerportal_credentialbuilder_jsonpreview_failed3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Failed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Falló`)
};

const fr_developerportal_credentialbuilder_jsonpreview_failed3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Failed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échoué`)
};

const ar_developerportal_credentialbuilder_jsonpreview_failed3 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Failed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل`)
};

/**
* | output |
* | --- |
* | "Failed" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Failed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_failed3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Failed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Failed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_failed3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_failed3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_failed3(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_failed3(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_failed3 as "developerPortal.credentialBuilder.jsonPreview.failed" }