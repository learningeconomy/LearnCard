/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Teststep_Credentialinput4Inputs */

const en_developerportal_guides_verifycredentials_teststep_credentialinput4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Credentialinput4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Input`)
};

const es_developerportal_guides_verifycredentials_teststep_credentialinput4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Credentialinput4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Input`)
};

const fr_developerportal_guides_verifycredentials_teststep_credentialinput4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Credentialinput4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Input`)
};

const ar_developerportal_guides_verifycredentials_teststep_credentialinput4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Credentialinput4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Input`)
};

/**
* | output |
* | --- |
* | "Credential Input" |
*
* @param {Developerportal_Guides_Verifycredentials_Teststep_Credentialinput4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_teststep_credentialinput4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Teststep_Credentialinput4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Teststep_Credentialinput4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_teststep_credentialinput4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_teststep_credentialinput4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_teststep_credentialinput4(inputs)
	return ar_developerportal_guides_verifycredentials_teststep_credentialinput4(inputs)
});
export { developerportal_guides_verifycredentials_teststep_credentialinput4 as "developerPortal.guides.verifyCredentials.testStep.credentialInput" }