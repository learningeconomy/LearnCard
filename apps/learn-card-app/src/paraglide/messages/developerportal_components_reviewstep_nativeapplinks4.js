/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Nativeapplinks4Inputs */

const en_developerportal_components_reviewstep_nativeapplinks4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Nativeapplinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Native App Links`)
};

const es_developerportal_components_reviewstep_nativeapplinks4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Nativeapplinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlaces de Apps Nativas`)
};

const fr_developerportal_components_reviewstep_nativeapplinks4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Nativeapplinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liens d'Apps Natives`)
};

const ar_developerportal_components_reviewstep_nativeapplinks4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Nativeapplinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط التطبيقات الأصلية`)
};

/**
* | output |
* | --- |
* | "Native App Links" |
*
* @param {Developerportal_Components_Reviewstep_Nativeapplinks4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_nativeapplinks4 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Nativeapplinks4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Nativeapplinks4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_nativeapplinks4(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_nativeapplinks4(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_nativeapplinks4(inputs)
	return ar_developerportal_components_reviewstep_nativeapplinks4(inputs)
});
export { developerportal_components_reviewstep_nativeapplinks4 as "developerPortal.components.reviewStep.nativeAppLinks" }