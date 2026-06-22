/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Issuetestfailed5Inputs */

const en_developerportal_credentialbuilder_jsonpreview_issuetestfailed5 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Issuetestfailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Test Failed`)
};

const es_developerportal_credentialbuilder_jsonpreview_issuetestfailed5 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Issuetestfailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prueba de Emisión Falló`)
};

const fr_developerportal_credentialbuilder_jsonpreview_issuetestfailed5 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Issuetestfailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test d'Émission Échoué`)
};

const ar_developerportal_credentialbuilder_jsonpreview_issuetestfailed5 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Issuetestfailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل اختبار الإصدار`)
};

/**
* | output |
* | --- |
* | "Issue Test Failed" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Issuetestfailed5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_issuetestfailed5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Issuetestfailed5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Issuetestfailed5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_issuetestfailed5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_issuetestfailed5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_issuetestfailed5(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_issuetestfailed5(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_issuetestfailed5 as "developerPortal.credentialBuilder.jsonPreview.issueTestFailed" }