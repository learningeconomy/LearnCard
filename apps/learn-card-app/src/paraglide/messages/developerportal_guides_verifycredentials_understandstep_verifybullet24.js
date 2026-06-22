/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet24Inputs */

const en_developerportal_guides_verifycredentials_understandstep_verifybullet24 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It was issued by who it claims`)
};

const es_developerportal_guides_verifycredentials_understandstep_verifybullet24 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It was issued by who it claims`)
};

const fr_developerportal_guides_verifycredentials_understandstep_verifybullet24 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It was issued by who it claims`)
};

const ar_developerportal_guides_verifycredentials_understandstep_verifybullet24 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It was issued by who it claims`)
};

/**
* | output |
* | --- |
* | "It was issued by who it claims" |
*
* @param {Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet24Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_understandstep_verifybullet24 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet24Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet24Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_understandstep_verifybullet24(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_understandstep_verifybullet24(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_understandstep_verifybullet24(inputs)
	return ar_developerportal_guides_verifycredentials_understandstep_verifybullet24(inputs)
});
export { developerportal_guides_verifycredentials_understandstep_verifybullet24 as "developerPortal.guides.verifyCredentials.understandStep.verifyBullet2" }