/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet35Inputs */

const en_developerportal_guides_verifycredentials_understandstep_usecasebullet35 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Validate identity documents`)
};

const es_developerportal_guides_verifycredentials_understandstep_usecasebullet35 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Validate identity documents`)
};

const fr_developerportal_guides_verifycredentials_understandstep_usecasebullet35 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Validate identity documents`)
};

const ar_developerportal_guides_verifycredentials_understandstep_usecasebullet35 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Validate identity documents`)
};

/**
* | output |
* | --- |
* | "Validate identity documents" |
*
* @param {Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_understandstep_usecasebullet35 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_understandstep_usecasebullet35(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_understandstep_usecasebullet35(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_understandstep_usecasebullet35(inputs)
	return ar_developerportal_guides_verifycredentials_understandstep_usecasebullet35(inputs)
});
export { developerportal_guides_verifycredentials_understandstep_usecasebullet35 as "developerPortal.guides.verifyCredentials.understandStep.useCaseBullet3" }