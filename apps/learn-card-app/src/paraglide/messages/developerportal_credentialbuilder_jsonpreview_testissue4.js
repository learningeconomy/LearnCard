/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Jsonpreview_Testissue4Inputs */

const en_developerportal_credentialbuilder_jsonpreview_testissue4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Testissue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Issue`)
};

const es_developerportal_credentialbuilder_jsonpreview_testissue4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Testissue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Probar Emisión`)
};

const fr_developerportal_credentialbuilder_jsonpreview_testissue4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Testissue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tester l'Émission`)
};

const ar_developerportal_credentialbuilder_jsonpreview_testissue4 = /** @type {(inputs: Developerportal_Credentialbuilder_Jsonpreview_Testissue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار الإصدار`)
};

/**
* | output |
* | --- |
* | "Test Issue" |
*
* @param {Developerportal_Credentialbuilder_Jsonpreview_Testissue4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_jsonpreview_testissue4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Jsonpreview_Testissue4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Jsonpreview_Testissue4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_jsonpreview_testissue4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_jsonpreview_testissue4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_jsonpreview_testissue4(inputs)
	return ar_developerportal_credentialbuilder_jsonpreview_testissue4(inputs)
});
export { developerportal_credentialbuilder_jsonpreview_testissue4 as "developerPortal.credentialBuilder.jsonPreview.testIssue" }