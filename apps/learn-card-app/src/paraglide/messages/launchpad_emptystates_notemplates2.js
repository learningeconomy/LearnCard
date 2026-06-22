/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Notemplates2Inputs */

const en_launchpad_emptystates_notemplates2 = /** @type {(inputs: Launchpad_Emptystates_Notemplates2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No templates found`)
};

const es_launchpad_emptystates_notemplates2 = /** @type {(inputs: Launchpad_Emptystates_Notemplates2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron plantillas`)
};

const fr_launchpad_emptystates_notemplates2 = /** @type {(inputs: Launchpad_Emptystates_Notemplates2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun modèle trouvé`)
};

const ar_launchpad_emptystates_notemplates2 = /** @type {(inputs: Launchpad_Emptystates_Notemplates2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على قوالب`)
};

/**
* | output |
* | --- |
* | "No templates found" |
*
* @param {Launchpad_Emptystates_Notemplates2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_notemplates2 = /** @type {((inputs?: Launchpad_Emptystates_Notemplates2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Notemplates2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_notemplates2(inputs)
	if (locale === "es") return es_launchpad_emptystates_notemplates2(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_notemplates2(inputs)
	return ar_launchpad_emptystates_notemplates2(inputs)
});
export { launchpad_emptystates_notemplates2 as "launchpad.emptyStates.noTemplates" }