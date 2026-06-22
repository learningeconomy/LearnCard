/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Teststep_Verifyingbutton4Inputs */

const en_developerportal_guides_verifycredentials_teststep_verifyingbutton4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Verifyingbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying...`)
};

const es_developerportal_guides_verifycredentials_teststep_verifyingbutton4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Verifyingbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying...`)
};

const fr_developerportal_guides_verifycredentials_teststep_verifyingbutton4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Verifyingbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying...`)
};

const ar_developerportal_guides_verifycredentials_teststep_verifyingbutton4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Verifyingbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying...`)
};

/**
* | output |
* | --- |
* | "Verifying..." |
*
* @param {Developerportal_Guides_Verifycredentials_Teststep_Verifyingbutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_teststep_verifyingbutton4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Teststep_Verifyingbutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Teststep_Verifyingbutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_teststep_verifyingbutton4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_teststep_verifyingbutton4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_teststep_verifyingbutton4(inputs)
	return ar_developerportal_guides_verifycredentials_teststep_verifyingbutton4(inputs)
});
export { developerportal_guides_verifycredentials_teststep_verifyingbutton4 as "developerPortal.guides.verifyCredentials.testStep.verifyingButton" }