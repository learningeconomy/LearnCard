/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Selectdescription2Inputs */

const en_developerportal_guides_hub_selectdescription2 = /** @type {(inputs: Developerportal_Guides_Hub_Selectdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a project to get started, or browse the available guides below.`)
};

const es_developerportal_guides_hub_selectdescription2 = /** @type {(inputs: Developerportal_Guides_Hub_Selectdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un proyecto para empezar, o explora las guías disponibles abajo.`)
};

const fr_developerportal_guides_hub_selectdescription2 = /** @type {(inputs: Developerportal_Guides_Hub_Selectdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un projet pour commencer, ou parcourez les guides disponibles ci-dessous.`)
};

const ar_developerportal_guides_hub_selectdescription2 = /** @type {(inputs: Developerportal_Guides_Hub_Selectdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مشروعاً للبدء، أو تصفح الأدلة المتاحة أدناه.`)
};

/**
* | output |
* | --- |
* | "Select a project to get started, or browse the available guides below." |
*
* @param {Developerportal_Guides_Hub_Selectdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_selectdescription2 = /** @type {((inputs?: Developerportal_Guides_Hub_Selectdescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Selectdescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_selectdescription2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_selectdescription2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_selectdescription2(inputs)
	return ar_developerportal_guides_hub_selectdescription2(inputs)
});
export { developerportal_guides_hub_selectdescription2 as "developerPortal.guides.hub.selectDescription" }