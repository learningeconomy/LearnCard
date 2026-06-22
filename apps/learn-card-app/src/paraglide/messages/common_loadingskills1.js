/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingskills1Inputs */

const en_common_loadingskills1 = /** @type {(inputs: Common_Loadingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading Skills...`)
};

const es_common_loadingskills1 = /** @type {(inputs: Common_Loadingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando habilidades...`)
};

const fr_common_loadingskills1 = /** @type {(inputs: Common_Loadingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des compétences...`)
};

const ar_common_loadingskills1 = /** @type {(inputs: Common_Loadingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل المهارات...`)
};

/**
* | output |
* | --- |
* | "Loading Skills..." |
*
* @param {Common_Loadingskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingskills1 = /** @type {((inputs?: Common_Loadingskills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingskills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingskills1(inputs)
	if (locale === "es") return es_common_loadingskills1(inputs)
	if (locale === "fr") return fr_common_loadingskills1(inputs)
	return ar_common_loadingskills1(inputs)
});
export { common_loadingskills1 as "common.loadingSkills" }