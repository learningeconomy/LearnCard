/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Teststep_Verifybutton4Inputs */

const en_developerportal_guides_verifycredentials_teststep_verifybutton4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Verifybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Credential`)
};

const es_developerportal_guides_verifycredentials_teststep_verifybutton4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Verifybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Credential`)
};

const fr_developerportal_guides_verifycredentials_teststep_verifybutton4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Verifybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Credential`)
};

const ar_developerportal_guides_verifycredentials_teststep_verifybutton4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Teststep_Verifybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Credential`)
};

/**
* | output |
* | --- |
* | "Verify Credential" |
*
* @param {Developerportal_Guides_Verifycredentials_Teststep_Verifybutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_teststep_verifybutton4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Teststep_Verifybutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Teststep_Verifybutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_teststep_verifybutton4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_teststep_verifybutton4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_teststep_verifybutton4(inputs)
	return ar_developerportal_guides_verifycredentials_teststep_verifybutton4(inputs)
});
export { developerportal_guides_verifycredentials_teststep_verifybutton4 as "developerPortal.guides.verifyCredentials.testStep.verifyButton" }