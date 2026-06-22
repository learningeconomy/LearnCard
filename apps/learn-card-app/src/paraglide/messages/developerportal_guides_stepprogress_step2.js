/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ current: NonNullable<unknown>, total: NonNullable<unknown> }} Developerportal_Guides_Stepprogress_Step2Inputs */

const en_developerportal_guides_stepprogress_step2 = /** @type {(inputs: Developerportal_Guides_Stepprogress_Step2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Step ${i?.current} of ${i?.total}`)
};

const es_developerportal_guides_stepprogress_step2 = /** @type {(inputs: Developerportal_Guides_Stepprogress_Step2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Paso ${i?.current} de ${i?.total}`)
};

const fr_developerportal_guides_stepprogress_step2 = /** @type {(inputs: Developerportal_Guides_Stepprogress_Step2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Étape ${i?.current} sur ${i?.total}`)
};

const ar_developerportal_guides_stepprogress_step2 = /** @type {(inputs: Developerportal_Guides_Stepprogress_Step2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`الخطوة ${i?.current} من ${i?.total}`)
};

/**
* | output |
* | --- |
* | "Step {current} of {total}" |
*
* @param {Developerportal_Guides_Stepprogress_Step2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_stepprogress_step2 = /** @type {((inputs: Developerportal_Guides_Stepprogress_Step2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Stepprogress_Step2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_stepprogress_step2(inputs)
	if (locale === "es") return es_developerportal_guides_stepprogress_step2(inputs)
	if (locale === "fr") return fr_developerportal_guides_stepprogress_step2(inputs)
	return ar_developerportal_guides_stepprogress_step2(inputs)
});
export { developerportal_guides_stepprogress_step2 as "developerPortal.guides.stepProgress.step" }