/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Teststep_Invalidjson4Inputs */

const en_developerportal_guides_verifycredentials_teststep_invalidjson4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Invalidjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid JSON or credential format`)
};

const es_developerportal_guides_verifycredentials_teststep_invalidjson4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Invalidjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid JSON or credential format`)
};

const fr_developerportal_guides_verifycredentials_teststep_invalidjson4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Invalidjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid JSON or credential format`)
};

const ar_developerportal_guides_verifycredentials_teststep_invalidjson4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Invalidjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid JSON or credential format`)
};

/**
* | output |
* | --- |
* | "Invalid JSON or credential format" |
*
* @param {Developerportal_Guides_Verifycredentials_Teststep_Invalidjson4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_teststep_invalidjson4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Teststep_Invalidjson4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Teststep_Invalidjson4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_teststep_invalidjson4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_teststep_invalidjson4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_teststep_invalidjson4(inputs)
	return ar_developerportal_guides_verifycredentials_teststep_invalidjson4(inputs)
});
export { developerportal_guides_verifycredentials_teststep_invalidjson4 as "developerPortal.guides.verifyCredentials.testStep.invalidJson" }