/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Teststep_Checkspassed4Inputs */

const en_developerportal_guides_verifycredentials_teststep_checkspassed4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Checkspassed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checks passed:`)
};

const es_developerportal_guides_verifycredentials_teststep_checkspassed4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Checkspassed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checks passed:`)
};

const fr_developerportal_guides_verifycredentials_teststep_checkspassed4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Checkspassed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checks passed:`)
};

const ar_developerportal_guides_verifycredentials_teststep_checkspassed4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Checkspassed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checks passed:`)
};

/**
* | output |
* | --- |
* | "Checks passed:" |
*
* @param {Developerportal_Guides_Verifycredentials_Teststep_Checkspassed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_teststep_checkspassed4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Teststep_Checkspassed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Teststep_Checkspassed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_teststep_checkspassed4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_teststep_checkspassed4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_teststep_checkspassed4(inputs)
	return ar_developerportal_guides_verifycredentials_teststep_checkspassed4(inputs)
});
export { developerportal_guides_verifycredentials_teststep_checkspassed4 as "developerPortal.guides.verifyCredentials.testStep.checksPassed" }