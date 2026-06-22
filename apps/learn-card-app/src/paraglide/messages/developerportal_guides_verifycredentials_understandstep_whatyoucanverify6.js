/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Understandstep_Whatyoucanverify6Inputs */

const en_developerportal_guides_verifycredentials_understandstep_whatyoucanverify6 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Whatyoucanverify6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What you can verify`)
};

const es_developerportal_guides_verifycredentials_understandstep_whatyoucanverify6 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Whatyoucanverify6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What you can verify`)
};

const fr_developerportal_guides_verifycredentials_understandstep_whatyoucanverify6 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Whatyoucanverify6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What you can verify`)
};

const ar_developerportal_guides_verifycredentials_understandstep_whatyoucanverify6 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Whatyoucanverify6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What you can verify`)
};

/**
* | output |
* | --- |
* | "What you can verify" |
*
* @param {Developerportal_Guides_Verifycredentials_Understandstep_Whatyoucanverify6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_understandstep_whatyoucanverify6 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Understandstep_Whatyoucanverify6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Understandstep_Whatyoucanverify6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_understandstep_whatyoucanverify6(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_understandstep_whatyoucanverify6(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_understandstep_whatyoucanverify6(inputs)
	return ar_developerportal_guides_verifycredentials_understandstep_whatyoucanverify6(inputs)
});
export { developerportal_guides_verifycredentials_understandstep_whatyoucanverify6 as "developerPortal.guides.verifyCredentials.understandStep.whatYouCanVerify" }