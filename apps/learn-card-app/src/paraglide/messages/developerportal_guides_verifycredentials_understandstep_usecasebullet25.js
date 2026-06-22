/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet25Inputs */

const en_developerportal_guides_verifycredentials_understandstep_usecasebullet25 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check professional certifications`)
};

const es_developerportal_guides_verifycredentials_understandstep_usecasebullet25 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check professional certifications`)
};

const fr_developerportal_guides_verifycredentials_understandstep_usecasebullet25 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check professional certifications`)
};

const ar_developerportal_guides_verifycredentials_understandstep_usecasebullet25 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check professional certifications`)
};

/**
* | output |
* | --- |
* | "Check professional certifications" |
*
* @param {Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_understandstep_usecasebullet25 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_understandstep_usecasebullet25(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_understandstep_usecasebullet25(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_understandstep_usecasebullet25(inputs)
	return ar_developerportal_guides_verifycredentials_understandstep_usecasebullet25(inputs)
});
export { developerportal_guides_verifycredentials_understandstep_usecasebullet25 as "developerPortal.guides.verifyCredentials.understandStep.useCaseBullet2" }