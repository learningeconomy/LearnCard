/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Tip33Inputs */

const en_developerportal_components_appdetailsstep_tip33 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Highlight key features and benefits in your description`)
};

const es_developerportal_components_appdetailsstep_tip33 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Highlight key features and benefits in your description`)
};

const fr_developerportal_components_appdetailsstep_tip33 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Highlight key features and benefits in your description`)
};

const ar_developerportal_components_appdetailsstep_tip33 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Highlight key features and benefits in your description`)
};

/**
* | output |
* | --- |
* | "Highlight key features and benefits in your description" |
*
* @param {Developerportal_Components_Appdetailsstep_Tip33Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_tip33 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Tip33Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Tip33Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_tip33(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_tip33(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_tip33(inputs)
	return ar_developerportal_components_appdetailsstep_tip33(inputs)
});
export { developerportal_components_appdetailsstep_tip33 as "developerPortal.components.appDetailsStep.tip3" }