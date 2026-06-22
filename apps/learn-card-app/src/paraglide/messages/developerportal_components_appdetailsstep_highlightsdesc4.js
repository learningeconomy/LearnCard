/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Highlightsdesc4Inputs */

const en_developerportal_components_appdetailsstep_highlightsdesc4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlightsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add key benefits or reasons to use your app (displayed as bullet points)`)
};

const es_developerportal_components_appdetailsstep_highlightsdesc4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlightsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade beneficios clave o razones para usar tu aplicación (mostrados como viñetas)`)
};

const fr_developerportal_components_appdetailsstep_highlightsdesc4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlightsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez des avantages clés ou des raisons d'utiliser votre application (affichés sous forme de puces)`)
};

const ar_developerportal_components_appdetailsstep_highlightsdesc4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlightsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف فوائد رئيسية أو أسباب لاستخدام تطبيقك (تظهر كنقاط)`)
};

/**
* | output |
* | --- |
* | "Add key benefits or reasons to use your app (displayed as bullet points)" |
*
* @param {Developerportal_Components_Appdetailsstep_Highlightsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_highlightsdesc4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Highlightsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Highlightsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_highlightsdesc4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_highlightsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_highlightsdesc4(inputs)
	return ar_developerportal_components_appdetailsstep_highlightsdesc4(inputs)
});
export { developerportal_components_appdetailsstep_highlightsdesc4 as "developerPortal.components.appDetailsStep.highlightsDesc" }