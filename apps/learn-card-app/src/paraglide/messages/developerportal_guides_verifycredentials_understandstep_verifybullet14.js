/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet14Inputs */

const en_developerportal_guides_verifycredentials_understandstep_verifybullet14 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The credential hasn't been tampered with`)
};

const es_developerportal_guides_verifycredentials_understandstep_verifybullet14 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The credential hasn't been tampered with`)
};

const fr_developerportal_guides_verifycredentials_understandstep_verifybullet14 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The credential hasn't been tampered with`)
};

const ar_developerportal_guides_verifycredentials_understandstep_verifybullet14 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The credential hasn't been tampered with`)
};

/**
* | output |
* | --- |
* | "The credential hasn't been tampered with" |
*
* @param {Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_understandstep_verifybullet14 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Understandstep_Verifybullet14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_understandstep_verifybullet14(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_understandstep_verifybullet14(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_understandstep_verifybullet14(inputs)
	return ar_developerportal_guides_verifycredentials_understandstep_verifybullet14(inputs)
});
export { developerportal_guides_verifycredentials_understandstep_verifybullet14 as "developerPortal.guides.verifyCredentials.understandStep.verifyBullet1" }