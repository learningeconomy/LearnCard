/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Verifystep_Whatgetschecked5Inputs */

const en_developerportal_guides_verifycredentials_verifystep_whatgetschecked5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Whatgetschecked5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What Gets Checked`)
};

const es_developerportal_guides_verifycredentials_verifystep_whatgetschecked5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Whatgetschecked5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What Gets Checked`)
};

const fr_developerportal_guides_verifycredentials_verifystep_whatgetschecked5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Whatgetschecked5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What Gets Checked`)
};

const ar_developerportal_guides_verifycredentials_verifystep_whatgetschecked5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Whatgetschecked5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What Gets Checked`)
};

/**
* | output |
* | --- |
* | "What Gets Checked" |
*
* @param {Developerportal_Guides_Verifycredentials_Verifystep_Whatgetschecked5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_verifystep_whatgetschecked5 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Verifystep_Whatgetschecked5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Verifystep_Whatgetschecked5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_verifystep_whatgetschecked5(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_verifystep_whatgetschecked5(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_verifystep_whatgetschecked5(inputs)
	return ar_developerportal_guides_verifycredentials_verifystep_whatgetschecked5(inputs)
});
export { developerportal_guides_verifycredentials_verifystep_whatgetschecked5 as "developerPortal.guides.verifyCredentials.verifyStep.whatGetsChecked" }