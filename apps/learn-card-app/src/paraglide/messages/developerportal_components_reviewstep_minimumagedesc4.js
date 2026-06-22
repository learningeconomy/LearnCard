/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ age: NonNullable<unknown> }} Developerportal_Components_Reviewstep_Minimumagedesc4Inputs */

const en_developerportal_components_reviewstep_minimumagedesc4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Minimumagedesc4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.age} years - the app will be hidden from users under this age`)
};

const es_developerportal_components_reviewstep_minimumagedesc4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Minimumagedesc4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.age} years - the app will be hidden from users under this age`)
};

const fr_developerportal_components_reviewstep_minimumagedesc4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Minimumagedesc4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.age} years - the app will be hidden from users under this age`)
};

const ar_developerportal_components_reviewstep_minimumagedesc4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Minimumagedesc4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.age} years - the app will be hidden from users under this age`)
};

/**
* | output |
* | --- |
* | "{age} years - the app will be hidden from users under this age" |
*
* @param {Developerportal_Components_Reviewstep_Minimumagedesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_minimumagedesc4 = /** @type {((inputs: Developerportal_Components_Reviewstep_Minimumagedesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Minimumagedesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_minimumagedesc4(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_minimumagedesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_minimumagedesc4(inputs)
	return ar_developerportal_components_reviewstep_minimumagedesc4(inputs)
});
export { developerportal_components_reviewstep_minimumagedesc4 as "developerPortal.components.reviewStep.minimumAgeDesc" }