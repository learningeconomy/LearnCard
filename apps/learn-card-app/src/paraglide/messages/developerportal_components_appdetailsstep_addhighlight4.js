/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Addhighlight4Inputs */

const en_developerportal_components_appdetailsstep_addhighlight4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Addhighlight4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add highlight`)
};

const es_developerportal_components_appdetailsstep_addhighlight4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Addhighlight4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir destacado`)
};

const fr_developerportal_components_appdetailsstep_addhighlight4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Addhighlight4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un point fort`)
};

const ar_developerportal_components_appdetailsstep_addhighlight4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Addhighlight4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة ميزة بارزة`)
};

/**
* | output |
* | --- |
* | "Add highlight" |
*
* @param {Developerportal_Components_Appdetailsstep_Addhighlight4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_addhighlight4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Addhighlight4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Addhighlight4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_addhighlight4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_addhighlight4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_addhighlight4(inputs)
	return ar_developerportal_components_appdetailsstep_addhighlight4(inputs)
});
export { developerportal_components_appdetailsstep_addhighlight4 as "developerPortal.components.appDetailsStep.addHighlight" }