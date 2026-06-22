/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Teststep_Readydescription4Inputs */

const en_developerportal_guides_verifycredentials_teststep_readydescription4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Readydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can now accept and verify credentials from users.`)
};

const es_developerportal_guides_verifycredentials_teststep_readydescription4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Readydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can now accept and verify credentials from users.`)
};

const fr_developerportal_guides_verifycredentials_teststep_readydescription4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Readydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can now accept and verify credentials from users.`)
};

const ar_developerportal_guides_verifycredentials_teststep_readydescription4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Readydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can now accept and verify credentials from users.`)
};

/**
* | output |
* | --- |
* | "You can now accept and verify credentials from users." |
*
* @param {Developerportal_Guides_Verifycredentials_Teststep_Readydescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_teststep_readydescription4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Teststep_Readydescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Teststep_Readydescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_teststep_readydescription4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_teststep_readydescription4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_teststep_readydescription4(inputs)
	return ar_developerportal_guides_verifycredentials_teststep_readydescription4(inputs)
});
export { developerportal_guides_verifycredentials_teststep_readydescription4 as "developerPortal.guides.verifyCredentials.testStep.readyDescription" }