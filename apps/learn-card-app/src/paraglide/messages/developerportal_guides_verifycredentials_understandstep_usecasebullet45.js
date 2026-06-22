/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet45Inputs */

const en_developerportal_guides_verifycredentials_understandstep_usecasebullet45 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm memberships`)
};

const es_developerportal_guides_verifycredentials_understandstep_usecasebullet45 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm memberships`)
};

const fr_developerportal_guides_verifycredentials_understandstep_usecasebullet45 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm memberships`)
};

const ar_developerportal_guides_verifycredentials_understandstep_usecasebullet45 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm memberships`)
};

/**
* | output |
* | --- |
* | "Confirm memberships" |
*
* @param {Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet45Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_understandstep_usecasebullet45 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet45Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Understandstep_Usecasebullet45Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_understandstep_usecasebullet45(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_understandstep_usecasebullet45(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_understandstep_usecasebullet45(inputs)
	return ar_developerportal_guides_verifycredentials_understandstep_usecasebullet45(inputs)
});
export { developerportal_guides_verifycredentials_understandstep_usecasebullet45 as "developerPortal.guides.verifyCredentials.understandStep.useCaseBullet4" }